"""
Configuration models for TGPro application
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator

class TelegramConfig(BaseModel):
    """Telegram API configuration model"""
    api_id: int = Field(..., gt=0, description="Telegram API ID from my.telegram.org")
    api_hash: str = Field(..., min_length=32, max_length=32, description="Telegram API Hash from my.telegram.org")
    phone_number: Optional[str] = Field(None, description="Phone number with country code")

    @validator('api_hash')
    def validate_api_hash(cls, v):
        if not v.isalnum():
            raise ValueError('API hash must contain only alphanumeric characters')
        return v

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if v and not v.startswith('+'):
            raise ValueError('Phone number must start with country code (+)')
        return v

class DelayConfig(BaseModel):
    """Message delay configuration"""
    min_delay_msg: int = Field(5, ge=1, le=3600, description="Minimum delay between messages (seconds)")
    max_delay_msg: int = Field(10, ge=1, le=3600, description="Maximum delay between messages (seconds)")
    min_cycle_delay_hours: float = Field(1.1, ge=0.1, le=24, description="Minimum delay between cycles (hours)")
    max_cycle_delay_hours: float = Field(1.3, ge=0.1, le=24, description="Maximum delay between cycles (hours)")

    @validator('max_delay_msg')
    def validate_max_delay(cls, v, values):
        if 'min_delay_msg' in values and v < values['min_delay_msg']:
            raise ValueError('max_delay_msg must be >= min_delay_msg')
        return v

    @validator('max_cycle_delay_hours')
    def validate_max_cycle_delay(cls, v, values):
        if 'min_cycle_delay_hours' in values and v < values['min_cycle_delay_hours']:
            raise ValueError('max_cycle_delay_hours must be >= min_cycle_delay_hours')
        return v

class SafetyConfig(BaseModel):
    """Safety and limits configuration"""
    max_messages_per_hour: int = Field(50, ge=1, le=1000, description="Maximum messages per hour")
    max_messages_per_day: int = Field(200, ge=1, le=10000, description="Maximum messages per day")
    enable_content_analysis: bool = Field(True, description="Enable spam content analysis")
    enable_warmup_schedule: bool = Field(True, description="Enable gradual warmup for new accounts")

class PathConfig(BaseModel):
    """File paths configuration"""
    groups_file: str = Field("/app/backend/groups.txt", description="Path to groups file")
    messages_dir: str = Field("/app/backend/messages", description="Path to messages directory")
    logs_file: str = Field("/app/backend/logs/telegram_automation.log", description="Path to log file")

class LoggingConfig(BaseModel):
    """Logging configuration"""
    level: str = Field("info", pattern="^(debug|info|warning|error|critical)$", description="Log level")
    file: str = Field("/app/backend/logs/telegram_automation.log", description="Log file path")

class AppConfig(BaseModel):
    """Complete application configuration"""
    telegram: TelegramConfig
    delays: DelayConfig = DelayConfig()
    safety: SafetyConfig = SafetyConfig()
    paths: PathConfig = PathConfig()
    logging: LoggingConfig = LoggingConfig()

class ConfigUpdate(BaseModel):
    """Configuration update request"""
    telegram: Optional[TelegramConfig] = None
    delays: Optional[DelayConfig] = None
    safety: Optional[SafetyConfig] = None
    paths: Optional[PathConfig] = None
    logging: Optional[LoggingConfig] = None