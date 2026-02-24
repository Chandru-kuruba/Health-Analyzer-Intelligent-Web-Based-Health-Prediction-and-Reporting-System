"""
AI Image Analysis Service - Using Emergent LLM Integration
Uses GPT-4o Vision for medical image analysis
"""
import os
import json
import re
import logging
import base64
import uuid
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Image Analysis System Prompt
IMAGE_ANALYSIS_SYSTEM_PROMPT = """You are an AI medical image analysis assistant.

Analyze the uploaded image of a visible body condition.

IMPORTANT: First determine if this is a medical/health-related image.
- If the image is NOT medical-related (e.g., landscapes, objects, food, people without visible conditions, animals, text, etc.), respond with:
{
  "detectedCondition": "Non-medical image",
  "severityLevel": "Mild",
  "confidenceScore": 95,
  "visualFindings": "This image does not appear to be medical-related. Please upload an image of a visible body condition such as skin conditions, rashes, wounds, or other health-related concerns.",
  "possibleCauses": [],
  "recommendedCare": ["Please upload a medical-related image for analysis"],
  "otcSuggestions": [],
  "whenToSeeDoctor": "If you have health concerns, please consult a healthcare professional.",
  "emergency": false,
  "disclaimer": "This image analysis is AI-assisted and not a medical diagnosis."
}

For medical images, provide structured output in JSON format:
{
  "detectedCondition": "Descriptive name of the detected condition",
  "severityLevel": "Mild | Moderate | Severe",
  "confidenceScore": 0-100,
  "visualFindings": "Detailed description of what is visible in the image",
  "possibleCauses": ["cause1", "cause2"],
  "recommendedCare": ["care step 1", "care step 2"],
  "otcSuggestions": ["OTC product 1"],
  "whenToSeeDoctor": "Specific guidance on when medical attention is needed",
  "emergency": true/false,
  "disclaimer": "This image analysis is AI-assisted and not a medical diagnosis."
}

Deep Analysis Requirements:
1. Possible Condition: Identify the most likely condition based on visual features
2. Symptoms Related: What symptoms might accompany this condition
3. Precautions: Steps to prevent worsening
4. Suggested Next Steps: Clear action items
5. Disclaimer: Always include

Rules:
- Do not provide prescription dosage
- If condition looks severe, mark emergency true
- Be specific to the image features
- Avoid generic responses
- Different images must generate different findings
- Analyze visible skin conditions, rashes, wounds, or other visible symptoms
- ALWAYS return valid JSON"""


