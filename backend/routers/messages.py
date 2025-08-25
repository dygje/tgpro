"""
Messages/Templates management router using MongoDB
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.message import (
    MessageTemplateCreate, MessageTemplate, MessageTemplateUpdate,
    MessageFile, MessageSendRequest, TaskResponse, TaskStatus
)
from services.db_service import DatabaseService
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/messages", tags=["messages"])
security = HTTPBearer()

# Global service references (injected from main app)
db_service: DatabaseService = None

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key authentication"""
    expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
    if credentials.credentials != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return credentials.credentials

@router.get("/", response_model=Dict[str, Any])
async def list_message_templates(api_key: str = Depends(verify_api_key)):
    """List all message templates from MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        messages = await db_service.get_messages()
        
        return {
            "message_templates": messages,
            "total": len(messages),
            "source": "mongodb"
        }
    except Exception as e:
        logger.error(f"Error listing message templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/", response_model=Dict[str, str])
async def create_message_template(
    message_data: MessageTemplateCreate,
    api_key: str = Depends(verify_api_key)
):
    """Create a new message template in MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Check if template already exists
        existing_messages = await db_service.get_messages()
        existing_ids = [msg["template_id"] for msg in existing_messages]
        
        if message_data.template_id in existing_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template ID already exists"
            )
        
        # Add message template to MongoDB
        success = await db_service.add_message(
            message_data.template_id,
            message_data.content,
            message_data.variables
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create message template"
            )
        
        logger.info(f"Created message template in MongoDB: {message_data.template_id}")
        return {
            "message": f"Message template '{message_data.template_id}' created successfully",
            "template_id": message_data.template_id,
            "source": "mongodb"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating message template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.put("/{template_id}", response_model=Dict[str, str])
async def update_message_template(
    template_id: str,
    message_data: MessageTemplateUpdate,
    api_key: str = Depends(verify_api_key)
):
    """Update an existing message template in MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Check if template exists
        existing_messages = await db_service.get_messages()
        existing_ids = [msg["template_id"] for msg in existing_messages]
        
        if template_id not in existing_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        # Update message template in MongoDB
        success = await db_service.update_message(
            template_id,
            message_data.content,
            message_data.variables
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update message template"
            )
        
        logger.info(f"Updated message template in MongoDB: {template_id}")
        return {
            "message": f"Message template '{template_id}' updated successfully",
            "template_id": template_id,
            "source": "mongodb"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating message template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{template_id}", response_model=Dict[str, str])
async def delete_message_template(
    template_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Delete a message template from MongoDB (soft delete)"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Remove message template from MongoDB
        success = await db_service.remove_message(template_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        logger.info(f"Deleted message template from MongoDB: {template_id}")
        return {
            "message": f"Message template '{template_id}' deleted successfully",
            "template_id": template_id,
            "source": "mongodb"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{template_id}", response_model=Dict[str, Any])
async def get_message_template(
    template_id: str,
    api_key: str = Depends(verify_api_key)
):
    """Get a specific message template from MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Get message template from MongoDB
        messages = await db_service.get_messages()
        template = None
        
        for msg in messages:
            if msg["template_id"] == template_id:
                template = msg
                break
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Template not found"
            )
        
        return {
            "template": template,
            "source": "mongodb"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting message template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )