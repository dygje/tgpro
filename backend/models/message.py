"""
Message template models for TGPro application
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator
from enum import Enum

class MessageType(str, Enum):
    """Message type enumeration"""
    TEXT = "text"
    MEDIA = "media"
    DOCUMENT = "document"

class MessageVariables(BaseModel):
    """Message template variables model"""
    variables: Dict[str, List[str]] = Field(
        default_factory=dict,
        description="Template variables with possible values for randomization"
    )

    @validator('variables')
    def validate_variables(cls, v):
        for key, values in v.items():
            if not isinstance(values, list) or len(values) == 0:
                raise ValueError(f'Variable {key} must have at least one value')
        return v

class MessageTemplateBase(BaseModel):
    """Base message template model"""
    template_id: str = Field(..., min_length=1, max_length=100, description="Unique template identifier")
    content: str = Field(..., min_length=1, description="Message template content")

    @validator('template_id')
    def validate_template_id(cls, v):
        # Only allow alphanumeric, underscore, and hyphen
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Template ID can only contain letters, numbers, underscore, and hyphen')
        return v

class MessageTemplateCreate(MessageTemplateBase):
    """Message template creation model"""
    message_type: MessageType = Field(MessageType.TEXT, description="Type of message")
    variables: Optional[Dict[str, List[str]]] = Field(None, description="Template variables")

class MessageTemplateUpdate(BaseModel):
    """Message template update model"""
    content: Optional[str] = Field(None, min_length=1, description="Message template content")
    message_type: Optional[MessageType] = Field(None, description="Type of message")
    variables: Optional[Dict[str, List[str]]] = Field(None, description="Template variables")
    active: Optional[bool] = Field(None, description="Whether template is active")

class MessageTemplate(MessageTemplateBase):
    """Complete message template model"""
    message_type: MessageType = Field(MessageType.TEXT, description="Type of message")
    variables: Dict[str, List[str]] = Field(default_factory=dict, description="Template variables")
    active: bool = Field(True, description="Whether template is active")
    created_at: str = Field(..., description="When template was created")
    updated_at: Optional[str] = Field(None, description="When template was last updated")

class MessageFile(BaseModel):
    """Message file model (for backward compatibility)"""
    filename: str = Field(..., description="Message file name")
    content: str = Field(..., description="Message file content")
    size: int = Field(..., description="File size in bytes")
    modified: str = Field(..., description="Last modified timestamp")

class MessageSendRequest(BaseModel):
    """Message sending request model"""
    template_id: str = Field(..., description="Message template identifier")
    recipients: Optional[List[str]] = Field(None, description="Specific recipients, or all from groups")
    custom_variables: Optional[Dict[str, Any]] = Field(None, description="Custom template variables")
    delay_override: Optional[Dict[str, int]] = Field(None, description="Override default delays")

class TaskStatus(BaseModel):
    """Task status model"""
    task_id: str = Field(..., description="Task identifier")
    status: str = Field(..., description="Task status")
    progress: Dict[str, Any] = Field(default_factory=dict, description="Task progress information")
    results: Optional[Dict[str, Any]] = Field(None, description="Task results")
    error: Optional[str] = Field(None, description="Error message if task failed")
    created_at: str = Field(..., description="Task creation time")
    updated_at: str = Field(..., description="Last update time")

class TaskResponse(BaseModel):
    """Task response model"""
    task_id: str = Field(..., description="Task identifier")
    status: str = Field(..., description="Task status")
    message: str = Field(..., description="Status message")
    estimated_completion: Optional[str] = Field(None, description="Estimated completion time")