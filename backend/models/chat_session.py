"""
Chat Session Model
Stores AI health chat conversations
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    emergency_flag: bool = False


class ChatSessionCreate(BaseModel):
    """Request to send a chat message"""
    message: str
    session_id: Optional[str] = None  # If None, creates new session


class ChatSession(BaseModel):
    """Full chat session record"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    messages: List[ChatMessage] = []
    emergency_detected: bool = False
    context_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    session_id: str
    message: ChatMessage
    emergency_alert: bool = False
    disclaimer: str = "This chat provides health information only and does not replace professional medical advice."


class ChatSessionResponse(BaseModel):
    """Full chat session response"""
    id: str
    user_id: str
    messages: List[ChatMessage]
    emergency_detected: bool
    created_at: datetime
    updated_at: datetime
