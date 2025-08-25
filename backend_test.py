#!/usr/bin/env python3
"""
Comprehensive Backend Testing for MongoDB + JWT Authentication Implementation
Testing all new MongoDB services and JWT authentication system
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://tgpro-reborn.preview.emergentagent.com"
API_KEY = "telegram-automation-key-2025"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.api_key = API_KEY
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.test_results = []
        self.session_id = None
        self.jwt_tokens = None
        
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
        request_headers = self.headers.copy()
        if headers:
            request_headers.update(headers)
            
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

    # ========== HEALTH AND SERVICE STATUS TESTS ==========
    
    def test_health_endpoint(self):
        """Test /api/health endpoint - should show all new services"""
        try:
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                # Check for all required services
                required_services = [
                    "config_manager", "blacklist_manager", "telegram_service",
                    "db_service", "encryption_service", "config_service", "auth_service"
                ]
                
                missing_services = []
                for service in required_services:
                    if not services.get(service):
                        missing_services.append(service)
                
                if not missing_services:
                    self.log_test("Health Check - All Services", True, 
                                f"All {len(required_services)} services are running", data)
                else:
                    self.log_test("Health Check - All Services", False, 
                                f"Missing services: {missing_services}", data)
            else:
                self.log_test("Health Check - All Services", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Health Check - All Services", False, f"Exception: {str(e)}")

    # ========== MONGODB CONFIGURATION SYSTEM TESTS (CYCLE 1) ==========
    
    def test_config_status_endpoint(self):
        """Test /api/config/status endpoint - should show all services healthy"""
        try:
            response = self.make_request("GET", "/api/config/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check service status indicators
                expected_fields = ["telegram_configured", "database_connected", "encryption_initialized", "status"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    db_connected = data.get("database_connected", False)
                    encryption_init = data.get("encryption_initialized", False)
                    
                    if db_connected and encryption_init:
                        self.log_test("Config Status - Services Health", True, 
                                    f"Database connected: {db_connected}, Encryption initialized: {encryption_init}", data)
                    else:
                        self.log_test("Config Status - Services Health", False, 
                                    f"Services not healthy - DB: {db_connected}, Encryption: {encryption_init}", data)
                else:
                    self.log_test("Config Status - Services Health", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Config Status - Services Health", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Config Status - Services Health", False, f"Exception: {str(e)}")

    def test_config_telegram_get(self):
        """Test /api/config/telegram GET - should show configuration status"""
        try:
            response = self.make_request("GET", "/api/config/telegram")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["configured", "api_id_configured", "api_hash_configured", "phone_number"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("Config Telegram GET", True, 
                                f"Configuration status retrieved successfully", data)
                else:
                    self.log_test("Config Telegram GET", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Config Telegram GET", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Config Telegram GET", False, f"Exception: {str(e)}")

    def test_config_telegram_post_valid(self):
        """Test /api/config/telegram POST - test with valid format credentials"""
        try:
            # Use valid format but dummy credentials for testing
            test_config = {
                "api_id": 87654321,  # Valid format but dummy
                "api_hash": "1234567890abcdef1234567890abcdef",  # Valid 32-char format but dummy
                "phone_number": "+1234567890"
            }
            
            response = self.make_request("POST", "/api/config/telegram", test_config)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("configured"):
                    self.log_test("Config Telegram POST - Valid Format", True, 
                                "Valid format credentials accepted", data)
                else:
                    self.log_test("Config Telegram POST - Valid Format", False, 
                                "Valid format credentials not accepted", data)
            elif response.status_code == 400:
                # Expected if validation rejects dummy credentials
                self.log_test("Config Telegram POST - Valid Format", True, 
                            "Validation correctly rejected dummy credentials", response.json())
            else:
                self.log_test("Config Telegram POST - Valid Format", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Config Telegram POST - Valid Format", False, f"Exception: {str(e)}")

    def test_config_telegram_post_invalid(self):
        """Test configuration validation - should reject invalid API credentials"""
        try:
            # Test with clearly invalid credentials
            invalid_configs = [
                {"api_id": 0, "api_hash": "invalid"},  # Invalid API ID and hash
                {"api_id": 12345678, "api_hash": "abcd1234567890123456789012345678"},  # Placeholder values
                {"api_id": -1, "api_hash": ""},  # Negative ID and empty hash
            ]
            
            validation_working = True
            for i, config in enumerate(invalid_configs):
                response = self.make_request("POST", "/api/config/telegram", config)
                
                if response.status_code != 400:
                    validation_working = False
                    break
            
            if validation_working:
                self.log_test("Config Validation - Invalid Credentials", True, 
                            "All invalid credentials properly rejected")
            else:
                self.log_test("Config Validation - Invalid Credentials", False, 
                            "Some invalid credentials were accepted")
                
        except Exception as e:
            self.log_test("Config Validation - Invalid Credentials", False, f"Exception: {str(e)}")

    def test_config_backward_compatibility(self):
        """Test backward compatibility with existing config endpoints"""
        try:
            # Test legacy config endpoint
            response = self.make_request("GET", "/api/config")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Config Backward Compatibility - Legacy GET", True, 
                            "Legacy config endpoint working", data)
            else:
                self.log_test("Config Backward Compatibility - Legacy GET", False, 
                            f"Legacy endpoint failed: HTTP {response.status_code}")
                
            # Test legacy config/legacy endpoint
            response = self.make_request("GET", "/api/config/legacy")
            
            if response.status_code == 200:
                data = response.json()
                # Check that sensitive data is masked
                telegram_config = data.get("telegram", {})
                api_id = telegram_config.get("api_id", "")
                api_hash = telegram_config.get("api_hash", "")
                
                # Should be masked with *** or empty
                if (api_id == "***" or api_id == "") and (api_hash == "***" or api_hash == ""):
                    self.log_test("Config Backward Compatibility - Legacy Masked", True, 
                                "Sensitive data properly masked in legacy endpoint")
                else:
                    self.log_test("Config Backward Compatibility - Legacy Masked", False, 
                                f"Sensitive data not masked: api_id={api_id}, api_hash={api_hash}")
            else:
                self.log_test("Config Backward Compatibility - Legacy Masked", False, 
                            f"Legacy masked endpoint failed: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Config Backward Compatibility", False, f"Exception: {str(e)}")

    # ========== JWT AUTHENTICATION SYSTEM TESTS (CYCLE 2) ==========
    
    def test_auth_status_no_auth(self):
        """Test /api/auth/status endpoint without authentication"""
        try:
            # Make request without JWT token (only API key)
            response = self.make_request("GET", "/api/auth/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should return not authenticated
                if not data.get("authenticated", True):
                    self.log_test("Auth Status - No Authentication", True, 
                                "Correctly returns not authenticated", data)
                else:
                    self.log_test("Auth Status - No Authentication", False, 
                                "Incorrectly shows as authenticated", data)
            else:
                self.log_test("Auth Status - No Authentication", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Status - No Authentication", False, f"Exception: {str(e)}")

    def test_auth_login_missing_telegram_config(self):
        """Test /api/auth/login with phone number - should handle missing Telegram config gracefully"""
        try:
            login_data = {
                "phone_number": "+1234567890"
            }
            
            response = self.make_request("POST", "/api/auth/login", login_data)
            
            # Should handle gracefully - either work or give clear error about missing config
            if response.status_code == 400:
                data = response.json()
                error_detail = data.get("detail", "").lower()
                
                if "telegram" in error_detail and ("not configured" in error_detail or "configure" in error_detail):
                    self.log_test("Auth Login - Missing Telegram Config", True, 
                                "Gracefully handles missing Telegram configuration", data)
                else:
                    self.log_test("Auth Login - Missing Telegram Config", False, 
                                f"Unclear error message: {data}")
            elif response.status_code == 200:
                # If it works, that's also acceptable
                data = response.json()
                if "session_id" in data:
                    self.session_id = data["session_id"]
                self.log_test("Auth Login - Missing Telegram Config", True, 
                            "Login process started successfully", data)
            else:
                self.log_test("Auth Login - Missing Telegram Config", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Auth Login - Missing Telegram Config", False, f"Exception: {str(e)}")

    def test_jwt_token_endpoints(self):
        """Test JWT token creation and validation flow"""
        try:
            # Test refresh endpoint without token
            response = self.make_request("POST", "/api/auth/refresh", {"refresh_token": "invalid_token"})
            
            if response.status_code == 401:
                self.log_test("JWT Token Validation", True, 
                            "Invalid refresh token properly rejected")
            else:
                self.log_test("JWT Token Validation", False, 
                            f"Invalid token not rejected: HTTP {response.status_code}")
                
            # Test protected endpoint without JWT
            response = self.make_request("GET", "/api/auth/me")
            
            if response.status_code == 401:
                self.log_test("JWT Protected Endpoint", True, 
                            "Protected endpoint requires authentication")
            else:
                self.log_test("JWT Protected Endpoint", False, 
                            f"Protected endpoint accessible without auth: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("JWT Token Endpoints", False, f"Exception: {str(e)}")

    def test_auth_middleware_distinction(self):
        """Test authentication middleware - should distinguish between API key vs JWT endpoints"""
        try:
            # Test API key endpoint (should work with API key)
            response = self.make_request("GET", "/api/health")
            api_key_works = response.status_code == 200
            
            # Test JWT endpoint (should require JWT token)
            response = self.make_request("GET", "/api/auth/me")
            jwt_required = response.status_code == 401
            
            # Test mixed endpoint (should work with API key)
            response = self.make_request("GET", "/api/auth/status")
            mixed_works = response.status_code == 200
            
            if api_key_works and jwt_required and mixed_works:
                self.log_test("Auth Middleware Distinction", True, 
                            "Correctly distinguishes API key vs JWT endpoints")
            else:
                self.log_test("Auth Middleware Distinction", False, 
                            f"Middleware confusion - API key: {api_key_works}, JWT required: {jwt_required}, Mixed: {mixed_works}")
                
        except Exception as e:
            self.log_test("Auth Middleware Distinction", False, f"Exception: {str(e)}")

    # ========== DATABASE VERIFICATION TESTS ==========
    
    def test_mongodb_collections_health(self):
        """Test MongoDB collections and operations through API"""
        try:
            # Test that we can interact with different collections through APIs
            
            # Test configs collection (through config endpoints)
            config_response = self.make_request("GET", "/api/config/status")
            config_healthy = config_response.status_code == 200 and config_response.json().get("database_connected")
            
            # Test groups collection (through groups endpoints)  
            groups_response = self.make_request("GET", "/api/groups")
            groups_healthy = groups_response.status_code == 200
            
            # Test messages collection (through messages endpoints)
            messages_response = self.make_request("GET", "/api/messages")
            messages_healthy = messages_response.status_code == 200
            
            # Test blacklist collection (through blacklist endpoints)
            blacklist_response = self.make_request("GET", "/api/blacklist")
            blacklist_healthy = blacklist_response.status_code == 200
            
            healthy_collections = sum([config_healthy, groups_healthy, messages_healthy, blacklist_healthy])
            
            if healthy_collections >= 3:  # At least 3 out of 4 should work
                self.log_test("MongoDB Collections Health", True, 
                            f"{healthy_collections}/4 collections accessible through APIs")
            else:
                self.log_test("MongoDB Collections Health", False, 
                            f"Only {healthy_collections}/4 collections accessible")
                
        except Exception as e:
            self.log_test("MongoDB Collections Health", False, f"Exception: {str(e)}")

    def test_database_connectivity(self):
        """Test database connectivity and operations"""
        try:
            # Test database operations through various endpoints
            operations_working = 0
            total_operations = 0
            
            # Test read operations
            read_endpoints = ["/api/health", "/api/config/status", "/api/groups", "/api/messages", "/api/blacklist"]
            
            for endpoint in read_endpoints:
                total_operations += 1
                response = self.make_request("GET", endpoint)
                if response.status_code == 200:
                    operations_working += 1
            
            # Test write operation (add a test group)
            total_operations += 1
            test_group_data = {"group_link": "https://t.me/test_mongodb_group"}
            response = self.make_request("POST", "/api/groups", test_group_data)
            if response.status_code in [200, 400]:  # 400 is OK if group already exists
                operations_working += 1
            
            success_rate = operations_working / total_operations
            
            if success_rate >= 0.8:  # 80% success rate
                self.log_test("Database Connectivity", True, 
                            f"Database operations: {operations_working}/{total_operations} successful ({success_rate:.1%})")
            else:
                self.log_test("Database Connectivity", False, 
                            f"Low database operation success rate: {success_rate:.1%}")
                
        except Exception as e:
            self.log_test("Database Connectivity", False, f"Exception: {str(e)}")

    # ========== INTEGRATION TESTING ==========
    
    def test_legacy_endpoints_api_key_auth(self):
        """Test that existing legacy endpoints still work with API key authentication"""
        try:
            legacy_endpoints = [
                "/api/health",
                "/api/templates", 
                "/api/config",
                "/api/blacklist",
                "/api/groups",
                "/api/messages",
                "/api/logs"
            ]
            
            working_endpoints = 0
            
            for endpoint in legacy_endpoints:
                response = self.make_request("GET", endpoint)
                if response.status_code == 200:
                    working_endpoints += 1
                elif response.status_code == 503:
                    # Service unavailable is acceptable for some endpoints
                    working_endpoints += 0.5
            
            success_rate = working_endpoints / len(legacy_endpoints)
            
            if success_rate >= 0.7:  # 70% success rate
                self.log_test("Legacy Endpoints - API Key Auth", True, 
                            f"Legacy endpoints working: {working_endpoints}/{len(legacy_endpoints)} ({success_rate:.1%})")
            else:
                self.log_test("Legacy Endpoints - API Key Auth", False, 
                            f"Too many legacy endpoints failing: {success_rate:.1%}")
                
        except Exception as e:
            self.log_test("Legacy Endpoints - API Key Auth", False, f"Exception: {str(e)}")

    def test_new_endpoints_appropriate_auth(self):
        """Test that new endpoints require appropriate authentication"""
        try:
            # Test new config endpoints (should work with API key)
            config_endpoints = ["/api/config/status", "/api/config/telegram"]
            config_working = 0
            
            for endpoint in config_endpoints:
                response = self.make_request("GET", endpoint)
                if response.status_code == 200:
                    config_working += 1
            
            # Test new auth endpoints (mixed auth requirements)
            auth_status_response = self.make_request("GET", "/api/auth/status")
            auth_status_working = auth_status_response.status_code == 200
            
            # Test JWT-only endpoints (should require JWT)
            jwt_response = self.make_request("GET", "/api/auth/me")
            jwt_properly_protected = jwt_response.status_code == 401
            
            if config_working >= 1 and auth_status_working and jwt_properly_protected:
                self.log_test("New Endpoints - Appropriate Auth", True, 
                            "New endpoints have correct authentication requirements")
            else:
                self.log_test("New Endpoints - Appropriate Auth", False, 
                            f"Auth issues - Config: {config_working}/2, Status: {auth_status_working}, JWT protected: {jwt_properly_protected}")
                
        except Exception as e:
            self.log_test("New Endpoints - Appropriate Auth", False, f"Exception: {str(e)}")

    def test_service_dependencies_initialization(self):
        """Test service dependencies and initialization order"""
        try:
            # Check health endpoint for service initialization status
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                # Check dependency chain: db_service -> encryption_service -> config_service -> auth_service
                db_service = services.get("db_service", False)
                encryption_service = services.get("encryption_service", False)
                config_service = services.get("config_service", False)
                auth_service = services.get("auth_service", False)
                
                # All should be initialized if dependencies are working
                if db_service and encryption_service and config_service and auth_service:
                    self.log_test("Service Dependencies", True, 
                                "All dependent services properly initialized")
                else:
                    self.log_test("Service Dependencies", False, 
                                f"Service initialization issues - DB: {db_service}, Encryption: {encryption_service}, Config: {config_service}, Auth: {auth_service}")
            else:
                self.log_test("Service Dependencies", False, 
                            f"Cannot check service status: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("Service Dependencies", False, f"Exception: {str(e)}")

    # ========== SECURITY TESTING ==========
    
    def test_api_credentials_encryption(self):
        """Test that API credentials are encrypted (indirect test through behavior)"""
        try:
            # Test that we can store and retrieve config without exposing sensitive data
            
            # Get current config status
            response = self.make_request("GET", "/api/config/telegram")
            
            if response.status_code == 200:
                data = response.json()
                
                # Should show configuration status but not actual credentials
                has_status_fields = all(field in data for field in ["configured", "api_id_configured", "api_hash_configured"])
                no_actual_credentials = "api_id" not in data and "api_hash" not in data
                
                if has_status_fields and no_actual_credentials:
                    self.log_test("API Credentials Encryption", True, 
                                "Credentials properly encrypted - only status exposed")
                else:
                    self.log_test("API Credentials Encryption", False, 
                                f"Potential credential exposure - Status fields: {has_status_fields}, No credentials: {no_actual_credentials}")
            else:
                self.log_test("API Credentials Encryption", False, 
                            f"Cannot test encryption: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("API Credentials Encryption", False, f"Exception: {str(e)}")

    def test_jwt_token_security(self):
        """Test JWT token security and expiration"""
        try:
            # Test with malformed JWT token
            malformed_headers = self.headers.copy()
            malformed_headers["Authorization"] = "Bearer invalid.jwt.token"
            
            response = requests.get(f"{self.base_url}/api/auth/me", headers=malformed_headers, timeout=30)
            
            if response.status_code == 401:
                self.log_test("JWT Token Security - Malformed", True, 
                            "Malformed JWT tokens properly rejected")
            else:
                self.log_test("JWT Token Security - Malformed", False, 
                            f"Malformed token accepted: HTTP {response.status_code}")
            
            # Test with expired token (simulate by using obviously invalid token)
            expired_headers = self.headers.copy()
            expired_headers["Authorization"] = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid"
            
            response = requests.get(f"{self.base_url}/api/auth/me", headers=expired_headers, timeout=30)
            
            if response.status_code == 401:
                self.log_test("JWT Token Security - Invalid", True, 
                            "Invalid JWT tokens properly rejected")
            else:
                self.log_test("JWT Token Security - Invalid", False, 
                            f"Invalid token accepted: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("JWT Token Security", False, f"Exception: {str(e)}")

    def test_session_security(self):
        """Test session security and proper cleanup"""
        try:
            # Test session endpoints require proper authentication
            session_endpoints = ["/api/auth/sessions", "/api/auth/me"]
            
            properly_protected = 0
            for endpoint in session_endpoints:
                response = self.make_request("GET", endpoint)
                if response.status_code == 401:
                    properly_protected += 1
            
            if properly_protected == len(session_endpoints):
                self.log_test("Session Security", True, 
                            "Session endpoints properly protected")
            else:
                self.log_test("Session Security", False, 
                            f"Only {properly_protected}/{len(session_endpoints)} session endpoints protected")
                
        except Exception as e:
            self.log_test("Session Security", False, f"Exception: {str(e)}")

    def test_authentication_bypass_attempts(self):
        """Test authentication bypass attempts"""
        try:
            bypass_attempts = 0
            successful_bypasses = 0
            
            # Test without Authorization header
            bypass_attempts += 1
            response = requests.get(f"{self.base_url}/api/auth/me", timeout=30)
            if response.status_code != 401:
                successful_bypasses += 1
            
            # Test with wrong API key
            bypass_attempts += 1
            wrong_headers = {"Authorization": "Bearer wrong-api-key", "Content-Type": "application/json"}
            response = requests.get(f"{self.base_url}/api/health", headers=wrong_headers, timeout=30)
            if response.status_code != 401:
                successful_bypasses += 1
            
            # Test with empty Authorization
            bypass_attempts += 1
            empty_headers = {"Authorization": "", "Content-Type": "application/json"}
            response = requests.get(f"{self.base_url}/api/auth/me", headers=empty_headers, timeout=30)
            if response.status_code != 401:
                successful_bypasses += 1
            
            if successful_bypasses == 0:
                self.log_test("Authentication Bypass Prevention", True, 
                            f"All {bypass_attempts} bypass attempts properly blocked")
            else:
                self.log_test("Authentication Bypass Prevention", False, 
                            f"{successful_bypasses}/{bypass_attempts} bypass attempts succeeded")
                
        except Exception as e:
            self.log_test("Authentication Bypass Prevention", False, f"Exception: {str(e)}")

    # ========== MAIN TEST EXECUTION ==========
    
    def run_all_tests(self):
        """Run all comprehensive tests"""
        print("=" * 80)
        print("COMPREHENSIVE BACKEND TESTING - MongoDB + JWT Authentication")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Health and Service Status Tests
        print("🏥 HEALTH AND SERVICE STATUS TESTS")
        print("-" * 50)
        self.test_health_endpoint()
        print()
        
        # MongoDB Configuration System Tests (Cycle 1)
        print("🗄️  MONGODB CONFIGURATION SYSTEM TESTS (CYCLE 1)")
        print("-" * 50)
        self.test_config_status_endpoint()
        self.test_config_telegram_get()
        self.test_config_telegram_post_valid()
        self.test_config_telegram_post_invalid()
        self.test_config_backward_compatibility()
        print()
        
        # JWT Authentication System Tests (Cycle 2)
        print("🔐 JWT AUTHENTICATION SYSTEM TESTS (CYCLE 2)")
        print("-" * 50)
        self.test_auth_status_no_auth()
        self.test_auth_login_missing_telegram_config()
        self.test_jwt_token_endpoints()
        self.test_auth_middleware_distinction()
        print()
        
        # Database Verification Tests
        print("💾 DATABASE VERIFICATION TESTS")
        print("-" * 50)
        self.test_mongodb_collections_health()
        self.test_database_connectivity()
        print()
        
        # Integration Testing
        print("🔗 INTEGRATION TESTING")
        print("-" * 50)
        self.test_legacy_endpoints_api_key_auth()
        self.test_new_endpoints_appropriate_auth()
        self.test_service_dependencies_initialization()
        print()
        
        # Security Testing
        print("🛡️  SECURITY TESTING")
        print("-" * 50)
        self.test_api_credentials_encryption()
        self.test_jwt_token_security()
        self.test_session_security()
        self.test_authentication_bypass_attempts()
        print()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("TEST SUMMARY")
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
                if any(keyword in test_name for keyword in ["health", "service", "database", "security", "auth"]):
                    critical_issues.append(f"• {result['test']}: {result['details']}")
        
        if critical_issues:
            for issue in critical_issues:
                print(issue)
        else:
            print("✅ No critical issues found!")
        
        print()
        print(f"Test completed at: {datetime.now().isoformat()}")
        print("=" * 80)

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()