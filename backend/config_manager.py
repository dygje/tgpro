import json
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ConfigManager:
    """Manages configuration settings from config.json"""
    
    def __init__(self, config_file: str = "/app/config.json"):
        self.config_file = Path(config_file)
        self.config = self._load_default_config()
        self._load_config()
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration"""
        return {
            "telegram": {
                "api_id": "",
                "api_hash": "",
                "phone_number": ""
            },
            "delays": {
                "min_delay_msg": 5,
                "max_delay_msg": 10,
                "min_cycle_delay_hours": 1.1,
                "max_cycle_delay_hours": 1.3
            },
            "paths": {
                "groups_file": "/app/backend/groups.txt",
                "messages_dir": "/app/backend/messages"
            },
            "logging": {
                "level": "info",
                "file": "/app/backend/logs/telegram_automation.log"
            },
            "safety": {
                "max_messages_per_hour": 50,
                "max_messages_per_day": 200,
                "enable_content_analysis": True,
                "enable_warmup_schedule": True
            }
        }
    
    def _load_config(self):
        """Load configuration from file"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r') as f:
                    file_config = json.load(f)
                    self._merge_config(self.config, file_config)
                logger.info(f"Configuration loaded from {self.config_file}")
            else:
                logger.info("Config file not found, using defaults")
                self._save_config()
        except Exception as e:
            logger.error(f"Error loading config: {e}")
    
    def _merge_config(self, default: Dict[str, Any], override: Dict[str, Any]):
        """Recursively merge configuration dictionaries"""
        for key, value in override.items():
            if key in default and isinstance(default[key], dict) and isinstance(value, dict):
                self._merge_config(default[key], value)
            else:
                default[key] = value
    
    def _save_config(self):
        """Save current configuration to file"""
        try:
            self.config_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Configuration saved to {self.config_file}")
        except Exception as e:
            logger.error(f"Error saving config: {e}")
    
    def get_config(self) -> Dict[str, Any]:
        """Get current configuration"""
        return self.config.copy()
    
    def update_config(self, updates: Dict[str, Any]):
        """Update configuration with new values"""
        self._merge_config(self.config, updates)
        self._save_config()
        logger.info("Configuration updated")
    
    def get(self, key_path: str, default=None):
        """Get configuration value by dot-separated path"""
        keys = key_path.split('.')
        value = self.config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        
        return value