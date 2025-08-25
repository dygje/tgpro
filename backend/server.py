import os
import json
import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from telegram_service import TelegramService, MessageTemplate, MessageType
from config_manager import ConfigManager
from blacklist_manager import BlacklistManager

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/backend/logs/telegram_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Pydantic models
class AuthRequest(BaseModel):
    phone_number: str = Field(..., description="Phone number with country code")
    
class VerifyCodeRequest(BaseModel):
    verification_code: str = Field(..., description="6-digit verification code")
    
class TwoFARequest(BaseModel):
    password: str = Field(..., description="2FA password")

class MessageRequest(BaseModel):
    template_id: str = Field(..., description="Message template identifier")
    recipients: Optional[List[str]] = Field(default=None, description="Specific recipients, or all from groups.txt")
    custom_variables: Optional[Dict[str, Any]] = Field(default=None, description="Custom template variables")

class TemplateRequest(BaseModel):
    template_id: str = Field(..., description="Unique template identifier")
    content: str = Field(..., description="Message template content")
    variables: Optional[Dict[str, List[str]]] = Field(default=None, description="Template variables for randomization")

class StatusResponse(BaseModel):
    authenticated: bool
    phone_number: Optional[str] = None
    session_valid: bool = False
    account_health: Optional[Dict[str, Any]] = None

class TaskResponse(BaseModel):
    task_id: str
    status: str
    message: str
    estimated_completion: Optional[datetime] = None

class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: Dict[str, Any]
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Global services
telegram_service = None
config_manager = None
blacklist_manager = None

