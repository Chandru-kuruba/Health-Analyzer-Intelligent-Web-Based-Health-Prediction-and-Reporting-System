from typing import List, Tuple
from models.health_record import RiskLevel

class HealthService:
    """Health assessment and risk calculation service"""
    
    @staticmethod
    def calculate_bmi(weight_kg: float, height_cm: float) -> Tuple[float, str]:
        """Calculate BMI and return category"""
        height_m = height_cm / 100
        bmi = round(weight_kg / (height_m ** 2), 2)
        
        if bmi < 18.5:
            category = "Underweight"
        elif bmi < 25:
            category = "Normal"
        elif bmi < 30:
            category = "Overweight"
        else:
            category = "Obese"
            
        return bmi, category
    
    @staticmethod
    def analyze_health_data(
        bmi: float,
        bmi_category: str,
        blood_sugar: float = None,
        bp_systolic: int = None,
        bp_diastolic: int = None,
        symptoms: str = None,
        image_prediction: dict = None
    ) -> Tuple[RiskLevel, List[str], List[str]]:
        """
        Rule-based health risk assessment engine
        Returns: (risk_level, conditions, recommendations)
        """
        conditions = []
        recommendations = []
        risk_score = 0
        
        # BMI Analysis
        if bmi_category == "Underweight":
            conditions.append("Underweight - BMI below healthy range")
            recommendations.append("Consider consulting a nutritionist for a healthy weight gain plan")
            risk_score += 1
        elif bmi_category == "Overweight":
            conditions.append("Overweight - BMI above healthy range")
            recommendations.append("Regular exercise and balanced diet recommended")
            risk_score += 1
        elif bmi_category == "Obese":
            conditions.append("Obesity Risk - BMI significantly above healthy range")
            recommendations.append("Consult a healthcare provider for weight management program")
            recommendations.append("Consider cardiovascular health screening")
            risk_score += 2
        
        # Blood Sugar Analysis
        if blood_sugar is not None:
            if blood_sugar > 200:
                conditions.append("High Blood Sugar Alert - Possible Diabetes Risk")
                recommendations.append("Urgent: Consult an endocrinologist immediately")
                recommendations.append("Monitor blood sugar levels regularly")
                risk_score += 3
            elif blood_sugar > 140:
                conditions.append("Elevated Blood Sugar - Pre-diabetes Risk")
                recommendations.append("Reduce sugar intake and monitor glucose levels")
                recommendations.append("Schedule a glucose tolerance test")
                risk_score += 2
            elif blood_sugar < 70:
                conditions.append("Low Blood Sugar - Hypoglycemia Risk")
                recommendations.append("Maintain regular meal schedule")
                recommendations.append("Consult doctor if symptoms persist")
                risk_score += 1
        
        # Blood Pressure Analysis
        if bp_systolic is not None and bp_diastolic is not None:
            if bp_systolic >= 180 or bp_diastolic >= 120:
                conditions.append("Hypertensive Crisis - Extremely High Blood Pressure")
                recommendations.append("URGENT: Seek immediate medical attention")
                risk_score += 4
            elif bp_systolic >= 140 or bp_diastolic >= 90:
                conditions.append("Hypertension - High Blood Pressure Stage 2")
                recommendations.append("Consult a cardiologist for blood pressure management")
                recommendations.append("Reduce sodium intake and manage stress")
                risk_score += 2
            elif bp_systolic >= 130 or bp_diastolic >= 80:
                conditions.append("Elevated Blood Pressure - Stage 1 Hypertension")
                recommendations.append("Monitor blood pressure regularly")
                recommendations.append("Lifestyle modifications recommended")
                risk_score += 1
            elif bp_systolic < 90 or bp_diastolic < 60:
                conditions.append("Low Blood Pressure - Hypotension")
                recommendations.append("Stay hydrated and monitor for dizziness")
                risk_score += 1
        
        # Symptom Analysis
        if symptoms:
            symptoms_lower = symptoms.lower()
            
            # Cardiac symptoms
            cardiac_symptoms = ["chest pain", "chest discomfort", "shortness of breath", 
                              "heart palpitations", "irregular heartbeat"]
            if any(s in symptoms_lower for s in cardiac_symptoms):
                conditions.append("Cardiac Alert - Potential Heart-Related Symptoms")
                recommendations.append("URGENT: Consult a cardiologist immediately")
                recommendations.append("Avoid strenuous activities until evaluated")
                risk_score += 3
            
            # Diabetes symptoms
            diabetes_symptoms = ["excessive thirst", "frequent urination", "blurred vision",
                               "numbness", "tingling"]
            if any(s in symptoms_lower for s in diabetes_symptoms):
                conditions.append("Possible Diabetes Symptoms Detected")
                recommendations.append("Get comprehensive diabetes screening")
                risk_score += 2
            
            # General symptoms
            if "headache" in symptoms_lower or "dizziness" in symptoms_lower:
                conditions.append("Neurological Symptoms Present")
                recommendations.append("Monitor symptoms and consult if persistent")
                risk_score += 1
            
            if "fatigue" in symptoms_lower or "tiredness" in symptoms_lower:
                conditions.append("Fatigue Reported")
                recommendations.append("Ensure adequate sleep and nutrition")
                recommendations.append("Consider thyroid and anemia screening")
                risk_score += 1
        
        # Image Analysis Integration
        if image_prediction:
            label = image_prediction.get("label", "").lower()
            confidence = image_prediction.get("confidence", 0)
            
            if "wound" in label and confidence > 0.6:
                conditions.append("Wound Detected in Image Analysis")
                recommendations.append("Keep wound clean and monitor for infection signs")
                risk_score += 1
            elif "infection" in label and confidence > 0.6:
                conditions.append("Possible Skin Infection Detected")
                recommendations.append("Consult a dermatologist for evaluation")
                risk_score += 2
            elif "rash" in label and confidence > 0.6:
                conditions.append("Skin Rash Detected")
                recommendations.append("Monitor for changes; consult dermatologist if persists")
                risk_score += 1
        
        # Default recommendations if nothing detected
        if not conditions:
            conditions.append("No significant health concerns detected")
            recommendations.append("Continue maintaining healthy lifestyle")
            recommendations.append("Schedule regular health check-ups")
        
        # General recommendation for all
        recommendations.append("This is an automated analysis - consult a healthcare professional for accurate diagnosis")
        
        # Determine risk level
        if risk_score >= 5:
            risk_level = RiskLevel.HIGH
        elif risk_score >= 2:
            risk_level = RiskLevel.MODERATE
        else:
            risk_level = RiskLevel.LOW
        
        return risk_level, conditions, recommendations
