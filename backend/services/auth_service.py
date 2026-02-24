from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
import os
import secrets

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "health-analyzer-secret-key-2024-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def generate_reset_token() -> str:
        """Generate a secure reset token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def get_reset_token_expires() -> datetime:
        """Get expiry time for reset token (1 hour)"""
        return datetime.now(timezone.utc) + timedelta(hours=1)
