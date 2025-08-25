"""
Migration management router for MongoDB data migration
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.migration import DataMigration
from services.db_service import DatabaseService
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/migration", tags=["migration"])
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

@router.post("/run", response_model=Dict[str, Any])
async def run_migration(
    background_tasks: BackgroundTasks,
    api_key: str = Depends(verify_api_key)
):
    """Run complete data migration from files to MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Create migration instance
        migration = DataMigration(db_service)
        
        # Run migration synchronously for immediate feedback
        results = await migration.run_full_migration()
        
        # Verify migration
        verification = await migration.verify_migration()
        
        logger.info("Migration completed via API")
        
        return {
            "message": "Migration completed successfully",
            "results": results,
            "verification": verification,
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error running migration via API: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/verify", response_model=Dict[str, Any])
async def verify_migration(api_key: str = Depends(verify_api_key)):
    """Verify migration status and data consistency"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Create migration instance
        migration = DataMigration(db_service)
        
        # Run verification
        verification = await migration.verify_migration()
        
        return {
            "message": "Migration verification completed",
            "verification": verification,
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error verifying migration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/status", response_model=Dict[str, Any])
async def get_migration_status(api_key: str = Depends(verify_api_key)):
    """Get current migration status and data counts"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Get data counts from MongoDB
        groups = await db_service.get_groups()
        messages = await db_service.get_messages()
        blacklists = await db_service.get_blacklists()
        
        # Count file-based data for comparison
        from pathlib import Path
        backend_dir = Path("/app/backend")
        
        # Count groups in file
        groups_file_count = 0
        groups_file = backend_dir / "groups.txt"
        if groups_file.exists():
            with open(groups_file, 'r') as f:
                for line in f:
                    if line.strip() and not line.startswith('#'):
                        groups_file_count += 1
        
        # Count message files
        messages_dir = backend_dir / "messages"
        messages_file_count = 0
        if messages_dir.exists():
            messages_file_count = len(list(messages_dir.glob("*.txt")))
        
        return {
            "mongodb_data": {
                "groups": len(groups),
                "message_templates": len(messages),
                "permanent_blacklist": len(blacklists["permanent"]),
                "temporary_blacklist": len(blacklists["temporary"])
            },
            "file_data": {
                "groups_file": groups_file_count,
                "message_files": messages_file_count
            },
            "migration_complete": len(groups) >= groups_file_count and len(messages) >= messages_file_count,
            "timestamp": "2025-01-01T00:00:00Z"
        }
        
    except Exception as e:
        logger.error(f"Error getting migration status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/groups", response_model=Dict[str, Any])
async def migrate_groups_only(api_key: str = Depends(verify_api_key)):
    """Migrate only groups data from file to MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Create migration instance
        migration = DataMigration(db_service)
        
        # Migrate groups only
        success = await migration.migrate_groups_from_file()
        
        if success:
            return {
                "message": "Groups migration completed successfully",
                "success": True,
                "timestamp": "2025-01-01T00:00:00Z"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Groups migration failed"
            )
        
    except Exception as e:
        logger.error(f"Error migrating groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/messages", response_model=Dict[str, Any])
async def migrate_messages_only(api_key: str = Depends(verify_api_key)):
    """Migrate only message templates from files to MongoDB"""
    try:
        if not db_service:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service not available"
            )
        
        # Create migration instance
        migration = DataMigration(db_service)
        
        # Migrate messages only
        success = await migration.migrate_messages_from_files()
        
        if success:
            return {
                "message": "Messages migration completed successfully",
                "success": True,
                "timestamp": "2025-01-01T00:00:00Z"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Messages migration failed"
            )
        
    except Exception as e:
        logger.error(f"Error migrating messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )