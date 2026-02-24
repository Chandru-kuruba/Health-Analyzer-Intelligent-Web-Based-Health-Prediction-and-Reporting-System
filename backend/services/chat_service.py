"""
AI Health Chat Service - Using Emergent LLM Integration
Context-aware conversational health assistant
"""
import os
import re
import logging
import uuid
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Founder/Creator Response - MUST OVERRIDE ANY AI RESPONSE
FOUNDER_RESPONSE = """Name: Chandru H / Akash B / Gopi Reddy Manoj Kumar
USN: 23DBCAD021 / 23DBCAD007 / 23DBCAD030
Course: 6th Sem BCA DS 'A sec'
School: SSCS
University: CMR University"""

# Keywords that trigger founder response
FOUNDER_KEYWORDS = [
    "who created", "who made", "who developed", "who built",
    "creator", "founder", "developer", "makers",
    "about the developers", "who is behind", "who designed",
    "who owns", "who is the owner", "made by whom",
    "developed by whom", "created by whom"
]

# Non-medical keywords to reject
NON_MEDICAL_KEYWORDS = [
    "politics", "election", "government", "president", "prime minister",
    "coding", "programming", "python", "javascript", "code", "software",
    "technology", "computer", "laptop", "phone", "app development",
    "sports", "football", "cricket", "basketball", "soccer",
    "entertainment", "movie", "music", "celebrity", "actor",
    "finance", "stock", "cryptocurrency", "bitcoin", "investment",
    "recipe", "cooking", "restaurant", "food recipe",
    "travel", "tourism", "vacation", "hotel", "flight",
    "weather", "climate change", "global warming",
    "history", "geography", "mathematics", "physics", "chemistry",
    "tell me a joke", "funny story", "riddle", "puzzle",
    "news", "current affairs", "war", "military",
    "religion", "god", "spiritual", "astrology", "horoscope"
]

# Chat System Prompt - Restricted to Medical/Health ONLY
CHAT_SYSTEM_PROMPT = """You are a Health Assistant AI. You ONLY answer medical and health-related queries.

IMPORTANT RESTRICTIONS:
- You can ONLY discuss: medical advice (non-diagnostic), health symptoms, first aid, wellness, diet & fitness, preventive healthcare, mental health wellness, medications (general info, not prescriptions)
- For ANY question outside health/medical topics, respond with: "I am a Health Assistant. I can only answer medical and health-related queries."
- NEVER provide: specific drug dosages, diagnosis, or replace professional medical advice

You have access to the user's health history for context-aware responses.

Emergency Detection - If user describes ANY of these symptoms, IMMEDIATELY advise emergency medical care:
- Chest pain, crushing chest pressure
- Difficulty breathing, can't breathe
- Loss of consciousness, fainting
- Heavy bleeding that won't stop
- Severe allergic reaction, throat swelling
- Sudden numbness, facial droop, slurred speech (stroke signs)
- Severe head injury
- Overdose
- Suicidal thoughts

For emergency symptoms, your response MUST include:
1. Clear statement: "EMERGENCY: Seek immediate medical attention"
2. Advise to call emergency services (911 or local equivalent)
3. Do NOT provide any other advice that could delay seeking help

For non-emergency health queries:
- Reference the user's health data when relevant
- Provide general health information
- Suggest lifestyle improvements
- Recommend seeing a doctor for persistent issues

Always end with: "Remember, I'm an AI assistant and cannot replace professional medical advice."

RESPONSE FORMAT RULES:
- Do NOT use markdown formatting like ### or ** or *
- Use plain text only
- Use simple line breaks for separation
- Keep responses clean and readable"""

EMERGENCY_KEYWORDS = [
    "chest pain", "crushing chest", "heart attack",
    "can't breathe", "difficulty breathing", "choking",
    "unconscious", "passed out", "fainting",
    "heavy bleeding", "won't stop bleeding",
    "allergic reaction", "throat swelling", "anaphylaxis",
    "numbness", "facial droop", "slurred speech", "stroke",
    "overdose", "poisoning",
    "severe head injury", "head trauma",
    "suicidal", "want to die", "end my life"
]


def clean_markdown(text: str) -> str:
    """Remove markdown formatting from text"""
    # Remove ### headers
    text = re.sub(r'#{1,6}\s*', '', text)
    # Remove bold **text** or __text__
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    # Remove italic *text* or _text_
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    # Remove bullet points with asterisks
    text = re.sub(r'^\s*\*\s+', '- ', text, flags=re.MULTILINE)
    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


