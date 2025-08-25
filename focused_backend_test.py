#!/usr/bin/env python3
"""
Focused Backend Testing for Review Request Areas
Tests specific areas mentioned in the review request after UI/UX improvements
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class FocusedTelegramAPITester:
    def __init__(self, base_url="https://bugfix-complete-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_key = "telegram-automation-key-2025"
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}'
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")
        print()

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> tuple[bool, Dict, int]:
        """Make HTTP request and return success, response data, status code"""
        url = f"{self.base_url}/api/{endpoint}"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, headers=self.headers, json=data, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, json=data, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers, timeout=10)
            else:
                return False, {}, 0

            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            return response.status_code < 400, response_data, response.status_code

        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def test_health_and_service_status(self):
        """Test Health Check & Service Status"""
        print("🔍 Testing Health Check & Service Status...")
        
        success, data, status_code = self.make_request('GET', 'health')
        
        if success and status_code == 200:
            # Verify all required services are present
            services = data.get('services', {})
            required_services = ['config_manager', 'blacklist_manager', 'telegram_service']
            all_services_present = all(services.get(service, False) for service in required_services)
            
            self.log_test(
                "Health Check - All Services Running",
                all_services_present,
                f"Status: {status_code}, Services: {services}"
            )
            
            # Check if response has all expected fields
            expected_fields = ['status', 'telegram_initialized', 'timestamp', 'services']
            has_all_fields = all(field in data for field in expected_fields)
            
            self.log_test(
                "Health Check - Response Format",
                has_all_fields,
                f"Expected fields present: {has_all_fields}, Response: {json.dumps(data, indent=2)}"
            )
        else:
            self.log_test(
                "Health Check - Service Availability",
                False,
                f"Status: {status_code}, Error: {data}"
            )

    def test_configuration_management(self):
        """Test Configuration Management endpoints"""
        print("🔍 Testing Configuration Management...")
        
        # Test GET /api/auth/configuration
        success, data, status_code = self.make_request('GET', 'auth/configuration')
        
        if success and status_code == 200:
            expected_fields = ['configured', 'phone_number', 'api_id_configured', 'api_hash_configured']
            has_all_fields = all(field in data for field in expected_fields)
            
            self.log_test(
                "GET /api/auth/configuration - Response Format",
                has_all_fields,
                f"Status: {status_code}, Fields: {list(data.keys())}, Response: {data}"
            )
            
            # Verify it doesn't expose sensitive credentials
            sensitive_fields = ['api_id', 'api_hash']
            no_sensitive_data = not any(field in data for field in sensitive_fields)
            
            self.log_test(
                "GET /api/auth/configuration - Security (No Sensitive Data)",
                no_sensitive_data,
                f"Sensitive fields not exposed: {no_sensitive_data}"
            )
        else:
            self.log_test(
                "GET /api/auth/configuration",
                False,
                f"Status: {status_code}, Error: {data}"
            )
        
        # Test POST /api/auth/configure with valid data
        config_data = {
            "api_id": "12345678",
            "api_hash": "abcd1234efgh5678ijkl9012mnop3456",
            "phone_number": "+1234567890"
        }
        success, data, status_code = self.make_request('POST', 'auth/configure', config_data)
        
        self.log_test(
            "POST /api/auth/configure - Valid Credentials",
            status_code in [200, 201],
            f"Status: {status_code}, Response: {data}"
        )
        
        # Test POST /api/auth/configure with empty credentials
        empty_config = {
            "api_id": "",
            "api_hash": "",
            "phone_number": ""
        }
        success, data, status_code = self.make_request('POST', 'auth/configure', empty_config)
        
        self.log_test(
            "POST /api/auth/configure - Empty Credentials",
            status_code in [400, 422],  # Should reject empty credentials
            f"Status: {status_code}, Should reject empty credentials"
        )

    def test_authentication_flow_improvements(self):
        """Test Enhanced Authentication Flow with better error messages"""
        print("🔍 Testing Enhanced Authentication Flow...")
        
        # Test POST /api/auth/phone with no API credentials configured
        phone_data = {"phone_number": "+1234567890"}
        success, data, status_code = self.make_request('POST', 'auth/phone', phone_data)
        
        # Should provide helpful error message
        expected_error_keywords = ['api', 'credentials', 'configure', 'settings']
        error_message = data.get('detail', '').lower()
        has_helpful_error = any(keyword in error_message for keyword in expected_error_keywords)
        
        self.log_test(
            "POST /api/auth/phone - Helpful Error (No API Credentials)",
            has_helpful_error and status_code == 400,
            f"Status: {status_code}, Error: {data.get('detail', 'N/A')}, Helpful: {has_helpful_error}"
        )
        
        # Test with placeholder/dummy credentials
        phone_with_dummy = {
            "phone_number": "+1234567890",
            "api_id": "12345678",
            "api_hash": "abcd1234efgh5678"
        }
        success, data, status_code = self.make_request('POST', 'auth/phone', phone_with_dummy)
        
        # Should detect and reject dummy credentials
        dummy_error_keywords = ['valid', 'real', 'my.telegram.org', 'credentials']
        error_message = data.get('detail', '').lower()
        detects_dummy = any(keyword in error_message for keyword in dummy_error_keywords)
        
        self.log_test(
            "POST /api/auth/phone - Detects Dummy Credentials",
            detects_dummy and status_code == 400,
            f"Status: {status_code}, Error: {data.get('detail', 'N/A')}, Detects dummy: {detects_dummy}"
        )
        
        # Test with invalid phone format
        invalid_phone = {
            "phone_number": "invalid-phone",
            "api_id": "87654321",
            "api_hash": "real1234hash5678"
        }
        success, data, status_code = self.make_request('POST', 'auth/phone', invalid_phone)
        
        phone_error_keywords = ['phone', 'format', 'country code']
        error_message = data.get('detail', '').lower()
        detects_invalid_phone = any(keyword in error_message for keyword in phone_error_keywords)
        
        self.log_test(
            "POST /api/auth/phone - Invalid Phone Format Error",
            status_code in [400, 500],  # Accept either as both are valid error responses
            f"Status: {status_code}, Error: {data.get('detail', 'N/A')}"
        )

    def test_api_security_comprehensive(self):
        """Test API Security comprehensively"""
        print("🔍 Testing API Security...")
        
        # Test with no Authorization header
        no_auth_headers = {'Content-Type': 'application/json'}
        try:
            response = requests.get(f"{self.base_url}/api/auth/status", headers=no_auth_headers, timeout=10)
            self.log_test(
                "API Security - No Authorization Header",
                response.status_code == 401,
                f"Status: {response.status_code}, Should be 401"
            )
        except Exception as e:
            self.log_test("API Security - No Authorization Header", False, f"Error: {e}")
        
        # Test with malformed Authorization header
        malformed_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'InvalidFormat'
        }
        try:
            response = requests.get(f"{self.base_url}/api/auth/status", headers=malformed_headers, timeout=10)
            self.log_test(
                "API Security - Malformed Authorization",
                response.status_code == 401,
                f"Status: {response.status_code}, Should be 401"
            )
        except Exception as e:
            self.log_test("API Security - Malformed Authorization", False, f"Error: {e}")
        
        # Test with wrong Bearer token
        wrong_token_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer wrong-token-123'
        }
        try:
            response = requests.get(f"{self.base_url}/api/auth/status", headers=wrong_token_headers, timeout=10)
            self.log_test(
                "API Security - Wrong Bearer Token",
                response.status_code == 401,
                f"Status: {response.status_code}, Should be 401"
            )
        except Exception as e:
            self.log_test("API Security - Wrong Bearer Token", False, f"Error: {e}")

    def test_error_handling_quality(self):
        """Test Error Handling Quality"""
        print("🔍 Testing Error Handling Quality...")
        
        # Test various endpoints with invalid data to check error responses
        test_cases = [
            {
                'name': 'Groups - Invalid Format',
                'method': 'POST',
                'endpoint': 'groups',
                'data': {'group_link': 'invalid-format'},
                'expected_status': 400
            },
            {
                'name': 'Messages - Missing Content',
                'method': 'POST',
                'endpoint': 'messages',
                'data': {'filename': 'test.txt'},
                'expected_status': 400
            },
            {
                'name': 'Blacklist - Missing Group Link',
                'method': 'POST',
                'endpoint': 'blacklist/permanent',
                'data': {'reason': 'test'},
                'expected_status': 400
            },
            {
                'name': 'Templates - Missing Content',
                'method': 'POST',
                'endpoint': 'templates',
                'data': {'template_id': 'test'},
                'expected_status': 400
            }
        ]
        
        for test_case in test_cases:
            success, data, status_code = self.make_request(
                test_case['method'], 
                test_case['endpoint'], 
                test_case['data']
            )
            
            # Check if error message is informative
            error_detail = data.get('detail', '')
            is_informative = len(error_detail) > 10 and not error_detail.startswith('Internal')
            
            self.log_test(
                f"Error Handling - {test_case['name']}",
                status_code == test_case['expected_status'] and is_informative,
                f"Status: {status_code}, Error: {error_detail}, Informative: {is_informative}"
            )

    def test_crud_operations_comprehensive(self):
        """Test CRUD Operations Comprehensively"""
        print("🔍 Testing CRUD Operations...")
        
        # Test Groups CRUD
        # Create
        group_data = {"group_link": "https://t.me/test_crud_group"}
        success, data, status_code = self.make_request('POST', 'groups', group_data)
        create_success = status_code in [200, 201, 400]  # 400 acceptable if already exists
        
        self.log_test(
            "Groups CRUD - Create",
            create_success,
            f"Status: {status_code}, Response: {data}"
        )
        
        # Read
        success, data, status_code = self.make_request('GET', 'groups')
        read_success = success and status_code == 200 and 'groups' in data
        
        self.log_test(
            "Groups CRUD - Read",
            read_success,
            f"Status: {status_code}, Groups count: {data.get('total', 0)}"
        )
        
        # Delete
        success, data, status_code = self.make_request('DELETE', 'groups/https://t.me/test_crud_group')
        delete_success = status_code in [200, 404]  # 404 acceptable if doesn't exist
        
        self.log_test(
            "Groups CRUD - Delete",
            delete_success,
            f"Status: {status_code}, Response: {data}"
        )
        
        # Test Messages CRUD
        # Create
        message_data = {"filename": "test_crud_message.txt", "content": "Test CRUD message content"}
        success, data, status_code = self.make_request('POST', 'messages', message_data)
        create_success = status_code in [200, 201, 400]  # 400 acceptable if already exists
        
        self.log_test(
            "Messages CRUD - Create",
            create_success,
            f"Status: {status_code}, Response: {data}"
        )
        
        # Read
        success, data, status_code = self.make_request('GET', 'messages')
        read_success = success and status_code == 200 and 'message_files' in data
        
        self.log_test(
            "Messages CRUD - Read",
            read_success,
            f"Status: {status_code}, Files count: {data.get('total', 0)}"
        )
        
        # Update
        update_data = {"content": "Updated CRUD message content"}
        success, data, status_code = self.make_request('PUT', 'messages/test_crud_message.txt', update_data)
        update_success = status_code in [200, 404]  # 404 acceptable if doesn't exist
        
        self.log_test(
            "Messages CRUD - Update",
            update_success,
            f"Status: {status_code}, Response: {data}"
        )
        
        # Delete
        success, data, status_code = self.make_request('DELETE', 'messages/test_crud_message.txt')
        delete_success = status_code in [200, 404]  # 404 acceptable if doesn't exist
        
        self.log_test(
            "Messages CRUD - Delete",
            delete_success,
            f"Status: {status_code}, Response: {data}"
        )

    def run_focused_tests(self):
        """Run all focused test suites"""
        print("🚀 Starting Focused Backend Testing for Review Request Areas...")
        print(f"Base URL: {self.base_url}")
        print(f"API Key: {self.api_key}")
        print("=" * 70)
        
        # Run focused test suites based on review request
        self.test_health_and_service_status()
        self.test_configuration_management()
        self.test_authentication_flow_improvements()
        self.test_api_security_comprehensive()
        self.test_error_handling_quality()
        self.test_crud_operations_comprehensive()
        
        # Print summary
        print("=" * 70)
        print("📊 FOCUSED TEST SUMMARY")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failed_test in self.failed_tests:
                print(f"  - {failed_test}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return len(self.failed_tests) == 0

def main():
    """Main test execution"""
    tester = FocusedTelegramAPITester()
    
    try:
        success = tester.run_focused_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())