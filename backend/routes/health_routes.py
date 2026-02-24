from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from models.health_record import (
    HealthRecordCreate, HealthRecord, HealthRecordResponse, 
    ImagePrediction, AITriageResult
)
from services.health_service import HealthService
from services.ml_service import MLService
from services.pdf_service import PDFService
from services.email_service import EmailService
from services.ai_triage_service import AITriageService
from middleware.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from typing import List
import os
import logging
from io import BytesIO

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["Health Assessment"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'health_analyzer')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Services
health_service = HealthService()
ml_service = MLService()
pdf_service = PDFService()
email_service = EmailService()
ai_triage_service = AITriageService()

@router.post("/assess", response_model=HealthRecordResponse)
async def create_health_assessment(
    data: HealthRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new AI-powered health assessment"""
    
    # Calculate BMI
    bmi, bmi_category = health_service.calculate_bmi(data.weight, data.height)
    
    # Process image if provided
    image_url = None
    image_prediction = None
    image_prediction_dict = None
    
    if data.image_data:
        image_url = await ml_service.save_image(data.image_data)
        ml_result = await ml_service.analyze_image(base64_data=data.image_data)
        image_prediction = ImagePrediction(
            label=ml_result['label'],
            confidence=ml_result['confidence'],
            description=ml_result['description']
        )
        image_prediction_dict = image_prediction.model_dump()
    
    # Run AI-powered triage analysis
    logger.info(f"Starting AI triage for patient age {data.age}, gender {data.gender}")
    
    ai_result = await ai_triage_service.analyze_patient(
        age=data.age,
        gender=data.gender.value,
        bmi=bmi,
        bmi_category=bmi_category,
        blood_sugar=data.blood_sugar_level,
        bp_systolic=data.blood_pressure_systolic,
        bp_diastolic=data.blood_pressure_diastolic,
        symptoms=data.symptoms,
        image_prediction=image_prediction_dict
    )
    
    logger.info(f"AI Triage complete - Risk: {ai_result.get('riskLevel')}, Confidence: {ai_result.get('confidenceScore')}%")
    
    # Create AI triage result object
    ai_triage = AITriageResult(**ai_result)
    
    # Map AI result to legacy fields for backward compatibility
    risk_level = ai_result.get('riskLevel', 'Low')
    conditions = [ai_result.get('primaryCondition', '')] + ai_result.get('otherPossibleConditions', [])
    recommendations = ai_result.get('lifestyleRecommendations', []) + ai_result.get('recommendedTests', [])
    
    # Create health record
    health_record = HealthRecord(
        user_id=current_user['sub'],
        full_name=data.full_name,
        email=data.email,
        age=data.age,
        dob=data.dob,
        gender=data.gender.value,
        height=data.height,
        weight=data.weight,
        bmi=bmi,
        bmi_category=bmi_category,
        blood_sugar_level=data.blood_sugar_level,
        blood_pressure_systolic=data.blood_pressure_systolic,
        blood_pressure_diastolic=data.blood_pressure_diastolic,
        symptoms=data.symptoms,
        image_url=image_url,
        image_prediction=image_prediction,
        ai_triage=ai_triage,
        risk_level=risk_level,
        conditions=conditions,
        recommendations=recommendations
    )
    
    # Prepare document for MongoDB
    record_doc = health_record.model_dump()
    record_doc['created_at'] = record_doc['created_at'].isoformat()
    
    await db.health_records.insert_one(record_doc)
    
    # Send critical alert email if emergency
    if ai_result.get('emergencyAlert', False):
        await email_service.send_critical_alert(
            to_email=data.email,
            patient_name=data.full_name,
            alert_details=ai_result.get('clinicalReasoning', 'Critical health condition detected')
        )
    
    return HealthRecordResponse(
        id=health_record.id,
        user_id=health_record.user_id,
        full_name=health_record.full_name,
        email=health_record.email,
        age=health_record.age,
        dob=health_record.dob,
        gender=health_record.gender,
        height=health_record.height,
        weight=health_record.weight,
        bmi=health_record.bmi,
        bmi_category=health_record.bmi_category,
        blood_sugar_level=health_record.blood_sugar_level,
        blood_pressure_systolic=health_record.blood_pressure_systolic,
        blood_pressure_diastolic=health_record.blood_pressure_diastolic,
        symptoms=health_record.symptoms,
        image_url=health_record.image_url,
        image_prediction=health_record.image_prediction,
        ai_triage=health_record.ai_triage,
        risk_level=health_record.risk_level,
        conditions=health_record.conditions,
        recommendations=health_record.recommendations,
        created_at=health_record.created_at
    )

@router.get("/records", response_model=List[HealthRecordResponse])
async def get_health_records(
    current_user: dict = Depends(get_current_user)
):
    """Get all health records for the current user"""
    records = await db.health_records.find(
        {"user_id": current_user['sub']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Convert datetime strings back to datetime objects
    from datetime import datetime
    for record in records:
        if isinstance(record.get('created_at'), str):
            record['created_at'] = datetime.fromisoformat(record['created_at'])
    
    return records

@router.get("/records/{record_id}", response_model=HealthRecordResponse)
async def get_health_record(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific health record"""
    record = await db.health_records.find_one(
        {"id": record_id, "user_id": current_user['sub']},
        {"_id": 0}
    )
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found"
        )
    
    from datetime import datetime
    if isinstance(record.get('created_at'), str):
        record['created_at'] = datetime.fromisoformat(record['created_at'])
    
    return record

