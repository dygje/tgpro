"""
Async task management router
"""
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from services.async_task_service import AsyncTaskService, TaskType, TaskStatus
from models.message import MessageSendRequest, TaskResponse, TaskStatus as TaskStatusModel
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
security = HTTPBearer()

# Global service references (injected from main app)
task_service: AsyncTaskService = None

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key authentication"""
    expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
    if credentials.credentials != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return credentials.credentials

@router.post("/message-sending", response_model=TaskResponse)
async def create_message_sending_task(
    request: MessageSendRequest,
    api_key: str = Depends(verify_api_key)
):
    """Create an async message sending task"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        # Prepare task parameters
        parameters = {
            "template_id": request.template_id,
            "recipients": request.recipients,
            "custom_variables": request.custom_variables,
            "delay_override": request.delay_override
        }
        
        # Estimate duration (2-5 minutes based on recipients)
        recipient_count = len(request.recipients) if request.recipients else 10
        estimated_duration = max(2, min(30, recipient_count // 2))
        
        # Create task
        task_id = await task_service.create_task(
            TaskType.MESSAGE_SENDING,
            parameters,
            priority=5,  # Normal priority
            estimated_duration_minutes=estimated_duration
        )
        
        return TaskResponse(
            task_id=task_id,
            status="pending",
            message=f"Message sending task created for template '{request.template_id}'",
            estimated_completion=f"2025-01-01T00:{estimated_duration}:00Z"
        )
        
    except Exception as e:
        logger.error(f"Error creating message sending task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/bulk-message", response_model=TaskResponse)
async def create_bulk_message_task(
    request: Dict[str, Any],
    api_key: str = Depends(verify_api_key)
):
    """Create an async bulk message task"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        templates = request.get("templates", [])
        groups = request.get("groups", [])
        
        if not templates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Templates are required"
            )
        
        if not groups:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Groups are required"
            )
        
        # Prepare task parameters
        parameters = {
            "templates": templates,
            "groups": groups,
            "variables": request.get("variables", {}),
            "delays": request.get("delays", {})
        }
        
        # Estimate duration
        total_operations = len(templates) * len(groups)
        estimated_duration = max(5, min(60, total_operations * 2))
        
        # Create task
        task_id = await task_service.create_task(
            TaskType.BULK_MESSAGE,
            parameters,
            priority=3,  # Higher priority for bulk operations
            estimated_duration_minutes=estimated_duration
        )
        
        return TaskResponse(
            task_id=task_id,
            status="pending",
            message=f"Bulk message task created for {len(templates)} templates and {len(groups)} groups",
            estimated_completion=f"2025-01-01T00:{estimated_duration}:00Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating bulk message task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/group-management", response_model=TaskResponse)
async def create_group_management_task(
    request: Dict[str, Any],
    api_key: str = Depends(verify_api_key)
):
    """Create an async group management task"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        operation = request.get("operation")  # add, remove, update
        groups = request.get("groups", [])
        
        if not operation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation is required (add, remove, update)"
            )
        
        if operation not in ["add", "remove", "update"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Operation must be 'add', 'remove', or 'update'"
            )
        
        if not groups:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Groups are required"
            )
        
        # Prepare task parameters
        parameters = {
            "operation": operation,
            "groups": groups,
            "metadata": request.get("metadata", {})
        }
        
        # Estimate duration
        estimated_duration = max(3, min(20, len(groups)))
        
        # Create task
        task_id = await task_service.create_task(
            TaskType.GROUP_MANAGEMENT,
            parameters,
            priority=4,  # Medium-high priority
            estimated_duration_minutes=estimated_duration
        )
        
        return TaskResponse(
            task_id=task_id,
            status="pending",
            message=f"Group {operation} task created for {len(groups)} groups",
            estimated_completion=f"2025-01-01T00:{estimated_duration}:00Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating group management task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{task_id}", response_model=Dict[str, Any])
async def get_task_status(
    task_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get status of a specific task"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        task_data = await task_service.get_task_status(task_id)
        
        if not task_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found"
            )
        
        return {
            "task": task_data,
            "message": f"Task status retrieved for {task_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting task status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/", response_model=Dict[str, Any])
async def list_tasks(
    status_filter: Optional[str] = Query(None, description="Filter by task status"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of tasks to return"),
    api_key: str = Depends(verify_api_key)
):
    """List tasks with optional status filter"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        # Convert status filter
        status_enum = None
        if status_filter:
            try:
                status_enum = TaskStatus(status_filter.lower())
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status filter. Must be one of: {[s.value for s in TaskStatus]}"
                )
        
        tasks = await task_service.list_tasks(status_filter=status_enum, limit=limit)
        
        return {
            "tasks": tasks,
            "total": len(tasks),
            "status_filter": status_filter,
            "limit": limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing tasks: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/{task_id}/cancel", response_model=Dict[str, str])
async def cancel_task(
    task_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Cancel a task"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        success = await task_service.cancel_task(task_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task cannot be cancelled (not found or already completed)"
            )
        
        return {
            "message": f"Task {task_id} cancelled successfully",
            "task_id": task_id,
            "status": "cancelled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/stats/overview", response_model=Dict[str, Any])
async def get_task_stats(api_key: str = Depends(verify_api_key)):
    """Get task service statistics"""
    try:
        if not task_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Task service not available"
            )
        
        # Get all tasks and calculate stats
        all_tasks = await task_service.list_tasks(limit=1000)
        
        stats = {
            "total_tasks": len(all_tasks),
            "by_status": {},
            "by_type": {},
            "running": task_service.running,
            "max_concurrent_tasks": task_service.max_concurrent_tasks,
            "queue_size": task_service.task_queue.qsize(),
            "active_tasks_count": len(task_service.active_tasks)
        }
        
        # Count by status and type
        for task in all_tasks:
            status = task.get("status", "unknown")
            task_type = task.get("task_type", "unknown")
            
            stats["by_status"][status] = stats["by_status"].get(status, 0) + 1
            stats["by_type"][task_type] = stats["by_type"].get(task_type, 0) + 1
        
        return {
            "stats": stats,
            "message": "Task statistics retrieved",
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error getting task stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )