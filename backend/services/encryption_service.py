"""
AES-256 Encryption Service for secure data storage
"""
import os
import base64
from typing import Optional
from cryptography.fernet import Fernet
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

class EncryptionService:
    def __init__(self, db_client: AsyncIOMotorClient, db_name: str):
        self.client = db_client
        self.db = self.client[db_name]
        self._fernet: Optional[Fernet] = None
        
    async def initialize(self) -> bool:
        """Initialize encryption service and ensure encryption key exists"""
        try:
            key = await self._get_or_create_encryption_key()
            self._fernet = Fernet(key)
            logger.info("Encryption service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize encryption service: {e}")
            return False
    
    async def _get_or_create_encryption_key(self) -> bytes:
        """Get existing encryption key or create new one"""
        # Check if encryption key exists in database
        key_doc = await self.db.secrets.find_one({"type": "encryption_key"})
        
        if key_doc and key_doc.get("key"):
            return key_doc["key"].encode()
        
        # Generate new encryption key
        key = Fernet.generate_key()
        
        # Store in database
        await self.db.secrets.replace_one(
            {"type": "encryption_key"},
            {
                "type": "encryption_key", 
                "key": key.decode(),
                "created_at": "2025-01-25T00:00:00Z"
            },
            upsert=True
        )
        
        logger.info("New encryption key generated and stored")
        return key
    
    def encrypt(self, data: str) -> str:
        """Encrypt string data"""
        if not self._fernet:
            raise RuntimeError("Encryption service not initialized")
        
        encrypted_data = self._fernet.encrypt(data.encode())
        return encrypted_data.decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt string data"""
        if not self._fernet:
            raise RuntimeError("Encryption service not initialized")
        
        decrypted_data = self._fernet.decrypt(encrypted_data.encode())
        return decrypted_data.decode()
    
    def encrypt_dict(self, data_dict: dict) -> dict:
        """Encrypt sensitive values in dictionary"""
        if not self._fernet:
            raise RuntimeError("Encryption service not initialized")
            
        encrypted_dict = {}
        for key, value in data_dict.items():
            if isinstance(value, str) and value.strip():
                encrypted_dict[key] = self.encrypt(value)
            else:
                encrypted_dict[key] = value
                
        return encrypted_dict
    
    def decrypt_dict(self, encrypted_dict: dict) -> dict:
        """Decrypt sensitive values in dictionary"""
        if not self._fernet:
            raise RuntimeError("Encryption service not initialized")
            
        decrypted_dict = {}
        for key, value in encrypted_dict.items():
            if isinstance(value, str) and value.strip():
                try:
                    decrypted_dict[key] = self.decrypt(value)
                except Exception:
                    # If decryption fails, assume it's plain text
                    decrypted_dict[key] = value
            else:
                decrypted_dict[key] = value
                
        return decrypted_dict