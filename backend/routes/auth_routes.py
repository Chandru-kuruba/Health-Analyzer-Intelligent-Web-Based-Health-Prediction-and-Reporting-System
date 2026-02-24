from fastapi import APIRouter, HTTPException, status
from models.user import UserCreate, UserLogin, User, UserResponse, TokenResponse, PasswordChange, PasswordResetRequest, PasswordResetConfirm
from services.auth_service import AuthService
from services.email_service import EmailService
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter(prefix="/auth", tags=["Authentication"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'health_analyzer')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

auth_service = AuthService()
email_service = EmailService()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=auth_service.hash_password(user_data.password),
        role="user",
        email_verified=False
    )
    
    # Prepare document for MongoDB
    user_doc = user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={"sub": user.id, "email": user.email, "name": user.name, "role": user.role}
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            email_verified=user.email_verified,
            created_at=user.created_at
        )
    )

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return access token"""
    # Find user by email
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not auth_service.verify_password(credentials.password, user_doc.get('password_hash', '')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Parse created_at if it's a string
    created_at = user_doc.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    # Create access token
    access_token = auth_service.create_access_token(
        data={
            "sub": user_doc['id'],
            "email": user_doc['email'],
            "name": user_doc['name'],
            "role": user_doc.get('role', 'user')
        }
    )
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_doc['id'],
            name=user_doc['name'],
            email=user_doc['email'],
            role=user_doc.get('role', 'user'),
            email_verified=user_doc.get('email_verified', False),
            created_at=created_at
        )
    )

@router.post("/change-password")
async def change_password(data: PasswordChange, token: str):
    """Change password for authenticated user"""
    from middleware.auth import verify_token
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get('sub')
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify current password
    if not auth_service.verify_password(data.current_password, user_doc.get('password_hash', '')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    new_hash = auth_service.hash_password(data.new_password)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Password changed successfully"}

@router.post("/request-password-reset")
async def request_password_reset(data: PasswordResetRequest):
    """Request password reset email"""
    user_doc = await db.users.find_one({"email": data.email}, {"_id": 0})
    
    if not user_doc:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = auth_service.generate_reset_token()
    reset_expires = auth_service.get_reset_token_expires()
    
    # Save token to user
    await db.users.update_one(
        {"email": data.email},
        {"$set": {
            "reset_token": reset_token,
            "reset_token_expires": reset_expires.isoformat()
        }}
    )
    
    # Send email
    await email_service.send_password_reset(
        to_email=data.email,
        reset_token=reset_token,
        user_name=user_doc.get('name', 'User')
    )
    
    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/reset-password")
async def reset_password(data: PasswordResetConfirm):
    """Reset password using token"""
    user_doc = await db.users.find_one({"reset_token": data.token}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token expired
    expires = user_doc.get('reset_token_expires')
    if expires:
        if isinstance(expires, str):
            expires = datetime.fromisoformat(expires)
        if expires < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
    
    # Update password and clear reset token
    new_hash = auth_service.hash_password(data.new_password)
    await db.users.update_one(
        {"reset_token": data.token},
        {"$set": {
            "password_hash": new_hash,
            "reset_token": None,
            "reset_token_expires": None
        }}
    )
    
    return {"message": "Password reset successfully"}
