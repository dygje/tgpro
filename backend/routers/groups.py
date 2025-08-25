"""
Groups management router using MongoDB
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from models.group import GroupCreate, Group, GroupUpdate, BlacklistCreate, BlacklistResponse
from services.db_service import DatabaseService
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/groups", tags=["groups"])
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
async def list_groups(api_key: str = Depends(verify_api_key)):
    """List all groups from MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        groups = await db_service.get_groups()
        
        return {
            "groups": groups,
            "total": len(groups),
            "source": "mongodb"
        }
    except Exception as e:
        logger.error(f"Error listing groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/", response_model=Dict[str, str])
async def add_group(
    group_data: GroupCreate,
    api_key: str = Depends(verify_api_key)
):
    """Add a group to MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Check if group already exists
        existing_groups = await db_service.get_groups()
        if group_data.group_link in existing_groups:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Group already exists in the database"
            )
        
        # Add group to MongoDB
        success = await db_service.add_group(
            group_data.group_link,
            group_data.metadata
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add group to database"
            )
        
        logger.info(f"Added group to MongoDB: {group_data.group_link}")
        return {
            "message": f"Group {group_data.group_link} added successfully to MongoDB",
            "group_link": group_data.group_link,
            "source": "mongodb"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/{group_link:path}", response_model=Dict[str, str])
async def remove_group(
    group_link: str,
    api_key: str = Depends(verify_api_key)
):
    """Remove a group from MongoDB (soft delete)"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Remove group from MongoDB
        success = await db_service.remove_group(group_link)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found in database"
            )
        
        logger.info(f"Removed group from MongoDB: {group_link}")
        return {
            "message": f"Group {group_link} removed successfully from MongoDB",
            "group_link": group_link,
            "source": "mongodb"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Blacklist management endpoints integrated
@router.get("/blacklist", response_model=BlacklistResponse)
async def get_blacklist(api_key: str = Depends(verify_api_key)):
    """Get blacklisted groups from MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        blacklists = await db_service.get_blacklists()
        
        return BlacklistResponse(
            permanent_blacklist=blacklists["permanent"],
            temporary_blacklist=blacklists["temporary"]
        )
    except Exception as e:
        logger.error(f"Error getting blacklist: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/blacklist/permanent", response_model=Dict[str, str])
async def add_to_permanent_blacklist(
    blacklist_data: BlacklistCreate,
    api_key: str = Depends(verify_api_key)
):
    """Add group to permanent blacklist in MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        success = await db_service.add_to_blacklist(
            blacklist_data.group_link,
            "permanent",
            blacklist_data.reason
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add group to permanent blacklist"
            )
        
        logger.info(f"Added {blacklist_data.group_link} to permanent blacklist")
        return {
            "message": f"Added {blacklist_data.group_link} to permanent blacklist",
            "group_link": blacklist_data.group_link,
            "type": "permanent"
        }
        
    except Exception as e:
        logger.error(f"Error adding to blacklist: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/blacklist/permanent/{group_link:path}", response_model=Dict[str, str])
async def remove_from_permanent_blacklist(
    group_link: str,
    api_key: str = Depends(verify_api_key)
):
    """Remove group from permanent blacklist in MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        success = await db_service.remove_from_blacklist(group_link, "permanent")
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found in permanent blacklist"
            )
        
        logger.info(f"Removed {group_link} from permanent blacklist")
        return {
            "message": f"Removed {group_link} from permanent blacklist",
            "group_link": group_link,
            "type": "permanent"
        }
        
    except Exception as e:
        logger.error(f"Error removing from blacklist: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )