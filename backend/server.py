from fastapi import FastAPI, APIRouter, Depends
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime
from passlib.context import CryptContext

# Import routes
from routes.auth_routes import router as auth_router
from routes.health_routes import router as health_router
from routes.image_routes import router as image_router
from routes.chat_routes import router as chat_router
from routes.admin_routes import router as admin_router
from middleware.auth import get_current_user
from models.user import UserResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'health_analyzer')]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(
    title="Health Analyzer API",
    description="Intelligent Health Prediction and Reporting System with AI-powered Image Analysis and Chat",
    version="2.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Root endpoint
@api_router.get("/")
async def root():
    return {
        "message": "Health Analyzer API",
        "version": "2.0.0",
        "status": "healthy",
        "features": [
            "AI-powered Health Assessment",
            "Medical Image Analysis",
            "Context-aware Health Chat",
            "Admin Dashboard",
            "Email Notifications",
            "PDF Reports"
        ]
    }

# Get current user info (protected endpoint)
@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    user_doc = await db.users.find_one({"id": current_user['sub']}, {"_id": 0})
    if not user_doc:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    created_at = user_doc.get('created_at')
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    
    return UserResponse(
        id=user_doc['id'],
        name=user_doc['name'],
        email=user_doc['email'],
        role=user_doc.get('role', 'user'),
        email_verified=user_doc.get('email_verified', False),
        created_at=created_at
    )

# Include routers
api_router.include_router(auth_router)
api_router.include_router(health_router)
api_router.include_router(image_router)
api_router.include_router(chat_router)
api_router.include_router(admin_router)

# Include the api_router in the main app
app.include_router(api_router)

# Mount static files for uploaded images
uploads_path = Path("/app/uploads")
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def seed_admin_user():
    """Seed default admin user if not exists"""
    admin_email = "admin@healthanalyzer.com"
    admin_password = "Admin@12345"
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        import uuid
        from datetime import timezone
        
        admin_doc = {
            "id": str(uuid.uuid4()),
            "name": "System Admin",
            "email": admin_email,
            "password_hash": pwd_context.hash(admin_password),
            "role": "admin",
            "email_verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info(f"Admin user seeded: {admin_email}")
    else:
        # Ensure existing admin has admin role
        if existing_admin.get('role') != 'admin':
            await db.users.update_one(
                {"email": admin_email},
                {"$set": {"role": "admin"}}
            )
            logger.info(f"Updated admin role for: {admin_email}")

@app.on_event("startup")
async def startup_event():
    logger.info("Health Analyzer API v2.0 starting up...")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.health_records.create_index("user_id")
    await db.health_records.create_index("id", unique=True)
    await db.image_analyses.create_index("user_id")
    await db.image_analyses.create_index("id", unique=True)
    await db.chat_sessions.create_index("user_id")
    await db.chat_sessions.create_index("id", unique=True)
    await db.admin_logs.create_index("admin_id")
    await db.admin_logs.create_index("created_at")
    
    logger.info("Database indexes created")
    
    # Seed admin user
    await seed_admin_user()
    
    logger.info("Health Analyzer API ready")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("Health Analyzer API shutting down...")
