"""
AI Medical Triage Service - Using Standard OpenAI API
Uses OpenAI GPT-4o for intelligent medical analysis and recommendations
"""
import os
import json
import re
import logging
from typing import Optional, Dict, Any, Tuple
from dotenv import load_dotenv
from pathlib import Path
from openai import OpenAI

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Medical System Prompt
MEDICAL_SYSTEM_PROMPT = """You are an AI medical triage assistant.

Analyze the provided patient data carefully and return structured health insights.

Rules:
- Do NOT provide prescription drug dosages.
- Only suggest over-the-counter (OTC) medicines if appropriate.
- If condition appears severe, recommend immediate medical consultation.
- Be dynamic and personalize output based on patient data.
- Avoid generic recommendations.
- Use risk-based reasoning.
- Always include a medical disclaimer.
- Base your reasoning strictly on provided data.
- Ensure different symptom combinations generate different outputs.

Return response strictly in JSON format:

{
  "primaryCondition": "Main identified condition or concern",
  "otherPossibleConditions": ["condition1", "condition2"],
  "riskLevel": "Low | Moderate | High",
  "confidenceScore": 0-100,
  "clinicalReasoning": "Detailed explanation of the analysis",
  "recommendedTests": ["test1", "test2"],
  "lifestyleRecommendations": ["recommendation1", "recommendation2"],
  "otcSuggestions": ["OTC product 1"],
  "whenToSeeDoctor": "Specific guidance",
  "emergencyAlert": true/false,
  "disclaimer": "This system provides informational health insights only and does not replace professional medical advice."
}"""


def clean_markdown(text: str) -> str:
    """Remove markdown formatting from text"""
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    return text.strip()