# Security
security = HTTPBearer()

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key authentication"""
    expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
    if credentials.credentials != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return credentials.credentials

# FastAPI app with lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global telegram_service, config_manager, blacklist_manager
    
    try:
        logger.info("Initializing Telegram Automation Service...")
        
        # Initialize managers
        config_manager = ConfigManager()
        blacklist_manager = BlacklistManager()
        telegram_service = TelegramService(config_manager, blacklist_manager)
        
        logger.info("Services initialized successfully")
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    finally:
        # Shutdown
        if telegram_service:
            await telegram_service.shutdown()
        logger.info("Services shutdown completed")

app = FastAPI(
    title="Telegram MTProto Automation Service",
    description="Advanced Telegram automation service using MTProto API with blacklist management and natural message patterns",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "telegram_initialized": telegram_service.is_initialized() if telegram_service else False,
        "timestamp": datetime.now().isoformat(),
        "services": {
            "config_manager": config_manager is not None,
            "blacklist_manager": blacklist_manager is not None,
            "telegram_service": telegram_service is not None
        }
    }

# Authentication endpoints
@app.post("/api/auth/phone")
async def request_verification_code(
    request: AuthRequest,
    api_key: str = Depends(verify_api_key)
):
    """Request verification code for phone number"""
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    
    try:
        success = await telegram_service.send_verification_code(request.phone_number)
        
        if success:
            return {
                "message": f"Verification code sent to {request.phone_number}",
                "phone_number": request.phone_number,
                "status": "code_sent"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send verification code"
            )
            
    except Exception as e:
        logger.error(f"Error requesting verification code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/auth/verify")
async def verify_code(
    request: VerifyCodeRequest,
    api_key: str = Depends(verify_api_key)
):
    """Verify phone number with code"""
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    
    try:
        result = await telegram_service.verify_code(request.verification_code)
        
        if result["success"]:
            return {
                "message": "Authentication successful",
                "authenticated": True,
                "requires_2fa": False
            }
        elif result.get("requires_2fa"):
            return {
                "message": "2FA password required",
                "authenticated": False,
                "requires_2fa": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Verification failed")
            )
            
    except Exception as e:
        logger.error(f"Error verifying code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/auth/2fa")
async def verify_2fa(
    request: TwoFARequest,
    api_key: str = Depends(verify_api_key)
):
    """Verify 2FA password"""
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    
    try:
        success = await telegram_service.verify_2fa(request.password)
        
        if success:
            return {
                "message": "2FA authentication successful",
                "authenticated": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA password"
            )
    except Exception as e:
        logger.error(f"Error verifying 2FA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/auth/status", response_model=StatusResponse)
async def get_auth_status(api_key: str = Depends(verify_api_key)):
    """Get current authentication status"""
    if not telegram_service:
        return StatusResponse(authenticated=False)
    
    status_info = await telegram_service.get_auth_status()
    account_health = await telegram_service.get_account_health() if status_info["authenticated"] else None
    
    return StatusResponse(
        authenticated=status_info["authenticated"],
        phone_number=status_info.get("phone_number"),
        session_valid=status_info.get("session_valid", False),
        account_health=account_health
    )

# Message automation endpoints
@app.post("/api/messages/send", response_model=TaskResponse)
async def send_messages(
    request: MessageRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Send automated messages to groups"""
    if not telegram_service or not telegram_service.is_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available or not authenticated"
        )
    
    try:
        # Validate template exists
        if not await telegram_service.template_exists(request.template_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template '{request.template_id}' not found"
            )
        
        # Create background task
        task_id = str(uuid.uuid4())
        
        background_tasks.add_task(
            telegram_service.send_messages_background,
            task_id=task_id,
            template_id=request.template_id,
            recipients=request.recipients,
            custom_variables=request.custom_variables
        )
        
        return TaskResponse(
            task_id=task_id,
            status="pending",
            message="Message sending task started",
            estimated_completion=datetime.now() + timedelta(minutes=30)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting message task: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get status of a background task"""
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    
    task_data = telegram_service.get_task_status(task_id)
    
    if not task_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return TaskStatusResponse(**task_data)

# Template management endpoints
@app.post("/api/templates")
async def create_template(
    request: TemplateRequest,
    api_key: str = Depends(verify_api_key)
):
    """Create a new message template"""
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    
    try:
        template = MessageTemplate(
            template_id=request.template_id,
            content=request.content,
            message_type=MessageType.TEXT,
            variables=request.variables or {}
        )
        
        await telegram_service.add_template(template)
        
        return {
            "message": f"Template '{request.template_id}' created successfully",
            "template_id": request.template_id
        }
        
    except Exception as e:
        logger.error(f"Error creating template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/templates")
async def list_templates(api_key: str = Depends(verify_api_key)):
    """List all available templates"""
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    
    templates = await telegram_service.list_templates()
    return {"templates": templates}

# Configuration endpoints
@app.get("/api/config")
async def get_config(api_key: str = Depends(verify_api_key)):
    """Get current configuration"""
    if not config_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configuration service not available"
        )
    
    return config_manager.get_config()

@app.put("/api/config") 
async def update_config(
    config_data: Dict[str, Any],
    api_key: str = Depends(verify_api_key)
):
    """Update configuration"""
    if not config_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configuration service not available"
        )
    
    try:
        config_manager.update_config(config_data)
        return {"message": "Configuration updated successfully"}
    except Exception as e:
        logger.error(f"Error updating config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Blacklist management endpoints
@app.get("/api/blacklist")
async def get_blacklist(api_key: str = Depends(verify_api_key)):
    """Get current blacklist status"""
    if not blacklist_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blacklist service not available"
        )
    
    return {
        "permanent_blacklist": await blacklist_manager.get_permanent_blacklist(),
        "temporary_blacklist": await blacklist_manager.get_temporary_blacklist()
    }

@app.post("/api/blacklist/permanent")
async def add_to_permanent_blacklist(
    data: Dict[str, str],
    api_key: str = Depends(verify_api_key)
):
    """Add group to permanent blacklist"""
    if not blacklist_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blacklist service not available"
        )
    
    group_link = data.get("group_link")
    reason = data.get("reason", "Manual addition")
    
    if not group_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="group_link is required"
        )
    
    await blacklist_manager.add_to_permanent_blacklist(group_link, reason)
    return {"message": f"Added {group_link} to permanent blacklist"}

@app.delete("/api/blacklist/permanent/{group_link}")
async def remove_from_permanent_blacklist(
    group_link: str,
    api_key: str = Depends(verify_api_key)
):
    """Remove group from permanent blacklist"""
    if not blacklist_manager:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Blacklist service not available"
        )
    
    await blacklist_manager.remove_from_permanent_blacklist(group_link)
    return {"message": f"Removed {group_link} from permanent blacklist"}

# Groups management endpoints
@app.get("/api/groups")
async def list_groups(api_key: str = Depends(verify_api_key)):
    """List all groups from groups.txt"""
    try:
        groups_file = Path("/app/backend/groups.txt")
        if not groups_file.exists():
            return {"groups": [], "message": "groups.txt file not found"}
        
        groups = []
        with open(groups_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    groups.append(line)
        
        return {"groups": groups, "total": len(groups)}
    except Exception as e:
        logger.error(f"Error reading groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/groups")
async def add_group(
    data: Dict[str, str],
    api_key: str = Depends(verify_api_key)
):
    """Add a group to groups.txt"""
    try:
        group_link = data.get("group_link", "").strip()
        if not group_link:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="group_link is required"
            )
        
        # Validate group link format
        if not (group_link.startswith("https://t.me/") or group_link.startswith("@")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid group link format. Use https://t.me/groupname or @groupname"
            )
        
        groups_file = Path("/app/backend/groups.txt")
        
        # Read existing groups
        existing_groups = []
        if groups_file.exists():
            with open(groups_file, 'r') as f:
                existing_groups = [line.strip() for line in f.readlines()]
        
        # Check if group already exists
        if group_link in existing_groups:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group already exists in the list"
            )
        
        # Add new group
        with open(groups_file, 'a') as f:
            f.write(f"{group_link}\n")
        
        logger.info(f"Added group: {group_link}")
        return {"message": f"Group {group_link} added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.delete("/api/groups/{group_link:path}")
async def remove_group(
    group_link: str,
    api_key: str = Depends(verify_api_key)
):
    """Remove a group from groups.txt"""
    try:
        groups_file = Path("/app/backend/groups.txt")
        if not groups_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Groups file not found"
            )
        
        # Read all lines
        with open(groups_file, 'r') as f:
            lines = f.readlines()
        
        # Filter out the group to remove
        updated_lines = []
        found = False
        for line in lines:
            if line.strip() == group_link:
                found = True
                continue
            updated_lines.append(line)
        
        if not found:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found in the list"
            )
        
        # Write back the updated content
        with open(groups_file, 'w') as f:
            f.writelines(updated_lines)
        
        logger.info(f"Removed group: {group_link}")
        return {"message": f"Group {group_link} removed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/messages")
async def list_message_files(api_key: str = Depends(verify_api_key)):
    """List all message files in messages/ directory"""
    try:
        messages_dir = Path("/app/backend/messages")
        if not messages_dir.exists():
            return {"message_files": [], "message": "messages/ directory not found"}
        
        message_files = []
        for file_path in messages_dir.glob("*.txt"):
            with open(file_path, 'r') as f:
                content = f.read()
            
            message_files.append({
                "filename": file_path.name,
                "content": content,
                "size": file_path.stat().st_size,
                "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
            })
        
        return {"message_files": message_files, "total": len(message_files)}
    except Exception as e:
        logger.error(f"Error reading message files: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/api/messages")
async def create_message_file(
    data: Dict[str, str],
    api_key: str = Depends(verify_api_key)
):
    """Create a new message file"""
    try:
        filename = data.get("filename", "").strip()
        content = data.get("content", "").strip()
        
        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="filename is required"
            )
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="content is required"
            )
        
        # Ensure filename ends with .txt
        if not filename.endswith('.txt'):
            filename += '.txt'
        
        # Validate filename (no path traversal)
        if '/' in filename or '\\' in filename or '..' in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename"
            )
        
        messages_dir = Path("/app/backend/messages")
        messages_dir.mkdir(exist_ok=True)
        
        file_path = messages_dir / filename
        
        # Check if file already exists
        if file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File already exists"
            )
        
        # Write the message file
        with open(file_path, 'w') as f:
            f.write(content)
        
        logger.info(f"Created message file: {filename}")
        return {"message": f"Message file {filename} created successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.put("/api/messages/{filename}")
async def update_message_file(
    filename: str,
    data: Dict[str, str],
    api_key: str = Depends(verify_api_key)
):
    """Update an existing message file"""
    try:
        content = data.get("content", "").strip()
        
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="content is required"
            )
        
        # Validate filename
        if '/' in filename or '\\' in filename or '..' in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename"
            )
        
        messages_dir = Path("/app/backend/messages")
        file_path = messages_dir / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message file not found"
            )
        
        # Update the message file
        with open(file_path, 'w') as f:
            f.write(content)
        
        logger.info(f"Updated message file: {filename}")
        return {"message": f"Message file {filename} updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating message file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.delete("/api/messages/{filename}")
async def delete_message_file(
    filename: str,
    api_key: str = Depends(verify_api_key)
):
    """Delete a message file"""
    try:
        # Validate filename
        if '/' in filename or '\\' in filename or '..' in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename"
            )
        
        messages_dir = Path("/app/backend/messages")
        file_path = messages_dir / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message file not found"
            )
        
        # Delete the message file
        file_path.unlink()
        
        logger.info(f"Deleted message file: {filename}")
        return {"message": f"Message file {filename} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Logs endpoint
@app.get("/api/logs")
async def get_logs(
    lines: int = 100,
    api_key: str = Depends(verify_api_key)
):
    """Get recent log entries"""
    try:
        log_file = Path("/app/backend/logs/telegram_automation.log")
        if not log_file.exists():
            return {"logs": [], "message": "Log file not found"}
        
        with open(log_file, 'r') as f:
            all_lines = f.readlines()
            recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines
        
        return {
            "logs": [line.strip() for line in recent_lines],
            "total_lines": len(recent_lines),
            "log_file": str(log_file)
        }
    except Exception as e:
        logger.error(f"Error reading logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )