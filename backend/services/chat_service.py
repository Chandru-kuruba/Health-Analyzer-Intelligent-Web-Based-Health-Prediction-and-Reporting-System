"""
AI Health Chat Service - Using Groq API
"""
import os
import re
import logging
from typing import Dict, Any, List
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

FOUNDER_RESPONSE = """Name: Chandru H / Akash B / Gopi Reddy Manoj Kumar
USN: 23DBCAD021 / 23DBCAD007 / 23DBCAD030
Course: 6th Sem BCA DS 'A sec'
School: SSCS
University: CMR University"""

FOUNDER_KEYWORDS = [
    "who created", "who made", "who developed", "who built",
    "creator", "founder", "developer", "makers",
    "about the developers", "who is behind", "who designed",
    "who owns", "who is the owner", "made by whom",
    "developed by whom", "created by whom"
]

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

CHAT_SYSTEM_PROMPT = """You are a Health Assistant AI. You ONLY answer medical and health-related queries.

IMPORTANT RESTRICTIONS:
- You can ONLY discuss: medical advice (non-diagnostic), health symptoms, first aid, wellness, diet & fitness, preventive healthcare, mental health wellness, medications (general info, not prescriptions)
- For ANY question outside health/medical topics, respond with: "I am a Health Assistant. I can only answer medical and health-related queries."
- NEVER provide: specific drug dosages, diagnosis, or replace professional medical advice

Emergency Detection - If user describes ANY of these symptoms, IMMEDIATELY advise emergency medical care:
- Chest pain, crushing chest pressure
- Difficulty breathing, can't breathe
- Loss of consciousness, fainting
- Heavy bleeding that won't stop
- Severe allergic reaction, throat swelling
- Sudden numbness, facial droop, slurred speech (stroke signs)
- Severe head injury, Overdose, Suicidal thoughts

For emergency symptoms, respond with:
1. Clear statement: "EMERGENCY: Seek immediate medical attention"
2. Advise to call emergency services (911 or local equivalent)

Always end with: "Remember, I'm an AI assistant and cannot replace professional medical advice."

RESPONSE FORMAT RULES:
- Do NOT use markdown formatting like ### or ** or *
- Use plain text only
- Keep responses clean and readable"""

EMERGENCY_KEYWORDS = [
    "chest pain", "crushing chest", "heart attack",
    "can't breathe", "difficulty breathing", "choking",
    "unconscious", "passed out", "fainting",
    "heavy bleeding", "won't stop bleeding",
    "allergic reaction", "throat swelling", "anaphylaxis",
    "numbness", "facial droop", "slurred speech", "stroke",
    "overdose", "poisoning", "severe head injury", "head trauma",
    "suicidal", "want to die", "end my life"
]


def clean_markdown(text: str) -> str:
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    text = re.sub(r'^\s*\*\s+', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


class ChatService:
    def __init__(self):
        self.api_key = os.environ.get('GROQ_API_KEY', '')
        self.client = None
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        self.model_name = "llama-3.1-8b-instant"
    
    def _is_founder_query(self, message: str) -> bool:
        message_lower = message.lower()
        for keyword in FOUNDER_KEYWORDS:
            if keyword in message_lower:
                return True
        return False
    
    def _is_non_medical_query(self, message: str) -> bool:
        message_lower = message.lower()
        for keyword in NON_MEDICAL_KEYWORDS:
            if keyword in message_lower:
                return True
        return False
    
    def _detect_emergency(self, message: str) -> bool:
        message_lower = message.lower()
        for keyword in EMERGENCY_KEYWORDS:
            if keyword in message_lower:
                return True
        return False
    
    def _build_context(self, health_records: List[Dict], image_analyses: List[Dict]) -> str:
        context_parts = []
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
        if not context_parts:
            return "No health history available for this user."
        return "\n".join(context_parts)
    
    def _create_emergency_response(self) -> str:
        return """EMERGENCY: Seek Immediate Medical Attention

Based on what you've described, this may be a medical emergency. Please:

1. Call emergency services immediately (911 or your local emergency number)
2. Do not delay - time is critical
3. Stay calm and follow dispatcher instructions
4. Do not drive yourself - have someone drive you or wait for emergency services

Remember, I'm an AI assistant and cannot replace professional medical advice."""
    
    def _create_non_medical_response(self) -> str:
        return "I am a Health Assistant. I can only answer medical and health-related queries."
    
    async def send_message(
        self,
        user_message: str,
        conversation_history: List[Dict],
        health_context: str
    ) -> tuple[str, bool]:
        # Check for founder query first - OVERRIDE EVERYTHING
        if self._is_founder_query(user_message):
            return FOUNDER_RESPONSE, False
        
        # Check for non-medical query
        if self._is_non_medical_query(user_message):
            return self._create_non_medical_response(), False
        
        # Check for emergency keywords
        is_emergency = self._detect_emergency(user_message)
        
        if is_emergency:
            logger.warning("Emergency detected in chat message")
            return self._create_emergency_response(), True
        
        try:
            if not self.client:
                logger.error("Groq API key not configured")
                return self._fallback_response(), False
            
            # Build system prompt with context
            system_prompt = f"{CHAT_SYSTEM_PROMPT}\n\n--- User Health Context ---\n{health_context}"
            
            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history (last 10 messages)
            if conversation_history:
                recent_messages = conversation_history[-10:]
                for msg in recent_messages:
                    messages.append({
                        "role": msg.get('role', 'user'),
                        "content": msg.get('content', '')
                    })
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Get AI response from Groq
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=1000,
                temperature=0.7
            )
            
            response_text = response.choices[0].message.content
            response_text = clean_markdown(response_text)
            
            # Check if response contains emergency indicators
            response_lower = response_text.lower()
            if "emergency" in response_lower and "seek immediate" in response_lower:
                is_emergency = True
            
            return response_text, is_emergency
            
        except Exception as e:
            logger.error(f"Chat error: {e}")
            return self._fallback_response(), False
    
    def _fallback_response(self) -> str:
        return """I apologize, but I'm having trouble connecting to my knowledge base right now. 

For health-related questions, I recommend:
1. Consulting with a healthcare professional
2. Using trusted medical resources like WebMD or Mayo Clinic
3. For emergencies, always call your local emergency number

Remember, I'm an AI assistant and cannot replace professional medical advice."""