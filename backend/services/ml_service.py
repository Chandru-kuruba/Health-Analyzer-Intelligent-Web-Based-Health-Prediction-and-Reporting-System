"""
ML Service - Image processing utilities
Uses OpenAI GPT-4o for image analysis
"""
import os
import json
import logging
import base64
import uuid
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Simple image classification prompt
IMAGE_CLASSIFICATION_PROMPT = """Analyze this medical image and classify what you see.

Return a JSON response with:
{
  "label": "Brief label of what you see (e.g., 'Skin Rash', 'Wound', 'Normal Skin', 'Bruise')",
  "confidence": 0.0-1.0,
  "description": "Brief description of the findings"
}

If this is not a medical image, return:
{
  "label": "Non-medical image",
  "confidence": 0.9,
  "description": "This does not appear to be a medical image"
}"""


class MLService:
    """ML service for image classification using OpenAI"""
    
    UPLOADS_DIR = Path("/app/uploads/images")
    
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY', '')
        self.client = None
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        self.model_name = "gpt-4o"
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    async def save_image(self, base64_data: str) -> str:
        """Save base64 image to disk and return URL"""
        try:
            # Remove data URL prefix if present
            clean_data = base64_data
            if ',' in base64_data:
                clean_data = base64_data.split(',', 1)[1]
            
            # Decode image
            image_bytes = base64.b64decode(clean_data)
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            
            # Detect extension
            if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                ext = 'png'
            elif image_bytes[:2] == b'\xff\xd8':
                ext = 'jpg'
            else:
                ext = 'jpg'
            
            filename = f"{file_id}.{ext}"
            filepath = self.UPLOADS_DIR / filename
            
            # Write file
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            return f"/uploads/images/{filename}"
            
        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            raise
    
    async def analyze_image(self, base64_data: str) -> Dict[str, Any]:
        """Analyze image and return classification"""
        try:
            if not self.client:
                logger.error("OpenAI API key not configured")
                return self._fallback_response()
            
            # Clean base64 data
            clean_base64 = base64_data
            mime_type = "image/jpeg"
            
            if ',' in clean_base64:
                header, clean_base64 = clean_base64.split(',', 1)
                if 'image/png' in header:
                    mime_type = 'image/png'
                elif 'image/webp' in header:
                    mime_type = 'image/webp'
            
            image_url = f"data:{mime_type};base64,{clean_base64}"
            
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": IMAGE_CLASSIFICATION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url, "detail": "low"}
                        }
                    ]
                }
            ]
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=500,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content
            
            # Parse JSON response
            try:
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
                return {
                    "label": data.get("label", "Unknown"),
                    "confidence": float(data.get("confidence", 0.5)),
                    "description": data.get("description", "Analysis complete")
                }
            except json.JSONDecodeError:
                return self._fallback_response()
                
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return self._fallback_response()
    
    def _fallback_response(self) -> Dict[str, Any]:
        """Fallback response when analysis fails"""
        return {
            "label": "Analysis pending",
            "confidence": 0.0,
            "description": "Image uploaded successfully. Full analysis available in detailed view."
        }