class AITriageService:
    """AI-powered medical triage analysis service using standard OpenAI API"""
    
    # Critical thresholds for safety override
    CRITICAL_BP_SYSTOLIC = 170
    CRITICAL_SUGAR_HIGH = 300
    CRITICAL_SUGAR_LOW = 50
    SEVERE_SYMPTOMS = [
        "severe chest pain", "crushing chest pain", "chest pressure",
        "difficulty breathing", "can't breathe", "gasping for air",
        "sudden numbness", "facial droop", "slurred speech",
        "sudden severe headache", "worst headache",
        "loss of consciousness", "fainting", "passed out",
        "severe allergic reaction", "throat swelling", "anaphylaxis",
        "coughing blood", "vomiting blood", "blood in stool"
    ]
    
    def __init__(self):
        self.api_key = os.environ.get('OPENAI_API_KEY', '')
        self.client = None
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        self.model_name = "gpt-4o"
        
    def _check_critical_thresholds(
        self,
        bp_systolic: Optional[int],
        bp_diastolic: Optional[int],
        blood_sugar: Optional[float],
        symptoms: Optional[str]
    ) -> Tuple[bool, str]:
        """
        Safety override layer - Check for critical conditions before AI call
        Returns: (is_emergency, reason)
        """
        reasons = []
        
        # Check blood pressure
        if bp_systolic and bp_systolic > self.CRITICAL_BP_SYSTOLIC:
            reasons.append(f"Critically high blood pressure (Systolic: {bp_systolic})")
        
        # Check blood sugar
        if blood_sugar:
            if blood_sugar > self.CRITICAL_SUGAR_HIGH:
                reasons.append(f"Dangerously high blood sugar ({blood_sugar} mg/dL)")
            elif blood_sugar < self.CRITICAL_SUGAR_LOW:
                reasons.append(f"Dangerously low blood sugar ({blood_sugar} mg/dL)")
        
        # Check for severe symptoms
        if symptoms:
            symptoms_lower = symptoms.lower()
            for severe in self.SEVERE_SYMPTOMS:
                if severe in symptoms_lower:
                    reasons.append(f"Severe symptom detected: {severe}")
                    break
        
        is_emergency = len(reasons) > 0
        return is_emergency, "; ".join(reasons) if reasons else ""
    
    def _build_patient_prompt(
        self,
        age: int,
        gender: str,
        bmi: float,
        bmi_category: str,
        blood_sugar: Optional[float],
        bp_systolic: Optional[int],
        bp_diastolic: Optional[int],
        symptoms: Optional[str],
        image_prediction: Optional[Dict[str, Any]]
    ) -> str:
        """Build the patient data prompt for AI analysis"""
        
        # Format blood pressure
        bp_str = "Not provided"
        if bp_systolic and bp_diastolic:
            bp_str = f"{bp_systolic}/{bp_diastolic} mmHg"
        
        # Format blood sugar
        sugar_str = f"{blood_sugar} mg/dL" if blood_sugar else "Not provided"
        
        # Format image analysis
        image_str = "No image uploaded"
        if image_prediction:
            image_str = f"{image_prediction.get('label', 'Unknown')} (Confidence: {image_prediction.get('confidence', 0)*100:.1f}%)"
            if image_prediction.get('description'):
                image_str += f" - {image_prediction.get('description')}"
        
        prompt = f"""Patient Profile:
Age: {age} years old
Gender: {gender.capitalize()}
BMI: {bmi} ({bmi_category})
Blood Sugar Level: {sugar_str}
Blood Pressure: {bp_str}
Symptoms: {symptoms if symptoms else "None reported"}
Image Analysis Result: {image_str}

Please analyze this patient's health data and provide a comprehensive triage assessment."""
        
        return prompt
    
    def _create_emergency_response(self, reason: str) -> Dict[str, Any]:
        """Create emergency response when critical thresholds are exceeded"""
        return {
            "primaryCondition": "Medical Emergency Detected",
            "otherPossibleConditions": [],
            "riskLevel": "High",
            "confidenceScore": 95,
            "clinicalReasoning": f"CRITICAL ALERT: {reason}. This requires immediate medical attention. The detected values or symptoms indicate a potentially life-threatening condition that needs emergency care.",
            "recommendedTests": [
                "Emergency room evaluation",
                "Complete vital signs monitoring",
                "Emergency blood work panel"
            ],
            "lifestyleRecommendations": [
                "Do not delay - seek immediate medical care",
                "Have someone drive you to the ER or call emergency services",
                "Do not eat or drink until evaluated"
            ],
            "otcSuggestions": [],
            "whenToSeeDoctor": "IMMEDIATELY - This is a medical emergency",
            "emergencyAlert": True,
            "disclaimer": "This system provides informational health insights only and does not replace professional medical advice. In case of emergency, call your local emergency number immediately."
        }
    
    def _create_fallback_response(
        self,
        bmi: float,
        bmi_category: str,
        blood_sugar: Optional[float],
        bp_systolic: Optional[int],
        symptoms: Optional[str]
    ) -> Dict[str, Any]:
        """Fallback weighted scoring engine when AI fails"""
        
        risk_score = 0
        conditions = []
        recommendations = []
        tests = []
        
        # BMI analysis
        if bmi_category == "Obese":
            risk_score += 2
            conditions.append("Obesity-related health concerns")
            recommendations.append("Consult a nutritionist for a personalized diet plan")
            tests.append("Lipid profile test")
        elif bmi_category == "Overweight":
            risk_score += 1
            conditions.append("Overweight")
            recommendations.append("Regular moderate exercise recommended")
        
        # Blood sugar analysis
        if blood_sugar:
            if blood_sugar > 200:
                risk_score += 3
                conditions.append("Elevated blood glucose")
                tests.append("HbA1c test")
                tests.append("Fasting glucose test")
            elif blood_sugar > 140:
                risk_score += 2
                conditions.append("Pre-diabetic range glucose")
                tests.append("Oral glucose tolerance test")
        
        # Blood pressure analysis
        if bp_systolic:
            if bp_systolic >= 140:
                risk_score += 2
                conditions.append("Elevated blood pressure")
                tests.append("24-hour blood pressure monitoring")
        
        # Determine risk level
        if risk_score >= 5:
            risk_level = "High"
        elif risk_score >= 2:
            risk_level = "Moderate"
        else:
            risk_level = "Low"
        
        primary = conditions[0] if conditions else "General health assessment"
        
        return {
            "primaryCondition": primary,
            "otherPossibleConditions": conditions[1:] if len(conditions) > 1 else [],
            "riskLevel": risk_level,
            "confidenceScore": 60,
            "clinicalReasoning": f"Based on provided metrics: BMI {bmi} ({bmi_category}), this assessment uses standardized health guidelines. AI analysis was unavailable.",
            "recommendedTests": tests if tests else ["Annual health checkup"],
            "lifestyleRecommendations": recommendations if recommendations else ["Maintain balanced diet", "Regular exercise", "Adequate sleep"],
            "otcSuggestions": [],
            "whenToSeeDoctor": "Schedule a routine checkup within the next month" if risk_level == "Low" else "Consider seeing a doctor within the next 1-2 weeks",
            "emergencyAlert": False,
            "disclaimer": "This system provides informational health insights only and does not replace professional medical advice."
        }
    
    async def analyze_patient(
        self,
        age: int,
        gender: str,
        bmi: float,
        bmi_category: str,
        blood_sugar: Optional[float] = None,
        bp_systolic: Optional[int] = None,
        bp_diastolic: Optional[int] = None,
        symptoms: Optional[str] = None,
        image_prediction: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main AI triage analysis method
        Returns structured medical triage response
        """
        
        # Step 1: Safety Override Check
        is_emergency, emergency_reason = self._check_critical_thresholds(
            bp_systolic, bp_diastolic, blood_sugar, symptoms
        )
        
        if is_emergency:
            logger.warning(f"Emergency detected: {emergency_reason}")
            return self._create_emergency_response(emergency_reason)
        
        # Step 2: Build patient prompt
        patient_prompt = self._build_patient_prompt(
            age, gender, bmi, bmi_category,
            blood_sugar, bp_systolic, bp_diastolic,
            symptoms, image_prediction
        )
        
        # Step 3: Call AI
        try:
            if not self.client:
                logger.error("OpenAI API key not configured")
                return self._create_fallback_response(bmi, bmi_category, blood_sugar, bp_systolic, symptoms)
            
            # Create messages
            messages = [
                {"role": "system", "content": MEDICAL_SYSTEM_PROMPT},
                {"role": "user", "content": patient_prompt}
            ]
            
            # Get AI response
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=1500,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content
            
            # Step 4: Parse and validate JSON response
            ai_response = self._parse_ai_response(response_text)
            
            if ai_response:
                # Clean markdown from text fields
                if 'clinicalReasoning' in ai_response:
                    ai_response['clinicalReasoning'] = clean_markdown(ai_response['clinicalReasoning'])
                
                logger.info(f"AI Triage complete - Confidence: {ai_response.get('confidenceScore', 0)}%")
                
                # If high risk with emergency alert, ensure no OTC suggestions
                if ai_response.get('emergencyAlert', False):
                    ai_response['otcSuggestions'] = []
                
                return ai_response
            else:
                logger.error("Failed to parse AI response, using fallback")
                return self._create_fallback_response(bmi, bmi_category, blood_sugar, bp_systolic, symptoms)
                
        except Exception as e:
            logger.error(f"AI triage error: {str(e)}")
            return self._create_fallback_response(bmi, bmi_category, blood_sugar, bp_systolic, symptoms)
    
    def _parse_ai_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse and validate AI JSON response"""
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
            
            # Parse JSON
            data = json.loads(response_text)
            
            # Validate required fields
            required_fields = [
                'primaryCondition', 'riskLevel', 'confidenceScore',
                'clinicalReasoning', 'emergencyAlert', 'disclaimer'
            ]
            
            for field in required_fields:
                if field not in data:
                    logger.warning(f"Missing required field: {field}")
                    return None
            
            # Validate risk level
            if data['riskLevel'] not in ['Low', 'Moderate', 'High']:
                data['riskLevel'] = 'Moderate'
            
            # Validate confidence score
            confidence = data.get('confidenceScore', 50)
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 100:
                data['confidenceScore'] = 50
            
            # Ensure arrays exist
            array_fields = ['otherPossibleConditions', 'recommendedTests', 
                          'lifestyleRecommendations', 'otcSuggestions']
            for field in array_fields:
                if field not in data or not isinstance(data[field], list):
                    data[field] = []
            
            return data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}")
            return None
        except Exception as e:
            logger.error(f"Response parse error: {e}")
            return None