class ChatService:
    """AI-powered health chat service using Emergent LLM integration"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        self.model_provider = "openai"
        self.model_name = "gpt-4o"
    
    def _is_founder_query(self, message: str) -> bool:
        """Check if message asks about founder/creator"""
        message_lower = message.lower()
        for keyword in FOUNDER_KEYWORDS:
            if keyword in message_lower:
                return True
        return False
    
    def _is_non_medical_query(self, message: str) -> bool:
        """Check if message is about non-medical topics"""
        message_lower = message.lower()
        for keyword in NON_MEDICAL_KEYWORDS:
            if keyword in message_lower:
                return True
        return False
    
    def _detect_emergency(self, message: str) -> bool:
        """Check if message contains emergency keywords"""
        message_lower = message.lower()
        for keyword in EMERGENCY_KEYWORDS:
            if keyword in message_lower:
                return True
        return False
    
    def _build_context(self, health_records: List[Dict], image_analyses: List[Dict]) -> str:
        """Build context string from user's health history"""
        context_parts = []
        
        # Add recent health records summary
        if health_records:
            latest = health_records[0]
            context_parts.append(f"""
User's Latest Health Assessment:
- BMI: {latest.get('bmi', 'N/A')} ({latest.get('bmi_category', 'N/A')})
- Blood Pressure: {latest.get('blood_pressure_systolic', 'N/A')}/{latest.get('blood_pressure_diastolic', 'N/A')} mmHg
- Blood Sugar: {latest.get('blood_sugar_level', 'N/A')} mg/dL
- Recent Symptoms: {latest.get('symptoms', 'None reported')}
- Risk Level: {latest.get('risk_level', 'N/A')}
""")
            
            # Add AI triage summary if available
            ai_triage = latest.get('ai_triage')
            if ai_triage:
                context_parts.append(f"""
AI Triage Analysis:
- Primary Condition: {ai_triage.get('primaryCondition', 'N/A')}
- Clinical Reasoning: {ai_triage.get('clinicalReasoning', 'N/A')}
""")
        
        # Add recent image analysis summary
        if image_analyses:
            latest_img = image_analyses[0]
            context_parts.append(f"""
Latest Image Analysis:
- Detected Condition: {latest_img.get('detected_condition', 'N/A')}
- Severity: {latest_img.get('severity_level', 'N/A')}
- Findings: {latest_img.get('visual_findings', 'N/A')}
""")
        
        if not context_parts:
            return "No health history available for this user."
        
        return "\n".join(context_parts)
    
    def _create_emergency_response(self) -> str:
        """Create emergency response message"""
        return """EMERGENCY: Seek Immediate Medical Attention

Based on what you've described, this may be a medical emergency. Please:

1. Call emergency services immediately (911 in the US, or your local emergency number)
2. Do not delay - time is critical
3. Stay calm and follow dispatcher instructions
4. Do not drive yourself - have someone drive you or wait for emergency services

If someone is with you, have them call while you stay on the line.

I cannot provide any further advice that might delay you seeking emergency care.

Remember, I'm an AI assistant and cannot replace professional medical advice."""
    
    def _create_non_medical_response(self) -> str:
        """Response for non-medical queries"""
        return "I am a Health Assistant. I can only answer medical and health-related queries."
    
    async def send_message(
        self,
        user_message: str,
        conversation_history: List[Dict],
        health_context: str
    ) -> tuple[str, bool]:
        """
        Send message to AI chat and get response
        Returns: (response_text, is_emergency)
        """
        # Check for founder query first - OVERRIDE EVERYTHING
        if self._is_founder_query(user_message):
            return FOUNDER_RESPONSE, False
        
        # Check for non-medical query
        if self._is_non_medical_query(user_message):
            return self._create_non_medical_response(), False
        
        # Check for emergency keywords
        is_emergency = self._detect_emergency(user_message)
        
        if is_emergency:
            logger.warning(f"Emergency detected in chat message")
            return self._create_emergency_response(), True
        
        try:
            if not self.api_key:
                logger.error("Emergent LLM API key not configured")
                return self._fallback_response(), False
            
            # Build system prompt with context
            system_prompt = f"{CHAT_SYSTEM_PROMPT}\n\n--- User Health Context ---\n{health_context}"
            
            # Create new LlmChat instance for this request
            session_id = str(uuid.uuid4())
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=system_prompt
            ).with_model(self.model_provider, self.model_name)
            
            # Build conversation context (last few messages for context)
            conversation_context = ""
            if conversation_history:
                recent_messages = conversation_history[-6:]
                for msg in recent_messages:
                    role = msg.get('role', 'user')
                    content = msg.get('content', '')
                    conversation_context += f"\n{role.capitalize()}: {content}"
            
            # Create message with context
            full_message = user_message
            if conversation_context:
                full_message = f"Previous conversation context:{conversation_context}\n\nCurrent question: {user_message}"
            
            # Get AI response
            llm_message = UserMessage(text=full_message)
            response_text = await chat.send_message(llm_message)
            
            # Clean markdown from response
            response_text = clean_markdown(response_text)
            
            # Check if AI response contains emergency indicators
            response_lower = response_text.lower()
            if "emergency" in response_lower and "seek immediate" in response_lower:
                is_emergency = True
            
            return response_text, is_emergency
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return self._fallback_response(), False
    
    def _fallback_response(self) -> str:
        """Fallback response when AI is unavailable"""
        return """I apologize, but I'm having trouble connecting to my knowledge base right now. 

For health-related questions, I recommend:
1. Consulting with a healthcare professional
2. Using trusted medical resources like WebMD or Mayo Clinic
3. For emergencies, always call your local emergency number

Remember, I'm an AI assistant and cannot replace professional medical advice."""
