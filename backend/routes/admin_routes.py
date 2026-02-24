"""
Admin Routes
Full admin dashboard with role-based access control and user management
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from models.user import UserResponse
from models.admin_log import AdminLog, AdminLogResponse
from middleware.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path
from typing import List, Optional
import os
import re
import uuid
import logging
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field, field_validator

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'health_analyzer')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Request/Response Models for User Management
class CreateUserRequest(BaseModel):
    """Request model for creating a new user"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(default="user")
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ['user', 'admin']:
            raise ValueError('Role must be either "user" or "admin"')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UpdateRoleRequest(BaseModel):
    """Request model for changing user role"""
    role: str
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ['user', 'admin']:
            raise ValueError('Role must be either "user" or "admin"')
        return v


class UpdatePasswordRequest(BaseModel):
    """Request model for resetting user password"""
    new_password: str = Field(..., alias='newPassword')
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserCreatedResponse(BaseModel):
    """Response model for created user"""
    id: str
    name: str
    email: str
    role: str
    created_at: datetime


# Response Models
class AdminStatsResponse(BaseModel):
    total_users: int
    total_health_records: int
    total_image_analyses: int
    total_chat_sessions: int
    high_risk_cases: int
    emergency_alerts: int
    condition_distribution: dict


class UserListItem(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime
    health_records_count: int = 0
    last_activity: Optional[datetime] = None


class HealthRecordAdmin(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    age: int
    gender: str
    bmi: float
    bmi_category: str
    risk_level: str
    conditions: List[str]
    emergency_alert: bool = False
    created_at: datetime


class ImageAnalysisAdmin(BaseModel):
    id: str
    user_id: str
    image_url: str
    detected_condition: str
    severity_level: str
    confidence_score: int
    emergency: bool
    created_at: datetime


class ChatSessionAdmin(BaseModel):
    id: str
    user_id: str
    message_count: int
    emergency_detected: bool
    last_message_preview: str
    created_at: datetime
    updated_at: datetime


# Admin middleware
async def require_admin(current_user: dict = Depends(get_current_user)):
    """Verify user has admin role"""
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def log_admin_action(
    admin_id: str,
    admin_email: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Log admin activity"""
    log = AdminLog(
        admin_id=admin_id,
        admin_email=admin_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    log_doc = log.model_dump()
    log_doc['created_at'] = log_doc['created_at'].isoformat()
    await db.admin_logs.insert_one(log_doc)


# Dashboard Stats
@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: dict = Depends(require_admin)
):
    """Get overall system statistics"""
    # Count totals
    total_users = await db.users.count_documents({})
    total_records = await db.health_records.count_documents({})
    total_images = await db.image_analyses.count_documents({})
    total_chats = await db.chat_sessions.count_documents({})
    
    # High risk cases
    high_risk = await db.health_records.count_documents({"risk_level": "High"})
    
    # Emergency alerts from image analyses and chat
    image_emergencies = await db.image_analyses.count_documents({"emergency": True})
    chat_emergencies = await db.chat_sessions.count_documents({"emergency_detected": True})
    
    # Condition distribution
    pipeline = [
        {"$unwind": "$conditions"},
        {"$group": {"_id": "$conditions", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    conditions_cursor = db.health_records.aggregate(pipeline)
    conditions = {}
    async for doc in conditions_cursor:
        if doc['_id']:
            conditions[doc['_id']] = doc['count']
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_stats",
        resource_type="dashboard"
    )
    
    return AdminStatsResponse(
        total_users=total_users,
        total_health_records=total_records,
        total_image_analyses=total_images,
        total_chat_sessions=total_chats,
        high_risk_cases=high_risk,
        emergency_alerts=image_emergencies + chat_emergencies,
        condition_distribution=conditions
    )


# Users Management
@router.get("/users", response_model=List[UserListItem])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    role: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """Get all users with their stats, pagination, search, and role filter"""
    query = {}
    conditions = []
    
    # Search filter
    if search:
        conditions.append({
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        })
    
    # Role filter
    if role and role in ['user', 'admin']:
        conditions.append({"role": role})
    
    if conditions:
        query = {"$and": conditions} if len(conditions) > 1 else conditions[0]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for user in users:
        # Count health records
        records_count = await db.health_records.count_documents({"user_id": user['id']})
        
        # Get last activity
        last_record = await db.health_records.find_one(
            {"user_id": user['id']},
            {"_id": 0, "created_at": 1},
            sort=[("created_at", -1)]
        )
        
        created_at = user.get('created_at')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        last_activity = None
        if last_record and last_record.get('created_at'):
            last_activity = last_record['created_at']
            if isinstance(last_activity, str):
                last_activity = datetime.fromisoformat(last_activity)
        
        result.append(UserListItem(
            id=user['id'],
            name=user['name'],
            email=user['email'],
            role=user.get('role', 'user'),
            created_at=created_at,
            health_records_count=records_count,
            last_activity=last_activity
        ))
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_users",
        resource_type="user",
        details=f"Retrieved {len(result)} users (search={search}, role={role})"
    )
    
    return result


@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin: dict = Depends(require_admin)
):
    """Get detailed user information"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's health records
    records = await db.health_records.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    # Get user's image analyses
    images = await db.image_analyses.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    # Get user's chat sessions
    chats = await db.chat_sessions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(10)
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_user_details",
        resource_type="user",
        resource_id=user_id
    )
    
    created_at = user.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    user['created_at'] = created_at
    
    return {
        "user": user,
        "health_records": records,
        "image_analyses": images,
        "chat_sessions": chats
    }


# User Management - Create, Update Role, Reset Password

@router.post("/users", response_model=UserCreatedResponse)
async def create_user(
    data: CreateUserRequest,
    admin: dict = Depends(require_admin)
):
    """
    Create a new user (admin only)
    - Password is hashed with bcrypt
    - Email must be unique
    - Default role is 'user' if not specified
    """
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    now = datetime.now(timezone.utc)
    user_id = str(uuid.uuid4())
    
    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": pwd_context.hash(data.password),
        "role": data.role,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="create_user",
        resource_type="user",
        resource_id=user_id,
        details=f"Created user: {data.email} with role: {data.role}"
    )
    
    logger.info(f"Admin {admin.get('email')} created user: {data.email}")
    
    return UserCreatedResponse(
        id=user_id,
        name=data.name,
        email=data.email,
        role=data.role,
        created_at=now
    )


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    data: UpdateRoleRequest,
    admin: dict = Depends(require_admin)
):
    """
    Change user role (admin only)
    - Cannot remove your own admin role
    - Cannot remove last admin in system
    """
    # Get target user
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    old_role = user.get('role', 'user')
    new_role = data.role
    
    # Prevent admin from removing their own admin role
    if admin['sub'] == user_id and old_role == 'admin' and new_role == 'user':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove your own admin role"
        )
    
    # Prevent removing last admin in system
    if old_role == 'admin' and new_role == 'user':
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last admin in the system"
            )
    
    # Update role
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"role": new_role, "updated_at": now.isoformat()}}
    )
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="change_role",
        resource_type="user",
        resource_id=user_id,
        details=f"Changed role from '{old_role}' to '{new_role}' for user: {user.get('email')}"
    )
    
    logger.info(f"Admin {admin.get('email')} changed role for {user.get('email')}: {old_role} -> {new_role}")
    
    return {
        "message": "Role updated successfully",
        "user_id": user_id,
        "old_role": old_role,
        "new_role": new_role
    }


