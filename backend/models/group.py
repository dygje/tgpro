"""
Group models for TGPro application
"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime

class GroupBase(BaseModel):
    """Base group model"""
    group_link: str = Field(..., min_length=1, description="Telegram group link or username")

    @validator('group_link')
    def validate_group_link(cls, v):
        v = v.strip()
        if not (v.startswith('https://t.me/') or v.startswith('@')):
            raise ValueError('Group link must start with https://t.me/ or @')
        return v

class GroupCreate(GroupBase):
    """Group creation model"""
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional group metadata")

class GroupUpdate(BaseModel):
    """Group update model"""
    active: Optional[bool] = Field(None, description="Whether group is active")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional group metadata")

class Group(GroupBase):
    """Complete group model"""
    active: bool = Field(True, description="Whether group is active")
    added_at: str = Field(..., description="When group was added")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional group metadata")
    removed_at: Optional[str] = Field(None, description="When group was removed")

class BlacklistEntry(BaseModel):
    """Blacklist entry model"""
    group_link: str = Field(..., description="Group link")
    blacklist_type: str = Field(..., pattern="^(permanent|temporary)$", description="Type of blacklist")
    reason: str = Field("", description="Reason for blacklisting")
    expires_at: Optional[str] = Field(None, description="Expiration time for temporary blacklist")
    active: bool = Field(True, description="Whether entry is active")
    created_at: str = Field(..., description="When entry was created")

class BlacklistCreate(BaseModel):
    """Blacklist creation model"""
    group_link: str = Field(..., description="Group link to blacklist")
    reason: Optional[str] = Field("", description="Reason for blacklisting")

class BlacklistResponse(BaseModel):
    """Blacklist response model"""
    permanent_blacklist: list = Field(default_factory=list, description="Permanent blacklisted groups")
    temporary_blacklist: list = Field(default_factory=list, description="Temporary blacklisted groups")