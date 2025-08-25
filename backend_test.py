#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Telegram Automation Service
Testing after Unified Authentication Interface implementation
"""

import requests
import json
import time
import sys
from datetime import datetime
from pathlib import Path

# Configuration
BACKEND_URL = "https://tgpro-login.preview.emergentagent.com/api"
API_KEY = "telegram-automation-key-2025"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

class BackendTester:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, description=""):
        """Test a single API endpoint"""
        url = f"{BACKEND_URL}{endpoint}"
        self.log(f"Testing {method} {endpoint} - {description}")
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=HEADERS, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=HEADERS, json=data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=HEADERS, json=data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=HEADERS, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            # Check status code
            if response.status_code == expected_status:
                self.log(f"✅ PASS: {description} (Status: {response.status_code})", "SUCCESS")
                self.passed += 1
                result = {
                    "endpoint": endpoint,
                    "method": method,
                    "status": "PASS",
                    "status_code": response.status_code,
                    "description": description,
                    "response_size": len(response.text)
                }
            else:
                self.log(f"❌ FAIL: {description} (Expected: {expected_status}, Got: {response.status_code})", "ERROR")
                self.log(f"Response: {response.text[:200]}...", "ERROR")
                self.failed += 1
                result = {
                    "endpoint": endpoint,
                    "method": method,
                    "status": "FAIL",
                    "status_code": response.status_code,
                    "expected_status": expected_status,
                    "description": description,
                    "error": response.text[:200]
                }
                
            self.results.append(result)
            return response
            
        except requests.exceptions.RequestException as e:
            self.log(f"❌ FAIL: {description} - Connection Error: {str(e)}", "ERROR")
            self.failed += 1
            self.results.append({
                "endpoint": endpoint,
                "method": method,
                "status": "FAIL",
                "description": description,
                "error": f"Connection Error: {str(e)}"
            })
            return None
            
    def test_health_and_status(self):
        """Test health check and authentication status endpoints"""
        self.log("=== TESTING HEALTH CHECK & STATUS ===", "INFO")
        
        # Test health endpoint
        response = self.test_endpoint("GET", "/health", description="Health check endpoint")
        if response and response.status_code == 200:
            try:
                health_data = response.json()
                services = health_data.get("services", {})
                self.log(f"Services status: {json.dumps(services, indent=2)}")
            except:
                pass
                
        # Test auth status endpoint
        self.test_endpoint("GET", "/auth/status", description="Authentication status endpoint")
        
    def test_configuration_management(self):
        """Test configuration management endpoints"""
        self.log("=== TESTING CONFIGURATION MANAGEMENT ===", "INFO")
        
        # Test get configuration
        self.test_endpoint("GET", "/auth/configuration", description="Get Telegram API configuration status")
        
        # Test configure API (with test data)
        config_data = {
            "api_id": "12345678",
            "api_hash": "abcd1234efgh5678ijkl9012mnop3456"
        }
        self.test_endpoint("POST", "/auth/configure", data=config_data, 
                          description="Configure Telegram API credentials")
        
    def test_authentication_flow(self):
        """Test authentication flow endpoints"""
        self.log("=== TESTING AUTHENTICATION FLOW ===", "INFO")
        
        # Test phone authentication (expected to fail without real credentials)
        phone_data = {"phone_number": "+1234567890"}
        self.test_endpoint("POST", "/auth/phone", data=phone_data, expected_status=400,
                          description="Request verification code (expected to fail without real API credentials)")
        
        # Test verification code (expected to fail without session_id)
        verify_data = {"verification_code": "123456"}
        self.test_endpoint("POST", "/auth/verify", data=verify_data, expected_status=400,
                          description="Verify phone code (expected to fail without session_id)")
        
        # Test 2FA (expected to fail without session_id)
        twofa_data = {"password": "testpassword"}
        self.test_endpoint("POST", "/auth/2fa", data=twofa_data, expected_status=400,
                          description="Verify 2FA password (expected to fail without session_id)")
        
    def test_groups_management(self):
        """Test groups management endpoints (File-based - legacy)"""
        self.log("=== TESTING GROUPS MANAGEMENT (File-based) ===", "INFO")
        
        # Test list groups
        self.test_endpoint("GET", "/groups", description="List all groups from groups.txt")
        
        # Test add group (using old format)
        test_group = f"https://t.me/testgroup_{int(time.time())}"
        group_data = {"group_link": test_group}
        response = self.test_endpoint("POST", "/groups", data=group_data, description="Add new group to groups.txt")
        
        # Test add duplicate group (should fail)
        if response and response.status_code == 200:
            self.test_endpoint("POST", "/groups", data=group_data, expected_status=400,
                              description="Add duplicate group (should fail)")
            
            # Test remove group
            self.test_endpoint("DELETE", f"/groups/{test_group}", description="Remove group from groups.txt")
        
    def test_messages_management(self):
        """Test messages management endpoints (File-based - legacy)"""
        self.log("=== TESTING MESSAGES MANAGEMENT (File-based) ===", "INFO")
        
        # Test list message files
        self.test_endpoint("GET", "/messages", description="List all message files")
        
        # Test create message file (using old format)
        test_filename = f"test_message_{int(time.time())}"
        message_data = {
            "filename": test_filename,
            "content": "This is a test message for API testing.\n\nHello {name}!\nBest regards,\nTelegram Bot"
        }
        response = self.test_endpoint("POST", "/messages", data=message_data, description="Create new message file")
        
        if response and response.status_code == 200:
            # Test update message file
            update_data = {
                "content": "Updated test message content.\n\nHi {name}!\nThis message was updated via API.\nCheers!"
            }
            self.test_endpoint("PUT", f"/messages/{test_filename}.txt", data=update_data, 
                              description="Update existing message file")
            
            # Test delete message file
            self.test_endpoint("DELETE", f"/messages/{test_filename}.txt", description="Delete message file")
        
    def test_templates_management(self):
        """Test templates management endpoints"""
        self.log("=== TESTING TEMPLATES MANAGEMENT ===", "INFO")
        
        # Test list templates
        self.test_endpoint("GET", "/templates", description="List all available templates")
        
        # Test create template
        template_data = {
            "template_id": f"test_template_{int(time.time())}",
            "content": "Hello {name}! This is a test template message.",
            "variables": {
                "name": ["John", "Jane", "Alex", "Sarah"]
            }
        }
        self.test_endpoint("POST", "/templates", data=template_data, description="Create new message template")
        
    def test_blacklist_management(self):
        """Test blacklist management endpoints (File-based - legacy)"""
        self.log("=== TESTING BLACKLIST MANAGEMENT (File-based) ===", "INFO")
        
        # Test get blacklist (using old endpoint)
        self.test_endpoint("GET", "/blacklist", description="Get current blacklist status")
        
        # Test add to permanent blacklist
        test_group = f"https://t.me/blacklisted_group_{int(time.time())}"
        blacklist_data = {
            "group_link": test_group,
            "reason": "API testing - automated blacklist entry"
        }
        response = self.test_endpoint("POST", "/blacklist/permanent", data=blacklist_data, 
                                     description="Add group to permanent blacklist")
        
        if response and response.status_code == 200:
            # Test remove from permanent blacklist
            self.test_endpoint("DELETE", f"/blacklist/permanent/{test_group}", 
                              description="Remove group from permanent blacklist")
        
    def test_configuration_endpoints(self):
        """Test general configuration endpoints"""
        self.log("=== TESTING CONFIGURATION ENDPOINTS ===", "INFO")
        
        # Test get config
        self.test_endpoint("GET", "/config", description="Get current configuration")
        
        # Test update config
        config_update = {
            "delays": {
                "message_delay": 5,
                "group_delay": 10
            }
        }
        self.test_endpoint("PUT", "/config", data=config_update, description="Update configuration")
        
    def test_logs_endpoint(self):
        """Test logs endpoint"""
        self.log("=== TESTING LOGS ENDPOINT ===", "INFO")
        
        # Test get logs
        self.test_endpoint("GET", "/logs?lines=50", description="Get recent log entries")
        
    def test_jwt_authentication(self):
        """Test JWT token authentication security"""
        self.log("=== TESTING JWT TOKEN AUTHENTICATION ===", "INFO")
        
        # Test with invalid API key
        invalid_headers = {
            "Authorization": "Bearer invalid-key-12345",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.get(f"{BACKEND_URL}/health", headers=invalid_headers, timeout=10)
            if response.status_code == 401:
                self.log("✅ PASS: Invalid API key properly rejected (Status: 401)", "SUCCESS")
                self.passed += 1
            else:
                self.log(f"❌ FAIL: Invalid API key not properly rejected (Status: {response.status_code})", "ERROR")
                self.failed += 1
        except Exception as e:
            self.log(f"❌ FAIL: Error testing invalid API key: {str(e)}", "ERROR")
            self.failed += 1
            
        # Test with missing Authorization header
        try:
            response = requests.get(f"{BACKEND_URL}/health", headers={"Content-Type": "application/json"}, timeout=10)
            if response.status_code == 403:
                self.log("✅ PASS: Missing Authorization header properly rejected (Status: 403)", "SUCCESS")
                self.passed += 1
            else:
                self.log(f"❌ FAIL: Missing Authorization header not properly rejected (Status: {response.status_code})", "ERROR")
                self.failed += 1
        except Exception as e:
            self.log(f"❌ FAIL: Error testing missing Authorization header: {str(e)}", "ERROR")
            self.failed += 1
            
        # Test JWT-based auth status endpoint (should fail without valid JWT)
        try:
            response = requests.get(f"{BACKEND_URL}/auth/status", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log("✅ PASS: JWT auth status properly requires valid JWT token (Status: 401)", "SUCCESS")
                self.passed += 1
            else:
                self.log(f"❌ FAIL: JWT auth status should require valid JWT token (Status: {response.status_code})", "ERROR")
                self.failed += 1
        except Exception as e:
            self.log(f"❌ FAIL: Error testing JWT auth status: {str(e)}", "ERROR")
            self.failed += 1
    
    def test_mongodb_integration(self):
        """Test MongoDB integration through health endpoint"""
        self.log("=== TESTING MONGODB INTEGRATION ===", "INFO")
        
        response = self.test_endpoint("GET", "/health", description="Check MongoDB services in health endpoint")
        if response and response.status_code == 200:
            try:
                health_data = response.json()
                services = health_data.get("services", {})
                
                mongodb_services = [
                    "db_service",
                    "encryption_service", 
                    "config_service",
                    "auth_service"
                ]
                
                for service in mongodb_services:
                    if services.get(service):
                        self.log(f"✅ PASS: {service} is operational", "SUCCESS")
                        self.passed += 1
                    else:
                        self.log(f"❌ FAIL: {service} is not operational", "ERROR")
                        self.failed += 1
                        
            except Exception as e:
                self.log(f"❌ FAIL: Error checking MongoDB services: {str(e)}", "ERROR")
                self.failed += 1
    
    def test_websocket_and_tasks(self):
        """Test WebSocket and async task endpoints"""
        self.log("=== TESTING WEBSOCKET & TASK ENDPOINTS ===", "INFO")
        
        # Test WebSocket connections endpoint
        self.test_endpoint("GET", "/ws/connections", description="Get WebSocket connection statistics")
        
        # Test task statistics
        self.test_endpoint("GET", "/tasks/stats/overview", description="Get task statistics overview")
        
        # Test task creation (message sending)
        task_data = {
            "template_id": "test_template",
            "recipients": ["https://t.me/testgroup"],
            "delay_override": {"message_delay": 5}
        }
        self.test_endpoint("POST", "/tasks/message-sending", data=task_data, description="Create message sending task")
        
    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("🚀 STARTING COMPREHENSIVE BACKEND API TESTING", "INFO")
        self.log(f"Backend URL: {BACKEND_URL}", "INFO")
        self.log("=" * 80, "INFO")
        
        start_time = time.time()
        
        # Run all test suites
        self.test_health_and_status()
        self.test_configuration_management()
        self.test_authentication_flow()
        self.test_groups_management()
        self.test_messages_management()
        self.test_templates_management()
        self.test_blacklist_management()
        self.test_configuration_endpoints()
        self.test_logs_endpoint()
        self.test_jwt_authentication()
        self.test_mongodb_integration()
        self.test_websocket_and_tasks()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        self.log("=" * 80, "INFO")
        self.log("🏁 TESTING COMPLETED", "INFO")
        self.log(f"Total Tests: {self.passed + self.failed}", "INFO")
        self.log(f"✅ Passed: {self.passed}", "SUCCESS")
        self.log(f"❌ Failed: {self.failed}", "ERROR")
        self.log(f"Success Rate: {(self.passed / (self.passed + self.failed) * 100):.1f}%", "INFO")
        self.log(f"Duration: {duration:.2f} seconds", "INFO")
        
        return {
            "total_tests": self.passed + self.failed,
            "passed": self.passed,
            "failed": self.failed,
            "success_rate": (self.passed / (self.passed + self.failed) * 100) if (self.passed + self.failed) > 0 else 0,
            "duration": duration,
            "results": self.results
        }

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results["failed"] == 0 else 1)