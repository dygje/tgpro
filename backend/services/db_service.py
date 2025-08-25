"""
MongoDB Database Service for TGPro application
"""
import os
from typing import Dict, List, Optional, Any
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        
    async def connect(self) -> bool:
        """Connect to MongoDB"""
        try:
            mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
            db_name = os.environ.get('DB_NAME', 'tgpro')
            
            self.client = AsyncIOMotorClient(mongo_url)
            self.db = self.client[db_name]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Connected to MongoDB: {db_name}")
            
            # Ensure indexes
            await self._ensure_indexes()
            
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    async def _ensure_indexes(self):
        """Create necessary database indexes"""
        try:
            # Configs collection indexes
            await self.db.configs.create_index([("type", 1)], unique=True)
            
            # Secrets collection indexes  
            await self.db.secrets.create_index([("type", 1)], unique=True)
            
            # Groups collection indexes
            await self.db.groups.create_index([("group_link", 1)], unique=True)
            
            # Messages collection indexes
            await self.db.messages.create_index([("template_id", 1)], unique=True)
            
            # Blacklists collection indexes
            await self.db.blacklists.create_index([("group_link", 1), ("type", 1)])
            
            # Logs collection indexes
            await self.db.logs.create_index([("timestamp", -1)])
            
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating database indexes: {e}")
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    # Configuration methods
    async def get_config(self, config_type: str) -> Optional[Dict[str, Any]]:
        """Get configuration by type"""
        try:
            config = await self.db.configs.find_one({"type": config_type})
            return config
        except Exception as e:
            logger.error(f"Error getting config {config_type}: {e}")
            return None
    
    async def save_config(self, config_type: str, config_data: Dict[str, Any]) -> bool:
        """Save configuration"""
        try:
            config_doc = {
                "type": config_type,
                "data": config_data,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = await self.db.configs.replace_one(
                {"type": config_type},
                config_doc,
                upsert=True
            )
            
            logger.info(f"Config {config_type} saved successfully")
            return True
        except Exception as e:
            logger.error(f"Error saving config {config_type}: {e}")
            return False
    
    # Groups methods
    async def get_groups(self) -> List[str]:
        """Get all groups"""
        try:
            cursor = self.db.groups.find({"active": True})
            groups = []
            async for doc in cursor:
                groups.append(doc["group_link"])
            return groups
        except Exception as e:
            logger.error(f"Error getting groups: {e}")
            return []
    
    async def add_group(self, group_link: str, metadata: Optional[Dict] = None) -> bool:
        """Add a group"""
        try:
            group_doc = {
                "group_link": group_link,
                "active": True,
                "added_at": datetime.now(timezone.utc).isoformat(),
                "metadata": metadata or {}
            }
            
            await self.db.groups.insert_one(group_doc)
            logger.info(f"Group added: {group_link}")
            return True
        except Exception as e:
            logger.error(f"Error adding group {group_link}: {e}")
            return False
    
    async def remove_group(self, group_link: str) -> bool:
        """Remove a group (soft delete)"""
        try:
            result = await self.db.groups.update_one(
                {"group_link": group_link},
                {"$set": {"active": False, "removed_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                logger.info(f"Group removed: {group_link}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing group {group_link}: {e}")
            return False
    
    # Messages methods
    async def get_messages(self) -> List[Dict[str, Any]]:
        """Get all message templates"""
        try:
            cursor = self.db.messages.find({"active": True})
            messages = []
            async for doc in cursor:
                messages.append({
                    "template_id": doc.get("template_id"),
                    "content": doc.get("content"),
                    "variables": doc.get("variables", {}),
                    "created_at": doc.get("created_at")
                })
            return messages
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return []
    
    async def add_message(self, template_id: str, content: str, variables: Optional[Dict] = None) -> bool:
        """Add a message template"""
        try:
            message_doc = {
                "template_id": template_id,
                "content": content,
                "variables": variables or {},
                "active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await self.db.messages.insert_one(message_doc)
            logger.info(f"Message template added: {template_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding message {template_id}: {e}")
            return False
    
    async def update_message(self, template_id: str, content: str, variables: Optional[Dict] = None) -> bool:
        """Update a message template"""
        try:
            update_doc = {
                "content": content,
                "variables": variables or {},
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = await self.db.messages.update_one(
                {"template_id": template_id},
                {"$set": update_doc}
            )
            
            if result.matched_count > 0:
                logger.info(f"Message template updated: {template_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error updating message {template_id}: {e}")
            return False
    
    async def remove_message(self, template_id: str) -> bool:
        """Remove a message template (soft delete)"""
        try:
            result = await self.db.messages.update_one(
                {"template_id": template_id},
                {"$set": {"active": False, "removed_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                logger.info(f"Message template removed: {template_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing message {template_id}: {e}")
            return False

    # Blacklist methods
    async def get_blacklists(self) -> Dict[str, List[str]]:
        """Get blacklists"""
        try:
            cursor = self.db.blacklists.find({"active": True})
            permanent = []
            temporary = []
            
            async for doc in cursor:
                if doc.get("blacklist_type") == "permanent":
                    permanent.append(doc["group_link"])
                elif doc.get("blacklist_type") == "temporary":
                    temporary.append(doc["group_link"])
            
            return {"permanent": permanent, "temporary": temporary}
        except Exception as e:
            logger.error(f"Error getting blacklists: {e}")
            return {"permanent": [], "temporary": []}
    
    async def add_to_blacklist(self, group_link: str, blacklist_type: str, reason: str = "", expires_at: Optional[str] = None) -> bool:
        """Add group to blacklist"""
        try:
            blacklist_doc = {
                "group_link": group_link,
                "blacklist_type": blacklist_type,
                "reason": reason,
                "active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            if expires_at:
                blacklist_doc["expires_at"] = expires_at
            
            await self.db.blacklists.insert_one(blacklist_doc)
            logger.info(f"Added {group_link} to {blacklist_type} blacklist")
            return True
        except Exception as e:
            logger.error(f"Error adding {group_link} to blacklist: {e}")
            return False
    
    async def remove_from_blacklist(self, group_link: str, blacklist_type: str) -> bool:
        """Remove group from blacklist"""
        try:
            result = await self.db.blacklists.update_one(
                {"group_link": group_link, "blacklist_type": blacklist_type},
                {"$set": {"active": False, "removed_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            if result.matched_count > 0:
                logger.info(f"Removed {group_link} from {blacklist_type} blacklist")
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing {group_link} from blacklist: {e}")
            return False

    # Logs methods
    async def add_log(self, level: str, message: str, metadata: Optional[Dict] = None) -> bool:
        """Add log entry"""
        try:
            log_doc = {
                "level": level,
                "message": message,
                "metadata": metadata or {},
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            await self.db.logs.insert_one(log_doc)
            return True
        except Exception as e:
            logger.error(f"Error adding log: {e}")
            return False
    
    async def get_logs(self, limit: int = 100, level: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent logs"""
        try:
            filter_query = {}
            if level:
                filter_query["level"] = level
            
            cursor = self.db.logs.find(filter_query).sort("timestamp", -1).limit(limit)
            logs = []
            async for doc in cursor:
                logs.append({
                    "level": doc.get("level"),
                    "message": doc.get("message"),
                    "timestamp": doc.get("timestamp"),
                    "metadata": doc.get("metadata", {})
                })
            
            return logs
        except Exception as e:
            logger.error(f"Error getting logs: {e}")
            return []