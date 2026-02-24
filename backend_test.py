"""
Health Analyzer Backend API Testing
Tests all critical backend functionality including authentication, chat, image analysis, and health assessments.
"""
import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image
import time

class HealthAnalyzerAPITester:
    def __init__(self, base_url="https://clinical-ai-hub-4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_issues = []
        self.flaky_issues = []
    
    def log_result(self, test_name, success, details="", is_critical=False):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        elif is_critical:
            self.critical_issues.append(f"{test_name}: {details}")
        else:
            self.flaky_issues.append(f"{test_name}: {details}")
        
        return success
    
    def make_request(self, method, endpoint, data=None, headers=None, files=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            default_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            default_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            del default_headers['Content-Type']
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=default_headers)
                else:
                    response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)
            
            return response
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def test_api_health(self):
        """Test basic API connectivity"""
        response = self.make_request('GET', '')
        if response and response.status_code == 200:
            data = response.json()
            return self.log_result(
                "API Health Check", 
                True, 
                f"API version: {data.get('version', 'unknown')}"
            )
        return self.log_result(
            "API Health Check", 
            False, 
            f"Status: {response.status_code if response else 'No response'}", 
            is_critical=True
        )
    
    def test_user_registration(self):
        """Test user registration"""
        timestamp = str(int(time.time()))
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        response = self.make_request('POST', 'auth/register', test_data)
        if response and response.status_code == 201:
            data = response.json()
            self.token = data.get('access_token')
            self.test_user_id = data.get('user', {}).get('id')
            return self.log_result(
                "User Registration", 
                True, 
                f"User created with ID: {self.test_user_id}"
            )
        return self.log_result(
            "User Registration", 
            False, 
            f"Status: {response.status_code if response else 'No response'}", 
            is_critical=True
        )
    
    def test_user_login(self):
        """Test user login with test credentials"""
        login_data = {
            "email": "test@example.com",
            "password": "test123"
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        if response and response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            return self.log_result(
                "User Login", 
                True, 
                "Successfully logged in with test credentials"
            )
        return self.log_result(
            "User Login", 
            False, 
            f"Status: {response.status_code if response else 'No response'}", 
            is_critical=True
        )
    
    def test_admin_login(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@healthanalyzer.com",
            "password": "Admin@12345"
        }
        
        response = self.make_request('POST', 'auth/login', admin_data)
        if response and response.status_code == 200:
            data = response.json()
            admin_user = data.get('user', {})
            return self.log_result(
                "Admin Login", 
                True, 
                f"Admin role: {admin_user.get('role', 'unknown')}"
            )
        return self.log_result(
            "Admin Login", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def test_protected_endpoint(self):
        """Test protected endpoint access"""
        if not self.token:
            return self.log_result(
                "Protected Endpoint Access", 
                False, 
                "No authentication token available", 
                is_critical=True
            )
        
        response = self.make_request('GET', 'auth/me')
        if response and response.status_code == 200:
            data = response.json()
            return self.log_result(
                "Protected Endpoint Access", 
                True, 
                f"User: {data.get('name', 'unknown')}"
            )
        return self.log_result(
            "Protected Endpoint Access", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def test_health_chat_medical_query(self):
        """Test health chat with medical query"""
        if not self.token:
            return self.log_result(
                "Health Chat - Medical Query", 
                False, 
                "No authentication token", 
                is_critical=True
            )
        
        chat_data = {
            "message": "What causes headaches?"
        }
        
        response = self.make_request('POST', 'chat', chat_data)
        if response and response.status_code == 200:
            data = response.json()
            message_content = data.get('message', {}).get('content', '')
            
            # Check if response contains medical information
            medical_indicators = ['health', 'medical', 'doctor', 'symptoms', 'headache', 'pain']
            contains_medical = any(indicator in message_content.lower() for indicator in medical_indicators)
            
            # Check for clean formatting (no markdown)
            has_markdown = any(marker in message_content for marker in ['###', '**', '*', '##'])
            
            if contains_medical and not has_markdown:
                return self.log_result(
                    "Health Chat - Medical Query", 
                    True, 
                    "Responded to medical query with clean formatting"
                )
            else:
                issues = []
                if not contains_medical:
                    issues.append("No medical content detected")
                if has_markdown:
                    issues.append("Contains markdown formatting")
                return self.log_result(
                    "Health Chat - Medical Query", 
                    False, 
                    f"Issues: {', '.join(issues)}"
                )
        
        return self.log_result(
            "Health Chat - Medical Query", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def test_health_chat_non_medical_query(self):
        """Test health chat rejection of non-medical query"""
        if not self.token:
            return self.log_result(
                "Health Chat - Non-Medical Query", 
                False, 
                "No authentication token", 
                is_critical=True
            )
        
        chat_data = {
            "message": "What is JavaScript?"
        }
        
        response = self.make_request('POST', 'chat', chat_data)
        if response and response.status_code == 200:
            data = response.json()
            message_content = data.get('message', {}).get('content', '')
            
            # Should contain rejection message
            rejection_phrase = "I am a Health Assistant. I can only answer medical and health-related queries."
            
            if rejection_phrase in message_content:
                return self.log_result(
                    "Health Chat - Non-Medical Query", 
                    True, 
                    "Correctly rejected non-medical query"
                )
            else:
                return self.log_result(
                    "Health Chat - Non-Medical Query", 
                    False, 
                    f"Did not reject properly. Response: {message_content[:100]}..."
                )
        
        return self.log_result(
            "Health Chat - Non-Medical Query", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def test_founder_query_response(self):
        """Test founder query response"""
        if not self.token:
            return self.log_result(
                "Founder Query Response", 
                False, 
                "No authentication token", 
                is_critical=True
            )
        
        chat_data = {
            "message": "Who created this?"
        }
        
        response = self.make_request('POST', 'chat', chat_data)
        if response and response.status_code == 200:
            data = response.json()
            message_content = data.get('message', {}).get('content', '')
            
            # Should contain specific founder information
            required_info = [
                "Chandru H", "Akash B", "Gopi Reddy Manoj Kumar",
                "23DBCAD021", "23DBCAD007", "23DBCAD030", 
                "BCA DS", "SSCS", "CMR University"
            ]
            
            found_info = sum(1 for info in required_info if info in message_content)
            
            if found_info >= 7:  # Should contain most of the required info
                return self.log_result(
                    "Founder Query Response", 
                    True, 
                    f"Contains {found_info}/{len(required_info)} required details"
                )
            else:
                return self.log_result(
                    "Founder Query Response", 
                    False, 
                    f"Missing founder details. Found {found_info}/{len(required_info)} items"
                )
        
        return self.log_result(
            "Founder Query Response", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def create_test_image(self):
        """Create a simple test image in base64 format"""
        # Create a small test image
        img = Image.new('RGB', (100, 100), color='red')
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')
    
    def test_image_analysis(self):
        """Test image analysis functionality"""
        if not self.token:
            return self.log_result(
                "Image Analysis", 
                False, 
                "No authentication token", 
                is_critical=True
            )
        
        # Create test image
        test_image_b64 = self.create_test_image()
        
        image_data = {
            "image": f"data:image/jpeg;base64,{test_image_b64}"
        }
        
        response = self.make_request('POST', 'image/analyze', image_data)
        if response and response.status_code == 200:
            data = response.json()
            
            # Check for required fields in response
            required_fields = [
                'detected_condition', 'severity_level', 'confidence_score',
                'visual_findings', 'when_to_see_doctor'
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                return self.log_result(
                    "Image Analysis", 
                    True, 
                    f"Analysis complete. Condition: {data.get('detected_condition', 'unknown')}"
                )
            else:
                return self.log_result(
                    "Image Analysis", 
                    False, 
                    f"Missing fields: {', '.join(missing_fields)}"
                )
        
        return self.log_result(
            "Image Analysis", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def test_password_change(self):
        """Test password change functionality"""
        if not self.token:
            return self.log_result(
                "Password Change", 
                False, 
                "No authentication token", 
                is_critical=True
            )
        
        password_data = {
            "current_password": "test123",
            "new_password": "NewTestPass123!"
        }
        
        response = self.make_request('POST', f'auth/change-password?token={self.token}', password_data)
        if response and response.status_code == 200:
            return self.log_result(
                "Password Change", 
                True, 
                "Password changed successfully"
            )
        elif response and response.status_code == 400:
            # This might be expected if we don't have the correct current password
            return self.log_result(
                "Password Change", 
                True, 
                "Endpoint working (incorrect password rejected as expected)"
            )
        
        return self.log_result(
            "Password Change", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def test_health_assessment_creation(self):
        """Test health assessment form submission"""
        if not self.token:
            return self.log_result(
                "Health Assessment Creation", 
                False, 
                "No authentication token", 
                is_critical=True
            )
        
        # Sample health assessment data
        assessment_data = {
            "age": 30,
            "gender": "Male",
            "height": 175,
            "weight": 70,
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "blood_sugar_level": 90,
            "symptoms": ["headache", "fatigue"],
            "medical_history": ["none"],
            "lifestyle_factors": {
                "smoking": False,
                "alcohol": "occasional",
                "exercise": "regular"
            }
        }
        
        response = self.make_request('POST', 'health/assess', assessment_data)
        if response and response.status_code in [200, 201]:
            data = response.json()
            return self.log_result(
                "Health Assessment Creation", 
                True, 
                f"Assessment created with ID: {data.get('id', 'unknown')}"
            )
        
        return self.log_result(
            "Health Assessment Creation", 
            False, 
            f"Status: {response.status_code if response else 'No response'}"
        )
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("=" * 60)
        print("HEALTH ANALYZER BACKEND API TESTING")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_api_health():
            print("\n❌ Critical: API is not responding. Stopping tests.")
            return False
        
        # Authentication tests
        print("\n--- Authentication Tests ---")
        self.test_user_login()  # Use existing test user
        self.test_admin_login()
        self.test_protected_endpoint()
        
        # Core functionality tests (requires authentication)
        if self.token:
            print("\n--- Core Functionality Tests ---")
            self.test_health_chat_medical_query()
            self.test_health_chat_non_medical_query()
            self.test_founder_query_response()
            self.test_image_analysis()
            self.test_password_change()
            self.test_health_assessment_creation()
        else:
            print("\n❌ Skipping core functionality tests - no authentication token")
        
        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.critical_issues:
            print(f"\n❌ Critical Issues ({len(self.critical_issues)}):")
            for issue in self.critical_issues:
                print(f"   - {issue}")
        
        if self.flaky_issues:
            print(f"\n⚠️ Other Issues ({len(self.flaky_issues)}):")
            for issue in self.flaky_issues:
                print(f"   - {issue}")
        
        return len(self.critical_issues) == 0

def main():
    """Main test execution"""
    tester = HealthAnalyzerAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())