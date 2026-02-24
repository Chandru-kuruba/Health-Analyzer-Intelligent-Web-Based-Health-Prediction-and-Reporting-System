"""
Chat Routes
AI-powered health chat with context awareness
"""
from fastapi import APIRouter, HTTPException, status, Depends
from models.chat_session import (
    ChatSessionCreate, ChatSession, ChatMessage, 
    ChatResponse, ChatSessionResponse
)
from services.chat_service import ChatService
from middleware.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from typing import List
import os
import logging
from datetime import datetime, timezone

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Health Chat"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'health_analyzer')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Service
chat_service = ChatService()


async def get_user_health_context(user_id: str) -> str:
    """Get user's health context for chat"""
    # Get recent health records
    health_records = await db.health_records.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    
    # Get recent image analyses
    image_analyses = await db.image_analyses.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(3)
    
    return chat_service._build_context(health_records, image_analyses)


@router.post("", response_model=ChatResponse)
async def send_chat_message(
    data: ChatSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the AI health chat
    
    - Creates new session if session_id not provided
    - Maintains conversation history
    - Detects emergency symptoms
    """
    user_id = current_user['sub']
    
    # Get or create session
    if data.session_id:
        session_doc = await db.chat_sessions.find_one(
            {"id": data.session_id, "user_id": user_id},
            {"_id": 0}
        )
        if not session_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Parse messages
        messages = []
        for msg in session_doc.get('messages', []):
            if isinstance(msg.get('timestamp'), str):
                msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
            messages.append(msg)
    else:
        # Create new session
        session = ChatSession(user_id=user_id)
        session_doc = session.model_dump()
        session_doc['created_at'] = session_doc['created_at'].isoformat()
        session_doc['updated_at'] = session_doc['updated_at'].isoformat()
        await db.chat_sessions.insert_one(session_doc)
        messages = []
    
    session_id = data.session_id or session_doc['id']
    
    # Get user health context
    health_context = await get_user_health_context(user_id)
    
    # Get AI response
    response_text, is_emergency = await chat_service.send_message(
        user_message=data.message,
        conversation_history=messages,
        health_context=health_context
    )
    
    # Create message records
    user_msg = ChatMessage(
        role="user",
        content=data.message,
        emergency_flag=False
    )
    
    assistant_msg = ChatMessage(
        role="assistant",
        content=response_text,
        emergency_flag=is_emergency
    )
    
    # Update session in MongoDB
    now = datetime.now(timezone.utc)
    await db.chat_sessions.update_one(
        {"id": session_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {
                            "role": "user",
                            "content": data.message,
                            "timestamp": now.isoformat(),
                            "emergency_flag": False
                        },
                        {
                            "role": "assistant",
                            "content": response_text,
                            "timestamp": now.isoformat(),
                            "emergency_flag": is_emergency
                        }
                    ]
                }
            },
            "$set": {
                "updated_at": now.isoformat(),
                "emergency_detected": is_emergency if is_emergency else session_doc.get('emergency_detected', False)
            }
        }
    )
    
    logger.info(f"Chat message processed - Emergency: {is_emergency}")
    
    return ChatResponse(
        session_id=session_id,
        message=assistant_msg,
        emergency_alert=is_emergency,
        disclaimer="This chat provides health information only and does not replace professional medical advice."
    )


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: dict = Depends(get_current_user)
):
    """Get all chat sessions for current user"""
    sessions = await db.chat_sessions.find(
        {"user_id": current_user['sub']},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(50)
    
    # Convert datetime strings
    for session in sessions:
        if isinstance(session.get('created_at'), str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
        if isinstance(session.get('updated_at'), str):
            session['updated_at'] = datetime.fromisoformat(session['updated_at'])
        
        for msg in session.get('messages', []):
            if isinstance(msg.get('timestamp'), str):
                msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific chat session"""
    session = await db.chat_sessions.find_one(
        {"id": session_id, "user_id": current_user['sub']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    # Convert datetime strings
    if isinstance(session.get('created_at'), str):
        session['created_at'] = datetime.fromisoformat(session['created_at'])
    if isinstance(session.get('updated_at'), str):
        session['updated_at'] = datetime.fromisoformat(session['updated_at'])
    
    for msg in session.get('messages', []):
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    
    return session


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a chat session"""
    result = await db.chat_sessions.delete_one(
        {"id": session_id, "user_id": current_user['sub']}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )
    
    return {"message": "Chat session deleted"}