def clean_markdown(text: str) -> str:
    """Remove markdown formatting from text"""
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    text = re.sub(r'^\s*\*\s+', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


class ImageAnalysisService:
    """AI-powered medical image analysis service using Emergent LLM integration"""
    
    UPLOADS_DIR = Path("/app/uploads/images")
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        self.model_provider = "openai"
        self.model_name = "gpt-4o"
        # Ensure uploads directory exists
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    def _validate_image(self, base64_data: str) -> tuple[bool, str, str]:
        """
        Validate image data and determine type
        Returns: (is_valid, mime_type, error_message)
        """
        try:
            # Remove data URL prefix if present
            clean_data = base64_data
            if ',' in base64_data:
                header, clean_data = base64_data.split(',', 1)
                if 'image/png' in header:
                    mime_type = 'image/png'
                elif 'image/jpeg' in header or 'image/jpg' in header:
                    mime_type = 'image/jpeg'
                elif 'image/webp' in header:
                    mime_type = 'image/webp'
                elif 'image/gif' in header:
                    mime_type = 'image/gif'
                else:
                    return False, '', 'Unsupported image format. Use JPG, PNG, WEBP, or GIF.'
            else:
                # Try to detect from base64 content
                try:
                    decoded = base64.b64decode(clean_data[:100])
                    if decoded[:8] == b'\x89PNG\r\n\x1a\n':
                        mime_type = 'image/png'
                    elif decoded[:2] == b'\xff\xd8':
                        mime_type = 'image/jpeg'
                    elif decoded[:4] == b'RIFF':
                        mime_type = 'image/webp'
                    elif decoded[:6] in (b'GIF87a', b'GIF89a'):
                        mime_type = 'image/gif'
                    else:
                        mime_type = 'image/jpeg'  # Default
                except Exception:
                    mime_type = 'image/jpeg'
            
            # Validate size (max 20MB)
            decoded_size = len(base64.b64decode(clean_data))
            if decoded_size > 20 * 1024 * 1024:
                return False, '', 'Image too large. Maximum size is 20MB.'
            
            # Minimum size check
            if decoded_size < 100:
                return False, '', 'Image too small or corrupted.'
            
            return True, mime_type, ''
            
        except Exception as e:
            logger.error(f"Image validation error: {e}")
            return False, '', f'Invalid image data: {str(e)}'
    
    async def save_image(self, base64_data: str) -> tuple[str, int]:
        """
        Save base64 image to disk
        Returns: (file_path, file_size)
        """
        try:
            # Remove data URL prefix if present
            clean_data = base64_data
            if ',' in base64_data:
                clean_data = base64_data.split(',', 1)[1]
            
            # Decode image
            image_bytes = base64.b64decode(clean_data)
            file_size = len(image_bytes)
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            
            # Detect extension
            if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                ext = 'png'
            elif image_bytes[:2] == b'\xff\xd8':
                ext = 'jpg'
            elif image_bytes[:4] == b'RIFF':
                ext = 'webp'
            else:
                ext = 'jpg'
            
            filename = f"{file_id}.{ext}"
            filepath = self.UPLOADS_DIR / filename
            
            # Write file
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            return f"/uploads/images/{filename}", file_size
            
        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            raise
    
    async def analyze_image(self, base64_data: str) -> Dict[str, Any]:
        """
        Analyze medical image using GPT-4o Vision via Emergent LLM
        Returns structured analysis result
        """
        # Validate image
        is_valid, mime_type, error = self._validate_image(base64_data)
        if not is_valid:
            raise ValueError(error)
        
        # Clean base64 data
        clean_base64 = base64_data
        if ',' in clean_base64:
            clean_base64 = clean_base64.split(',', 1)[1]
        
        try:
            if not self.api_key:
                logger.error("Emergent LLM API key not configured")
                return self._create_fallback_response()
            
            # Create new LlmChat instance
            session_id = str(uuid.uuid4())
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=IMAGE_ANALYSIS_SYSTEM_PROMPT
            ).with_model(self.model_provider, self.model_name)
            
            # Create image content
            image_content = ImageContent(image_base64=clean_base64)
            
            # Create message with image
            llm_message = UserMessage(
                text="Please analyze this image. If it's a medical image showing a body condition, provide detailed medical analysis in JSON format. If it's not medical-related, indicate that clearly in JSON format.",
                file_contents=[image_content]
            )
            
            # Get AI response
            response_text = await chat.send_message(llm_message)
            
            # Parse response
            result = self._parse_response(response_text)
            
            if result:
                # Clean markdown from text fields
                if 'visualFindings' in result:
                    result['visualFindings'] = clean_markdown(result['visualFindings'])
                if 'whenToSeeDoctor' in result:
                    result['whenToSeeDoctor'] = clean_markdown(result['whenToSeeDoctor'])
                
                # Safety override: if severe, clear OTC suggestions
                if result.get('emergency', False) or result.get('severityLevel') == 'Severe':
                    result['otcSuggestions'] = []
                return result
            else:
                logger.error("Failed to parse AI response")
                return self._create_fallback_response()
                
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return self._create_fallback_response()
    
    def _parse_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse AI JSON response"""
        try:
            response_text = response_text.strip()
            
            # Handle markdown code blocks
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                response_text = response_text[start:end].strip()
            
            data = json.loads(response_text)
            
            # Validate required fields
            required = ['detectedCondition', 'severityLevel', 'confidenceScore', 
                       'visualFindings', 'whenToSeeDoctor']
            for field in required:
                if field not in data:
                    logger.warning(f"Missing field: {field}")
                    return None
            
            # Normalize severity level
            if data['severityLevel'] not in ['Mild', 'Moderate', 'Severe']:
                data['severityLevel'] = 'Moderate'
            
            # Ensure arrays exist
            for field in ['possibleCauses', 'recommendedCare', 'otcSuggestions']:
                if field not in data or not isinstance(data[field], list):
                    data[field] = []
            
            # Ensure disclaimer
            if 'disclaimer' not in data:
                data['disclaimer'] = "This image analysis is AI-assisted and not a medical diagnosis."
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return None
    
    def _create_fallback_response(self) -> Dict[str, Any]:
        """Fallback response when AI is unavailable"""
        return {
            "detectedCondition": "Analysis Unavailable",
            "severityLevel": "Moderate",
            "confidenceScore": 0,
            "visualFindings": "Image analysis service is temporarily unavailable. Please try again or consult a healthcare professional for proper evaluation.",
            "possibleCauses": [],
            "recommendedCare": ["Consult a healthcare professional for proper evaluation"],
            "otcSuggestions": [],
            "whenToSeeDoctor": "Please schedule an appointment with a healthcare provider for proper assessment.",
            "emergency": False,
            "disclaimer": "This image analysis is AI-assisted and not a medical diagnosis."
        }
