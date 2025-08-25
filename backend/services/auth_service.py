"""
JWT Authentication Service for TGPro application
"""
import os
import jwt
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from cryptography.fernet import Fernet
import logging

from .db_service import DatabaseService
from .encryption_service import EncryptionService
from models.auth import (
    TokenPair, TokenPayload, SessionData, AuthStatus, 
    TokenType, UserRole, SessionInfo, UserInfo
)

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db_service: DatabaseService, encryption_service: EncryptionService):
        self.db = db_service
        self.encryption = encryption_service
        self._jwt_secret: Optional[str] = None
        self._algorithm = "HS256"
        self._access_token_expire_minutes = 60  # 1 hour
        self._refresh_token_expire_days = 30    # 30 days
        
    async def initialize(self) -> bool:
        """Initialize auth service and ensure JWT secret exists"""
        try:
            self._jwt_secret = await self._get_or_create_jwt_secret()
            logger.info("Authentication service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize auth service: {e}")
            return False
    
    async def _get_or_create_jwt_secret(self) -> str:
        """Get existing JWT secret or create new one"""
        # Check if JWT secret exists in database
        secret_doc = await self.db.db.secrets.find_one({"type": "jwt_secret"})
        
        if secret_doc and secret_doc.get("key"):
            return secret_doc["key"]
        
        # Generate new JWT secret (256 bits)
        jwt_secret = Fernet.generate_key().decode()
        
        # Store in database
        await self.db.db.secrets.replace_one(
            {"type": "jwt_secret"},
            {
                "type": "jwt_secret", 
                "key": jwt_secret,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            upsert=True
        )
        
        logger.info("New JWT secret generated and stored")
        return jwt_secret
    
    def _create_token_payload(self, user_id: str, phone_number: str, session_id: str, 
                            token_type: TokenType, role: UserRole = UserRole.USER) -> Dict[str, Any]:
        """Create JWT token payload"""
        now = datetime.now(timezone.utc)
        
        if token_type == TokenType.ACCESS:
            exp = now + timedelta(minutes=self._access_token_expire_minutes)
        else:  # REFRESH
            exp = now + timedelta(days=self._refresh_token_expire_days)
        
        return {
            "sub": user_id,
            "phone_number": phone_number,
            "role": role.value,
            "session_id": session_id,
            "token_type": token_type.value,
            "exp": int(exp.timestamp()),
            "iat": int(now.timestamp()),
            "jti": str(uuid.uuid4())
        }
    
    def _create_jwt_token(self, payload: Dict[str, Any]) -> str:
        """Create JWT token from payload"""
        return jwt.encode(payload, self._jwt_secret, algorithm=self._algorithm)
    
    def _decode_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, self._jwt_secret, algorithms=[self._algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None
    
    async def create_session(self, phone_number: str, telegram_session_data: Optional[str] = None) -> str:
        """Create a new user session"""
        try:
            session_id = str(uuid.uuid4())
            user_id = f"user_{phone_number.replace('+', '').replace(' ', '')}"
            
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(days=self._refresh_token_expire_days)
            
            # Encrypt Telegram session data if provided
            encrypted_telegram_session = None
            if telegram_session_data:
                encrypted_telegram_session = self.encryption.encrypt(telegram_session_data)
            
            session_data = {
                "session_id": session_id,
                "user_id": user_id,
                "phone_number": phone_number,
                "role": UserRole.USER.value,
                "telegram_session": encrypted_telegram_session,
                "is_authenticated": False,
                "requires_2fa": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "metadata": {}
            }
            
            await self.db.db.sessions.replace_one(
                {"session_id": session_id},
                session_data,
                upsert=True
            )
            
            logger.info(f"Created new session: {session_id} for user: {phone_number}")
            return session_id
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get session data by ID"""
        try:
            session_doc = await self.db.db.sessions.find_one({"session_id": session_id})
            if not session_doc:
                return None
            
            # Check if session is expired
            expires_at = datetime.fromisoformat(session_doc["expires_at"].replace('Z', '+00:00'))
            if expires_at < datetime.now(timezone.utc):
                await self.invalidate_session(session_id)
                return None
            
            return SessionData(**session_doc)
            
        except Exception as e:
            logger.error(f"Error getting session {session_id}: {e}")
            return None
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data"""
        try:
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            result = await self.db.db.sessions.update_one(
                {"session_id": session_id},
                {"$set": updates}
            )
            
            return result.matched_count > 0
            
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return False
    
    async def authenticate_session(self, session_id: str, requires_2fa: bool = False) -> bool:
        """Mark session as authenticated"""
        updates = {
            "is_authenticated": True,
            "requires_2fa": requires_2fa
        }
        return await self.update_session(session_id, updates)
    
    async def create_tokens(self, session_id: str) -> Optional[TokenPair]:
        """Create JWT token pair for authenticated session"""
        try:
            session = await self.get_session(session_id)
            if not session or not session.is_authenticated:
                return None
            
            # Create access token
            access_payload = self._create_token_payload(
                session.user_id, session.phone_number, session_id, 
                TokenType.ACCESS, session.role
            )
            access_token = self._create_jwt_token(access_payload)
            
            # Create refresh token
            refresh_payload = self._create_token_payload(
                session.user_id, session.phone_number, session_id,
                TokenType.REFRESH, session.role
            )
            refresh_token = self._create_jwt_token(refresh_payload)
            
            return TokenPair(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=self._access_token_expire_minutes * 60
            )
            
        except Exception as e:
            logger.error(f"Error creating tokens for session {session_id}: {e}")
            return None
    
    async def verify_access_token(self, token: str) -> Optional[TokenPayload]:
        """Verify and decode access token"""
        try:
            payload = self._decode_jwt_token(token)
            if not payload or payload.get("token_type") != TokenType.ACCESS.value:
                return None
            
            # Verify session still exists and is valid
            session = await self.get_session(payload.get("session_id"))
            if not session or not session.is_authenticated:
                return None
            
            return TokenPayload(**payload)
            
        except Exception as e:
            logger.error(f"Error verifying access token: {e}")
            return None
    
    async def refresh_access_token(self, refresh_token: str) -> Optional[TokenPair]:
        """Refresh access token using refresh token"""
        try:
            payload = self._decode_jwt_token(refresh_token)
            if not payload or payload.get("token_type") != TokenType.REFRESH.value:
                return None
            
            session_id = payload.get("session_id")
            session = await self.get_session(session_id)
            if not session or not session.is_authenticated:
                return None
            
            # Create new token pair
            return await self.create_tokens(session_id)
            
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
    
    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate session"""
        try:
            result = await self.db.db.sessions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "is_authenticated": False,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Invalidated session: {session_id}")
            return result.matched_count > 0
            
        except Exception as e:
            logger.error(f"Error invalidating session {session_id}: {e}")
            return False
    
    async def invalidate_user_sessions(self, user_id: str, except_session: Optional[str] = None) -> int:
        """Invalidate all sessions for a user"""
        try:
            filter_query = {"user_id": user_id}
            if except_session:
                filter_query["session_id"] = {"$ne": except_session}
            
            result = await self.db.db.sessions.update_many(
                filter_query,
                {"$set": {
                    "is_authenticated": False,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Invalidated {result.modified_count} sessions for user {user_id}")
            return result.modified_count
            
        except Exception as e:
            logger.error(f"Error invalidating user sessions: {e}")
            return 0
    
    async def get_user_sessions(self, user_id: str, active_only: bool = True) -> List[SessionInfo]:
        """Get all sessions for a user"""
        try:
            filter_query = {"user_id": user_id}
            if active_only:
                filter_query["is_authenticated"] = True
            
            cursor = self.db.db.sessions.find(filter_query)
            sessions = []
            
            async for doc in cursor:
                sessions.append(SessionInfo(
                    session_id=doc["session_id"],
                    user_id=doc["user_id"],
                    phone_number=doc["phone_number"],
                    created_at=doc["created_at"],
                    last_activity=doc["updated_at"],
                    is_current=False  # Will be set by caller
                ))
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {e}")
            return []
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions"""
        try:
            now = datetime.now(timezone.utc).isoformat()
            
            result = await self.db.db.sessions.delete_many({
                "expires_at": {"$lt": now}
            })
            
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} expired sessions")
            
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Error cleaning up expired sessions: {e}")
            return 0
    
    async def get_user_info(self, user_id: str) -> Optional[UserInfo]:
        """Get user information"""
        try:
            # Get latest session for user
            session_doc = await self.db.db.sessions.find_one(
                {"user_id": user_id},
                sort=[("updated_at", -1)]
            )
            
            if not session_doc:
                return None
            
            # Count active sessions
            active_sessions = await self.db.db.sessions.count_documents({
                "user_id": user_id,
                "is_authenticated": True
            })
            
            return UserInfo(
                user_id=user_id,
                phone_number=session_doc["phone_number"],
                role=UserRole(session_doc.get("role", "user")),
                telegram_authenticated=bool(session_doc.get("telegram_session")),
                active_sessions=active_sessions,
                last_login=session_doc.get("updated_at")
            )
            
        except Exception as e:
            logger.error(f"Error getting user info for {user_id}: {e}")
            return None