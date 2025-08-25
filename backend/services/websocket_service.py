"""
WebSocket service for real-time monitoring and logging
"""
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Set
from fastapi import WebSocket, WebSocketDisconnect
from services.db_service import DatabaseService

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self, db_service: DatabaseService):
        self.db_service = db_service
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_types: Dict[str, str] = {}  # connection_id -> type (logs, monitoring, etc)
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.running = False
        
    async def connect(self, websocket: WebSocket, client_id: str, connection_type: str = "general"):
        """Connect a WebSocket client"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.connection_types[client_id] = connection_type
        
        logger.info(f"WebSocket client connected: {client_id} (type: {connection_type})")
        
        # Send welcome message
        await self.send_to_client(client_id, {
            "type": "connection_established",
            "client_id": client_id,
            "connection_type": connection_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Start message processing if not already running
        if not self.running:
            asyncio.create_task(self._process_message_queue())
            self.running = True
    
    async def disconnect(self, client_id: str):
        """Disconnect a WebSocket client"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            del self.connection_types[client_id]
            logger.info(f"WebSocket client disconnected: {client_id}")
    
    async def send_to_client(self, client_id: str, message: Dict[str, Any]) -> bool:
        """Send message to specific client"""
        if client_id not in self.active_connections:
            return False
            
        try:
            websocket = self.active_connections[client_id]
            await websocket.send_text(json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Error sending to client {client_id}: {e}")
            await self.disconnect(client_id)
            return False
    
    async def broadcast_to_type(self, connection_type: str, message: Dict[str, Any]) -> int:
        """Broadcast message to all clients of specific type"""
        sent_count = 0
        clients_to_remove = []
        
        for client_id, websocket in self.active_connections.items():
            if self.connection_types.get(client_id) == connection_type:
                try:
                    await websocket.send_text(json.dumps(message))
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Error broadcasting to client {client_id}: {e}")
                    clients_to_remove.append(client_id)
        
        # Clean up failed connections
        for client_id in clients_to_remove:
            await self.disconnect(client_id)
        
        return sent_count
    
    async def broadcast_to_all(self, message: Dict[str, Any]) -> int:
        """Broadcast message to all connected clients"""
        sent_count = 0
        clients_to_remove = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting to client {client_id}: {e}")
                clients_to_remove.append(client_id)
        
        # Clean up failed connections
        for client_id in clients_to_remove:
            await self.disconnect(client_id)
        
        return sent_count
    
    async def add_log_message(self, level: str, message: str, metadata: Optional[Dict] = None):
        """Add log message to queue for broadcasting"""
        log_entry = {
            "type": "log",
            "level": level,
            "message": message,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in MongoDB
        if self.db_service:
            await self.db_service.add_log(level, message, metadata)
        
        # Add to broadcast queue
        await self.message_queue.put(log_entry)
    
    async def add_monitoring_event(self, event_type: str, data: Dict[str, Any]):
        """Add monitoring event to queue for broadcasting"""
        monitoring_entry = {
            "type": "monitoring",
            "event_type": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Add to broadcast queue
        await self.message_queue.put(monitoring_entry)
    
    async def add_task_update(self, task_id: str, status: str, progress: Dict[str, Any], results: Optional[Dict] = None):
        """Add task status update for broadcasting"""
        task_update = {
            "type": "task_update",
            "task_id": task_id,
            "status": status,
            "progress": progress,
            "results": results,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Add to broadcast queue
        await self.message_queue.put(task_update)
    
    async def _process_message_queue(self):
        """Process message queue and broadcast to appropriate clients"""
        while True:
            try:
                # Wait for messages in queue
                message = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)
                
                message_type = message.get("type")
                
                if message_type == "log":
                    # Broadcast to log monitoring clients
                    await self.broadcast_to_type("logs", message)
                elif message_type == "monitoring":
                    # Broadcast to monitoring clients
                    await self.broadcast_to_type("monitoring", message)
                elif message_type == "task_update":
                    # Broadcast to all clients (tasks are important)
                    await self.broadcast_to_all(message)
                else:
                    # Broadcast general messages to all
                    await self.broadcast_to_all(message)
                    
            except asyncio.TimeoutError:
                # No messages in queue, continue
                continue
            except Exception as e:
                logger.error(f"Error processing message queue: {e}")
                await asyncio.sleep(1)
    
    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        type_counts = {}
        for connection_type in self.connection_types.values():
            type_counts[connection_type] = type_counts.get(connection_type, 0) + 1
        
        return {
            "total_connections": len(self.active_connections),
            "connection_types": type_counts,
            "active_client_ids": list(self.active_connections.keys()),
            "queue_size": self.message_queue.qsize()
        }
    
    async def send_system_stats(self):
        """Send system statistics to monitoring clients"""
        import psutil
        
        try:
            # Get system stats
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            stats = {
                "type": "system_stats",
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available": memory.available,
                "disk_percent": disk.percent,
                "disk_free": disk.free,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            await self.broadcast_to_type("monitoring", stats)
            
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")

class WebSocketLogHandler(logging.Handler):
    """Custom log handler that sends logs to WebSocket clients"""
    
    def __init__(self, websocket_manager: WebSocketManager):
        super().__init__()
        self.websocket_manager = websocket_manager
        
    def emit(self, record):
        """Send log record to WebSocket clients"""
        try:
            # Format the log record
            message = self.format(record)
            
            # Extract metadata from record
            metadata = {
                "logger": record.name,
                "filename": record.filename,
                "line_number": record.lineno,
                "function": record.funcName
            }
            
            # Add to WebSocket queue (async)
            asyncio.create_task(
                self.websocket_manager.add_log_message(
                    record.levelname.lower(),
                    message,
                    metadata
                )
            )
        except Exception as e:
            # Don't let logging errors break the application
            print(f"WebSocket logging error: {e}")