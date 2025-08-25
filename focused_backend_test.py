#!/usr/bin/env python3
"""
Focused Backend API Testing for TGPro UI Integration
Testing the specific endpoints mentioned in the review request
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://tgpro-login.preview.emergentagent.com/api"
API_KEY = "telegram-automation-key-2025"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

class FocusedTester:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, method, endpoint, description=""):
        """Test a single API endpoint"""
        url = f"{BACKEND_URL}{endpoint}"
        self.log(f"Testing {method} {endpoint} - {description}")
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=HEADERS, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            # Check if endpoint is accessible and returns valid JSON
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.log(f"✅ PASS: {description} (Status: {response.status_code})", "SUCCESS")
                    self.log(f"Response preview: {str(data)[:100]}...", "INFO")
                    self.passed += 1
                    return True
                except json.JSONDecodeError:
                    self.log(f"❌ FAIL: {description} - Invalid JSON response", "ERROR")
                    self.failed += 1
                    return False
            else:
                self.log(f"❌ FAIL: {description} (Status: {response.status_code})", "ERROR")
                self.log(f"Response: {response.text[:200]}...", "ERROR")
                self.failed += 1
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ FAIL: {description} - Connection Error: {str(e)}", "ERROR")
            self.failed += 1
            return False
            
    def test_key_endpoints(self):
        """Test the key endpoints mentioned in the review request"""
        self.log("🎯 TESTING KEY ENDPOINTS FOR UI INTEGRATION", "INFO")
        self.log("=" * 80, "INFO")
        
        # Key endpoints from the review request
        key_endpoints = [
            ("/health", "Health check endpoint to verify all services are running"),
            ("/groups", "GET /api/groups (for GroupsManager)"),
            ("/messages", "GET /api/messages (for MessagesManager)"),
            ("/templates", "GET /api/templates (for TemplateManager)"),
            ("/blacklist", "GET /api/blacklist (for BlacklistManager)"),
            ("/config", "GET /api/config (for ConfigManager)"),
            ("/logs", "GET /api/logs (for LogViewer)"),
            ("/auth/configuration", "GET /api/auth/configuration (for auth configuration)")
        ]
        
        for endpoint, description in key_endpoints:
            self.test_endpoint("GET", endpoint, description)
            
        # Special test for auth/status (expected to fail without JWT token)
        self.log("Testing GET /auth/status - Authentication status (expected to require JWT)", "INFO")
        try:
            response = requests.get(f"{BACKEND_URL}/auth/status", headers=HEADERS, timeout=10)
            if response.status_code == 401:
                self.log("✅ PASS: Authentication status properly requires JWT token (Status: 401)", "SUCCESS")
                self.passed += 1
            else:
                self.log(f"❌ FAIL: Authentication status should require JWT token (Status: {response.status_code})", "ERROR")
                self.failed += 1
        except Exception as e:
            self.log(f"❌ FAIL: Error testing auth status: {str(e)}", "ERROR")
            self.failed += 1
            
    def run_focused_tests(self):
        """Run focused tests for UI integration"""
        start_time = time.time()
        
        self.test_key_endpoints()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        self.log("=" * 80, "INFO")
        self.log("🏁 FOCUSED TESTING COMPLETED", "INFO")
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
            "duration": duration
        }

if __name__ == "__main__":
    tester = FocusedTester()
    results = tester.run_focused_tests()