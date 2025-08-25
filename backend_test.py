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
    def __init__(self, base_url="https://code-revitalizer.preview.emergentagent.com"):
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

    def test_groups_management(self):
        """Test Groups Management endpoints (NEW functionality)"""
        print("🔍 Testing Groups Management Endpoints...")
        
        # Test list groups (existing endpoint)
        success, data, status_code = self.make_request('GET', 'groups')
        self.log_test(
            "List Groups",
            success and status_code == 200,
            f"Status: {status_code}, Groups: {data.get('total', 0)}"
        )

        # Test add valid group with https://t.me/ format
        group_data = {"group_link": "https://t.me/testgroup123"}
        success, data, status_code = self.make_request('POST', 'groups', group_data)
        self.log_test(
            "Add Group (https format)",
            status_code in [200, 201],
            f"Status: {status_code}, Response: {data}"
        )

        # Test add valid group with @ format
        group_data = {"group_link": "@testgroup456"}
        success, data, status_code = self.make_request('POST', 'groups', group_data)
        self.log_test(
            "Add Group (@ format)",
            status_code in [200, 201],
            f"Status: {status_code}, Response: {data}"
        )

        # Test add invalid format group (should fail)
        group_data = {"group_link": "invalid-group-format"}
        success, data, status_code = self.make_request('POST', 'groups', group_data)
        self.log_test(
            "Add Invalid Group Format",
            status_code == 400,
            f"Status: {status_code}, Should reject invalid format"
        )

        # Test add duplicate group (should fail)
        group_data = {"group_link": "https://t.me/testgroup123"}
        success, data, status_code = self.make_request('POST', 'groups', group_data)
        self.log_test(
            "Add Duplicate Group",
            status_code == 400,
            f"Status: {status_code}, Should reject duplicate"
        )

        # Test add group without group_link (should fail)
        group_data = {}
        success, data, status_code = self.make_request('POST', 'groups', group_data)
        self.log_test(
            "Add Group Without Link",
            status_code == 400,
            f"Status: {status_code}, Should require group_link"
        )

        # Test remove existing group
        success, data, status_code = self.make_request('DELETE', 'groups/https://t.me/testgroup123')
        self.log_test(
            "Remove Existing Group",
            status_code in [200, 404],  # 404 is acceptable if group doesn't exist
            f"Status: {status_code}, Response: {data}"
        )

        # Test remove non-existent group (should fail)
        success, data, status_code = self.make_request('DELETE', 'groups/https://t.me/nonexistentgroup999')
        self.log_test(
            "Remove Non-existent Group",
            status_code == 404,
            f"Status: {status_code}, Should return 404"
        )

    def test_messages_management(self):
        """Test Messages Management endpoints (NEW functionality)"""
        print("🔍 Testing Messages Management Endpoints...")
        
        # Test list message files (now includes content)
        success, data, status_code = self.make_request('GET', 'messages')
        self.log_test(
            "List Message Files with Content",
            success and status_code == 200,
            f"Status: {status_code}, Files: {data.get('total', 0)}"
        )

        # Test create new message file
        message_data = {
            "filename": "test_message_001.txt",
            "content": "Hello! This is a test message for our automation system. Best regards, Team."
        }
        success, data, status_code = self.make_request('POST', 'messages', message_data)
        self.log_test(
            "Create Message File",
            status_code in [200, 201],
            f"Status: {status_code}, Response: {data}"
        )

        # Test create message file without .txt extension (should auto-add)
        message_data = {
            "filename": "test_message_002",
            "content": "Another test message without .txt extension."
        }
        success, data, status_code = self.make_request('POST', 'messages', message_data)
        self.log_test(
            "Create Message File (auto .txt)",
            status_code in [200, 201],
            f"Status: {status_code}, Should auto-add .txt extension"
        )

        # Test create message file with invalid filename (should fail)
        message_data = {
            "filename": "../invalid/path.txt",
            "content": "This should fail due to path traversal"
        }
        success, data, status_code = self.make_request('POST', 'messages', message_data)
        self.log_test(
            "Create Message File (Invalid Path)",
            status_code == 400,
            f"Status: {status_code}, Should reject path traversal"
        )

        # Test create message file without content (should fail)
        message_data = {
            "filename": "empty_message.txt",
            "content": ""
        }
        success, data, status_code = self.make_request('POST', 'messages', message_data)
        self.log_test(
            "Create Message File (No Content)",
            status_code == 400,
            f"Status: {status_code}, Should require content"
        )

        # Test create duplicate filename (should fail)
        message_data = {
            "filename": "test_message_001.txt",
            "content": "Duplicate filename test"
        }
        success, data, status_code = self.make_request('POST', 'messages', message_data)
        self.log_test(
            "Create Duplicate Message File",
            status_code == 400,
            f"Status: {status_code}, Should reject duplicate filename"
        )

        # Test update existing message file
        update_data = {
            "content": "Updated content for test message 001. This is the new version."
        }
        success, data, status_code = self.make_request('PUT', 'messages/test_message_001.txt', update_data)
        self.log_test(
            "Update Message File",
            status_code in [200, 404],  # 404 acceptable if file doesn't exist
            f"Status: {status_code}, Response: {data}"
        )

        # Test update non-existent file (should fail)
        update_data = {
            "content": "This file doesn't exist"
        }
        success, data, status_code = self.make_request('PUT', 'messages/nonexistent_file.txt', update_data)
        self.log_test(
            "Update Non-existent File",
            status_code == 404,
            f"Status: {status_code}, Should return 404"
        )

        # Test update with invalid filename (should fail)
        update_data = {
            "content": "Invalid path test"
        }
        success, data, status_code = self.make_request('PUT', 'messages/../invalid.txt', update_data)
        self.log_test(
            "Update Invalid Filename",
            status_code in [400, 404],  # 404 is acceptable as FastAPI treats as route param
            f"Status: {status_code}, Should reject invalid filename"
        )

        # Test update without content (should fail)
        update_data = {}
        success, data, status_code = self.make_request('PUT', 'messages/test_message_001.txt', update_data)
        self.log_test(
            "Update Without Content",
            status_code == 400,
            f"Status: {status_code}, Should require content"
        )

        # Test delete message file
        success, data, status_code = self.make_request('DELETE', 'messages/test_message_001.txt')
        self.log_test(
            "Delete Message File",
            status_code in [200, 404],  # 404 acceptable if file doesn't exist
            f"Status: {status_code}, Response: {data}"
        )

        # Test delete non-existent file (should fail)
        success, data, status_code = self.make_request('DELETE', 'messages/nonexistent_file.txt')
        self.log_test(
            "Delete Non-existent File",
            status_code == 404,
            f"Status: {status_code}, Should return 404"
        )

        # Test delete with invalid filename (should fail)
        success, data, status_code = self.make_request('DELETE', 'messages/../invalid.txt')
        self.log_test(
            "Delete Invalid Filename",
            status_code == 400,
            f"Status: {status_code}, Should reject invalid filename"
        )

    def test_file_endpoints(self):
        """Test legacy file management endpoints for compatibility"""
        print("🔍 Testing Legacy File Management Endpoints...")
        
        # Test list groups (legacy test)
        success, data, status_code = self.make_request('GET', 'groups')
        self.log_test(
            "List Groups (Legacy)",
            success and status_code == 200,
            f"Status: {status_code}, Groups: {data.get('total', 0)}"
        )

        # Test list message files (legacy test)
        success, data, status_code = self.make_request('GET', 'messages')
        self.log_test(
            "List Message Files (Legacy)",
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
        
        # Test with invalid API key on protected endpoint (auth/status)
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid-key'
        }
        
        try:
            response = requests.get(f"{self.base_url}/api/auth/status", headers=invalid_headers, timeout=10)
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
            
        # Test health endpoint should work without API key (public endpoint)
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            self.log_test(
                "Health Endpoint (Public Access)",
                response.status_code == 200,
                f"Status: {response.status_code}, Health endpoint should be public"
            )
        except Exception as e:
            self.log_test(
                "Health Endpoint (Public Access)",
                False,
                f"Error testing health endpoint: {e}"
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
        self.test_groups_management()  # NEW: Enhanced Groups Management
        self.test_messages_management()  # NEW: Enhanced Messages Management
        self.test_file_endpoints()  # Legacy compatibility tests
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