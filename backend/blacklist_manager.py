import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Any
from enum import Enum
import aiofiles

logger = logging.getLogger(__name__)

class BlacklistReason(Enum):
    CHAT_FORBIDDEN = "ChatForbidden"
    CHAT_ID_INVALID = "ChatIdInvalid"
    USER_BLOCKED = "UserBlocked"
    PEER_ID_INVALID = "PeerIdInvalid"
    CHAT_WRITE_FORBIDDEN = "ChatWriteForbidden"
    SLOW_MODE = "SlowModeWait"
    FLOOD_WAIT = "FloodWait"
    MANUAL = "Manual"

class BlacklistManager:
    """Manages permanent and temporary blacklists for groups"""
    
    def __init__(self):
        self.blacklist_dir = Path("/app/backend/blacklists")
        self.blacklist_dir.mkdir(exist_ok=True)
        
        self.permanent_file = self.blacklist_dir / "permanent_blacklist.json"
        self.temporary_file = self.blacklist_dir / "temporary_blacklist.json"
        
        # In-memory caches
        self.permanent_blacklist: Set[str] = set()
        self.temporary_blacklist: Dict[str, Dict] = {}
        
        # Load existing blacklists
        asyncio.create_task(self._load_blacklists())
    
    async def _load_blacklists(self):
        """Load blacklists from files"""
        await self._load_permanent_blacklist()
        await self._load_temporary_blacklist()
        await self._cleanup_expired_temporary()
    
    async def _load_permanent_blacklist(self):
        """Load permanent blacklist from file"""
        try:
            if self.permanent_file.exists():
                async with aiofiles.open(self.permanent_file, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    self.permanent_blacklist = set(data.get("blacklisted_groups", []))
                logger.info(f"Loaded {len(self.permanent_blacklist)} permanently blacklisted groups")
            else:
                self.permanent_blacklist = set()
        except Exception as e:
            logger.error(f"Error loading permanent blacklist: {e}")
            self.permanent_blacklist = set()
    
    async def _load_temporary_blacklist(self):
        """Load temporary blacklist from file"""
        try:
            if self.temporary_file.exists():
                async with aiofiles.open(self.temporary_file, 'r') as f:
                    content = await f.read()
                    data = json.loads(content)
                    
                    # Convert expiry strings back to datetime objects
                    for group_link, entry in data.get("blacklisted_groups", {}).items():
                        if "expiry" in entry:
                            entry["expiry"] = datetime.fromisoformat(entry["expiry"])
                    
                    self.temporary_blacklist = data.get("blacklisted_groups", {})
                logger.info(f"Loaded {len(self.temporary_blacklist)} temporarily blacklisted groups")
            else:
                self.temporary_blacklist = {}
        except Exception as e:
            logger.error(f"Error loading temporary blacklist: {e}")
            self.temporary_blacklist = {}
    
    async def _save_permanent_blacklist(self):
        """Save permanent blacklist to file"""
        try:
            data = {
                "blacklisted_groups": list(self.permanent_blacklist),
                "last_updated": datetime.now().isoformat()
            }
            
            async with aiofiles.open(self.permanent_file, 'w') as f:
                await f.write(json.dumps(data, indent=2))
                
        except Exception as e:
            logger.error(f"Error saving permanent blacklist: {e}")
    
    async def _save_temporary_blacklist(self):
        """Save temporary blacklist to file"""
        try:
            # Convert datetime objects to strings for JSON serialization
            serializable_data = {}
            for group_link, entry in self.temporary_blacklist.items():
                serializable_entry = entry.copy()
                if "expiry" in serializable_entry:
                    serializable_entry["expiry"] = serializable_entry["expiry"].isoformat()
                serializable_data[group_link] = serializable_entry
            
            data = {
                "blacklisted_groups": serializable_data,
                "last_updated": datetime.now().isoformat()
            }
            
            async with aiofiles.open(self.temporary_file, 'w') as f:
                await f.write(json.dumps(data, indent=2))
                
        except Exception as e:
            logger.error(f"Error saving temporary blacklist: {e}")
    
    async def _cleanup_expired_temporary(self):
        """Remove expired entries from temporary blacklist"""
        now = datetime.now()
        expired_groups = []
        
        for group_link, entry in self.temporary_blacklist.items():
            if "expiry" in entry and entry["expiry"] <= now:
                expired_groups.append(group_link)
        
        if expired_groups:
            for group_link in expired_groups:
                del self.temporary_blacklist[group_link]
            
            await self._save_temporary_blacklist()
            logger.info(f"Removed {len(expired_groups)} expired temporary blacklist entries")
    
    async def is_permanently_blacklisted(self, group_link: str) -> bool:
        """Check if group is permanently blacklisted"""
        return group_link in self.permanent_blacklist
    
    async def is_temporarily_blacklisted(self, group_link: str) -> bool:
        """Check if group is temporarily blacklisted"""
        if group_link not in self.temporary_blacklist:
            return False
        
        entry = self.temporary_blacklist[group_link]
        if "expiry" in entry and entry["expiry"] <= datetime.now():
            # Entry expired, remove it
            del self.temporary_blacklist[group_link]
            await self._save_temporary_blacklist()
            return False
        
        return True
    
    async def add_to_permanent_blacklist(self, group_link: str, reason: str):
        """Add group to permanent blacklist"""
        self.permanent_blacklist.add(group_link)
        await self._save_permanent_blacklist()
        
        # Also remove from temporary blacklist if present
        if group_link in self.temporary_blacklist:
            del self.temporary_blacklist[group_link]
            await self._save_temporary_blacklist()
        
        logger.warning(f"Added {group_link} to permanent blacklist: {reason}")
    
    async def add_to_temporary_blacklist(
        self, 
        group_link: str, 
        reason: BlacklistReason, 
        expiry_minutes: int = 60
    ):
        """Add group to temporary blacklist"""
        expiry = datetime.now() + timedelta(minutes=expiry_minutes)
        
        self.temporary_blacklist[group_link] = {
            "reason": reason.value,
            "added_at": datetime.now(),
            "expiry": expiry,
            "expiry_minutes": expiry_minutes
        }
        
        await self._save_temporary_blacklist()
        logger.warning(f"Added {group_link} to temporary blacklist: {reason.value} (expires in {expiry_minutes} min)")
    
    async def remove_from_permanent_blacklist(self, group_link: str):
        """Remove group from permanent blacklist"""
        if group_link in self.permanent_blacklist:
            self.permanent_blacklist.remove(group_link)
            await self._save_permanent_blacklist()
            logger.info(f"Removed {group_link} from permanent blacklist")
    
    async def remove_from_temporary_blacklist(self, group_link: str):
        """Remove group from temporary blacklist"""
        if group_link in self.temporary_blacklist:
            del self.temporary_blacklist[group_link]
            await self._save_temporary_blacklist()
            logger.info(f"Removed {group_link} from temporary blacklist")
    
    async def get_permanent_blacklist(self) -> List[str]:
        """Get list of permanently blacklisted groups"""
        return list(self.permanent_blacklist)
    
    async def get_temporary_blacklist(self) -> Dict[str, Dict]:
        """Get temporarily blacklisted groups with details"""
        await self._cleanup_expired_temporary()
        
        result = {}
        for group_link, entry in self.temporary_blacklist.items():
            result[group_link] = {
                "reason": entry["reason"],
                "added_at": entry["added_at"].isoformat() if isinstance(entry["added_at"], datetime) else entry["added_at"],
                "expiry": entry["expiry"].isoformat() if isinstance(entry["expiry"], datetime) else entry["expiry"],
                "expires_in_minutes": max(0, int((entry["expiry"] - datetime.now()).total_seconds() / 60))
            }
        
        return result
    
    async def get_blacklist_stats(self) -> Dict[str, Any]:
        """Get blacklist statistics"""
        await self._cleanup_expired_temporary()
        
        return {
            "permanent_count": len(self.permanent_blacklist),
            "temporary_count": len(self.temporary_blacklist),
            "total_blacklisted": len(self.permanent_blacklist) + len(self.temporary_blacklist)
        }

# Import asyncio here to avoid circular import issues
import asyncio