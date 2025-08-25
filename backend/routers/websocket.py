"""
WebSocket router for real-time monitoring and logging
"""
import json
import asyncio
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from services.websocket_service import WebSocketManager
from services.db_service import DatabaseService
import logging
import os
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ws", tags=["websocket"])
security = HTTPBearer()

# Global service references (injected from main app)
websocket_manager: WebSocketManager = None
db_service: DatabaseService = None

async def verify_api_key_query(api_key: str = Query(..., description="API key for authentication")):
    """Verify API key from query parameter (for WebSocket)"""
    expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
    if api_key != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return api_key

async def verify_api_key_header(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key from Authorization header"""
    expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
    if credentials.credentials != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return credentials.credentials

@router.websocket("/logs")
async def websocket_logs_endpoint(websocket: WebSocket, api_key: str = Query(...)):
    """WebSocket endpoint for real-time logs"""
    try:
        # Verify API key
        await verify_api_key_query(api_key)
        
        if not websocket_manager:
            await websocket.close(code=1000, reason="WebSocket service not available")
            return
        
        # Generate unique client ID
        client_id = f"logs-{uuid.uuid4().hex[:8]}"
        
        # Connect client
        await websocket_manager.connect(websocket, client_id, "logs")
        
        try:
            # Send recent logs on connection
            recent_logs = await db_service.get_logs(limit=50) if db_service else []
            for log_entry in reversed(recent_logs):  # Send oldest first
                await websocket_manager.send_to_client(client_id, {
                    "type": "historical_log",
                    **log_entry
                })
            
            # Keep connection alive and handle messages
            while True:
                # Wait for client messages (for keep-alive or commands)
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    message = json.loads(data)
                    
                    # Handle client commands
                    if message.get("command") == "ping":
                        await websocket_manager.send_to_client(client_id, {
                            "type": "pong",
                            "timestamp": "2025-01-01T00:00:00Z"
                        })
                    elif message.get("command") == "get_recent_logs":
                        limit = message.get("limit", 20)
                        recent_logs = await db_service.get_logs(limit=limit) if db_service else []
                        await websocket_manager.send_to_client(client_id, {
                            "type": "recent_logs",
                            "logs": recent_logs
                        })
                        
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    await websocket_manager.send_to_client(client_id, {
                        "type": "ping"
                    })
                    
        except WebSocketDisconnect:
            logger.info(f"Log WebSocket client disconnected: {client_id}")
        finally:
            await websocket_manager.disconnect(client_id)
            
    except Exception as e:
        logger.error(f"WebSocket logs error: {e}")
        await websocket.close(code=1000, reason=f"Error: {str(e)}")

@router.websocket("/monitoring")
async def websocket_monitoring_endpoint(websocket: WebSocket, api_key: str = Query(...)):
    """WebSocket endpoint for real-time monitoring"""
    try:
        # Verify API key
        await verify_api_key_query(api_key)
        
        if not websocket_manager:
            await websocket.close(code=1000, reason="WebSocket service not available")
            return
        
        # Generate unique client ID
        client_id = f"monitoring-{uuid.uuid4().hex[:8]}"
        
        # Connect client
        await websocket_manager.connect(websocket, client_id, "monitoring")
        
        try:
            # Send initial system stats
            await websocket_manager.send_system_stats()
            
            # Keep connection alive and handle messages
            while True:
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    message = json.loads(data)
                    
                    # Handle client commands
                    if message.get("command") == "ping":
                        await websocket_manager.send_to_client(client_id, {
                            "type": "pong",
                            "timestamp": "2025-01-01T00:00:00Z"
                        })
                    elif message.get("command") == "get_stats":
                        await websocket_manager.send_system_stats()
                    elif message.get("command") == "get_connection_stats":
                        stats = await websocket_manager.get_connection_stats()
                        await websocket_manager.send_to_client(client_id, {
                            "type": "connection_stats",
                            "stats": stats
                        })
                        
                except asyncio.TimeoutError:
                    # Send periodic system stats
                    await websocket_manager.send_system_stats()
                    
        except WebSocketDisconnect:
            logger.info(f"Monitoring WebSocket client disconnected: {client_id}")
        finally:
            await websocket_manager.disconnect(client_id)
            
    except Exception as e:
        logger.error(f"WebSocket monitoring error: {e}")
        await websocket.close(code=1000, reason=f"Error: {str(e)}")

@router.websocket("/tasks")
async def websocket_tasks_endpoint(websocket: WebSocket, api_key: str = Query(...)):
    """WebSocket endpoint for real-time task updates"""
    try:
        # Verify API key
        await verify_api_key_query(api_key)
        
        if not websocket_manager:
            await websocket.close(code=1000, reason="WebSocket service not available")
            return
        
        # Generate unique client ID
        client_id = f"tasks-{uuid.uuid4().hex[:8]}"
        
        # Connect client
        await websocket_manager.connect(websocket, client_id, "tasks")
        
        try:
            # Keep connection alive and handle messages
            while True:
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    message = json.loads(data)
                    
                    # Handle client commands
                    if message.get("command") == "ping":
                        await websocket_manager.send_to_client(client_id, {
                            "type": "pong",
                            "timestamp": "2025-01-01T00:00:00Z"
                        })
                        
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    await websocket_manager.send_to_client(client_id, {
                        "type": "ping"
                    })
                    
        except WebSocketDisconnect:
            logger.info(f"Tasks WebSocket client disconnected: {client_id}")
        finally:
            await websocket_manager.disconnect(client_id)
            
    except Exception as e:
        logger.error(f"WebSocket tasks error: {e}")
        await websocket.close(code=1000, reason=f"Error: {str(e)}")

# REST endpoints for WebSocket management
@router.get("/connections", response_model=Dict[str, Any])
async def get_websocket_connections(api_key: str = Depends(verify_api_key_header)):
    """Get current WebSocket connection statistics"""
    try:
        if not websocket_manager:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="WebSocket service not available"
            )
        
        stats = await websocket_manager.get_connection_stats()
        return {
            "message": "WebSocket connection stats retrieved",
            "stats": stats,
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error getting WebSocket connections: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/broadcast", response_model=Dict[str, Any])
async def broadcast_message(
    message_data: Dict[str, Any],
    connection_type: str = Query(None, description="Connection type to broadcast to (optional)"),
    api_key: str = Depends(verify_api_key_header)
):
    """Broadcast message to WebSocket clients"""
    try:
        if not websocket_manager:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="WebSocket service not available"
            )
        
        # Add timestamp if not present
        if "timestamp" not in message_data:
            message_data["timestamp"] = "2025-01-01T00:00:00Z"
        
        # Broadcast message
        if connection_type:
            sent_count = await websocket_manager.broadcast_to_type(connection_type, message_data)
        else:
            sent_count = await websocket_manager.broadcast_to_all(message_data)
        
        return {
            "message": f"Message broadcasted to {sent_count} clients",
            "sent_count": sent_count,
            "connection_type": connection_type,
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error broadcasting message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/log", response_model=Dict[str, str])
async def add_websocket_log(
    log_data: Dict[str, Any],
    api_key: str = Depends(verify_api_key_header)
):
    """Add log entry that will be broadcasted to WebSocket clients"""
    try:
        if not websocket_manager:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="WebSocket service not available"
            )
        
        level = log_data.get("level", "info")
        message = log_data.get("message", "")
        metadata = log_data.get("metadata", {})
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message is required"
            )
        
        # Add log entry
        await websocket_manager.add_log_message(level, message, metadata)
        
        return {
            "message": "Log entry added and broadcasted",
            "level": level,
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding WebSocket log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )