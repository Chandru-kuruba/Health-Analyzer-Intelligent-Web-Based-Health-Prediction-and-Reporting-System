from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timezone
import os

security = HTTPBearer()

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "health-analyzer-secret-key-2024-production")
ALGORITHM = "HS256"

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, credentials: HTTPAuthorizationCredentials = Depends(security)):
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Invalid authentication scheme."
                )
            payload = verify_token(credentials.credentials)
            if not payload:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="Invalid token or expired token."
                )
            return payload
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Invalid authorization code."
            )

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            return None
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
