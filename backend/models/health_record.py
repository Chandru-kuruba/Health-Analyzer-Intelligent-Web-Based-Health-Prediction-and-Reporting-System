from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
import uuid

class RiskLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ImagePrediction(BaseModel):
    label: str
    confidence: float
    description: str

class AITriageResult(BaseModel):
    """AI-powered medical triage analysis result"""
    primaryCondition: str
    otherPossibleConditions: List[str] = []
    riskLevel: str
    confidenceScore: int
    clinicalReasoning: str
    recommendedTests: List[str] = []
    lifestyleRecommendations: List[str] = []
    otcSuggestions: List[str] = []
    whenToSeeDoctor: str
    emergencyAlert: bool = False
    disclaimer: str

class HealthRecordCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str
    age: int = Field(..., ge=1, le=150)
    dob: str  # ISO date string
    gender: Gender
    height: float = Field(..., gt=0, le=300)  # in cm
    weight: float = Field(..., gt=0, le=500)  # in kg
    blood_sugar_level: Optional[float] = Field(None, ge=0, le=1000)  # mg/dL
    blood_pressure_systolic: Optional[int] = Field(None, ge=50, le=300)
    blood_pressure_diastolic: Optional[int] = Field(None, ge=30, le=200)
    symptoms: Optional[str] = None
    image_data: Optional[str] = None  # Base64 encoded image

class HealthRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    email: str
    age: int
    dob: str
    gender: str
    height: float
    weight: float
    bmi: float
    bmi_category: str
    blood_sugar_level: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    symptoms: Optional[str] = None
    image_url: Optional[str] = None
    image_prediction: Optional[ImagePrediction] = None
    
    # AI Triage Results
    ai_triage: Optional[AITriageResult] = None
    
    # Legacy fields for backward compatibility
    risk_level: str = "Low"
    conditions: List[str] = []
    recommendations: List[str] = []
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthRecordResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    age: int
    dob: str
    gender: str
    height: float
    weight: float
    bmi: float
    bmi_category: str
    blood_sugar_level: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    symptoms: Optional[str] = None
    image_url: Optional[str] = None
    image_prediction: Optional[ImagePrediction] = None
    ai_triage: Optional[AITriageResult] = None
    risk_level: str
    conditions: List[str]
    recommendations: List[str]
    created_at: datetime
