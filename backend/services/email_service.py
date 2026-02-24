import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import ssl
import os
from pathlib import Path
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Email service using SMTP with Gmail configuration"""
    
    def __init__(self):
        self.smtp_server = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        self.smtp_username = os.environ.get("SMTP_USER", "")
        self.smtp_password = os.environ.get("SMTP_PASS", "")
        self.smtp_from_name = os.environ.get("SMTP_FROM_NAME", "Health Analyzer")
        self.smtp_from_email = os.environ.get("SMTP_FROM_EMAIL", os.environ.get("SMTP_USER", ""))
    
    def is_configured(self) -> bool:
        """Check if email service is properly configured"""
        return bool(self.smtp_username and self.smtp_password)
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False,
        attachments: Optional[List[dict]] = None
    ) -> dict:
        """
        Send an email with optional attachments.
        """
        if not self.is_configured():
            logger.warning("Email service not configured - skipping email send")
            return {
                "success": False,
                "message": "Email service not configured. Please set SMTP environment variables.",
                "simulated": True
            }
        
        try:
            message = MIMEMultipart()
            message['From'] = f"{self.smtp_from_name} <{self.smtp_from_email}>"
            message['To'] = to_email
            message['Subject'] = subject
            
            # Attach body
            content_type = "html" if is_html else "plain"
            message.attach(MIMEText(body, content_type))
            
            # Attach files if provided
            if attachments:
                for attachment in attachments:
                    self._attach_file(message, attachment)
            
            # Create SSL context
            context = ssl.create_default_context()
            
            # Send email using TLS
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.smtp_from_email, to_email, message.as_string())
            
            logger.info(f"Email sent successfully to {to_email}")
            return {
                "success": True,
                "message": f"Email sent successfully to {to_email}",
                "simulated": False
            }
        
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP authentication failed: {e}")
            return {
                "success": False,
                "message": "Email authentication failed. Check SMTP credentials.",
                "simulated": False
            }
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error occurred: {e}")
            return {
                "success": False,
                "message": f"SMTP error: {str(e)}",
                "simulated": False
            }
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return {
                "success": False,
                "message": f"Error sending email: {str(e)}",
                "simulated": False
            }
    
    def _attach_file(self, message: MIMEMultipart, attachment: dict):
        """Attach a file to the email message"""
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(attachment['data'])
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f"attachment; filename= {attachment['filename']}"
        )
        message.attach(part)
    
    async def send_health_report(
        self,
        to_email: str,
        patient_name: str,
        risk_level: str,
        pdf_data: bytes
    ) -> dict:
        """Send health report email with PDF attachment"""
        
        risk_color = {
            "low": "#10B981",
            "moderate": "#F59E0B",
            "high": "#EF4444"
        }.get(risk_level.lower(), "#6B7280")
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2E86C1; margin: 0;">Health Analyzer</h1>
                    <p style="color: #64748B; font-size: 14px;">Your Health Analysis Report</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #1E293B;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #475569; line-height: 1.6;">
                    Your health analysis has been completed. Please find your detailed health report attached to this email.
                </p>
                
                <div style="background-color: #F1F5F9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #475569;">
                        <strong>Risk Assessment:</strong>
                        <span style="background-color: {risk_color}; color: white; padding: 4px 12px; border-radius: 4px; margin-left: 10px; font-weight: bold;">
                            {risk_level.upper()}
                        </span>
                    </p>
                </div>
                
                <p style="color: #475569; line-height: 1.6;">
                    Please review the attached PDF report for detailed information about your health metrics, conditions detected, and personalized recommendations.
                </p>
                
                <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400E; font-size: 13px;">
                        <strong>Important:</strong> This report is for informational purposes only and does not replace professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment.
                    </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #94A3B8; font-size: 12px; text-align: center;">
                    Health Analyzer - AI-Powered Health Analysis<br>
                    This is an automated message. Please do not reply directly to this email.
                </p>
            </div>
        </body>
        </html>
        """
        
        attachments = [{
            "data": pdf_data,
            "filename": f"health_report_{patient_name.replace(' ', '_')}.pdf",
            "mime_type": "application/pdf"
        }]
        
        return await self.send_email(
            to_email=to_email,
            subject=f"Your Health Analysis Report - {risk_level.capitalize()} Risk",
            body=html_body,
            is_html=True,
            attachments=attachments
        )
    
    async def send_password_reset(self, to_email: str, reset_token: str, user_name: str) -> dict:
        """Send password reset email"""
        
        # For localhost, we'll just include the token in the email
        reset_link = f"Your password reset token is: {reset_token}"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2E86C1; margin: 0;">Health Analyzer</h1>
                    <p style="color: #64748B; font-size: 14px;">Password Reset Request</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #1E293B;">Dear <strong>{user_name}</strong>,</p>
                
                <p style="color: #475569; line-height: 1.6;">
                    We received a request to reset your password. Use the token below to reset your password:
                </p>
                
                <div style="background-color: #F1F5F9; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: #1E293B; font-size: 18px; font-family: monospace;">
                        {reset_token}
                    </p>
                </div>
                
                <p style="color: #475569; line-height: 1.6;">
                    This token will expire in 1 hour. If you did not request a password reset, please ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #94A3B8; font-size: 12px; text-align: center;">
                    Health Analyzer - AI-Powered Health Analysis
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Password Reset - Health Analyzer",
            body=html_body,
            is_html=True
        )
    
    async def send_email_verification(self, to_email: str, verification_token: str, user_name: str) -> dict:
        """Send email verification"""
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #2E86C1; margin: 0;">Health Analyzer</h1>
                    <p style="color: #64748B; font-size: 14px;">Email Verification</p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #1E293B;">Dear <strong>{user_name}</strong>,</p>
                
                <p style="color: #475569; line-height: 1.6;">
                    Welcome to Health Analyzer! Please verify your email using the code below:
                </p>
                
                <div style="background-color: #10B981; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                    <p style="margin: 0; color: white; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
                        {verification_token}
                    </p>
                </div>
                
                <p style="color: #475569; line-height: 1.6;">
                    Enter this code in the app to verify your email address.
                </p>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #94A3B8; font-size: 12px; text-align: center;">
                    Health Analyzer - AI-Powered Health Analysis
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="Verify Your Email - Health Analyzer",
            body=html_body,
            is_html=True
        )
    
    async def send_critical_alert(self, to_email: str, patient_name: str, alert_details: str) -> dict:
        """Send critical health alert email"""
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background-color: #F8FAFC; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 20px; background-color: #EF4444; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px;">
                    <h1 style="color: white; margin: 0;">CRITICAL HEALTH ALERT</h1>
                </div>
                
                <p style="color: #1E293B;">Dear <strong>{patient_name}</strong>,</p>
                
                <p style="color: #EF4444; line-height: 1.6; font-weight: bold;">
                    A critical health condition has been detected in your recent analysis:
                </p>
                
                <div style="background-color: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #991B1B;">
                        {alert_details}
                    </p>
                </div>
                
                <p style="color: #475569; line-height: 1.6;">
                    <strong>Please seek immediate medical attention.</strong> Contact your healthcare provider or visit the nearest emergency room.
                </p>
                
                <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;">
                
                <p style="color: #94A3B8; font-size: 12px; text-align: center;">
                    Health Analyzer - AI-Powered Health Analysis<br>
                    This is an automated critical alert.
                </p>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(
            to_email=to_email,
            subject="CRITICAL HEALTH ALERT - Immediate Attention Required",
            body=html_body,
            is_html=True
        )
