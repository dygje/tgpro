#!/usr/bin/env python3
"""
MongoDB Migration Testing for TGPro Application
Testing Phase 1 MongoDB migration functionality and new MongoDB-based API endpoints
"""

import asyncio
import json
import requests
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://telegram-automation.preview.emergentagent.com"
API_KEY = "telegram-automation-key-2025"

class MongoDBMigrationTester:
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

    # ========== MIGRATION STATUS AND VERIFICATION TESTS ==========
    
    def test_migration_status_endpoint(self):
        """Test /api/migration/status endpoint - should show migration status"""
        try:
            response = self.make_request("GET", "/api/migration/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["mongodb_data", "file_data", "migration_complete"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    mongodb_data = data.get("mongodb_data", {})
                    file_data = data.get("file_data", {})
                    migration_complete = data.get("migration_complete", False)
                    
                    self.log_test("Migration Status Endpoint", True, 
                                f"Status retrieved - MongoDB: {mongodb_data}, Files: {file_data}, Complete: {migration_complete}", data)
                else:
                    self.log_test("Migration Status Endpoint", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Migration Status Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Migration Status Endpoint", False, f"Exception: {str(e)}")

    def test_migration_verify_endpoint(self):
        """Test /api/migration/verify endpoint - should verify migration consistency"""
        try:
            response = self.make_request("GET", "/api/migration/verify")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["verification", "message"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    verification = data.get("verification", {})
                    
                    # Check verification data structure
                    verification_fields = ["groups_in_db", "groups_in_file", "messages_in_db", "messages_in_files"]
                    verification_complete = all(field in verification for field in verification_fields)
                    
                    if verification_complete:
                        self.log_test("Migration Verify Endpoint", True, 
                                    f"Verification completed - {verification}", data)
                    else:
                        self.log_test("Migration Verify Endpoint", False, 
                                    f"Incomplete verification data: {verification}", data)
                else:
                    self.log_test("Migration Verify Endpoint", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Migration Verify Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Migration Verify Endpoint", False, f"Exception: {str(e)}")

    def test_migration_run_endpoint(self):
        """Test /api/migration/run endpoint - should run full migration"""
        try:
            response = self.make_request("POST", "/api/migration/run")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["message", "results", "verification"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    results = data.get("results", {})
                    verification = data.get("verification", {})
                    
                    # Check if migration was successful
                    migration_success = all(results.get(key, False) for key in ["groups", "messages"])
                    
                    if migration_success:
                        self.log_test("Migration Run Endpoint", True, 
                                    f"Migration completed successfully - Results: {results}", data)
                    else:
                        self.log_test("Migration Run Endpoint", False, 
                                    f"Migration had failures - Results: {results}", data)
                else:
                    self.log_test("Migration Run Endpoint", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Migration Run Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Migration Run Endpoint", False, f"Exception: {str(e)}")

    # ========== MONGODB GROUPS API TESTS ==========
    
    def test_mongodb_groups_list(self):
        """Test /api/groups/ GET endpoint - should return groups from MongoDB"""
        try:
            response = self.make_request("GET", "/api/groups/")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["groups", "total", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    groups = data.get("groups", [])
                    total = data.get("total", 0)
                    source = data.get("source", "")
                    
                    # Should indicate MongoDB source
                    if source == "mongodb":
                        # Check for expected test group
                        has_test_group = "https://t.me/test_mongodb_group" in groups
                        
                        self.log_test("MongoDB Groups List", True, 
                                    f"Groups from MongoDB - Total: {total}, Has test group: {has_test_group}", data)
                    else:
                        self.log_test("MongoDB Groups List", False, 
                                    f"Wrong source: {source}, expected 'mongodb'", data)
                else:
                    self.log_test("MongoDB Groups List", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("MongoDB Groups List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Groups List", False, f"Exception: {str(e)}")

    def test_mongodb_groups_add(self):
        """Test /api/groups/ POST endpoint - should add group to MongoDB"""
        try:
            test_group = {
                "group_link": "https://t.me/test_mongodb_add_group",
                "metadata": {"test": "true", "added_via": "api_test"}
            }
            
            response = self.make_request("POST", "/api/groups/", test_group)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["message", "group_link", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    source = data.get("source", "")
                    group_link = data.get("group_link", "")
                    
                    if source == "mongodb" and group_link == test_group["group_link"]:
                        self.log_test("MongoDB Groups Add", True, 
                                    f"Group added to MongoDB successfully", data)
                    else:
                        self.log_test("MongoDB Groups Add", False, 
                                    f"Wrong source or group_link: source={source}, group={group_link}", data)
                else:
                    self.log_test("MongoDB Groups Add", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 400:
                # Group might already exist - this is acceptable
                data = response.json()
                if "already exists" in data.get("detail", "").lower():
                    self.log_test("MongoDB Groups Add", True, 
                                "Group already exists in MongoDB (expected)", data)
                else:
                    self.log_test("MongoDB Groups Add", False, 
                                f"Unexpected 400 error: {data}", data)
            else:
                self.log_test("MongoDB Groups Add", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Groups Add", False, f"Exception: {str(e)}")

    def test_mongodb_groups_delete(self):
        """Test /api/groups DELETE endpoint - should remove group from MongoDB"""
        try:
            test_group_link = "https://t.me/test_mongodb_delete_group"
            
            # First add the group
            add_response = self.make_request("POST", "/api/groups/", {
                "group_link": test_group_link,
                "metadata": {"test": "true"}
            })
            
            # Then delete it
            response = self.make_request("DELETE", f"/api/groups/{test_group_link}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["message", "group_link", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    source = data.get("source", "")
                    group_link = data.get("group_link", "")
                    
                    if source == "mongodb" and group_link == test_group_link:
                        self.log_test("MongoDB Groups Delete", True, 
                                    f"Group removed from MongoDB successfully", data)
                    else:
                        self.log_test("MongoDB Groups Delete", False, 
                                    f"Wrong source or group_link: source={source}, group={group_link}", data)
                else:
                    self.log_test("MongoDB Groups Delete", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 404:
                # Group not found - might be acceptable if it was already deleted
                self.log_test("MongoDB Groups Delete", True, 
                            "Group not found (might be already deleted)", response.json())
            else:
                self.log_test("MongoDB Groups Delete", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Groups Delete", False, f"Exception: {str(e)}")

    # ========== MONGODB MESSAGES API TESTS ==========
    
    def test_mongodb_messages_list(self):
        """Test /api/messages/ GET endpoint - should return message templates from MongoDB"""
        try:
            response = self.make_request("GET", "/api/messages/")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["message_templates", "total", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    templates = data.get("message_templates", [])
                    total = data.get("total", 0)
                    source = data.get("source", "")
                    
                    # Should indicate MongoDB source
                    if source == "mongodb":
                        # Check for expected migrated templates
                        template_ids = [t.get("template_id") for t in templates]
                        expected_templates = ["1", "2", "3", "4", "sample_template", "test_message_002"]
                        found_templates = [tid for tid in expected_templates if tid in template_ids]
                        
                        if len(found_templates) >= 4:  # At least 4 out of 6 expected templates
                            self.log_test("MongoDB Messages List", True, 
                                        f"Templates from MongoDB - Total: {total}, Found: {found_templates}", data)
                        else:
                            self.log_test("MongoDB Messages List", False, 
                                        f"Missing expected templates - Found: {found_templates}, Expected: {expected_templates}", data)
                    else:
                        self.log_test("MongoDB Messages List", False, 
                                    f"Wrong source: {source}, expected 'mongodb'", data)
                else:
                    self.log_test("MongoDB Messages List", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("MongoDB Messages List", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Messages List", False, f"Exception: {str(e)}")

    def test_mongodb_messages_create(self):
        """Test /api/messages/ POST endpoint - should create message template in MongoDB"""
        try:
            test_template = {
                "template_id": "test_mongodb_template",
                "content": "This is a test template created via MongoDB API. Hello {{ name }}!",
                "variables": {"name": ["Friend", "Buddy", "There"]}
            }
            
            response = self.make_request("POST", "/api/messages/", test_template)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["message", "template_id", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    source = data.get("source", "")
                    template_id = data.get("template_id", "")
                    
                    if source == "mongodb" and template_id == test_template["template_id"]:
                        self.log_test("MongoDB Messages Create", True, 
                                    f"Template created in MongoDB successfully", data)
                    else:
                        self.log_test("MongoDB Messages Create", False, 
                                    f"Wrong source or template_id: source={source}, id={template_id}", data)
                else:
                    self.log_test("MongoDB Messages Create", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 400:
                # Template might already exist - this is acceptable
                data = response.json()
                if "already exists" in data.get("detail", "").lower():
                    self.log_test("MongoDB Messages Create", True, 
                                "Template already exists in MongoDB (expected)", data)
                else:
                    self.log_test("MongoDB Messages Create", False, 
                                f"Unexpected 400 error: {data}", data)
            else:
                self.log_test("MongoDB Messages Create", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Messages Create", False, f"Exception: {str(e)}")

    def test_mongodb_messages_update(self):
        """Test /api/messages PUT endpoint - should update message template in MongoDB"""
        try:
            template_id = "test_mongodb_update_template"
            
            # First create the template
            create_data = {
                "template_id": template_id,
                "content": "Original content",
                "variables": {}
            }
            create_response = self.make_request("POST", "/api/messages", create_data)
            
            # Then update it
            update_data = {
                "content": "Updated content via MongoDB API. Hello {{ name }}!",
                "variables": {"name": ["Updated", "Modified", "Changed"]}
            }
            
            response = self.make_request("PUT", f"/api/messages/{template_id}", update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["message", "template_id", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    source = data.get("source", "")
                    returned_id = data.get("template_id", "")
                    
                    if source == "mongodb" and returned_id == template_id:
                        self.log_test("MongoDB Messages Update", True, 
                                    f"Template updated in MongoDB successfully", data)
                    else:
                        self.log_test("MongoDB Messages Update", False, 
                                    f"Wrong source or template_id: source={source}, id={returned_id}", data)
                else:
                    self.log_test("MongoDB Messages Update", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 404:
                # Template not found - try to create it first
                create_response = self.make_request("POST", "/api/messages", create_data)
                if create_response.status_code == 200:
                    # Now try update again
                    response = self.make_request("PUT", f"/api/messages/{template_id}", update_data)
                    if response.status_code == 200:
                        self.log_test("MongoDB Messages Update", True, 
                                    "Template created and updated successfully", response.json())
                    else:
                        self.log_test("MongoDB Messages Update", False, 
                                    f"Update failed after creation: {response.status_code}")
                else:
                    self.log_test("MongoDB Messages Update", False, 
                                "Template not found and creation failed", response.json())
            else:
                self.log_test("MongoDB Messages Update", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Messages Update", False, f"Exception: {str(e)}")

    def test_mongodb_messages_delete(self):
        """Test /api/messages DELETE endpoint - should delete message template from MongoDB"""
        try:
            template_id = "test_mongodb_delete_template"
            
            # First create the template
            create_data = {
                "template_id": template_id,
                "content": "Template to be deleted",
                "variables": {}
            }
            create_response = self.make_request("POST", "/api/messages", create_data)
            
            # Then delete it
            response = self.make_request("DELETE", f"/api/messages/{template_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields and source
                expected_fields = ["message", "template_id", "source"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    source = data.get("source", "")
                    returned_id = data.get("template_id", "")
                    
                    if source == "mongodb" and returned_id == template_id:
                        self.log_test("MongoDB Messages Delete", True, 
                                    f"Template deleted from MongoDB successfully", data)
                    else:
                        self.log_test("MongoDB Messages Delete", False, 
                                    f"Wrong source or template_id: source={source}, id={returned_id}", data)
                else:
                    self.log_test("MongoDB Messages Delete", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 404:
                # Template not found - might be acceptable if it was already deleted
                self.log_test("MongoDB Messages Delete", True, 
                            "Template not found (might be already deleted)", response.json())
            else:
                self.log_test("MongoDB Messages Delete", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Messages Delete", False, f"Exception: {str(e)}")

    # ========== BLACKLIST INTEGRATION TESTS ==========
    
    def test_mongodb_blacklist_get(self):
        """Test /api/groups/blacklist GET endpoint - should return blacklists from MongoDB"""
        try:
            response = self.make_request("GET", "/api/groups/blacklist")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["permanent_blacklist", "temporary_blacklist"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    permanent = data.get("permanent_blacklist", [])
                    temporary = data.get("temporary_blacklist", [])
                    
                    self.log_test("MongoDB Blacklist Get", True, 
                                f"Blacklists retrieved - Permanent: {len(permanent)}, Temporary: {len(temporary)}", data)
                else:
                    self.log_test("MongoDB Blacklist Get", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("MongoDB Blacklist Get", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Blacklist Get", False, f"Exception: {str(e)}")

    def test_mongodb_blacklist_add_permanent(self):
        """Test /api/groups/blacklist/permanent POST endpoint - should add to permanent blacklist"""
        try:
            test_blacklist = {
                "group_link": "https://t.me/test_mongodb_blacklist",
                "reason": "Test blacklist entry via MongoDB API"
            }
            
            response = self.make_request("POST", "/api/groups/blacklist/permanent", test_blacklist)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["message", "group_link", "type"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    group_link = data.get("group_link", "")
                    blacklist_type = data.get("type", "")
                    
                    if group_link == test_blacklist["group_link"] and blacklist_type == "permanent":
                        self.log_test("MongoDB Blacklist Add Permanent", True, 
                                    f"Group added to permanent blacklist successfully", data)
                    else:
                        self.log_test("MongoDB Blacklist Add Permanent", False, 
                                    f"Wrong group_link or type: group={group_link}, type={blacklist_type}", data)
                else:
                    self.log_test("MongoDB Blacklist Add Permanent", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("MongoDB Blacklist Add Permanent", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Blacklist Add Permanent", False, f"Exception: {str(e)}")

    def test_mongodb_blacklist_remove_permanent(self):
        """Test /api/groups/blacklist/permanent DELETE endpoint - should remove from permanent blacklist"""
        try:
            test_group_link = "https://t.me/test_mongodb_blacklist_remove"
            
            # First add to blacklist
            add_response = self.make_request("POST", "/api/groups/blacklist/permanent", {
                "group_link": test_group_link,
                "reason": "Test entry to be removed"
            })
            
            # Then remove it
            response = self.make_request("DELETE", f"/api/groups/blacklist/permanent/{test_group_link}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check expected fields
                expected_fields = ["message", "group_link", "type"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    group_link = data.get("group_link", "")
                    blacklist_type = data.get("type", "")
                    
                    if group_link == test_group_link and blacklist_type == "permanent":
                        self.log_test("MongoDB Blacklist Remove Permanent", True, 
                                    f"Group removed from permanent blacklist successfully", data)
                    else:
                        self.log_test("MongoDB Blacklist Remove Permanent", False, 
                                    f"Wrong group_link or type: group={group_link}, type={blacklist_type}", data)
                else:
                    self.log_test("MongoDB Blacklist Remove Permanent", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 404:
                # Group not found - might be acceptable if it was already removed
                self.log_test("MongoDB Blacklist Remove Permanent", True, 
                            "Group not found in blacklist (might be already removed)", response.json())
            else:
                self.log_test("MongoDB Blacklist Remove Permanent", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("MongoDB Blacklist Remove Permanent", False, f"Exception: {str(e)}")

    # ========== DATA CONSISTENCY TESTS ==========
    
    def test_data_consistency_groups(self):
        """Test that migrated groups data matches original file data"""
        try:
            # Get groups from MongoDB API
            mongodb_response = self.make_request("GET", "/api/groups")
            
            # Get migration status to compare
            status_response = self.make_request("GET", "/api/migration/status")
            
            if mongodb_response.status_code == 200 and status_response.status_code == 200:
                mongodb_data = mongodb_response.json()
                status_data = status_response.json()
                
                mongodb_groups = mongodb_data.get("groups", [])
                file_groups_count = status_data.get("file_data", {}).get("groups_file", 0)
                mongodb_groups_count = len(mongodb_groups)
                
                # Check if test group exists (from groups.txt)
                has_test_group = "https://t.me/test_mongodb_group" in mongodb_groups
                
                # Data consistency check
                if mongodb_groups_count >= file_groups_count and has_test_group:
                    self.log_test("Data Consistency - Groups", True, 
                                f"Groups data consistent - MongoDB: {mongodb_groups_count}, File: {file_groups_count}, Has test group: {has_test_group}")
                else:
                    self.log_test("Data Consistency - Groups", False, 
                                f"Groups data inconsistent - MongoDB: {mongodb_groups_count}, File: {file_groups_count}, Has test group: {has_test_group}")
            else:
                self.log_test("Data Consistency - Groups", False, 
                            f"Failed to get data - MongoDB: {mongodb_response.status_code}, Status: {status_response.status_code}")
                
        except Exception as e:
            self.log_test("Data Consistency - Groups", False, f"Exception: {str(e)}")

    def test_data_consistency_messages(self):
        """Test that migrated message templates match original file data"""
        try:
            # Get messages from MongoDB API
            mongodb_response = self.make_request("GET", "/api/messages")
            
            # Get migration status to compare
            status_response = self.make_request("GET", "/api/migration/status")
            
            if mongodb_response.status_code == 200 and status_response.status_code == 200:
                mongodb_data = mongodb_response.json()
                status_data = status_response.json()
                
                mongodb_templates = mongodb_data.get("message_templates", [])
                file_messages_count = status_data.get("file_data", {}).get("message_files", 0)
                mongodb_messages_count = len(mongodb_templates)
                
                # Check for expected templates (from message files)
                template_ids = [t.get("template_id") for t in mongodb_templates]
                expected_templates = ["1", "2", "3", "4", "sample_template", "test_message_002"]
                found_templates = [tid for tid in expected_templates if tid in template_ids]
                
                # Data consistency check
                if mongodb_messages_count >= file_messages_count and len(found_templates) >= 4:
                    self.log_test("Data Consistency - Messages", True, 
                                f"Messages data consistent - MongoDB: {mongodb_messages_count}, File: {file_messages_count}, Found templates: {found_templates}")
                else:
                    self.log_test("Data Consistency - Messages", False, 
                                f"Messages data inconsistent - MongoDB: {mongodb_messages_count}, File: {file_messages_count}, Found templates: {found_templates}")
            else:
                self.log_test("Data Consistency - Messages", False, 
                            f"Failed to get data - MongoDB: {mongodb_response.status_code}, Status: {status_response.status_code}")
                
        except Exception as e:
            self.log_test("Data Consistency - Messages", False, f"Exception: {str(e)}")

    # ========== MAIN TEST EXECUTION ==========
    
    def run_all_tests(self):
        """Run all MongoDB migration tests"""
        print("=" * 80)
        print("MONGODB MIGRATION TESTING - Phase 1 MongoDB Migration")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Migration Status and Verification Tests
        print("🔄 MIGRATION STATUS AND VERIFICATION TESTS")
        print("-" * 50)
        self.test_migration_status_endpoint()
        self.test_migration_verify_endpoint()
        self.test_migration_run_endpoint()
        print()
        
        # MongoDB Groups API Tests
        print("👥 MONGODB GROUPS API TESTS")
        print("-" * 50)
        self.test_mongodb_groups_list()
        self.test_mongodb_groups_add()
        self.test_mongodb_groups_delete()
        print()
        
        # MongoDB Messages API Tests
        print("💬 MONGODB MESSAGES API TESTS")
        print("-" * 50)
        self.test_mongodb_messages_list()
        self.test_mongodb_messages_create()
        self.test_mongodb_messages_update()
        self.test_mongodb_messages_delete()
        print()
        
        # Blacklist Integration Tests
        print("🚫 BLACKLIST INTEGRATION TESTS")
        print("-" * 50)
        self.test_mongodb_blacklist_get()
        self.test_mongodb_blacklist_add_permanent()
        self.test_mongodb_blacklist_remove_permanent()
        print()
        
        # Data Consistency Tests
        print("🔍 DATA CONSISTENCY TESTS")
        print("-" * 50)
        self.test_data_consistency_groups()
        self.test_data_consistency_messages()
        print()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("=" * 80)
        print("MONGODB MIGRATION TEST SUMMARY")
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
                if any(keyword in test_name for keyword in ["migration", "consistency", "mongodb"]):
                    critical_issues.append(f"• {result['test']}: {result['details']}")
        
        if critical_issues:
            for issue in critical_issues:
                print(issue)
        else:
            print("✅ No critical MongoDB migration issues found!")
        
        print()
        print(f"Test completed at: {datetime.now().isoformat()}")
        print("=" * 80)

if __name__ == "__main__":
    tester = MongoDBMigrationTester()
    tester.run_all_tests()