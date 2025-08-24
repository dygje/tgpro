import os
import json
import asyncio
import logging
import random
import string
from typing import Dict, List, Optional, Union, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path

from pyrogram import Client
from pyrogram.errors import (
    FloodWait, PhoneCodeInvalid, PhoneCodeExpired, 
    SessionPasswordNeeded, PasswordHashInvalid,
    ChatForbidden, ChatIdInvalid, UserBlocked, PeerIdInvalid,
    SlowModeWait, ChatWriteForbidden
)
import jinja2
import aiofiles

from config_manager import ConfigManager
from blacklist_manager import BlacklistManager, BlacklistReason
from rate_limiter import TelegramRateLimiter
from account_safety import AccountSafetyManager

logger = logging.getLogger(__name__)

class MessageType(Enum):
    TEXT = "text"
    MEDIA = "media"
    DOCUMENT = "document"

@dataclass
class MessageTemplate:
    template_id: str
    content: str
    message_type: MessageType = MessageType.TEXT
    media_path: Optional[str] = None
    variables: Dict[str, List[str]] = field(default_factory=dict)

class TelegramService:
    """Main service for Telegram automation operations"""
    
    def __init__(self, config_manager: ConfigManager, blacklist_manager: BlacklistManager):
        self.config_manager = config_manager
        self.blacklist_manager = blacklist_manager
        self.rate_limiter = TelegramRateLimiter()
        self.safety_manager = AccountSafetyManager()
        
        self.client: Optional[Client] = None
        self.templates: Dict[str, MessageTemplate] = {}
        self.tasks: Dict[str, Dict[str, Any]] = {}
        
        # Authentication state
        self.phone_number: Optional[str] = None
        self.phone_code_hash: Optional[str] = None
        self.is_authenticated = False
        
        # Jinja2 environment for template rendering
        self.jinja_env = jinja2.Environment(
            loader=jinja2.DictLoader({}),
            autoescape=True
        )
        
        # Session directory
        self.session_dir = Path("/app/backend/telegram_sessions")
        self.session_dir.mkdir(exist_ok=True)
    
    def is_initialized(self) -> bool:
        """Check if service is initialized and authenticated"""
        return self.client is not None and self.is_authenticated
    
    async def send_verification_code(self, phone_number: str) -> bool:
        """Send verification code to phone number"""
        try:
            # Get API credentials from config
            config = self.config_manager.get_config()
            api_id = config.get("telegram", {}).get("api_id")
            api_hash = config.get("telegram", {}).get("api_hash")
            
            if not api_id or not api_hash:
                logger.error("Telegram API credentials not configured")
                return False
            
            # Create client if not exists
            if not self.client:
                self.client = Client(
                    name="telegram_automation",
                    api_id=int(api_id),
                    api_hash=api_hash,
                    workdir=str(self.session_dir)
                )
            
            await self.client.connect()
            
            # Send verification code
            sent_code = await self.client.send_code(phone_number)
            self.phone_number = phone_number
            self.phone_code_hash = sent_code.phone_code_hash
            
            logger.info(f"Verification code sent to {phone_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending verification code: {e}")
            return False
    
    async def verify_code(self, verification_code: str) -> Dict[str, Any]:
        """Verify phone number with code"""
        if not self.client or not self.phone_number or not self.phone_code_hash:
            return {"success": False, "error": "No pending verification"}
        
        try:
            await self.client.sign_in(
                self.phone_number,
                self.phone_code_hash,
                verification_code
            )
            
            self.is_authenticated = True
            logger.info(f"Successfully authenticated {self.phone_number}")
            
            return {"success": True}
            
        except SessionPasswordNeeded:
            logger.info("2FA password required")
            return {"success": False, "requires_2fa": True}
            
        except (PhoneCodeInvalid, PhoneCodeExpired) as e:
            logger.error(f"Invalid or expired verification code: {e}")
            return {"success": False, "error": "Invalid or expired verification code"}
            
        except Exception as e:
            logger.error(f"Error verifying code: {e}")
            return {"success": False, "error": str(e)}
    
    async def verify_2fa(self, password: str) -> bool:
        """Verify 2FA password"""
        if not self.client:
            return False
        
        try:
            await self.client.check_password(password)
            self.is_authenticated = True
            logger.info("2FA authentication successful")
            return True
            
        except PasswordHashInvalid:
            logger.error("Invalid 2FA password")
            return False
            
        except Exception as e:
            logger.error(f"Error verifying 2FA: {e}")
            return False
    
    async def get_auth_status(self) -> Dict[str, Any]:
        """Get current authentication status"""
        if not self.client:
            return {"authenticated": False}
        
        try:
            if self.is_authenticated:
                me = await self.client.get_me()
                return {
                    "authenticated": True,
                    "phone_number": self.phone_number,
                    "session_valid": True,
                    "user_id": me.id,
                    "username": me.username,
                    "first_name": me.first_name
                }
        except Exception as e:
            logger.error(f"Error getting auth status: {e}")
            self.is_authenticated = False
        
        return {"authenticated": False, "session_valid": False}
    
    async def get_account_health(self) -> Dict[str, Any]:
        """Get account health metrics"""
        return await self.safety_manager.generate_safety_report()
    
    async def add_template(self, template: MessageTemplate):
        """Add a message template"""
        self.templates[template.template_id] = template
        # Add to Jinja environment
        self.jinja_env.loader.mapping[template.template_id] = template.content
        logger.info(f"Added template: {template.template_id}")
    
    async def template_exists(self, template_id: str) -> bool:
        """Check if template exists"""
        return template_id in self.templates
    
    async def list_templates(self) -> Dict[str, Any]:
        """List all templates"""
        templates = {}
        for template_id, template in self.templates.items():
            templates[template_id] = {
                "template_id": template.template_id,
                "message_type": template.message_type.value,
                "has_variables": len(template.variables) > 0,
                "variable_count": len(template.variables)
            }
        return templates
    
    async def load_groups_from_file(self) -> List[str]:
        """Load groups from groups.txt file"""
        groups_file = Path("/app/backend/groups.txt")
        groups = []
        
        try:
            if groups_file.exists():
                async with aiofiles.open(groups_file, 'r') as f:
                    content = await f.read()
                    for line in content.split('\n'):
                        line = line.strip()
                        if line and not line.startswith('#'):
                            groups.append(line)
            else:
                logger.warning("groups.txt file not found")
        except Exception as e:
            logger.error(f"Error loading groups: {e}")
        
        return groups
    
    async def load_random_message(self) -> Optional[str]:
        """Load a random message from messages/ directory"""
        messages_dir = Path("/app/backend/messages")
        
        try:
            if not messages_dir.exists():
                logger.warning("messages/ directory not found")
                return None
            
            message_files = list(messages_dir.glob("*.txt"))
            if not message_files:
                logger.warning("No message files found in messages/ directory")
                return None
            
            # Select random message file
            selected_file = random.choice(message_files)
            
            async with aiofiles.open(selected_file, 'r') as f:
                content = await f.read()
                return content.strip()
                
        except Exception as e:
            logger.error(f"Error loading random message: {e}")
            return None
    
    async def generate_message_content(
        self,
        template: MessageTemplate,
        custom_variables: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate message content from template"""
        variables = custom_variables or {}
        
        # Add default variables
        variables.update({
            'current_time': datetime.now().strftime('%H:%M'),
            'current_date': datetime.now().strftime('%Y-%m-%d'),
            'random_string': ''.join(random.choices(string.ascii_letters, k=3)),
            'random_number': random.randint(100, 999)
        })
        
        # Add template-specific random variables
        for var_name, var_options in template.variables.items():
            if var_name not in variables:
                variables[var_name] = random.choice(var_options)
        
        # Render template with Jinja2
        jinja_template = self.jinja_env.get_template(template.template_id)
        return jinja_template.render(**variables)
    
    async def send_message_to_group(
        self,
        group_link: str,
        message: str,
        delay_before: Optional[float] = None
    ) -> Dict[str, Any]:
        """Send message to a specific group"""
        if not self.client or not self.is_authenticated:
            return {"success": False, "error": "Not authenticated"}
        
        # Check blacklists
        if await self.blacklist_manager.is_permanently_blacklisted(group_link):
            return {"success": False, "error": "Group is permanently blacklisted", "skipped": True}
        
        if await self.blacklist_manager.is_temporarily_blacklisted(group_link):
            return {"success": False, "error": "Group is temporarily blacklisted", "skipped": True}
        
        # Apply delay if specified
        if delay_before:
            await asyncio.sleep(delay_before)
        
        try:
            # Send message with rate limiting
            await self.rate_limiter.acquire('messages')
            
            result = await self.client.send_message(group_link, message)
            
            logger.info(f"Message sent successfully to {group_link}")
            return {
                "success": True,
                "message_id": result.id,
                "chat_id": result.chat.id,
                "group_link": group_link
            }
            
        except FloodWait as e:
            logger.warning(f"FloodWait for {e.value} seconds on {group_link}")
            await self.blacklist_manager.add_to_temporary_blacklist(
                group_link, 
                BlacklistReason.FLOOD_WAIT,
                expiry_minutes=e.value // 60 + 1
            )
            return {"success": False, "error": f"FloodWait: {e.value}s", "flood_wait": True}
            
        except (ChatForbidden, ChatIdInvalid, UserBlocked, PeerIdInvalid) as e:
            logger.error(f"Permanent error for {group_link}: {e}")
            await self.blacklist_manager.add_to_permanent_blacklist(group_link, str(e))
            return {"success": False, "error": str(e), "permanent_error": True}
            
        except SlowModeWait as e:
            logger.warning(f"SlowModeWait for {e.value} seconds on {group_link}")
            await self.blacklist_manager.add_to_temporary_blacklist(
                group_link,
                BlacklistReason.SLOW_MODE,
                expiry_minutes=e.value // 60 + 1
            )
            return {"success": False, "error": f"SlowModeWait: {e.value}s", "slow_mode": True}
            
        except ChatWriteForbidden as e:
            logger.error(f"Write forbidden for {group_link}: {e}")
            await self.blacklist_manager.add_to_permanent_blacklist(group_link, str(e))
            return {"success": False, "error": str(e), "permanent_error": True}
            
        except Exception as e:
            logger.error(f"Unexpected error sending to {group_link}: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_messages_background(
        self,
        task_id: str,
        template_id: str,
        recipients: Optional[List[str]] = None,
        custom_variables: Optional[Dict[str, Any]] = None
    ):
        """Background task for sending messages"""
        if not self.is_authenticated:
            self.tasks[task_id] = {
                "task_id": task_id,
                "status": "failed",
                "error": "Not authenticated",
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            return
        
        # Initialize task
        self.tasks[task_id] = {
            "task_id": task_id,
            "status": "running",
            "progress": {"current": 0, "total": 0, "sent": 0, "failed": 0, "skipped": 0},
            "results": None,
            "error": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        try:
            # Get template
            template = self.templates.get(template_id)
            if not template:
                raise ValueError(f"Template {template_id} not found")
            
            # Get recipients (groups)
            if recipients:
                target_groups = recipients
            else:
                target_groups = await self.load_groups_from_file()
            
            if not target_groups:
                raise ValueError("No groups to send messages to")
            
            # Update task progress
            self.tasks[task_id]["progress"]["total"] = len(target_groups)
            
            # Load configuration
            config = self.config_manager.get_config()
            min_delay = config.get("delays", {}).get("min_delay_msg", 5)
            max_delay = config.get("delays", {}).get("max_delay_msg", 10)
            
            results = {
                "sent": [],
                "failed": [],
                "skipped": [],
                "total": len(target_groups)
            }
            
            logger.info(f"Starting message campaign {task_id}: {template_id} to {len(target_groups)} groups")
            
            # Send messages to each group
            for i, group_link in enumerate(target_groups):
                try:
                    # Generate message content for this group
                    message_content = await self.generate_message_content(template, custom_variables)
                    
                    # Add random delay (except for first message)
                    delay = random.uniform(min_delay, max_delay) if i > 0 else 0
                    
                    # Send message
                    result = await self.send_message_to_group(
                        group_link, 
                        message_content,
                        delay_before=delay
                    )
                    
                    # Process result
                    if result["success"]:
                        results["sent"].append({
                            "group_link": group_link,
                            "message_id": result.get("message_id"),
                            "timestamp": datetime.now().isoformat()
                        })
                        self.tasks[task_id]["progress"]["sent"] += 1
                    elif result.get("skipped"):
                        results["skipped"].append({
                            "group_link": group_link,
                            "reason": result["error"]
                        })
                        self.tasks[task_id]["progress"]["skipped"] += 1
                    else:
                        results["failed"].append({
                            "group_link": group_link,
                            "error": result["error"]
                        })
                        self.tasks[task_id]["progress"]["failed"] += 1
                    
                    # Update progress
                    self.tasks[task_id]["progress"]["current"] = i + 1
                    self.tasks[task_id]["updated_at"] = datetime.now()
                    
                except Exception as e:
                    logger.error(f"Error processing group {group_link}: {e}")
                    results["failed"].append({
                        "group_link": group_link,
                        "error": str(e)
                    })
                    self.tasks[task_id]["progress"]["failed"] += 1
            
            # Complete task
            self.tasks[task_id].update({
                "status": "completed",
                "results": results,
                "updated_at": datetime.now()
            })
            
            # Update safety manager
            self.safety_manager.update_metrics_after_operation(
                "send_messages",
                results,
                had_flood_wait=any("flood_wait" in str(f.get("error", "")) for f in results["failed"])
            )
            
            logger.info(f"Campaign {task_id} completed: {len(results['sent'])} sent, "
                       f"{len(results['failed'])} failed, {len(results['skipped'])} skipped")
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {e}")
            self.tasks[task_id].update({
                "status": "failed",
                "error": str(e),
                "updated_at": datetime.now()
            })
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a background task"""
        return self.tasks.get(task_id)
    
    async def shutdown(self):
        """Clean shutdown of Telegram service"""
        if self.client:
            try:
                await self.client.disconnect()
                logger.info("Telegram client disconnected")
            except Exception as e:
                logger.error(f"Error disconnecting client: {e}")