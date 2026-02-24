"""
Admin Logs Model
Stores admin activity logs
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class AdminLog(BaseModel):
    """Admin activity log entry"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_email: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdminLogResponse(BaseModel):
    """Response model for admin logs"""
    id: str
    admin_id: str
    admin_email: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[str]
    created_at: datetime
