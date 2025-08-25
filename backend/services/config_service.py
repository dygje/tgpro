"""
Configuration Service with MongoDB and AES-256 encryption
Replaces the old file-based config_manager.py
"""
import os
import json
from typing import Dict, Any, Optional
from pathlib import Path
import logging
from datetime import datetime, timezone

from .db_service import DatabaseService
from .encryption_service import EncryptionService
from ..models.config import AppConfig, TelegramConfig, ConfigUpdate

logger = logging.getLogger(__name__)

class ConfigService:
    def __init__(self, db_service: DatabaseService, encryption_service: EncryptionService):
        self.db = db_service
        self.encryption = encryption_service
        self._config_cache: Optional[AppConfig] = None
        
    async def initialize(self) -> bool:
        """Initialize config service and migrate from file-based config if needed"""
        try:
            # Check if we need to migrate from old config.json
            await self._migrate_from_file_config()
            
            # Load current config
            await self._load_config()
            
            logger.info("Configuration service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize config service: {e}")
            return False
    
    async def _migrate_from_file_config(self):
        """Migrate configuration from config.json to MongoDB with encryption"""
        try:
            config_file = Path("/app/config.json")
            
            if not config_file.exists():
                logger.info("No config.json found, skipping migration")
                return
                
            # Check if already migrated
            existing_config = await self.db.get_config("telegram")
            if existing_config:
                logger.info("Configuration already exists in database, skipping migration")
                return
            
            # Read old config file
            with open(config_file, 'r') as f:
                old_config = json.load(f)
            
            logger.info("Migrating configuration from config.json to MongoDB...")
            
            # Migrate Telegram config with encryption
            telegram_config = old_config.get("telegram", {})
            if telegram_config.get("api_id") and telegram_config.get("api_hash"):
                # Encrypt sensitive data
                encrypted_telegram = {
                    "api_id": self.encryption.encrypt(str(telegram_config["api_id"])),
                    "api_hash": self.encryption.encrypt(telegram_config["api_hash"])
                }
                
                if telegram_config.get("phone_number"):
                    encrypted_telegram["phone_number"] = telegram_config["phone_number"]
                
                await self.db.save_config("telegram", encrypted_telegram)
                logger.info("Migrated encrypted Telegram configuration")
            
            # Migrate other configs (non-sensitive)
            for config_type in ["delays", "safety", "paths", "logging"]:
                if config_type in old_config:
                    await self.db.save_config(config_type, old_config[config_type])
                    logger.info(f"Migrated {config_type} configuration")
            
            # Backup old config file
            backup_path = config_file.with_suffix('.json.backup')
            config_file.rename(backup_path)
            logger.info(f"Old config backed up to {backup_path}")
            
        except Exception as e:
            logger.error(f"Error migrating config: {e}")
    
    async def _load_config(self) -> AppConfig:
        """Load configuration from database"""
        try:
            # Load Telegram config (encrypted)
            telegram_config_doc = await self.db.get_config("telegram")
            telegram_config = {}
            
            if telegram_config_doc and telegram_config_doc.get("data"):
                encrypted_data = telegram_config_doc["data"]
                
                # Decrypt sensitive fields
                if "api_id" in encrypted_data:
                    telegram_config["api_id"] = int(self.encryption.decrypt(encrypted_data["api_id"]))
                if "api_hash" in encrypted_data:
                    telegram_config["api_hash"] = self.encryption.decrypt(encrypted_data["api_hash"])
                if "phone_number" in encrypted_data:
                    telegram_config["phone_number"] = encrypted_data["phone_number"]
            
            # Load other configs
            config_data = {"telegram": telegram_config}
            
            for config_type in ["delays", "safety", "paths", "logging"]:
                config_doc = await self.db.get_config(config_type)
                if config_doc and config_doc.get("data"):
                    config_data[config_type] = config_doc["data"]
            
            # Create AppConfig with defaults for missing sections
            if not telegram_config:
                # Use empty config if no Telegram config exists
                telegram_config = {"api_id": 0, "api_hash": ""}
            
            self._config_cache = AppConfig(
                telegram=TelegramConfig(**telegram_config),
                **{k: v for k, v in config_data.items() if k != "telegram"}
            )
            
            return self._config_cache
            
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            # Return default config on error
            self._config_cache = AppConfig(
                telegram=TelegramConfig(api_id=0, api_hash="")
            )
            return self._config_cache
    
    async def get_config(self) -> AppConfig:
        """Get current configuration"""
        if not self._config_cache:
            return await self._load_config()
        return self._config_cache
    
    async def update_telegram_config(self, telegram_config: TelegramConfig) -> bool:
        """Update Telegram configuration with encryption"""
        try:
            # Encrypt sensitive data
            encrypted_data = {
                "api_id": self.encryption.encrypt(str(telegram_config.api_id)),
                "api_hash": self.encryption.encrypt(telegram_config.api_hash)
            }
            
            if telegram_config.phone_number:
                encrypted_data["phone_number"] = telegram_config.phone_number
            
            # Save to database
            success = await self.db.save_config("telegram", encrypted_data)
            
            if success:
                # Update cache
                current_config = await self.get_config()
                current_config.telegram = telegram_config
                self._config_cache = current_config
                
                logger.info("Telegram configuration updated successfully")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating Telegram config: {e}")
            return False
    
    async def update_config_section(self, section: str, config_data: Dict[str, Any]) -> bool:
        """Update a configuration section"""
        try:
            success = await self.db.save_config(section, config_data)
            
            if success:
                # Refresh cache
                await self._load_config()
                logger.info(f"Configuration section '{section}' updated successfully")
            
            return success
            
        except Exception as e:
            logger.error(f"Error updating config section {section}: {e}")
            return False
    
    async def get_telegram_config(self) -> Optional[TelegramConfig]:
        """Get Telegram configuration"""
        try:
            config = await self.get_config()
            return config.telegram
        except Exception as e:
            logger.error(f"Error getting Telegram config: {e}")
            return None
    
    async def is_telegram_configured(self) -> bool:
        """Check if Telegram is properly configured"""
        try:
            telegram_config = await self.get_telegram_config()
            return (
                telegram_config and 
                telegram_config.api_id > 0 and 
                len(telegram_config.api_hash) == 32
            )
        except Exception as e:
            logger.error(f"Error checking Telegram config: {e}")
            return False
    
    async def validate_telegram_credentials(self, api_id: int, api_hash: str) -> Dict[str, Any]:
        """Validate Telegram API credentials"""
        validation_result = {
            "valid": False,
            "errors": []
        }
        
        # Validate API ID
        if not isinstance(api_id, int) or api_id <= 0:
            validation_result["errors"].append("API ID must be a positive integer")
        
        # Validate API Hash
        if not isinstance(api_hash, str) or len(api_hash) != 32:
            validation_result["errors"].append("API Hash must be exactly 32 characters")
        
        if not api_hash.isalnum():
            validation_result["errors"].append("API Hash must contain only alphanumeric characters")
        
        # Check for placeholder/dummy values
        if api_id == 12345678 or api_hash.startswith("abcd1234"):
            validation_result["errors"].append("Please use real API credentials from my.telegram.org/apps")
        
        validation_result["valid"] = len(validation_result["errors"]) == 0
        return validation_result
    
    def get_legacy_config_dict(self) -> Dict[str, Any]:
        """Get configuration in legacy format for backward compatibility"""
        if not self._config_cache:
            return {}
            
        return {
            "telegram": {
                "api_id": str(self._config_cache.telegram.api_id),
                "api_hash": self._config_cache.telegram.api_hash,
                "phone_number": self._config_cache.telegram.phone_number or ""
            },
            "delays": self._config_cache.delays.dict(),
            "safety": self._config_cache.safety.dict(),
            "paths": self._config_cache.paths.dict(),
            "logging": self._config_cache.logging.dict()
        }