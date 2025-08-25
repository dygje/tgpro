"""
Async task service for message sending automation with queuing and background processing
"""
import asyncio
import uuid
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from enum import Enum
from dataclasses import dataclass, asdict
from services.db_service import DatabaseService
from services.websocket_service import WebSocketManager

logger = logging.getLogger(__name__)

class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"

class TaskType(str, Enum):
    MESSAGE_SENDING = "message_sending"
    BULK_MESSAGE = "bulk_message"
    GROUP_MANAGEMENT = "group_management"
    SYSTEM_MAINTENANCE = "system_maintenance"

@dataclass
class TaskData:
    task_id: str
    task_type: TaskType
    status: TaskStatus
    created_at: datetime
    updated_at: datetime
    progress: Dict[str, Any]
    parameters: Dict[str, Any]
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    priority: int = 5  # 1 (highest) to 10 (lowest)

class AsyncTaskService:
    def __init__(self, db_service: DatabaseService, websocket_manager: Optional[WebSocketManager] = None):
        self.db_service = db_service
        self.websocket_manager = websocket_manager
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.active_tasks: Dict[str, TaskData] = {}
        self.running = False
        self.max_concurrent_tasks = 3
        self.worker_semaphore = asyncio.Semaphore(self.max_concurrent_tasks)
        
    async def start(self):
        """Start the async task processing"""
        if self.running:
            return
        
        self.running = True
        logger.info("Starting async task service")
        
        # Start task workers
        for i in range(self.max_concurrent_tasks):
            asyncio.create_task(self._task_worker(f"worker-{i}"))
        
        # Start task monitor
        asyncio.create_task(self._task_monitor())
        
        if self.websocket_manager:
            await self.websocket_manager.add_log_message(
                "info", "Async task service started", 
                {"workers": self.max_concurrent_tasks}
            )
    
    async def stop(self):
        """Stop the async task processing"""
        self.running = False
        logger.info("Stopping async task service")
        
        # Cancel all pending tasks
        pending_tasks = [task for task in self.active_tasks.values() if task.status == TaskStatus.PENDING]
        for task in pending_tasks:
            await self.cancel_task(task.task_id)
        
        if self.websocket_manager:
            await self.websocket_manager.add_log_message(
                "info", "Async task service stopped", 
                {"cancelled_tasks": len(pending_tasks)}
            )
    
    async def create_task(
        self, 
        task_type: TaskType, 
        parameters: Dict[str, Any], 
        priority: int = 5,
        estimated_duration_minutes: Optional[int] = None
    ) -> str:
        """Create a new async task"""
        task_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        estimated_completion = None
        if estimated_duration_minutes:
            estimated_completion = now + timedelta(minutes=estimated_duration_minutes)
        
        task_data = TaskData(
            task_id=task_id,
            task_type=task_type,
            status=TaskStatus.PENDING,
            created_at=now,
            updated_at=now,
            progress={"percentage": 0, "stage": "created"},
            parameters=parameters,
            priority=priority,
            estimated_completion=estimated_completion
        )
        
        # Store task
        self.active_tasks[task_id] = task_data
        
        # Add to queue (priority queue simulation)
        await self.task_queue.put((priority, task_id))
        
        # Store in database
        await self._store_task_in_db(task_data)
        
        logger.info(f"Created task: {task_id} ({task_type.value})")
        
        if self.websocket_manager:
            await self.websocket_manager.add_task_update(
                task_id, TaskStatus.PENDING.value, 
                task_data.progress, None
            )
        
        return task_id
    
    async def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status"""
        if task_id in self.active_tasks:
            task = self.active_tasks[task_id]
            return {
                "task_id": task.task_id,
                "task_type": task.task_type.value,
                "status": task.status.value,
                "progress": task.progress,
                "results": task.results,
                "error": task.error,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
                "estimated_completion": task.estimated_completion.isoformat() if task.estimated_completion else None
            }
        
        # Try to load from database
        return await self._load_task_from_db(task_id)
    
    async def cancel_task(self, task_id: str) -> bool:
        """Cancel a task"""
        if task_id not in self.active_tasks:
            return False
        
        task = self.active_tasks[task_id]
        
        if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            return False
        
        task.status = TaskStatus.CANCELLED
        task.updated_at = datetime.now(timezone.utc)
        task.error = "Task cancelled by user"
        
        await self._store_task_in_db(task)
        
        if self.websocket_manager:
            await self.websocket_manager.add_task_update(
                task_id, TaskStatus.CANCELLED.value,
                task.progress, task.results
            )
        
        logger.info(f"Cancelled task: {task_id}")
        return True
    
    async def list_tasks(self, status_filter: Optional[TaskStatus] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List tasks with optional status filter"""
        tasks = []
        
        for task in self.active_tasks.values():
            if status_filter is None or task.status == status_filter:
                tasks.append({
                    "task_id": task.task_id,
                    "task_type": task.task_type.value,
                    "status": task.status.value,
                    "progress": task.progress,
                    "created_at": task.created_at.isoformat(),
                    "estimated_completion": task.estimated_completion.isoformat() if task.estimated_completion else None
                })
        
        # Sort by created_at (newest first) and limit
        tasks.sort(key=lambda x: x["created_at"], reverse=True)
        return tasks[:limit]
    
    async def _task_worker(self, worker_id: str):
        """Task worker that processes tasks from the queue"""
        logger.info(f"Task worker {worker_id} started")
        
        while self.running:
            try:
                # Get task from queue (with timeout to check self.running)
                try:
                    priority, task_id = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                # Acquire semaphore to limit concurrent tasks
                async with self.worker_semaphore:
                    if task_id in self.active_tasks:
                        task = self.active_tasks[task_id]
                        
                        # Skip if task was cancelled
                        if task.status == TaskStatus.CANCELLED:
                            continue
                        
                        try:
                            # Process the task
                            await self._process_task(task, worker_id)
                        except Exception as e:
                            logger.error(f"Error processing task {task_id}: {e}")
                            await self._fail_task(task, str(e))
            
            except Exception as e:
                logger.error(f"Task worker {worker_id} error: {e}")
                await asyncio.sleep(1)
        
        logger.info(f"Task worker {worker_id} stopped")
    
    async def _process_task(self, task: TaskData, worker_id: str):
        """Process a specific task"""
        logger.info(f"Worker {worker_id} processing task: {task.task_id} ({task.task_type.value})")
        
        # Update task status
        task.status = TaskStatus.RUNNING
        task.updated_at = datetime.now(timezone.utc)
        task.progress = {"percentage": 0, "stage": "starting", "worker": worker_id}
        
        await self._store_task_in_db(task)
        
        if self.websocket_manager:
            await self.websocket_manager.add_task_update(
                task.task_id, TaskStatus.RUNNING.value,
                task.progress, None
            )
        
        try:
            # Process based on task type
            if task.task_type == TaskType.MESSAGE_SENDING:
                await self._process_message_sending_task(task)
            elif task.task_type == TaskType.BULK_MESSAGE:
                await self._process_bulk_message_task(task)
            elif task.task_type == TaskType.GROUP_MANAGEMENT:
                await self._process_group_management_task(task)
            else:
                raise ValueError(f"Unknown task type: {task.task_type}")
            
            # Task completed successfully
            task.status = TaskStatus.COMPLETED
            task.updated_at = datetime.now(timezone.utc)
            task.progress["percentage"] = 100
            task.progress["stage"] = "completed"
            
            await self._store_task_in_db(task)
            
            if self.websocket_manager:
                await self.websocket_manager.add_task_update(
                    task.task_id, TaskStatus.COMPLETED.value,
                    task.progress, task.results
                )
                
                await self.websocket_manager.add_log_message(
                    "info", f"Task completed successfully: {task.task_id}",
                    {"task_type": task.task_type.value, "worker": worker_id}
                )
            
            logger.info(f"Task completed: {task.task_id}")
            
        except Exception as e:
            await self._fail_task(task, str(e))
            raise
    
    async def _process_message_sending_task(self, task: TaskData):
        """Process message sending task"""
        parameters = task.parameters
        template_id = parameters.get("template_id")
        recipients = parameters.get("recipients", [])
        custom_variables = parameters.get("custom_variables", {})
        
        if not template_id:
            raise ValueError("template_id is required for message sending")
        
        # Simulate message sending with delays and progress updates
        total_recipients = len(recipients) if recipients else 10  # Default for all groups
        
        task.results = {
            "total_recipients": total_recipients,
            "sent_count": 0,
            "failed_count": 0,
            "skipped_count": 0,
            "messages": []
        }
        
        for i in range(total_recipients):
            # Update progress
            progress_percentage = int((i / total_recipients) * 100)
            task.progress = {
                "percentage": progress_percentage,
                "stage": f"sending_message",
                "current_recipient": i + 1,
                "total_recipients": total_recipients
            }
            
            task.updated_at = datetime.now(timezone.utc)
            await self._store_task_in_db(task)
            
            if self.websocket_manager:
                await self.websocket_manager.add_task_update(
                    task.task_id, TaskStatus.RUNNING.value,
                    task.progress, task.results
                )
            
            # Simulate message sending delay (1-3 seconds)
            delay = 1 + (i % 3)
            await asyncio.sleep(delay)
            
            # Simulate success/failure (90% success rate)
            if i % 10 != 9:  # 90% success
                task.results["sent_count"] += 1
                task.results["messages"].append({
                    "recipient": f"recipient_{i}",
                    "status": "sent",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            else:
                task.results["failed_count"] += 1
                task.results["messages"].append({
                    "recipient": f"recipient_{i}",
                    "status": "failed",
                    "error": "Rate limit exceeded",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    
    async def _process_bulk_message_task(self, task: TaskData):
        """Process bulk message task"""
        parameters = task.parameters
        message_templates = parameters.get("templates", [])
        groups = parameters.get("groups", [])
        
        total_operations = len(message_templates) * len(groups)
        
        task.results = {
            "total_operations": total_operations,
            "completed_operations": 0,
            "templates_processed": 0,
            "groups_processed": 0
        }
        
        operation_count = 0
        
        for template_idx, template in enumerate(message_templates):
            for group_idx, group in enumerate(groups):
                # Update progress
                progress_percentage = int((operation_count / total_operations) * 100)
                task.progress = {
                    "percentage": progress_percentage,
                    "stage": "processing_bulk_messages",
                    "current_template": template_idx + 1,
                    "current_group": group_idx + 1
                }
                
                task.updated_at = datetime.now(timezone.utc)
                await self._store_task_in_db(task)
                
                if self.websocket_manager:
                    await self.websocket_manager.add_task_update(
                        task.task_id, TaskStatus.RUNNING.value,
                        task.progress, task.results
                    )
                
                # Simulate processing delay
                await asyncio.sleep(2)
                
                task.results["completed_operations"] += 1
                operation_count += 1
            
            task.results["templates_processed"] += 1
        
        task.results["groups_processed"] = len(groups)
    
    async def _process_group_management_task(self, task: TaskData):
        """Process group management task"""
        parameters = task.parameters
        operation = parameters.get("operation")  # add, remove, update
        groups = parameters.get("groups", [])
        
        task.results = {
            "operation": operation,
            "total_groups": len(groups),
            "processed_groups": 0,
            "successful_operations": 0,
            "failed_operations": 0
        }
        
        for i, group in enumerate(groups):
            # Update progress
            progress_percentage = int((i / len(groups)) * 100)
            task.progress = {
                "percentage": progress_percentage,
                "stage": f"{operation}_groups",
                "current_group": i + 1,
                "total_groups": len(groups)
            }
            
            task.updated_at = datetime.now(timezone.utc)
            await self._store_task_in_db(task)
            
            if self.websocket_manager:
                await self.websocket_manager.add_task_update(
                    task.task_id, TaskStatus.RUNNING.value,
                    task.progress, task.results
                )
            
            # Simulate group operation delay
            await asyncio.sleep(1.5)
            
            # Simulate 95% success rate
            if i % 20 != 19:
                task.results["successful_operations"] += 1
            else:
                task.results["failed_operations"] += 1
            
            task.results["processed_groups"] += 1
    
    async def _fail_task(self, task: TaskData, error: str):
        """Mark task as failed"""
        task.status = TaskStatus.FAILED
        task.error = error
        task.updated_at = datetime.now(timezone.utc)
        task.progress["stage"] = "failed"
        
        await self._store_task_in_db(task)
        
        if self.websocket_manager:
            await self.websocket_manager.add_task_update(
                task.task_id, TaskStatus.FAILED.value,
                task.progress, task.results
            )
            
            await self.websocket_manager.add_log_message(
                "error", f"Task failed: {task.task_id}",
                {"error": error, "task_type": task.task_type.value}
            )
        
        logger.error(f"Task failed: {task.task_id} - {error}")
    
    async def _store_task_in_db(self, task: TaskData):
        """Store task data in database"""
        try:
            if self.db_service:
                # Store task in MongoDB logs collection with special type
                await self.db_service.add_log(
                    "task",
                    f"Task update: {task.task_id}",
                    {
                        "task_data": asdict(task),
                        "task_id": task.task_id,
                        "task_type": task.task_type.value,
                        "status": task.status.value
                    }
                )
        except Exception as e:
            logger.error(f"Failed to store task in database: {e}")
    
    async def _load_task_from_db(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Load task data from database"""
        try:
            if self.db_service:
                # Load recent task logs
                logs = await self.db_service.get_logs(limit=100, level="task")
                
                # Find latest task update
                for log in logs:
                    metadata = log.get("metadata", {})
                    if metadata.get("task_id") == task_id:
                        task_data = metadata.get("task_data")
                        if task_data:
                            return {
                                "task_id": task_data.get("task_id"),
                                "task_type": task_data.get("task_type"),
                                "status": task_data.get("status"),
                                "progress": task_data.get("progress", {}),
                                "results": task_data.get("results"),
                                "error": task_data.get("error"),
                                "created_at": task_data.get("created_at"),
                                "updated_at": task_data.get("updated_at")
                            }
            return None
        except Exception as e:
            logger.error(f"Failed to load task from database: {e}")
            return None
    
    async def _task_monitor(self):
        """Monitor tasks and clean up completed tasks"""
        while self.running:
            try:
                # Clean up old completed tasks (older than 1 hour)
                cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
                
                tasks_to_remove = []
                for task_id, task in self.active_tasks.items():
                    if (task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED] and
                        task.updated_at < cutoff_time):
                        tasks_to_remove.append(task_id)
                
                for task_id in tasks_to_remove:
                    del self.active_tasks[task_id]
                    logger.info(f"Cleaned up old task: {task_id}")
                
                # Send periodic stats
                if self.websocket_manager:
                    await self.websocket_manager.add_monitoring_event(
                        "task_stats",
                        {
                            "active_tasks": len(self.active_tasks),
                            "queue_size": self.task_queue.qsize(),
                            "by_status": {
                                status.value: len([t for t in self.active_tasks.values() if t.status == status])
                                for status in TaskStatus
                            }
                        }
                    )
                
            except Exception as e:
                logger.error(f"Task monitor error: {e}")
            
            # Sleep for 5 minutes
            await asyncio.sleep(300)