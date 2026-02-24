"""
Image Analysis Model
Stores results from standalone AI image analysis
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class ImageAnalysisResult(BaseModel):
    """AI Image Analysis Result"""
    detectedCondition: str
    severityLevel: str  # Mild | Moderate | Severe
    confidenceScore: int  # 0-100
    visualFindings: str
    possibleCauses: List[str] = []
    recommendedCare: List[str] = []
    otcSuggestions: List[str] = []
    whenToSeeDoctor: str
    emergency: bool = False
    disclaimer: str = "This image analysis is AI-assisted and not a medical diagnosis."


class ImageAnalysisCreate(BaseModel):
    """Request model for image analysis"""
    image_data: str  # Base64 encoded image


class ImageAnalysis(BaseModel):
    """Full Image Analysis record"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    image_url: str
    file_type: str = "image/jpeg"
    file_size: int = 0
    detected_condition: str
    severity_level: str
    confidence_score: int
    visual_findings: str
    possible_causes: List[str] = []
    recommended_care: List[str] = []
    otc_suggestions: List[str] = []
    when_to_see_doctor: str
    emergency: bool = False
    disclaimer: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ImageAnalysisResponse(BaseModel):
    """Response model for image analysis"""
    id: str
    user_id: str
    image_url: str
    detected_condition: str
    severity_level: str
    confidence_score: int
    visual_findings: str
    possible_causes: List[str]
    recommended_care: List[str]
    otc_suggestions: List[str]
    when_to_see_doctor: str
    emergency: bool
    disclaimer: str
    created_at: datetime
