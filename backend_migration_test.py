#!/usr/bin/env python3
"""
Backend API Testing After Frontend Migration to TypeScript + Chakra UI
Testing core backend endpoints to ensure they remain functional after frontend changes
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional, List

# Configuration
BACKEND_URL = "https://tgpro-refactor.preview.emergentagent.com"
API_KEY = "telegram-automation-key-2025"

class BackendMigrationTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.api_key = API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Use custom headers if provided, otherwise use default headers
        if headers is not None:
            request_headers = headers
        else:
            request_headers = self.headers.copy()
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {endpoint}: {e}")
            raise

    # ========== CORE HEALTH & STATUS TESTS ==========
    
    def test_health_endpoint(self):
        """Test GET /api/health - verify all services running"""
        try:
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status")
                services = data.get("services", {})
                
                # Check critical services
                critical_services = [
                    "config_manager", "blacklist_manager", "telegram_service",
                    "db_service", "encryption_service", "config_service",
                    "auth_service", "websocket_manager", "task_service"
                ]
                
                failed_services = [service for service in critical_services 
                                 if not services.get(service, False)]
                
                if status == "healthy" and not failed_services:
                    self.log_test("Health Check", True, 
                                f"All services healthy: {len(critical_services)} services running", data)
                else:
                    self.log_test("Health Check", False, 
                                f"Service issues - Status: {status}, Failed: {failed_services}", data)
            else:
                self.log_test("Health Check", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")

    def test_auth_status_endpoint(self):
        """Test GET /api/auth/status - check authentication status (JWT-based)"""
        try:
            # This endpoint uses JWT authentication, not API key
            # Without a valid JWT token, it should return unauthenticated status
            no_auth_headers = {"Content-Type": "application/json"}
            response = self.make_request("GET", "/api/auth/status", headers=no_auth_headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Should have authentication status fields
                required_fields = ["authenticated"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    authenticated = data.get("authenticated", False)
                    # Without JWT token, should be false
                    if not authenticated:
                        self.log_test("Auth Status", True, 
                                    f"Auth status endpoint working - Unauthenticated as expected: {authenticated}", data)
                    else:
                        self.log_test("Auth Status", False, 
                                    f"Unexpected authenticated status without JWT token: {authenticated}", data)
                else:
                    self.log_test("Auth Status", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Auth Status", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Status", False, f"Exception: {str(e)}")

    def test_auth_configuration_endpoint(self):
        """Test GET /api/auth/configuration - verify API configuration endpoint"""
        try:
            response = self.make_request("GET", "/api/auth/configuration")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should have configuration status fields
                expected_fields = ["configured", "api_id_configured", "api_hash_configured"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    configured = data.get("configured", False)
                    self.log_test("Auth Configuration", True, 
                                f"Configuration status retrieved - Configured: {configured}", data)
                else:
                    self.log_test("Auth Configuration", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Auth Configuration", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Configuration", False, f"Exception: {str(e)}")

    # ========== CRUD OPERATIONS TESTS ==========
    
    def test_groups_list_endpoint(self):
        """Test GET /api/groups - list groups"""
        try:
            response = self.make_request("GET", "/api/groups")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should have groups array and total count
                if "groups" in data and "total" in data:
                    groups = data.get("groups", [])
                    total = data.get("total", 0)
                    self.log_test("Groups List", True, 
                                f"Groups retrieved successfully - Total: {total} groups", data)
                else:
                    self.log_test("Groups List", False, 
                                "Missing 'groups' or 'total' fields", data)
            else:
                self.log_test("Groups List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Groups List", False, f"Exception: {str(e)}")

    def test_messages_list_endpoint(self):
        """Test GET /api/messages - list message files"""
        try:
            response = self.make_request("GET", "/api/messages")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should have message_files array and total count
                if "message_files" in data and "total" in data:
                    message_files = data.get("message_files", [])
                    total = data.get("total", 0)
                    self.log_test("Messages List", True, 
                                f"Message files retrieved successfully - Total: {total} files", data)
                else:
                    self.log_test("Messages List", False, 
                                "Missing 'message_files' or 'total' fields", data)
            else:
                self.log_test("Messages List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Messages List", False, f"Exception: {str(e)}")

    def test_templates_list_endpoint(self):
        """Test GET /api/templates - list templates"""
        try:
            response = self.make_request("GET", "/api/templates")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should have templates array
                if "templates" in data:
                    templates = data.get("templates", [])
                    self.log_test("Templates List", True, 
                                f"Templates retrieved successfully - Count: {len(templates)}", data)
                else:
                    self.log_test("Templates List", False, 
                                "Missing 'templates' field", data)
            else:
                self.log_test("Templates List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Templates List", False, f"Exception: {str(e)}")

    def test_blacklist_list_endpoint(self):
        """Test GET /api/blacklist - list blacklist items"""
        try:
            response = self.make_request("GET", "/api/blacklist")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should have permanent_blacklist and temporary_blacklist
                expected_fields = ["permanent_blacklist", "temporary_blacklist"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    permanent = data.get("permanent_blacklist", [])
                    temporary = data.get("temporary_blacklist", [])
                    self.log_test("Blacklist List", True, 
                                f"Blacklist retrieved - Permanent: {len(permanent)}, Temporary: {len(temporary)}", data)
                else:
                    self.log_test("Blacklist List", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Blacklist List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Blacklist List", False, f"Exception: {str(e)}")

    # ========== CONFIGURATION MANAGEMENT TESTS ==========
    
    def test_config_get_endpoint(self):
        """Test GET /api/config - get configuration"""
        try:
            response = self.make_request("GET", "/api/config")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return configuration object
                if isinstance(data, dict) and data:
                    self.log_test("Config Get", True, 
                                f"Configuration retrieved successfully - Keys: {list(data.keys())}", data)
                else:
                    self.log_test("Config Get", False, 
                                "Empty or invalid configuration response", data)
            else:
                self.log_test("Config Get", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Config Get", False, f"Exception: {str(e)}")

    def test_mongodb_integration(self):
        """Test MongoDB integration through health endpoint"""
        try:
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                # Check MongoDB-related services
                mongodb_services = {
                    "db_service": services.get("db_service", False),
                    "encryption_service": services.get("encryption_service", False),
                    "config_service": services.get("config_service", False),
                    "auth_service": services.get("auth_service", False)
                }
                
                failed_mongodb_services = [service for service, status in mongodb_services.items() if not status]
                
                if not failed_mongodb_services:
                    self.log_test("MongoDB Integration", True, 
                                "All MongoDB services operational", mongodb_services)
                else:
                    self.log_test("MongoDB Integration", False, 
                                f"MongoDB service issues: {failed_mongodb_services}", mongodb_services)
            else:
                self.log_test("MongoDB Integration", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Integration", False, f"Exception: {str(e)}")

    # ========== WEBSOCKET & TASK ENDPOINTS TESTS ==========
    
    def test_websocket_connections_endpoint(self):
        """Test GET /api/ws/connections - WebSocket stats"""
        try:
            response = self.make_request("GET", "/api/ws/connections")
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get("stats", {})
                
                # Check expected WebSocket stats fields
                expected_fields = ["total_connections", "connection_types", "active_client_ids", "queue_size"]
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if not missing_fields:
                    total_connections = stats.get("total_connections", 0)
                    self.log_test("WebSocket Connections", True, 
                                f"WebSocket stats retrieved - Connections: {total_connections}", data)
                else:
                    self.log_test("WebSocket Connections", False, 
                                f"Missing stats fields: {missing_fields}", data)
            else:
                self.log_test("WebSocket Connections", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("WebSocket Connections", False, f"Exception: {str(e)}")

    def test_task_stats_overview_endpoint(self):
        """Test GET /api/tasks/stats/overview - task statistics"""
        try:
            response = self.make_request("GET", "/api/tasks/stats/overview")
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get("stats", {})
                
                # Check expected task stats fields
                expected_fields = ["total_tasks", "by_status", "by_type", "running", "queue_size", "active_tasks_count"]
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if not missing_fields:
                    total_tasks = stats.get("total_tasks", 0)
                    running = stats.get("running", False)
                    queue_size = stats.get("queue_size", 0)
                    self.log_test("Task Stats Overview", True, 
                                f"Task stats retrieved - Total: {total_tasks}, Running: {running}, Queue: {queue_size}", data)
                else:
                    self.log_test("Task Stats Overview", False, 
                                f"Missing stats fields: {missing_fields}", data)
            else:
                self.log_test("Task Stats Overview", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Task Stats Overview", False, f"Exception: {str(e)}")

    # ========== API SECURITY TESTS ==========
    
    def test_api_security_valid_token(self):
        """Test API security with valid Bearer token"""
        try:
            # Test with valid API key
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                self.log_test("API Security - Valid Token", True, 
                            "Valid Bearer token accepted successfully")
            else:
                self.log_test("API Security - Valid Token", False, 
                            f"Valid token rejected - HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("API Security - Valid Token", False, f"Exception: {str(e)}")

    def test_api_security_invalid_token(self):
        """Test API security with invalid Bearer token"""
        try:
            # Test with invalid API key on a legacy endpoint that requires API key auth
            invalid_headers = {
                "Authorization": "Bearer invalid-api-key-12345",
                "Content-Type": "application/json"
            }
            
            response = self.make_request("GET", "/api/config", headers=invalid_headers)
            
            if response.status_code == 401:
                data = response.json()
                if "Invalid API key" in data.get("detail", ""):
                    self.log_test("API Security - Invalid Token", True, 
                                "Invalid Bearer token properly rejected with 401")
                else:
                    self.log_test("API Security - Invalid Token", False, 
                                f"Wrong error message: {data.get('detail')}")
            else:
                self.log_test("API Security - Invalid Token", False, 
                            f"Invalid token not rejected - HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("API Security - Invalid Token", False, f"Exception: {str(e)}")

    def test_api_security_no_token(self):
        """Test API security without Bearer token"""
        try:
            # Test without Authorization header on an endpoint that requires API key auth
            no_auth_headers = {"Content-Type": "application/json"}
            
            response = self.make_request("GET", "/api/groups", headers=no_auth_headers)
            
            if response.status_code == 401:
                self.log_test("API Security - No Token", True, 
                            "Request without token properly rejected with 401")
            elif response.status_code == 403:
                self.log_test("API Security - No Token", True, 
                            "Request without token properly rejected with 403")
            else:
                self.log_test("API Security - No Token", False, 
                            f"Request without token not rejected - HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("API Security - No Token", False, f"Exception: {str(e)}")

    # ========== ADDITIONAL INTEGRATION TESTS ==========
    
    def test_create_and_delete_group(self):
        """Test group creation and deletion to verify CRUD operations"""
        test_group = "https://t.me/migration_test_group_002"
        
        try:
            # First, try to create a test group
            create_data = {"group_link": test_group}
            response = self.make_request("POST", "/api/groups", create_data)
            
            if response.status_code == 200:
                # Group created successfully, now try to delete it
                # Use the exact group link as path parameter
                delete_response = self.make_request("DELETE", f"/api/groups/{test_group}")
                
                if delete_response.status_code == 200:
                    self.log_test("Group CRUD Operations", True, 
                                "Group creation and deletion working correctly")
                else:
                    self.log_test("Group CRUD Operations", False, 
                                f"Group deletion failed - HTTP {delete_response.status_code}: {delete_response.text}")
            elif response.status_code == 400 and "already exists" in response.text:
                # Group already exists, try to delete it
                delete_response = self.make_request("DELETE", f"/api/groups/{test_group}")
                
                if delete_response.status_code == 200:
                    self.log_test("Group CRUD Operations", True, 
                                "Group deletion working (group already existed)")
                else:
                    self.log_test("Group CRUD Operations", False, 
                                f"Group deletion failed - HTTP {delete_response.status_code}: {delete_response.text}")
            else:
                self.log_test("Group CRUD Operations", False, 
                            f"Group creation failed - HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Group CRUD Operations", False, f"Exception: {str(e)}")

    def test_create_and_delete_message(self):
        """Test message file creation and deletion"""
        test_filename = "migration_test_message_002.txt"
        test_content = "This is a test message for migration testing - updated."
        
        try:
            # First, try to create a test message file
            create_data = {"filename": test_filename, "content": test_content}
            response = self.make_request("POST", "/api/messages", create_data)
            
            if response.status_code == 200:
                # Message created successfully, now try to delete it
                delete_response = self.make_request("DELETE", f"/api/messages/{test_filename}")
                
                if delete_response.status_code == 200:
                    self.log_test("Message CRUD Operations", True, 
                                "Message creation and deletion working correctly")
                else:
                    self.log_test("Message CRUD Operations", False, 
                                f"Message deletion failed - HTTP {delete_response.status_code}: {delete_response.text}")
            elif response.status_code == 400 and "already exists" in response.text:
                # Message already exists, try to delete it
                delete_response = self.make_request("DELETE", f"/api/messages/{test_filename}")
                
                if delete_response.status_code == 200:
                    self.log_test("Message CRUD Operations", True, 
                                "Message deletion working (file already existed)")
                else:
                    self.log_test("Message CRUD Operations", False, 
                                f"Message deletion failed - HTTP {delete_response.status_code}: {delete_response.text}")
            else:
                self.log_test("Message CRUD Operations", False, 
                            f"Message creation failed - HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Message CRUD Operations", False, f"Exception: {str(e)}")

    # ========== MAIN TEST EXECUTION ==========
    
    def run_migration_tests(self):
        """Run all backend migration tests"""
        print("=" * 80)
        print("BACKEND API TESTING AFTER FRONTEND MIGRATION")
        print("TypeScript + Chakra UI Migration Verification")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"API Key: {self.api_key}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Core Health & Status Tests
        print("🏥 CORE HEALTH & STATUS TESTS")
        print("-" * 50)
        self.test_health_endpoint()
        self.test_auth_status_endpoint()
        self.test_auth_configuration_endpoint()
        print()
        
        # CRUD Operations Tests
        print("📊 CRUD OPERATIONS TESTS")
        print("-" * 50)
        self.test_groups_list_endpoint()
        self.test_messages_list_endpoint()
        self.test_templates_list_endpoint()
        self.test_blacklist_list_endpoint()
        print()
        
        # Configuration Management Tests
        print("⚙️ CONFIGURATION MANAGEMENT TESTS")
        print("-" * 50)
        self.test_config_get_endpoint()
        self.test_mongodb_integration()
        print()
        
        # WebSocket & Task Endpoints Tests
        print("🔌 WEBSOCKET & TASK ENDPOINTS TESTS")
        print("-" * 50)
        self.test_websocket_connections_endpoint()
        self.test_task_stats_overview_endpoint()
        print()
        
        # API Security Tests
        print("🔒 API SECURITY TESTS")
        print("-" * 50)
        self.test_api_security_valid_token()
        self.test_api_security_invalid_token()
        self.test_api_security_no_token()
        print()
        
        # Additional Integration Tests
        print("🔗 INTEGRATION TESTS")
        print("-" * 50)
        self.test_create_and_delete_group()
        self.test_create_and_delete_message()
        print()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("MIGRATION TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            print("-" * 40)
            for result in self.test_results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
            print()
        
        print("CRITICAL ISSUES FOUND:")
        print("-" * 40)
        critical_issues = []
        
        for result in self.test_results:
            if not result["success"]:
                test_name = result["test"].lower()
                if any(keyword in test_name for keyword in ["health", "security", "mongodb", "auth"]):
                    critical_issues.append(f"• {result['test']}: {result['details']}")
        
        if critical_issues:
            for issue in critical_issues:
                print(issue)
        else:
            print("✅ No critical issues found!")
        
        print()
        print("MIGRATION STATUS:")
        print("-" * 40)
        
        # Analyze results for migration-specific issues
        core_health_passed = any(r["test"] == "Health Check" and r["success"] for r in self.test_results)
        crud_operations_passed = sum(1 for r in self.test_results if "List" in r["test"] and r["success"]) >= 4
        security_passed = sum(1 for r in self.test_results if "API Security" in r["test"] and r["success"]) >= 2
        
        if core_health_passed and crud_operations_passed and security_passed:
            print("✅ Backend APIs are fully functional after frontend migration")
            print("✅ All core endpoints responding correctly")
            print("✅ API security working properly")
            print("✅ CRUD operations intact")
        else:
            print("⚠️  Some backend functionality may be affected by migration")
            if not core_health_passed:
                print("❌ Core health check issues detected")
            if not crud_operations_passed:
                print("❌ CRUD operations issues detected")
            if not security_passed:
                print("❌ API security issues detected")
        
        print()
        print(f"Test completed at: {datetime.now().isoformat()}")
        print("=" * 80)

if __name__ == "__main__":
    tester = BackendMigrationTester()
    tester.run_migration_tests()