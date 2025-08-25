#!/usr/bin/env python3
"""
Comprehensive Testing for Telegram Login Widget Backend Implementation
Focus: Testing new /api/auth/telegram-login endpoint and hash verification
"""

import requests
import json
import time
import hmac
import hashlib
from datetime import datetime
from typing import Dict, Any

# Configuration
BACKEND_URL = "https://tgpro-login.preview.emergentagent.com/api"
API_KEY = "telegram-automation-key-2025"
BOT_TOKEN = "7400143812:AAHVS-Wr40Y4GgtgfymzBmVUvUiBazMbozI"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

class TelegramLoginTester:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def generate_telegram_login_data(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate valid Telegram Login Widget data with proper hash"""
        # Create data string for hash calculation
        data_check_arr = []
        for key, value in sorted(user_data.items()):
            if value is not None:
                data_check_arr.append(f"{key}={value}")
        
        data_check_string = "\n".join(data_check_arr)
        
        # Calculate hash using bot token
        secret_key = hashlib.sha256(BOT_TOKEN.encode()).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        # Add hash to user data
        login_data = user_data.copy()
        login_data["hash"] = calculated_hash
        
        return login_data
    
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, description=""):
        """Test a single API endpoint"""
        url = f"{BACKEND_URL}{endpoint}"
        self.log(f"Testing {method} {endpoint} - {description}")
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=HEADERS, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=HEADERS, json=data, timeout=10)
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
                
                # Log response for successful tests
                try:
                    response_data = response.json()
                    self.log(f"Response: {json.dumps(response_data, indent=2)[:300]}...")
                except:
                    self.log(f"Response: {response.text[:200]}...")
                    
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
    
    def test_health_check(self):
        """Test health check to ensure all services are running"""
        self.log("=== TESTING HEALTH CHECK AFTER TELEGRAM LOGIN IMPLEMENTATION ===", "INFO")
        
        response = self.test_endpoint("GET", "/health", description="Health check - all services running after Telegram Login implementation")
        
        if response and response.status_code == 200:
            try:
                health_data = response.json()
                services = health_data.get("services", {})
                self.log(f"Services status: {json.dumps(services, indent=2)}")
                
                # Check specific services
                critical_services = ["telegram_service", "db_service", "encryption_service", "config_service", "auth_service"]
                for service in critical_services:
                    if services.get(service):
                        self.log(f"✅ {service}: Operational")
                    else:
                        self.log(f"❌ {service}: Not operational")
                        
            except Exception as e:
                self.log(f"Error parsing health response: {e}")
    
    def test_bot_token_configuration(self):
        """Test that bot token is properly loaded and accessible"""
        self.log("=== TESTING BOT TOKEN CONFIGURATION ===", "INFO")
        
        # Test with invalid login data to check if bot token is loaded
        invalid_data = {
            "id": 123456789,
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "auth_date": int(time.time()),
            "hash": "invalid_hash_to_test_verification"
        }
        
        response = self.test_endpoint("POST", "/auth/telegram-login", data=invalid_data, 
                                    expected_status=400, 
                                    description="Test bot token loading (should fail with invalid hash)")
        
        if response and response.status_code == 400:
            try:
                error_data = response.json()
                if "Invalid Telegram authentication data" in error_data.get("detail", ""):
                    self.log("✅ Bot token is properly loaded and hash verification is working")
                else:
                    self.log(f"❌ Unexpected error message: {error_data.get('detail')}")
            except:
                pass
    
    def test_telegram_login_endpoint_valid_data(self):
        """Test /api/auth/telegram-login with valid Telegram Login Widget data"""
        self.log("=== TESTING TELEGRAM LOGIN ENDPOINT - VALID DATA ===", "INFO")
        
        # Create valid test user data
        user_data = {
            "id": 987654321,
            "first_name": "John",
            "last_name": "Doe", 
            "username": "johndoe",
            "photo_url": "https://t.me/i/userpic/320/johndoe.jpg",
            "auth_date": int(time.time())
        }
        
        # Generate valid login data with proper hash
        login_data = self.generate_telegram_login_data(user_data)
        
        response = self.test_endpoint("POST", "/auth/telegram-login", data=login_data,
                                    expected_status=200,
                                    description="Telegram Login with valid hash verification")
        
        if response and response.status_code == 200:
            try:
                response_data = response.json()
                if response_data.get("success") and "Welcome" in response_data.get("message", ""):
                    self.log("✅ Telegram Login successful with proper user data returned")
                    user_info = response_data.get("user", {})
                    self.log(f"User info: ID={user_info.get('id')}, Name={user_info.get('first_name')} {user_info.get('last_name')}")
                else:
                    self.log(f"❌ Unexpected response format: {response_data}")
            except Exception as e:
                self.log(f"❌ Error parsing response: {e}")
    
    def test_telegram_login_endpoint_invalid_hash(self):
        """Test /api/auth/telegram-login with invalid hash"""
        self.log("=== TESTING TELEGRAM LOGIN ENDPOINT - INVALID HASH ===", "INFO")
        
        # Create test data with invalid hash
        invalid_login_data = {
            "id": 123456789,
            "first_name": "Test",
            "last_name": "User",
            "username": "testuser",
            "auth_date": int(time.time()),
            "hash": "definitely_invalid_hash_12345"
        }
        
        self.test_endpoint("POST", "/auth/telegram-login", data=invalid_login_data,
                          expected_status=400,
                          description="Telegram Login with invalid hash (should be rejected)")
    
    def test_telegram_login_endpoint_missing_fields(self):
        """Test /api/auth/telegram-login with missing required fields"""
        self.log("=== TESTING TELEGRAM LOGIN ENDPOINT - MISSING FIELDS ===", "INFO")
        
        # Test with missing required fields
        incomplete_data = {
            "first_name": "Test",
            "auth_date": int(time.time()),
            "hash": "some_hash"
            # Missing required 'id' field
        }
        
        self.test_endpoint("POST", "/auth/telegram-login", data=incomplete_data,
                          expected_status=422,
                          description="Telegram Login with missing required fields (should fail validation)")
    
    def test_hash_verification_algorithm(self):
        """Test the HMAC-SHA256 hash verification algorithm implementation"""
        self.log("=== TESTING HASH VERIFICATION ALGORITHM ===", "INFO")
        
        # Test multiple scenarios with different data combinations
        test_cases = [
            {
                "name": "Basic user data",
                "data": {
                    "id": 111111111,
                    "first_name": "Alice",
                    "auth_date": 1640995200  # Fixed timestamp for consistent testing
                }
            },
            {
                "name": "Full user data with optional fields",
                "data": {
                    "id": 222222222,
                    "first_name": "Bob",
                    "last_name": "Smith",
                    "username": "bobsmith",
                    "photo_url": "https://t.me/i/userpic/320/bobsmith.jpg",
                    "auth_date": 1640995200
                }
            },
            {
                "name": "User data with None values (should be excluded)",
                "data": {
                    "id": 333333333,
                    "first_name": "Charlie",
                    "last_name": None,  # Should be excluded from hash calculation
                    "username": "charlie",
                    "photo_url": None,  # Should be excluded from hash calculation
                    "auth_date": 1640995200
                }
            }
        ]
        
        for test_case in test_cases:
            self.log(f"Testing hash verification: {test_case['name']}")
            
            # Generate valid login data
            login_data = self.generate_telegram_login_data(test_case["data"])
            
            response = self.test_endpoint("POST", "/auth/telegram-login", data=login_data,
                                        expected_status=200,
                                        description=f"Hash verification - {test_case['name']}")
    
    def test_authentication_flow_integration(self):
        """Test integration with existing authentication endpoints"""
        self.log("=== TESTING AUTHENTICATION FLOW INTEGRATION ===", "INFO")
        
        # Test that existing configuration endpoints still work
        self.test_endpoint("GET", "/auth/configuration", 
                          description="Configuration endpoint compatibility after Telegram Login implementation")
        
        # Test configure endpoint
        config_data = {
            "api_id": "12345678",
            "api_hash": "abcd1234efgh5678ijkl9012mnop3456"
        }
        self.test_endpoint("POST", "/auth/configure", data=config_data,
                          description="Configure API credentials compatibility")
    
    def test_core_functionality_preservation(self):
        """Test that core API functionality is preserved after Telegram Login implementation"""
        self.log("=== TESTING CORE FUNCTIONALITY PRESERVATION ===", "INFO")
        
        # Test groups endpoint
        self.test_endpoint("GET", "/groups", description="Groups management endpoint")
        
        # Test messages endpoint  
        self.test_endpoint("GET", "/messages", description="Messages management endpoint")
        
        # Test templates endpoint
        self.test_endpoint("GET", "/templates", description="Templates management endpoint")
        
        # Test blacklist endpoint
        self.test_endpoint("GET", "/blacklist", description="Blacklist management endpoint")
        
        # Test config endpoint
        self.test_endpoint("GET", "/config", description="Configuration endpoint")
        
        # Test logs endpoint
        self.test_endpoint("GET", "/logs?lines=10", description="Logs endpoint")
    
    def run_all_tests(self):
        """Run all Telegram Login Widget tests"""
        self.log("🚀 STARTING TELEGRAM LOGIN WIDGET BACKEND TESTING", "INFO")
        self.log(f"Backend URL: {BACKEND_URL}", "INFO")
        self.log(f"Bot Token: {BOT_TOKEN[:20]}...", "INFO")
        self.log("=" * 80, "INFO")
        
        start_time = time.time()
        
        # Run all test suites in order of priority
        self.test_health_check()
        self.test_bot_token_configuration()
        self.test_telegram_login_endpoint_valid_data()
        self.test_telegram_login_endpoint_invalid_hash()
        self.test_telegram_login_endpoint_missing_fields()
        self.test_hash_verification_algorithm()
        self.test_authentication_flow_integration()
        self.test_core_functionality_preservation()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        self.log("=" * 80, "INFO")
        self.log("🏁 TELEGRAM LOGIN WIDGET TESTING COMPLETED", "INFO")
        self.log(f"Total Tests: {self.passed + self.failed}", "INFO")
        self.log(f"✅ Passed: {self.passed}", "SUCCESS")
        self.log(f"❌ Failed: {self.failed}", "ERROR")
        
        if self.passed + self.failed > 0:
            success_rate = (self.passed / (self.passed + self.failed) * 100)
            self.log(f"Success Rate: {success_rate:.1f}%", "INFO")
        
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
    tester = TelegramLoginTester()
    results = tester.run_all_tests()
    
    # Print detailed results
    print("\n" + "=" * 80)
    print("DETAILED TEST RESULTS:")
    print("=" * 80)
    
    for result in results["results"]:
        status_icon = "✅" if result["status"] == "PASS" else "❌"
        print(f"{status_icon} {result['method']} {result['endpoint']} - {result['description']}")
        if result["status"] == "FAIL" and "error" in result:
            print(f"   Error: {result['error']}")
    
    print(f"\nFinal Result: {results['passed']}/{results['total_tests']} tests passed ({results['success_rate']:.1f}%)")