@router.put("/users/{user_id}/password")
async def reset_user_password(
    user_id: str,
    data: UpdatePasswordRequest,
    admin: dict = Depends(require_admin)
):
    """
    Reset user password (admin only)
    - Password must meet strength requirements
    - Password is hashed before saving
    """
    # Get target user
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Hash new password
    hashed_password = pwd_context.hash(data.new_password)
    
    # Update password
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": hashed_password, "updated_at": now.isoformat()}}
    )
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="reset_password",
        resource_type="user",
        resource_id=user_id,
        details=f"Reset password for user: {user.get('email')}"
    )
    
    logger.info(f"Admin {admin.get('email')} reset password for {user.get('email')}")
    
    return {
        "message": "Password reset successfully",
        "user_id": user_id
    }


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_admin)
):
    """
    Delete a user (admin only)
    - Cannot delete yourself
    - Cannot delete the last admin
    """
    # Get target user
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if admin['sub'] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Prevent deleting last admin
    if user.get('role') == 'admin':
        admin_count = await db.users.count_documents({"role": "admin"})
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last admin in the system"
            )
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="delete_user",
        resource_type="user",
        resource_id=user_id,
        details=f"Deleted user: {user.get('email')}"
    )
    
    logger.info(f"Admin {admin.get('email')} deleted user: {user.get('email')}")
    
    return {
        "message": "User deleted successfully",
        "user_id": user_id
    }


