"""
Configuration API router with MongoDB and encryption
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from ..models.config import TelegramConfig, ConfigUpdate
from ..services.config_service import ConfigService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/config", tags=["configuration"])
security = HTTPBearer()

# This will be injected by the main app
config_service: ConfigService = None

def get_config_service():
    if not config_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configuration service not available"
        )
    return config_service

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API key authentication"""
    import os
    expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
    if credentials.credentials != expected_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return credentials.credentials

@router.get("/telegram")
async def get_telegram_configuration(
    api_key: str = Depends(verify_api_key),
    service: ConfigService = Depends(get_config_service)
):
    """Get current Telegram API configuration status (without exposing sensitive data)"""
    try:
        telegram_config = await service.get_telegram_config()
        is_configured = await service.is_telegram_configured()
        
        return {
            "configured": is_configured,
            "api_id_configured": telegram_config.api_id > 0 if telegram_config else False,
            "api_hash_configured": len(telegram_config.api_hash) == 32 if telegram_config else False,
            "phone_number": telegram_config.phone_number if telegram_config else ""
        }
        
    except Exception as e:
        logger.error(f"Error getting Telegram configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get configuration"
        )

@router.post("/telegram")
async def update_telegram_configuration(
    config: TelegramConfig,
    api_key: str = Depends(verify_api_key),
    service: ConfigService = Depends(get_config_service)
):
    """Update Telegram API credentials (encrypted storage)"""
    try:
        # Validate credentials
        validation = await service.validate_telegram_credentials(config.api_id, config.api_hash)
        
        if not validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Invalid credentials", "errors": validation["errors"]}
            )
        
        # Update configuration
        success = await service.update_telegram_config(config)
        
        if success:
            return {
                "message": "Telegram API credentials configured successfully",
                "configured": True
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save configuration"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating Telegram configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {str(e)}"
        )

@router.get("/")
async def get_full_configuration(
    api_key: str = Depends(verify_api_key),
    service: ConfigService = Depends(get_config_service)
):
    """Get complete application configuration (without sensitive data)"""
    try:
        config = await service.get_config()
        
        # Return configuration without sensitive data
        return {
            "telegram": {
                "api_id_configured": config.telegram.api_id > 0,
                "api_hash_configured": len(config.telegram.api_hash) == 32,
                "phone_number": config.telegram.phone_number or ""
            },
            "delays": config.delays.dict(),
            "safety": config.safety.dict(),
            "paths": config.paths.dict(),
            "logging": config.logging.dict()
        }
        
    except Exception as e:
        logger.error(f"Error getting configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get configuration"
        )

@router.put("/")
async def update_configuration(
    config_update: ConfigUpdate,
    api_key: str = Depends(verify_api_key),
    service: ConfigService = Depends(get_config_service)
):
    """Update application configuration sections"""
    try:
        updated_sections = []
        
        # Update Telegram config if provided
        if config_update.telegram:
            validation = await service.validate_telegram_credentials(
                config_update.telegram.api_id, 
                config_update.telegram.api_hash
            )
            
            if not validation["valid"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": "Invalid Telegram credentials", "errors": validation["errors"]}
                )
            
            success = await service.update_telegram_config(config_update.telegram)
            if success:
                updated_sections.append("telegram")
        
        # Update other sections
        for section_name, section_data in [
            ("delays", config_update.delays),
            ("safety", config_update.safety), 
            ("paths", config_update.paths),
            ("logging", config_update.logging)
        ]:
            if section_data:
                success = await service.update_config_section(section_name, section_data.dict())
                if success:
                    updated_sections.append(section_name)
        
        return {
            "message": f"Configuration updated successfully",
            "updated_sections": updated_sections
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update configuration"
        )

@router.get("/status")
async def get_configuration_status(
    api_key: str = Depends(verify_api_key),
    service: ConfigService = Depends(get_config_service)
):
    """Get configuration status and health check"""
    try:
        is_telegram_configured = await service.is_telegram_configured()
        
        return {
            "telegram_configured": is_telegram_configured,
            "database_connected": service.db.client is not None,
            "encryption_initialized": service.encryption._fernet is not None,
            "status": "ready" if is_telegram_configured else "configuration_required"
        }
        
    except Exception as e:
        logger.error(f"Error getting configuration status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get status"
        )

# Legacy compatibility endpoints
@router.get("/legacy")
async def get_legacy_configuration(
    api_key: str = Depends(verify_api_key),
    service: ConfigService = Depends(get_config_service)
):
    """Get configuration in legacy format for backward compatibility"""
    try:
        legacy_config = service.get_legacy_config_dict()
        
        # Remove sensitive data from legacy response
        if "telegram" in legacy_config:
            legacy_config["telegram"] = {
                "api_id": "***" if legacy_config["telegram"].get("api_id", "0") != "0" else "",
                "api_hash": "***" if legacy_config["telegram"].get("api_hash", "") else "",
                "phone_number": legacy_config["telegram"].get("phone_number", "")
            }
        
        return legacy_config
        
    except Exception as e:
        logger.error(f"Error getting legacy configuration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get legacy configuration"
        )