@router.get("/records/{record_id}/pdf")
async def download_health_report_pdf(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Download health report as PDF"""
    record = await db.health_records.find_one(
        {"id": record_id, "user_id": current_user['sub']},
        {"_id": 0}
    )
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found"
        )
    
    # Generate PDF with AI triage data
    pdf_bytes = await pdf_service.generate_health_report(record)
    
    # Return as streaming response
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=health_report_{record_id}.pdf"
        }
    )

@router.post("/records/{record_id}/email")
async def email_health_report(
    record_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Email health report to the user"""
    record = await db.health_records.find_one(
        {"id": record_id, "user_id": current_user['sub']},
        {"_id": 0}
    )
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Health record not found"
        )
    
    # Generate PDF
    pdf_bytes = await pdf_service.generate_health_report(record)
    
    # Send email
    result = await email_service.send_health_report(
        to_email=record['email'],
        patient_name=record['full_name'],
        risk_level=record.get('risk_level', 'Low'),
        pdf_data=pdf_bytes
    )
    
    if not result['success']:
        return {
            "success": False,
            "message": result['message'],
            "email_configured": email_service.is_configured()
        }
    
    return {
        "success": True,
        "message": f"Report sent to {record['email']}",
        "email_configured": True
    }

@router.get("/stats")
async def get_health_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get health statistics for the current user"""
    # Count total records
    total_records = await db.health_records.count_documents({"user_id": current_user['sub']})
    
    # Get risk level distribution
    risk_counts = {}
    for risk in ['Low', 'Moderate', 'High']:
        count = await db.health_records.count_documents({
            "user_id": current_user['sub'],
            "risk_level": risk
        })
        risk_counts[risk.lower()] = count
    
    # Get latest record
    latest_record = await db.health_records.find_one(
        {"user_id": current_user['sub']},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    return {
        "total_assessments": total_records,
        "risk_distribution": risk_counts,
        "latest_assessment": latest_record
    }

@router.post("/calculate-bmi")
async def calculate_bmi_endpoint(
    weight: float,
    height: float
):
    """Calculate BMI without authentication (utility endpoint)"""
    if weight <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Weight and height must be positive values"
        )
    
    bmi, category = health_service.calculate_bmi(weight, height)
    
    return {
        "bmi": bmi,
        "category": category,
        "weight_kg": weight,
        "height_cm": height
    }