# Health Records Management
@router.get("/health-records", response_model=List[HealthRecordAdmin])
async def get_all_health_records(
    skip: int = 0,
    limit: int = 50,
    risk_level: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    """Get all health records"""
    query = {}
    if risk_level:
        query["risk_level"] = risk_level
    
    records = await db.health_records.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for record in records:
        created_at = record.get('created_at')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        # Check for emergency from AI triage
        ai_triage = record.get('ai_triage', {})
        emergency = ai_triage.get('emergencyAlert', False) if ai_triage else False
        
        result.append(HealthRecordAdmin(
            id=record['id'],
            user_id=record['user_id'],
            full_name=record['full_name'],
            email=record['email'],
            age=record['age'],
            gender=record['gender'],
            bmi=record['bmi'],
            bmi_category=record['bmi_category'],
            risk_level=record.get('risk_level', 'Low'),
            conditions=record.get('conditions', []),
            emergency_alert=emergency,
            created_at=created_at
        ))
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_health_records",
        resource_type="health_record",
        details=f"Risk filter: {risk_level}" if risk_level else None
    )
    
    return result


# Image Analyses Management
@router.get("/image-analyses", response_model=List[ImageAnalysisAdmin])
async def get_all_image_analyses(
    skip: int = 0,
    limit: int = 50,
    severity: Optional[str] = None,
    emergency_only: bool = False,
    admin: dict = Depends(require_admin)
):
    """Get all image analyses"""
    query = {}
    if severity:
        query["severity_level"] = severity
    if emergency_only:
        query["emergency"] = True
    
    analyses = await db.image_analyses.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for analysis in analyses:
        created_at = analysis.get('created_at')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        result.append(ImageAnalysisAdmin(
            id=analysis['id'],
            user_id=analysis['user_id'],
            image_url=analysis['image_url'],
            detected_condition=analysis['detected_condition'],
            severity_level=analysis['severity_level'],
            confidence_score=analysis.get('confidence_score', 0),
            emergency=analysis.get('emergency', False),
            created_at=created_at
        ))
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_image_analyses",
        resource_type="image_analysis"
    )
    
    return result


# Chat Sessions Management
@router.get("/chat-sessions", response_model=List[ChatSessionAdmin])
async def get_all_chat_sessions(
    skip: int = 0,
    limit: int = 50,
    emergency_only: bool = False,
    admin: dict = Depends(require_admin)
):
    """Get all chat sessions"""
    query = {}
    if emergency_only:
        query["emergency_detected"] = True
    
    sessions = await db.chat_sessions.find(query, {"_id": 0}).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for session in sessions:
        created_at = session.get('created_at')
        updated_at = session.get('updated_at')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        
        messages = session.get('messages', [])
        last_preview = ""
        if messages:
            last_msg = messages[-1]
            content = last_msg.get('content', '')
            last_preview = content[:100] + "..." if len(content) > 100 else content
        
        result.append(ChatSessionAdmin(
            id=session['id'],
            user_id=session['user_id'],
            message_count=len(messages),
            emergency_detected=session.get('emergency_detected', False),
            last_message_preview=last_preview,
            created_at=created_at,
            updated_at=updated_at
        ))
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_chat_sessions",
        resource_type="chat_session"
    )
    
    return result


@router.get("/chat-sessions/{session_id}")
async def get_chat_session_details(
    session_id: str,
    admin: dict = Depends(require_admin)
):
    """Get full chat session with all messages"""
    session = await db.chat_sessions.find_one({"id": session_id}, {"_id": 0})
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Get user info
    user = await db.users.find_one(
        {"id": session['user_id']},
        {"_id": 0, "password_hash": 0}
    )
    
    # Log action
    await log_admin_action(
        admin_id=admin['sub'],
        admin_email=admin.get('email', ''),
        action="view_chat_details",
        resource_type="chat_session",
        resource_id=session_id
    )
    
    return {
        "session": session,
        "user": user
    }


# Admin Logs
@router.get("/logs", response_model=List[AdminLogResponse])
async def get_admin_logs(
    skip: int = 0,
    limit: int = 100,
    admin: dict = Depends(require_admin)
):
    """Get admin activity logs"""
    logs = await db.admin_logs.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('created_at'), str):
            log['created_at'] = datetime.fromisoformat(log['created_at'])
    
    return logs
