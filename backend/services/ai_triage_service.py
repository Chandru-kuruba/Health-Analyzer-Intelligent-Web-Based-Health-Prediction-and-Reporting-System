"""
AI Medical Triage Service - Using Groq API
"""
import os
import json
import re
import logging
from typing import Optional, Dict, Any, Tuple
from dotenv import load_dotenv
from pathlib import Path
from groq import Groq

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

MEDICAL_SYSTEM_PROMPT = """You are an AI medical triage assistant.

Analyze the provided patient data carefully and return structured health insights.

Rules:
- Do NOT provide prescription drug dosages.
- Only suggest over-the-counter (OTC) medicines if appropriate.
- If condition appears severe, recommend immediate medical consultation.
- Always include a medical disclaimer.
- Return response strictly in JSON format.

Return this exact JSON structure:
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
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    return text.strip()


class AITriageService:
    CRITICAL_BP_SYSTOLIC = 170
    CRITICAL_SUGAR_HIGH = 300
    CRITICAL_SUGAR_LOW = 50
    SEVERE_SYMPTOMS = [
        "severe chest pain", "crushing chest pain", "chest pressure",
        "difficulty breathing", "can't breathe", "gasping for air",
        "sudden numbness", "facial droop", "slurred speech",
        "loss of consciousness", "fainting", "passed out",
        "severe allergic reaction", "throat swelling", "anaphylaxis"
    ]
    
    def __init__(self):
        self.api_key = os.environ.get('GROQ_API_KEY', '')
        self.client = None
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        self.model_name = "llama-3.1-8b-instant"
        
    def _check_critical_thresholds(self, bp_systolic, bp_diastolic, blood_sugar, symptoms) -> Tuple[bool, str]:
        reasons = []
        if bp_systolic and bp_systolic > self.CRITICAL_BP_SYSTOLIC:
            reasons.append(f"Critically high blood pressure (Systolic: {bp_systolic})")
        if blood_sugar:
            if blood_sugar > self.CRITICAL_SUGAR_HIGH:
                reasons.append(f"Dangerously high blood sugar ({blood_sugar} mg/dL)")
            elif blood_sugar < self.CRITICAL_SUGAR_LOW:
                reasons.append(f"Dangerously low blood sugar ({blood_sugar} mg/dL)")
        if symptoms:
            symptoms_lower = symptoms.lower()
            for severe in self.SEVERE_SYMPTOMS:
                if severe in symptoms_lower:
                    reasons.append(f"Severe symptom detected: {severe}")
                    break
        return len(reasons) > 0, "; ".join(reasons) if reasons else ""
    
    def _build_patient_prompt(self, age, gender, bmi, bmi_category, blood_sugar, bp_systolic, bp_diastolic, symptoms, image_prediction) -> str:
        bp_str = f"{bp_systolic}/{bp_diastolic} mmHg" if bp_systolic and bp_diastolic else "Not provided"
        sugar_str = f"{blood_sugar} mg/dL" if blood_sugar else "Not provided"
        image_str = "No image uploaded"
        if image_prediction:
            image_str = f"{image_prediction.get('label', 'Unknown')} (Confidence: {image_prediction.get('confidence', 0)*100:.1f}%)"
        
        return f"""Patient Profile:
Age: {age} years old
Gender: {gender.capitalize()}
BMI: {bmi} ({bmi_category})
Blood Sugar Level: {sugar_str}
Blood Pressure: {bp_str}
Symptoms: {symptoms if symptoms else "None reported"}
Image Analysis Result: {image_str}

