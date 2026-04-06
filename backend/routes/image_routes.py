"""
Image Analysis Routes
Standalone AI-powered medical image analysis
"""
from fastapi import APIRouter, HTTPException, status, Depends
from models.image_analysis import (
    ImageAnalysisCreate, ImageAnalysis, ImageAnalysisResponse
)
from services.image_analysis_service import ImageAnalysisService
from services.email_service import EmailService
from middleware.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from typing import List
import os
import logging
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/image", tags=["Image Analysis"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'health_analyzer')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Services
image_service = ImageAnalysisService()
email_service = EmailService()


@router.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(
    data: ImageAnalysisCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze a medical image using AI Vision
    
    Accepts base64 encoded image (JPG, PNG, WEBP)
    Returns structured medical image analysis
    """
    try:
        # Save image to disk
        image_url, file_size = await image_service.save_image(data.image_data)
        
        # Analyze image with AI
        analysis_result = await image_service.analyze_image(data.image_data)
        
        # Create record
        record = ImageAnalysis(
            user_id=current_user['sub'],
            image_url=image_url,
            file_size=file_size,
            detected_condition=analysis_result['detectedCondition'],
            severity_level=analysis_result['severityLevel'],
            confidence_score=analysis_result['confidenceScore'],
            visual_findings=analysis_result['visualFindings'],
            possible_causes=analysis_result.get('possibleCauses', []),
            recommended_care=analysis_result.get('recommendedCare', []),
            otc_suggestions=analysis_result.get('otcSuggestions', []),
            when_to_see_doctor=analysis_result['whenToSeeDoctor'],
            emergency=analysis_result.get('emergency', False),
            disclaimer=analysis_result.get('disclaimer', '')
        )
        
        # Save to MongoDB
        record_doc = record.model_dump()
        record_doc['created_at'] = record_doc['created_at'].isoformat()
        await db.image_analyses.insert_one(record_doc)
        
        logger.info(f"Image analysis complete - Condition: {record.detected_condition}, Severity: {record.severity_level}")
        
        # Send critical alert email if emergency
        if record.emergency:
            user_doc = await db.users.find_one({"id": current_user['sub']}, {"_id": 0})
            if user_doc:
                await email_service.send_critical_alert(
                    to_email=user_doc.get('email', ''),
                    patient_name=user_doc.get('name', 'User'),
                    alert_details=f"Critical condition detected in image analysis: {record.detected_condition}. {record.visual_findings}"
                )
        
        return ImageAnalysisResponse(
            id=record.id,
            user_id=record.user_id,
            image_url=record.image_url,
            detected_condition=record.detected_condition,
            severity_level=record.severity_level,
            confidence_score=record.confidence_score,
            visual_findings=record.visual_findings,
            possible_causes=record.possible_causes,
            recommended_care=record.recommended_care,
            otc_suggestions=record.otc_suggestions,
            when_to_see_doctor=record.when_to_see_doctor,
            emergency=record.emergency,
            disclaimer=record.disclaimer,
            created_at=record.created_at
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image analysis failed. Please try again."
        )


@router.get("/analyses", response_model=List[ImageAnalysisResponse])
async def get_image_analyses(
    current_user: dict = Depends(get_current_user)
):
    """Get all image analyses for current user"""
    analyses = await db.image_analyses.find(
        {"user_id": current_user['sub']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Convert datetime strings
    for analysis in analyses:
        if isinstance(analysis.get('created_at'), str):
            analysis['created_at'] = datetime.fromisoformat(analysis['created_at'])
    
    return analyses


@router.get("/analyses/{analysis_id}", response_model=ImageAnalysisResponse)
async def get_image_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific image analysis"""
    analysis = await db.image_analyses.find_one(
        {"id": analysis_id, "user_id": current_user['sub']},
        {"_id": 0}
    )
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image analysis not found"
        )
    
    if isinstance(analysis.get('created_at'), str):
        analysis['created_at'] = datetime.fromisoformat(analysis['created_at'])
    
    return analysis
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.image_analysis_service import ImageAnalysisService

router = APIRouter(prefix="/api/image", tags=["image-analysis"])
service = ImageAnalysisService()


class AnalyzeImageRequest(BaseModel):
    image_data: str  # base64


@router.post("/analyze")
async def analyze_image(payload: AnalyzeImageRequest):
    try:
        return await service.analyze_image(payload.image_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to analyze image")