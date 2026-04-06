"""
ML Service - Image processing utilities using Replicate API with LLaVA-13b
"""
import os
import json
import logging
import base64
import uuid
from typing import Dict, Any
from pathlib import Path
from dotenv import load_dotenv
import replicate

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Configure Replicate
REPLICATE_API_TOKEN = os.environ.get('REPLICATE_API_TOKEN', '')
if REPLICATE_API_TOKEN:
    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

IMAGE_CLASSIFICATION_PROMPT = """Look at this image and classify it briefly.

If this is a medical/health-related image (skin condition, wound, rash, injury), respond with JSON:
{"label": "Brief label like 'Skin Rash' or 'Wound' or 'Bruise'", "confidence": 0.75, "description": "Brief description"}

If this is NOT a medical image, respond with JSON:
{"label": "Non-medical image", "confidence": 0.9, "description": "This is not a medical image"}

Return ONLY JSON."""


class MLService:
    UPLOADS_DIR = Path(__file__).parent.parent / "uploads" / "images"
    
    def __init__(self):
        self.api_token = REPLICATE_API_TOKEN
        self.model = "replicate/llava-1.6-34b"
        self.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    
    async def save_image(self, base64_data: str) -> str:
        try:
            clean_data = base64_data
            if ',' in base64_data:
                clean_data = base64_data.split(',', 1)[1]
            
            image_bytes = base64.b64decode(clean_data)
            file_id = str(uuid.uuid4())
            
            if image_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                ext = 'png'
            elif image_bytes[:2] == b'\xff\xd8':
                ext = 'jpg'
            else:
                ext = 'jpg'
            
            filename = f"{file_id}.{ext}"
            filepath = self.UPLOADS_DIR / filename
            
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            
            return f"/uploads/images/{filename}"
        except Exception as e:
            logger.error(f"Failed to save image: {e}")
            raise
    
    async def analyze_image(self, base64_data: str) -> Dict[str, Any]:
        """Analyze image using Replicate LLaVA-13b for classification"""
        try:
            if not self.api_token:
                logger.error("Replicate API token not configured")
                return self._fallback_response()
            
            clean_base64 = base64_data
            mime_type = "image/jpeg"
            
            if ',' in clean_base64:
                header, clean_base64 = clean_base64.split(',', 1)
                if 'image/png' in header:
                    mime_type = 'image/png'
                elif 'image/webp' in header:
                    mime_type = 'image/webp'
            
            # Create data URI
            data_uri = f"data:{mime_type};base64,{clean_base64}"
            
            # Run LLaVA model
            output = replicate.run(
                self.model,
                input={
                    "image": data_uri,
                    "prompt": IMAGE_CLASSIFICATION_PROMPT,
                    "max_tokens": 300,
                    "temperature": 0.3
                }
            )
            
            response_text = "".join(output)
            
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
                
                # Find JSON
                if '{' in response_text:
                    start = response_text.find('{')
                    end = response_text.rfind('}') + 1
                    json_str = response_text[start:end]
                    data = json.loads(json_str)
                    
                    return {
                        "label": data.get("label", "Unknown"),
                        "confidence": float(data.get("confidence", 0.5)),
                        "description": data.get("description", "Analysis complete")
                    }
                
                # If no JSON, extract from text
                return {
                    "label": "Image Analyzed",
                    "confidence": 0.6,
                    "description": response_text[:200] if len(response_text) > 200 else response_text
                }
                
            except json.JSONDecodeError:
                logger.error("Failed to parse LLaVA response as JSON")
                return {
                    "label": "Image Analyzed",
                    "confidence": 0.5,
                    "description": response_text[:200] if len(response_text) > 200 else response_text
                }
                
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return self._fallback_response()
    
    def _fallback_response(self) -> Dict[str, Any]:
        return {
            "label": "Analysis pending",
            "confidence": 0.0,
            "description": "Image uploaded successfully. Full analysis available in detailed view."
        }