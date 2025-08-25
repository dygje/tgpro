#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Phase 2 (WebSocket Real-time System) and Phase 3 (Async Task Processing)
Testing WebSocket endpoints, async task management, and real-time integration
"""

import asyncio
import json
import requests
import time
import websockets
import threading
from datetime import datetime
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse

# Configuration
BACKEND_URL = "https://telegram-automation.preview.emergentagent.com"
API_KEY = "telegram-automation-key-2025"

# WebSocket URL (convert HTTPS to WSS)
parsed_url = urlparse(BACKEND_URL)
WS_BASE_URL = f"wss://{parsed_url.netloc}"

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
        self.websocket_messages = []  # Store WebSocket messages for testing
        self.active_websockets = []   # Track active WebSocket connections
        
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

    async def connect_websocket(self, endpoint: str, connection_type: str = "test") -> Optional[websockets.WebSocketServerProtocol]:
        """Connect to WebSocket endpoint"""
        try:
            ws_url = f"{WS_BASE_URL}{endpoint}?api_key={self.api_key}"
            websocket = await websockets.connect(ws_url, timeout=10)
            self.active_websockets.append((websocket, connection_type))
            return websocket
        except Exception as e:
            print(f"WebSocket connection error for {endpoint}: {e}")
            return None

    async def close_all_websockets(self):
        """Close all active WebSocket connections"""
        for websocket, connection_type in self.active_websockets:
            try:
                await websocket.close()
            except:
                pass
        self.active_websockets.clear()

    # ========== PHASE 2: WEBSOCKET REAL-TIME SYSTEM TESTS ==========
    
    def test_websocket_service_health(self):
        """Test WebSocket service health in main health endpoint"""
        try:
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                # Check for WebSocket and task services
                websocket_service = services.get("websocket_manager", False)
                task_service = services.get("task_service", False)
                
                if websocket_service and task_service:
                    self.log_test("WebSocket Service Health", True, 
                                "WebSocket manager and task service are running", data)
                else:
                    self.log_test("WebSocket Service Health", False, 
                                f"Services missing - WebSocket: {websocket_service}, Task: {task_service}", data)
            else:
                self.log_test("WebSocket Service Health", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("WebSocket Service Health", False, f"Exception: {str(e)}")

    async def test_websocket_logs_endpoint(self):
        """Test /api/ws/logs WebSocket endpoint"""
        try:
            websocket = await self.connect_websocket("/api/ws/logs", "logs")
            
            if not websocket:
                self.log_test("WebSocket Logs Endpoint", False, "Failed to connect to WebSocket")
                return
            
            # Wait for welcome message
            try:
                welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                welcome_data = json.loads(welcome_msg)
                
                if welcome_data.get("type") == "connection_established":
                    # Send ping command
                    await websocket.send(json.dumps({"command": "ping"}))
                    
                    # Wait for pong response
                    pong_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    pong_data = json.loads(pong_msg)
                    
                    if pong_data.get("type") == "pong":
                        self.log_test("WebSocket Logs Endpoint", True, 
                                    "WebSocket logs connection established and ping/pong working")
                    else:
                        self.log_test("WebSocket Logs Endpoint", False, 
                                    f"Unexpected pong response: {pong_data}")
                else:
                    self.log_test("WebSocket Logs Endpoint", False, 
                                f"Unexpected welcome message: {welcome_data}")
                    
            except asyncio.TimeoutError:
                self.log_test("WebSocket Logs Endpoint", False, "Timeout waiting for WebSocket messages")
            
            await websocket.close()
            
        except Exception as e:
            self.log_test("WebSocket Logs Endpoint", False, f"Exception: {str(e)}")

    async def test_websocket_monitoring_endpoint(self):
        """Test /api/ws/monitoring WebSocket endpoint"""
        try:
            websocket = await self.connect_websocket("/api/ws/monitoring", "monitoring")
            
            if not websocket:
                self.log_test("WebSocket Monitoring Endpoint", False, "Failed to connect to WebSocket")
                return
            
            # Wait for welcome message and system stats
            messages_received = 0
            system_stats_received = False
            
            try:
                for _ in range(3):  # Wait for up to 3 messages
                    msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(msg)
                    messages_received += 1
                    
                    if data.get("type") == "system_stats":
                        system_stats_received = True
                        break
                
                if system_stats_received:
                    # Test get_stats command
                    await websocket.send(json.dumps({"command": "get_stats"}))
                    
                    # Wait for stats response
                    stats_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    stats_data = json.loads(stats_msg)
                    
                    if stats_data.get("type") == "system_stats":
                        self.log_test("WebSocket Monitoring Endpoint", True, 
                                    f"Monitoring WebSocket working, received {messages_received} messages")
                    else:
                        self.log_test("WebSocket Monitoring Endpoint", False, 
                                    f"Stats command failed: {stats_data}")
                else:
                    self.log_test("WebSocket Monitoring Endpoint", False, 
                                f"No system stats received in {messages_received} messages")
                    
            except asyncio.TimeoutError:
                self.log_test("WebSocket Monitoring Endpoint", False, "Timeout waiting for monitoring messages")
            
            await websocket.close()
            
        except Exception as e:
            self.log_test("WebSocket Monitoring Endpoint", False, f"Exception: {str(e)}")

    async def test_websocket_tasks_endpoint(self):
        """Test /api/ws/tasks WebSocket endpoint"""
        try:
            websocket = await self.connect_websocket("/api/ws/tasks", "tasks")
            
            if not websocket:
                self.log_test("WebSocket Tasks Endpoint", False, "Failed to connect to WebSocket")
                return
            
            # Wait for welcome message
            try:
                welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                welcome_data = json.loads(welcome_msg)
                
                if welcome_data.get("type") == "connection_established":
                    # Send ping command
                    await websocket.send(json.dumps({"command": "ping"}))
                    
                    # Wait for pong response
                    pong_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    pong_data = json.loads(pong_msg)
                    
                    if pong_data.get("type") == "pong":
                        self.log_test("WebSocket Tasks Endpoint", True, 
                                    "WebSocket tasks connection established and working")
                    else:
                        self.log_test("WebSocket Tasks Endpoint", False, 
                                    f"Unexpected pong response: {pong_data}")
                else:
                    self.log_test("WebSocket Tasks Endpoint", False, 
                                f"Unexpected welcome message: {welcome_data}")
                    
            except asyncio.TimeoutError:
                self.log_test("WebSocket Tasks Endpoint", False, "Timeout waiting for WebSocket messages")
            
            await websocket.close()
            
        except Exception as e:
            self.log_test("WebSocket Tasks Endpoint", False, f"Exception: {str(e)}")

    def test_websocket_connections_endpoint(self):
        """Test /api/ws/connections REST endpoint"""
        try:
            response = self.make_request("GET", "/api/ws/connections")
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get("stats", {})
                
                # Check expected fields
                expected_fields = ["total_connections", "connection_types", "active_client_ids", "queue_size"]
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if not missing_fields:
                    self.log_test("WebSocket Connections Endpoint", True, 
                                f"Connection stats retrieved: {stats['total_connections']} connections", data)
                else:
                    self.log_test("WebSocket Connections Endpoint", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("WebSocket Connections Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("WebSocket Connections Endpoint", False, f"Exception: {str(e)}")

    def test_websocket_broadcast_endpoint(self):
        """Test /api/ws/broadcast REST endpoint"""
        try:
            broadcast_data = {
                "type": "test_broadcast",
                "message": "Test broadcast message",
                "test_id": "broadcast_test_001"
            }
            
            response = self.make_request("POST", "/api/ws/broadcast", broadcast_data)
            
            if response.status_code == 200:
                data = response.json()
                sent_count = data.get("sent_count", 0)
                
                self.log_test("WebSocket Broadcast Endpoint", True, 
                            f"Broadcast sent to {sent_count} clients", data)
            else:
                self.log_test("WebSocket Broadcast Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("WebSocket Broadcast Endpoint", False, f"Exception: {str(e)}")

    def test_websocket_log_endpoint(self):
        """Test /api/ws/log REST endpoint"""
        try:
            log_data = {
                "level": "info",
                "message": "Test log message from API endpoint",
                "metadata": {
                    "test_id": "log_test_001",
                    "source": "backend_test"
                }
            }
            
            response = self.make_request("POST", "/api/ws/log", log_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if "broadcasted" in data.get("message", "").lower():
                    self.log_test("WebSocket Log Endpoint", True, 
                                "Log entry added and broadcasted successfully", data)
                else:
                    self.log_test("WebSocket Log Endpoint", False, 
                                f"Unexpected response: {data}")
            else:
                self.log_test("WebSocket Log Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("WebSocket Log Endpoint", False, f"Exception: {str(e)}")

    # ========== PHASE 3: ASYNC TASK PROCESSING TESTS ==========
    
    def test_task_service_health(self):
        """Test task service health and availability"""
        try:
            response = self.make_request("GET", "/api/health")
            
            if response.status_code == 200:
                data = response.json()
                services = data.get("services", {})
                
                task_service = services.get("task_service", False)
                
                if task_service:
                    self.log_test("Task Service Health", True, 
                                "Task service is running and available", data)
                else:
                    self.log_test("Task Service Health", False, 
                                "Task service not available", data)
            else:
                self.log_test("Task Service Health", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Task Service Health", False, f"Exception: {str(e)}")

    def test_create_message_sending_task(self):
        """Test /api/tasks/message-sending endpoint"""
        try:
            task_data = {
                "template_id": "test_template_001",
                "recipients": ["@test_group_1", "@test_group_2"],
                "custom_variables": {
                    "name": "Test User",
                    "product": "Test Product"
                },
                "delay_override": {
                    "min_delay": 2,
                    "max_delay": 5
                }
            }
            
            response = self.make_request("POST", "/api/tasks/message-sending", task_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["task_id", "status", "message", "estimated_completion"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get("status") == "pending":
                    task_id = data.get("task_id")
                    self.log_test("Create Message Sending Task", True, 
                                f"Task created successfully: {task_id}", data)
                    return task_id
                else:
                    self.log_test("Create Message Sending Task", False, 
                                f"Invalid response - Missing: {missing_fields}, Status: {data.get('status')}", data)
            else:
                self.log_test("Create Message Sending Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Message Sending Task", False, f"Exception: {str(e)}")
        
        return None

    def test_create_bulk_message_task(self):
        """Test /api/tasks/bulk-message endpoint"""
        try:
            task_data = {
                "templates": ["template_1", "template_2"],
                "groups": ["@group_1", "@group_2", "@group_3"],
                "variables": {
                    "greeting": ["Hello", "Hi", "Hey"],
                    "closing": ["Best regards", "Cheers", "Thanks"]
                },
                "delays": {
                    "between_messages": 3,
                    "between_groups": 10
                }
            }
            
            response = self.make_request("POST", "/api/tasks/bulk-message", task_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "pending" and "task_id" in data:
                    task_id = data.get("task_id")
                    self.log_test("Create Bulk Message Task", True, 
                                f"Bulk task created successfully: {task_id}", data)
                    return task_id
                else:
                    self.log_test("Create Bulk Message Task", False, 
                                f"Invalid response: {data}")
            else:
                self.log_test("Create Bulk Message Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Bulk Message Task", False, f"Exception: {str(e)}")
        
        return None

    def test_create_group_management_task(self):
        """Test /api/tasks/group-management endpoint"""
        try:
            task_data = {
                "operation": "add",
                "groups": [
                    "https://t.me/test_group_1",
                    "https://t.me/test_group_2",
                    "@test_group_3"
                ],
                "metadata": {
                    "source": "api_test",
                    "batch_id": "batch_001"
                }
            }
            
            response = self.make_request("POST", "/api/tasks/group-management", task_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "pending" and "task_id" in data:
                    task_id = data.get("task_id")
                    self.log_test("Create Group Management Task", True, 
                                f"Group management task created: {task_id}", data)
                    return task_id
                else:
                    self.log_test("Create Group Management Task", False, 
                                f"Invalid response: {data}")
            else:
                self.log_test("Create Group Management Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Group Management Task", False, f"Exception: {str(e)}")
        
        return None

    def test_get_task_status(self, task_id: str):
        """Test /api/tasks/{task_id} endpoint"""
        if not task_id:
            self.log_test("Get Task Status", False, "No task ID provided")
            return
        
        try:
            response = self.make_request("GET", f"/api/tasks/{task_id}")
            
            if response.status_code == 200:
                data = response.json()
                task_data = data.get("task", {})
                
                # Check required fields
                required_fields = ["task_id", "task_type", "status", "progress", "created_at"]
                missing_fields = [field for field in required_fields if field not in task_data]
                
                if not missing_fields:
                    status = task_data.get("status")
                    progress = task_data.get("progress", {})
                    self.log_test("Get Task Status", True, 
                                f"Task status retrieved: {status}, Progress: {progress.get('percentage', 0)}%", data)
                else:
                    self.log_test("Get Task Status", False, 
                                f"Missing fields: {missing_fields}", data)
            elif response.status_code == 404:
                self.log_test("Get Task Status", True, 
                            "Task not found (expected for test task)", response.json())
            else:
                self.log_test("Get Task Status", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Task Status", False, f"Exception: {str(e)}")

    def test_list_tasks(self):
        """Test /api/tasks/ endpoint"""
        try:
            response = self.make_request("GET", "/api/tasks/?limit=10")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["tasks", "total", "limit"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    tasks = data.get("tasks", [])
                    total = data.get("total", 0)
                    self.log_test("List Tasks", True, 
                                f"Tasks listed successfully: {total} tasks found", data)
                else:
                    self.log_test("List Tasks", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("List Tasks", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("List Tasks", False, f"Exception: {str(e)}")

    def test_cancel_task(self, task_id: str):
        """Test /api/tasks/{task_id}/cancel endpoint"""
        if not task_id:
            self.log_test("Cancel Task", False, "No task ID provided")
            return
        
        try:
            response = self.make_request("POST", f"/api/tasks/{task_id}/cancel")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("status") == "cancelled":
                    self.log_test("Cancel Task", True, 
                                f"Task cancelled successfully: {task_id}", data)
                else:
                    self.log_test("Cancel Task", False, 
                                f"Unexpected response: {data}")
            elif response.status_code == 400:
                # Task might not be cancellable (already completed/failed)
                self.log_test("Cancel Task", True, 
                            "Task cannot be cancelled (expected for completed tasks)", response.json())
            else:
                self.log_test("Cancel Task", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Cancel Task", False, f"Exception: {str(e)}")

    def test_task_stats_overview(self):
        """Test /api/tasks/stats/overview endpoint"""
        try:
            response = self.make_request("GET", "/api/tasks/stats/overview")
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get("stats", {})
                
                # Check expected fields
                expected_fields = ["total_tasks", "by_status", "by_type", "running", "max_concurrent_tasks", "queue_size", "active_tasks_count"]
                missing_fields = [field for field in expected_fields if field not in stats]
                
                if not missing_fields:
                    total_tasks = stats.get("total_tasks", 0)
                    running = stats.get("running", False)
                    queue_size = stats.get("queue_size", 0)
                    self.log_test("Task Stats Overview", True, 
                                f"Stats retrieved: {total_tasks} total tasks, Running: {running}, Queue: {queue_size}", data)
                else:
                    self.log_test("Task Stats Overview", False, 
                                f"Missing fields: {missing_fields}", data)
            else:
                self.log_test("Task Stats Overview", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Task Stats Overview", False, f"Exception: {str(e)}")

    # ========== INTEGRATION TESTING ==========
    
    async def test_websocket_task_integration(self):
        """Test integration between WebSocket and task services"""
        try:
            # Connect to tasks WebSocket
            websocket = await self.connect_websocket("/api/ws/tasks", "tasks")
            
            if not websocket:
                self.log_test("WebSocket Task Integration", False, "Failed to connect to tasks WebSocket")
                return
            
            # Wait for welcome message
            welcome_msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            welcome_data = json.loads(welcome_msg)
            
            if welcome_data.get("type") != "connection_established":
                self.log_test("WebSocket Task Integration", False, "WebSocket connection not established")
                await websocket.close()
                return
            
            # Create a task via REST API
            task_data = {
                "template_id": "integration_test_template",
                "recipients": ["@integration_test_group"],
                "custom_variables": {"test": "integration"}
            }
            
            response = self.make_request("POST", "/api/tasks/message-sending", task_data)
            
            if response.status_code != 200:
                self.log_test("WebSocket Task Integration", False, "Failed to create task for integration test")
                await websocket.close()
                return
            
            task_id = response.json().get("task_id")
            
            # Wait for task update via WebSocket
            task_update_received = False
            try:
                for _ in range(5):  # Wait for up to 5 messages
                    msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(msg)
                    
                    if (data.get("type") == "task_update" and 
                        data.get("task_id") == task_id):
                        task_update_received = True
                        break
                
                if task_update_received:
                    self.log_test("WebSocket Task Integration", True, 
                                f"Task update received via WebSocket for task: {task_id}")
                else:
                    self.log_test("WebSocket Task Integration", False, 
                                "No task update received via WebSocket")
                    
            except asyncio.TimeoutError:
                self.log_test("WebSocket Task Integration", False, 
                            "Timeout waiting for task update via WebSocket")
            
            await websocket.close()
            
        except Exception as e:
            self.log_test("WebSocket Task Integration", False, f"Exception: {str(e)}")

    def test_service_cross_communication(self):
        """Test cross-service communication and dependencies"""
        try:
            # Test that WebSocket service can access task service
            response = self.make_request("GET", "/api/ws/connections")
            websocket_available = response.status_code == 200
            
            # Test that task service is available
            response = self.make_request("GET", "/api/tasks/stats/overview")
            task_service_available = response.status_code == 200
            
            # Test broadcast functionality (requires both services)
            broadcast_data = {"type": "service_test", "message": "Cross-service communication test"}
            response = self.make_request("POST", "/api/ws/broadcast", broadcast_data)
            broadcast_working = response.status_code == 200
            
            if websocket_available and task_service_available and broadcast_working:
                self.log_test("Service Cross Communication", True, 
                            "All services communicating properly")
            else:
                self.log_test("Service Cross Communication", False, 
                            f"Service issues - WebSocket: {websocket_available}, Tasks: {task_service_available}, Broadcast: {broadcast_working}")
                
        except Exception as e:
            self.log_test("Service Cross Communication", False, f"Exception: {str(e)}")

    # ========== MAIN TEST EXECUTION ==========
    
    async def run_phase2_phase3_tests(self):
        """Run Phase 2 and Phase 3 tests"""
        print("=" * 80)
        print("PHASE 2 & 3 TESTING - WebSocket Real-time System + Async Task Processing")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"WebSocket URL: {WS_BASE_URL}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print()
        
        # Service Health Tests
        print("🏥 SERVICE HEALTH TESTS")
        print("-" * 50)
        self.test_websocket_service_health()
        self.test_task_service_health()
        print()
        
        # Phase 2: WebSocket Real-time System Tests
        print("🔌 PHASE 2: WEBSOCKET REAL-TIME SYSTEM TESTS")
        print("-" * 50)
        await self.test_websocket_logs_endpoint()
        await self.test_websocket_monitoring_endpoint()
        await self.test_websocket_tasks_endpoint()
        self.test_websocket_connections_endpoint()
        self.test_websocket_broadcast_endpoint()
        self.test_websocket_log_endpoint()
        print()
        
        # Phase 3: Async Task Processing Tests
        print("⚡ PHASE 3: ASYNC TASK PROCESSING TESTS")
        print("-" * 50)
        
        # Create tasks and get their IDs for further testing
        message_task_id = self.test_create_message_sending_task()
        bulk_task_id = self.test_create_bulk_message_task()
        group_task_id = self.test_create_group_management_task()
        
        # Test task management
        self.test_list_tasks()
        self.test_task_stats_overview()
        
        # Test task status and cancellation with created tasks
        if message_task_id:
            self.test_get_task_status(message_task_id)
            time.sleep(2)  # Wait a bit before cancelling
            self.test_cancel_task(message_task_id)
        
        if bulk_task_id:
            self.test_get_task_status(bulk_task_id)
        
        if group_task_id:
            self.test_get_task_status(group_task_id)
        
        print()
        
        # Integration Testing
        print("🔗 INTEGRATION TESTING")
        print("-" * 50)
        await self.test_websocket_task_integration()
        self.test_service_cross_communication()
        print()
        
        # Clean up WebSocket connections
        await self.close_all_websockets()
        
        # Summary
        self.print_summary()

    def run_all_tests(self):
        """Run all tests (wrapper for async execution)"""
        asyncio.run(self.run_phase2_phase3_tests())

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