Please analyze this patient's health data and provide a comprehensive triage assessment. Return ONLY valid JSON."""
    
    def _create_emergency_response(self, reason: str) -> Dict[str, Any]:
        return {
            "primaryCondition": "Medical Emergency Detected",
            "otherPossibleConditions": [],
            "riskLevel": "High",
            "confidenceScore": 95,
            "clinicalReasoning": f"CRITICAL ALERT: {reason}. This requires immediate medical attention.",
            "recommendedTests": ["Emergency room evaluation", "Complete vital signs monitoring"],
            "lifestyleRecommendations": ["Do not delay - seek immediate medical care", "Have someone drive you to the ER"],
            "otcSuggestions": [],
            "whenToSeeDoctor": "IMMEDIATELY - This is a medical emergency",
            "emergencyAlert": True,
            "disclaimer": "This system provides informational health insights only and does not replace professional medical advice."
        }
    
    def _create_fallback_response(self, bmi, bmi_category, blood_sugar, bp_systolic, symptoms) -> Dict[str, Any]:
        risk_score = 0
        conditions = []
        recommendations = []
        tests = []
        
        if bmi_category == "Obese":
            risk_score += 2
            conditions.append("Obesity-related health concerns")
            recommendations.append("Consult a nutritionist for a personalized diet plan")
            tests.append("Lipid profile test")
        elif bmi_category == "Overweight":
            risk_score += 1
            conditions.append("Overweight")
            recommendations.append("Regular moderate exercise recommended")
        
        if blood_sugar and blood_sugar > 200:
            risk_score += 3
            conditions.append("Elevated blood glucose")
            tests.append("HbA1c test")
            tests.append("Fasting glucose test")
        elif blood_sugar and blood_sugar > 140:
            risk_score += 2
            conditions.append("Pre-diabetic range glucose")
            tests.append("Oral glucose tolerance test")
        
        if bp_systolic and bp_systolic >= 140:
            risk_score += 2
            conditions.append("Elevated blood pressure")
            tests.append("24-hour blood pressure monitoring")
        
        if risk_score >= 5:
            risk_level = "High"
        elif risk_score >= 2:
            risk_level = "Moderate"
        else:
            risk_level = "Low"
        
        return {
            "primaryCondition": conditions[0] if conditions else "General health assessment",
            "otherPossibleConditions": conditions[1:] if len(conditions) > 1 else [],
            "riskLevel": risk_level,
            "confidenceScore": 65,
            "clinicalReasoning": f"Based on provided metrics: BMI {bmi} ({bmi_category}). Assessment uses standardized health guidelines.",
            "recommendedTests": tests if tests else ["Annual health checkup"],
            "lifestyleRecommendations": recommendations if recommendations else ["Maintain balanced diet", "Regular exercise", "Adequate sleep"],
            "otcSuggestions": [],
            "whenToSeeDoctor": "Schedule a routine checkup within the next month" if risk_level == "Low" else "Consider seeing a doctor within 1-2 weeks",
            "emergencyAlert": False,
            "disclaimer": "This system provides informational health insights only and does not replace professional medical advice."
        }
    
    async def analyze_patient(self, age, gender, bmi, bmi_category, blood_sugar=None, bp_systolic=None, bp_diastolic=None, symptoms=None, image_prediction=None) -> Dict[str, Any]:
        # Safety check first
        is_emergency, emergency_reason = self._check_critical_thresholds(bp_systolic, bp_diastolic, blood_sugar, symptoms)
        
        if is_emergency:
            logger.warning(f"Emergency detected: {emergency_reason}")
            return self._create_emergency_response(emergency_reason)
        
        patient_prompt = self._build_patient_prompt(age, gender, bmi, bmi_category, blood_sugar, bp_systolic, bp_diastolic, symptoms, image_prediction)
        
        try:
            if not self.client:
                logger.error("Groq API key not configured")
                return self._create_fallback_response(bmi, bmi_category, blood_sugar, bp_systolic, symptoms)
            
            messages = [
                {"role": "system", "content": MEDICAL_SYSTEM_PROMPT},
                {"role": "user", "content": patient_prompt}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                max_tokens=1500,
                temperature=0.3
            )
            
            response_text = response.choices[0].message.content
            ai_response = self._parse_ai_response(response_text)
            
            if ai_response:
                if 'clinicalReasoning' in ai_response:
                    ai_response['clinicalReasoning'] = clean_markdown(ai_response['clinicalReasoning'])
                logger.info(f"AI Triage complete - Risk: {ai_response.get('riskLevel')}")
                return ai_response
            else:
                logger.warning("Failed to parse AI response, using fallback")
                return self._create_fallback_response(bmi, bmi_category, blood_sugar, bp_systolic, symptoms)
                
        except Exception as e:
            logger.error(f"AI triage error: {str(e)}")
            return self._create_fallback_response(bmi, bmi_category, blood_sugar, bp_systolic, symptoms)
    
    def _parse_ai_response(self, response_text: str) -> Optional[Dict[str, Any]]:
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
            
            # Find JSON in response
            if '{' in response_text:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                json_str = response_text[start:end]
                data = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['primaryCondition', 'riskLevel', 'confidenceScore']
                for field in required_fields:
                    if field not in data:
                        return None
                
                # Normalize risk level
                if data.get('riskLevel') not in ['Low', 'Moderate', 'High']:
                    data['riskLevel'] = 'Moderate'
                
                # Ensure arrays exist
                for field in ['otherPossibleConditions', 'recommendedTests', 'lifestyleRecommendations', 'otcSuggestions']:
                    if field not in data or not isinstance(data[field], list):
                        data[field] = []
                
                if 'emergencyAlert' not in data:
                    data['emergencyAlert'] = False
                if 'disclaimer' not in data:
                    data['disclaimer'] = "This system provides informational health insights only."
                if 'clinicalReasoning' not in data:
                    data['clinicalReasoning'] = "Analysis based on provided health metrics."
                if 'whenToSeeDoctor' not in data:
                    data['whenToSeeDoctor'] = "Consult a healthcare provider for personalized advice."
                
                return data
            return None
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return None