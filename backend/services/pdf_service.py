from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime
from pathlib import Path
import tempfile

class PDFService:
    """Generate professional health report PDFs with AI triage results"""
    
    # Colors matching our medical theme
    PRIMARY_BLUE = colors.HexColor("#2E86C1")
    SOFT_BLUE = colors.HexColor("#AED6F1")
    DARK_BLUE = colors.HexColor("#1B4F72")
    RISK_GREEN = colors.HexColor("#10B981")
    RISK_YELLOW = colors.HexColor("#F59E0B")
    RISK_RED = colors.HexColor("#EF4444")
    SLATE_800 = colors.HexColor("#1E293B")
    EMERGENCY_RED = colors.HexColor("#DC2626")
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=self.PRIMARY_BLUE,
            spaceAfter=20,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=self.DARK_BLUE,
            spaceBefore=15,
            spaceAfter=10,
            borderPadding=(5, 0, 5, 0)
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomBodyText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=self.SLATE_800,
            spaceAfter=6
        ))
        
        self.styles.add(ParagraphStyle(
            name='Disclaimer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            spaceBefore=20,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='EmergencyAlert',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.white,
            backColor=self.EMERGENCY_RED,
            spaceBefore=10,
            spaceAfter=10,
            alignment=TA_CENTER,
            borderPadding=10
        ))
        
        self.styles.add(ParagraphStyle(
            name='ClinicalReasoning',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=self.SLATE_800,
            spaceAfter=8,
            leftIndent=10,
            borderColor=self.SOFT_BLUE,
            borderWidth=1,
            borderPadding=8
        ))
    
    def _get_risk_color(self, risk_level: str) -> colors.Color:
        """Get color based on risk level"""
        risk_level_lower = risk_level.lower() if risk_level else 'low'
        if risk_level_lower == "high":
            return self.RISK_RED
        elif risk_level_lower == "moderate":
            return self.RISK_YELLOW
        return self.RISK_GREEN
    
    async def generate_health_report(self, health_record: dict) -> bytes:
        """Generate a PDF health report from health record data with AI triage"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )
        
        elements = []
        
        # Get AI triage data
        ai_triage = health_record.get('ai_triage', {})
        is_emergency = ai_triage.get('emergencyAlert', False)
        
        # Title
        elements.append(Paragraph("AI-Powered Health Analysis Report", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Emergency Alert Banner (if applicable)
        if is_emergency:
            emergency_text = "EMERGENCY ALERT: Immediate Medical Attention Required"
            elements.append(Paragraph(emergency_text, self.styles['EmergencyAlert']))
            elements.append(Spacer(1, 0.2*inch))
        
        # Report Info
        report_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        elements.append(Paragraph(f"Report Generated: {report_date}", self.styles['CustomBodyText']))
        elements.append(Paragraph(f"Report ID: {health_record.get('id', 'N/A')}", self.styles['CustomBodyText']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Risk Level and Confidence Banner
        risk_level = ai_triage.get('riskLevel', health_record.get('risk_level', 'Low'))
        confidence = ai_triage.get('confidenceScore', 0)
        risk_color = self._get_risk_color(risk_level)
        
        risk_data = [
            ["Risk Assessment", f"{risk_level.upper()}", f"AI Confidence: {confidence}%"]
        ]
        risk_table = Table(risk_data, colWidths=[2*inch, 2*inch, 2*inch])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), self.SOFT_BLUE),
            ('BACKGROUND', (1, 0), (1, 0), risk_color),
            ('BACKGROUND', (2, 0), (2, 0), self.SOFT_BLUE),
            ('TEXTCOLOR', (0, 0), (0, 0), self.SLATE_800),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.white),
            ('TEXTCOLOR', (2, 0), (2, 0), self.SLATE_800),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        elements.append(risk_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Primary Condition
        primary_condition = ai_triage.get('primaryCondition', 'General Assessment')
        elements.append(Paragraph("Primary Condition Identified", self.styles['SectionHeader']))
        elements.append(Paragraph(f"<b>{primary_condition}</b>", self.styles['CustomBodyText']))
        
        # Other Possible Conditions
        other_conditions = ai_triage.get('otherPossibleConditions', [])
        if other_conditions:
            elements.append(Spacer(1, 0.1*inch))
            elements.append(Paragraph("Other Possible Conditions:", self.styles['CustomBodyText']))
            for cond in other_conditions:
                elements.append(Paragraph(f"- {cond}", self.styles['CustomBodyText']))
        elements.append(Spacer(1, 0.15*inch))
        
        # Clinical Reasoning
        clinical_reasoning = ai_triage.get('clinicalReasoning', '')
        if clinical_reasoning:
            elements.append(Paragraph("Clinical Reasoning", self.styles['SectionHeader']))
            elements.append(Paragraph(clinical_reasoning, self.styles['ClinicalReasoning']))
            elements.append(Spacer(1, 0.15*inch))
        
        # Patient Information Section
        elements.append(Paragraph("Patient Information", self.styles['SectionHeader']))
        
        patient_data = [
            ["Full Name", health_record.get('full_name', 'N/A')],
            ["Age", f"{health_record.get('age', 'N/A')} years"],
            ["Gender", health_record.get('gender', 'N/A').capitalize()],
            ["Date of Birth", health_record.get('dob', 'N/A')],
            ["Email", health_record.get('email', 'N/A')]
        ]
        
        patient_table = Table(patient_data, colWidths=[2*inch, 4*inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.SOFT_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.SLATE_800),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        elements.append(patient_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Health Metrics Section
        elements.append(Paragraph("Health Metrics", self.styles['SectionHeader']))
        
        metrics_data = [
            ["Height", f"{health_record.get('height', 'N/A')} cm"],
            ["Weight", f"{health_record.get('weight', 'N/A')} kg"],
            ["BMI", f"{health_record.get('bmi', 'N/A')} ({health_record.get('bmi_category', 'N/A')})"],
        ]
        
        if health_record.get('blood_sugar_level'):
            metrics_data.append(["Blood Sugar", f"{health_record.get('blood_sugar_level')} mg/dL"])
        
        if health_record.get('blood_pressure_systolic') and health_record.get('blood_pressure_diastolic'):
            bp = f"{health_record.get('blood_pressure_systolic')}/{health_record.get('blood_pressure_diastolic')} mmHg"
            metrics_data.append(["Blood Pressure", bp])
        
        metrics_table = Table(metrics_data, colWidths=[2*inch, 4*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), self.SOFT_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, -1), self.SLATE_800),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        elements.append(metrics_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Symptoms Section (if present)
        if health_record.get('symptoms'):
            elements.append(Paragraph("Reported Symptoms", self.styles['SectionHeader']))
            elements.append(Paragraph(health_record.get('symptoms'), self.styles['CustomBodyText']))
            elements.append(Spacer(1, 0.15*inch))
        
        # Recommended Tests
        recommended_tests = ai_triage.get('recommendedTests', [])
        if recommended_tests:
            elements.append(Paragraph("Recommended Medical Tests", self.styles['SectionHeader']))
            for test in recommended_tests:
                elements.append(Paragraph(f"- {test}", self.styles['CustomBodyText']))
            elements.append(Spacer(1, 0.15*inch))
        
        # Lifestyle Recommendations
        lifestyle_recs = ai_triage.get('lifestyleRecommendations', [])
        if lifestyle_recs:
            elements.append(Paragraph("Lifestyle Recommendations", self.styles['SectionHeader']))
            for rec in lifestyle_recs:
                elements.append(Paragraph(f"- {rec}", self.styles['CustomBodyText']))
            elements.append(Spacer(1, 0.15*inch))
        
        # When to See Doctor
        when_to_see = ai_triage.get('whenToSeeDoctor', '')
        if when_to_see:
            elements.append(Paragraph("When to See a Doctor", self.styles['SectionHeader']))
            elements.append(Paragraph(f"<b>{when_to_see}</b>", self.styles['CustomBodyText']))
            elements.append(Spacer(1, 0.2*inch))
        
        # Medical Disclaimer
        disclaimer_text = ai_triage.get('disclaimer', 
            "This system provides informational health insights only and does not replace professional medical advice.")
        full_disclaimer = f"""
        <b>MEDICAL DISCLAIMER:</b> {disclaimer_text}
        Always seek the advice of your physician or other qualified health provider with any questions you 
        may have regarding a medical condition. Never disregard professional medical advice or delay in 
        seeking it because of information provided by this automated system.
        """
        elements.append(Paragraph(full_disclaimer, self.styles['Disclaimer']))
        
        # Build PDF
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    async def save_pdf(self, pdf_bytes: bytes, filename: str = None) -> str:
        """Save PDF to temporary file and return path"""
        if not filename:
            filename = f"health_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        temp_dir = Path(tempfile.gettempdir())
        file_path = temp_dir / filename
        
        with open(file_path, 'wb') as f:
            f.write(pdf_bytes)
        
        return str(file_path)
