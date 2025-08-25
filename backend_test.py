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
BACKEND_URL = "https://telegram-manager-5.preview.emergentagent.com/api"
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
        """Test groups management endpoints (MongoDB-based)"""
        self.log("=== TESTING GROUPS MANAGEMENT (MongoDB) ===", "INFO")
        
        # Test list groups
        self.test_endpoint("GET", "/groups", description="List all groups from MongoDB")
        
        # Test add group (with unique test data)
        test_group = f"https://t.me/testgroup_{int(time.time())}"
        group_data = {"group_link": test_group, "metadata": {"added_by": "api_test"}}
        response = self.test_endpoint("POST", "/groups", data=group_data, description="Add new group to MongoDB")
        
        # Test add duplicate group (should fail)
        if response and response.status_code == 200:
            self.test_endpoint("POST", "/groups", data=group_data, expected_status=400,
                              description="Add duplicate group (should fail)")
            
            # Test remove group
            self.test_endpoint("DELETE", f"/groups/{test_group}", description="Remove group from MongoDB")
        
    def test_messages_management(self):
        """Test messages management endpoints (MongoDB-based)"""
        self.log("=== TESTING MESSAGES MANAGEMENT (MongoDB) ===", "INFO")
        
        # Test list message templates
        self.test_endpoint("GET", "/messages", description="List all message templates from MongoDB")
        
        # Test create message template
        test_template_id = f"test_template_{int(time.time())}"
        message_data = {
            "template_id": test_template_id,
            "content": "This is a test message template for API testing.\n\nHello {name}!\nBest regards,\nTelegram Bot",
            "variables": {"name": ["John", "Jane", "Alex"]}
        }
        response = self.test_endpoint("POST", "/messages", data=message_data, description="Create new message template in MongoDB")
        
        if response and response.status_code == 200:
            # Test update message template
            update_data = {
                "content": "Updated test message template content.\n\nHi {name}!\nThis template was updated via API.\nCheers!",
                "variables": {"name": ["John", "Jane", "Alex", "Sarah"]}
            }
            self.test_endpoint("PUT", f"/messages/{test_template_id}", data=update_data, 
                              description="Update existing message template in MongoDB")
            
            # Test get specific template
            self.test_endpoint("GET", f"/messages/{test_template_id}", description="Get specific message template from MongoDB")
            
            # Test delete message template
            self.test_endpoint("DELETE", f"/messages/{test_template_id}", description="Delete message template from MongoDB")
        
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
        """Test blacklist management endpoints (MongoDB-based)"""
        self.log("=== TESTING BLACKLIST MANAGEMENT (MongoDB) ===", "INFO")
        
        # Test get blacklist (using groups router)
        self.test_endpoint("GET", "/groups/blacklist", description="Get current blacklist status from MongoDB")
        
        # Test add to permanent blacklist
        test_group = f"https://t.me/blacklisted_group_{int(time.time())}"
        blacklist_data = {
            "group_link": test_group,
            "reason": "API testing - automated blacklist entry"
        }
        response = self.test_endpoint("POST", "/groups/blacklist/permanent", data=blacklist_data, 
                                     description="Add group to permanent blacklist in MongoDB")
        
        if response and response.status_code == 200:
            # Test remove from permanent blacklist
            self.test_endpoint("DELETE", f"/groups/blacklist/permanent/{test_group}", 
                              description="Remove group from permanent blacklist in MongoDB")
        
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