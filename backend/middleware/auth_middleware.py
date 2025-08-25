"""
JWT Authentication Middleware for TGPro application
"""
import os
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """JWT Authentication Middleware"""
    
    def __init__(self, app, auth_service=None):
        super().__init__(app)
        self.auth_service = auth_service
        
        # Paths that require JWT authentication
        self.jwt_protected_paths = [
            "/api/messages/send",
            "/api/tasks/",
            "/api/templates",
            "/api/auth/logout",
            "/api/auth/me",
            "/api/auth/sessions",
            "/api/auth/cleanup"
        ]
        
        # Paths that use legacy API key authentication
        self.api_key_paths = [
            "/api/health",
            "/api/config/",
            "/api/auth/login",
            "/api/auth/verify", 
            "/api/auth/2fa",
            "/api/auth/refresh",
            "/api/auth/status",
            "/api/groups",
            "/api/blacklist",
            "/api/logs"
        ]
        
        # Public paths (no authentication required)
        self.public_paths = [
            "/",
            "/docs",
            "/openapi.json",
            "/redoc"
        ]
    
    def _should_use_jwt_auth(self, path: str) -> bool:
        """Check if path should use JWT authentication"""
        return any(path.startswith(protected_path) for protected_path in self.jwt_protected_paths)
    
    def _should_use_api_key_auth(self, path: str) -> bool:
        """Check if path should use API key authentication"""
        return any(path.startswith(api_path) for api_path in self.api_key_paths)
    
    def _is_public_path(self, path: str) -> bool:
        """Check if path is public"""
        return any(path.startswith(public_path) for public_path in self.public_paths)
    
    async def _verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        if not self.auth_service:
            return None
        
        try:
            token_payload = await self.auth_service.verify_access_token(token)
            return token_payload.dict() if token_payload else None
        except Exception as e:
            logger.warning(f"JWT verification failed: {e}")
            return None
    
    def _verify_api_key(self, token: str) -> bool:
        """Verify API key"""
        expected_key = os.getenv('API_KEY', 'telegram-automation-key-2025')
        return token == expected_key
    
    async def dispatch(self, request: Request, call_next):
        """Process request with appropriate authentication"""
        path = request.url.path
        
        # Skip authentication for public paths
        if self._is_public_path(path):
            return await call_next(request)
        
        # Get authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            if self._should_use_jwt_auth(path) or self._should_use_api_key_auth(path):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authorization header required",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            return await call_next(request)
        
        token = auth_header.split(" ")[1]
        
        # JWT authentication for protected endpoints
        if self._should_use_jwt_auth(path):
            user_info = await self._verify_jwt_token(token)
            if not user_info:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired JWT token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Add user info to request state
            request.state.user = user_info
            
        # API key authentication for legacy endpoints
        elif self._should_use_api_key_auth(path):
            if not self._verify_api_key(token):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid API key",
                    headers={"WWW-Authenticate": "Bearer"}
                )
        
        return await call_next(request)

def setup_auth_middleware(app, auth_service):
    """Setup authentication middleware"""
    middleware = JWTAuthMiddleware(app, auth_service)
    return middleware