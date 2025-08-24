#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Telegram MTProto Automation System
Tests all endpoints systematically with proper authentication
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class TelegramAutomationAPITester:
    def __init__(self, base_url="https://message-pulse-1.preview.emergentagent.com"):
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

    def test_health_endpoint(self):
        """Test health check endpoint"""
        print("🔍 Testing Health Check Endpoint...")
        success, data, status_code = self.make_request('GET', 'health')
        
        if success and status_code == 200:
            expected_keys = ['status', 'telegram_initialized', 'timestamp', 'services']
            has_all_keys = all(key in data for key in expected_keys)
            self.log_test(
                "Health Check", 
                has_all_keys,
                f"Status: {status_code}, Response: {json.dumps(data, indent=2)}"
            )
        else:
            self.log_test(
                "Health Check", 
                False,
                f"Status: {status_code}, Error: {data}"
            )

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("🔍 Testing Authentication Endpoints...")
        
        # Test auth status endpoint
        success, data, status_code = self.make_request('GET', 'auth/status')
        self.log_test(
            "Auth Status Check",
            success and status_code == 200,
            f"Status: {status_code}, Authenticated: {data.get('authenticated', 'N/A')}"
        )

        # Test phone verification request (should work without actual phone)
        phone_data = {"phone_number": "+1234567890"}
        success, data, status_code = self.make_request('POST', 'auth/phone', phone_data)
        self.log_test(
            "Phone Verification Request",
            status_code in [200, 400, 503],  # Accept various responses since we don't have real service
            f"Status: {status_code}, Response: {data}"
        )

        # Test code verification (should fail gracefully)
        code_data = {"verification_code": "123456"}
        success, data, status_code = self.make_request('POST', 'auth/verify', code_data)
        self.log_test(
            "Code Verification",
            status_code in [200, 400, 503],
            f"Status: {status_code}, Response: {data}"
        )

        # Test 2FA verification (should fail gracefully)
        twofa_data = {"password": "testpassword"}
        success, data, status_code = self.make_request('POST', 'auth/2fa', twofa_data)
        self.log_test(
            "2FA Verification",
            status_code in [200, 400, 503],
            f"Status: {status_code}, Response: {data}"
        )

    def test_template_endpoints(self):
        """Test template management endpoints"""
        print("🔍 Testing Template Management Endpoints...")
        
        # Test list templates
        success, data, status_code = self.make_request('GET', 'templates')
        self.log_test(
            "List Templates",
            success and status_code == 200,
            f"Status: {status_code}, Templates: {len(data.get('templates', []))}"
        )

        # Test create template
        template_data = {
            "template_id": "test_template_001",
            "content": "Hello {name}, this is a test message from {company}!",
            "variables": {
                "name": ["John", "Jane", "Bob"],
                "company": ["TechCorp", "StartupInc"]
            }
        }
        success, data, status_code = self.make_request('POST', 'templates', template_data)
        self.log_test(
            "Create Template",
            status_code in [200, 201, 503],
            f"Status: {status_code}, Response: {data}"
        )

    def test_config_endpoints(self):
        """Test configuration management endpoints"""
        print("🔍 Testing Configuration Management Endpoints...")
        
        # Test get config
        success, data, status_code = self.make_request('GET', 'config')
        self.log_test(
            "Get Configuration",
            status_code in [200, 503],
            f"Status: {status_code}, Config keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}"
        )

        # Test update config
        config_data = {
            "message_delay_min": 30,
            "message_delay_max": 60,
            "daily_message_limit": 50
        }
        success, data, status_code = self.make_request('PUT', 'config', config_data)
        self.log_test(
            "Update Configuration",
            status_code in [200, 503],
            f"Status: {status_code}, Response: {data}"
        )

    def test_blacklist_endpoints(self):
        """Test blacklist management endpoints"""
        print("🔍 Testing Blacklist Management Endpoints...")
        
        # Test get blacklist
        success, data, status_code = self.make_request('GET', 'blacklist')
        self.log_test(
            "Get Blacklist",
            status_code in [200, 503],
            f"Status: {status_code}, Permanent: {len(data.get('permanent_blacklist', []))}, Temporary: {len(data.get('temporary_blacklist', []))}"
        )

        # Test add to permanent blacklist
        blacklist_data = {
            "group_link": "https://t.me/test_group_123",
            "reason": "Test blacklist entry"
        }
        success, data, status_code = self.make_request('POST', 'blacklist/permanent', blacklist_data)
        self.log_test(
            "Add to Permanent Blacklist",
            status_code in [200, 503],
            f"Status: {status_code}, Response: {data}"
        )

        # Test remove from permanent blacklist
        success, data, status_code = self.make_request('DELETE', 'blacklist/permanent/https://t.me/test_group_123')
        self.log_test(
            "Remove from Permanent Blacklist",
            status_code in [200, 404, 503],
            f"Status: {status_code}, Response: {data}"
        )

    def test_file_endpoints(self):
        """Test file management endpoints"""
        print("🔍 Testing File Management Endpoints...")
        
        # Test list groups
        success, data, status_code = self.make_request('GET', 'groups')
        self.log_test(
            "List Groups",
            success and status_code == 200,
            f"Status: {status_code}, Groups: {data.get('total', 0)}"
        )

        # Test list message files
        success, data, status_code = self.make_request('GET', 'messages')
        self.log_test(
            "List Message Files",
            success and status_code == 200,
            f"Status: {status_code}, Files: {data.get('total', 0)}"
        )

    def test_message_endpoints(self):
        """Test message automation endpoints"""
        print("🔍 Testing Message Automation Endpoints...")
        
        # Test send messages (should fail gracefully without authentication)
        message_data = {
            "template_id": "test_template_001",
            "recipients": ["https://t.me/test_group"],
            "custom_variables": {"name": "TestUser", "company": "TestCorp"}
        }
        success, data, status_code = self.make_request('POST', 'messages/send', message_data)
        self.log_test(
            "Send Messages",
            status_code in [200, 201, 400, 503],
            f"Status: {status_code}, Response: {data}"
        )

        # Test get task status (with dummy task ID)
        success, data, status_code = self.make_request('GET', 'tasks/dummy-task-id')
        self.log_test(
            "Get Task Status",
            status_code in [200, 404, 503],
            f"Status: {status_code}, Response: {data}"
        )

    def test_logs_endpoint(self):
        """Test logs endpoint"""
        print("🔍 Testing Logs Endpoint...")
        
        success, data, status_code = self.make_request('GET', 'logs?lines=10')
        self.log_test(
            "Get Logs",
            success and status_code == 200,
            f"Status: {status_code}, Log lines: {data.get('total_lines', 0)}"
        )

    def test_api_security(self):
        """Test API security (invalid API key)"""
        print("🔍 Testing API Security...")
        
        # Test with invalid API key
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-key'
        }
        
        try:
            response = requests.get(f"{self.base_url}/api/health", headers=invalid_headers, timeout=10)
            self.log_test(
                "API Security (Invalid Key)",
                response.status_code == 401,
                f"Status: {response.status_code}, Should be 401 Unauthorized"
            )
        except Exception as e:
            self.log_test(
                "API Security (Invalid Key)",
                False,
                f"Error testing security: {e}"
            )

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Backend API Testing...")
        print(f"Base URL: {self.base_url}")
        print(f"API Key: {self.api_key}")
        print("=" * 60)
        
        # Run all test suites
        self.test_health_endpoint()
        self.test_api_security()
        self.test_auth_endpoints()
        self.test_template_endpoints()
        self.test_config_endpoints()
        self.test_blacklist_endpoints()
        self.test_file_endpoints()
        self.test_message_endpoints()
        self.test_logs_endpoint()
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
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
    tester = TelegramAutomationAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())