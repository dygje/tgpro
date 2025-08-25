"""
Authentication models for JWT and session management
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime, timezone
from enum import Enum

class TokenType(str, Enum):
    """Token type enumeration"""
    ACCESS = "access"
    REFRESH = "refresh"

class UserRole(str, Enum):
    """User role enumeration"""
    USER = "user"
    ADMIN = "admin"

class AuthRequest(BaseModel):
    """Authentication request model"""
    phone_number: str = Field(..., description="Phone number with country code")

    @validator('phone_number')
    def validate_phone_number(cls, v):
        v = v.strip()
        if not v.startswith('+'):
            raise ValueError('Phone number must start with country code (+)')
        if len(v) < 10 or len(v) > 20:
            raise ValueError('Phone number must be between 10-20 characters')
        return v

class VerifyCodeRequest(BaseModel):
    """Verification code request model"""
    verification_code: str = Field(..., min_length=4, max_length=6, description="Verification code")
    session_id: Optional[str] = Field(None, description="Session ID for verification")

    @validator('verification_code')
    def validate_code(cls, v):
        if not v.isdigit():
            raise ValueError('Verification code must contain only numbers')
        return v

class TwoFARequest(BaseModel):
    """Two-factor authentication request model"""
    password: str = Field(..., min_length=1, description="2FA password")
    session_id: Optional[str] = Field(None, description="Session ID for 2FA")

class TokenPair(BaseModel):
    """JWT token pair model"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")

class TokenPayload(BaseModel):
    """JWT token payload model"""
    sub: str = Field(..., description="Subject (user ID)")
    phone_number: str = Field(..., description="User phone number")
    role: UserRole = Field(UserRole.USER, description="User role")
    session_id: str = Field(..., description="Session ID")
    token_type: TokenType = Field(..., description="Token type")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")
    jti: str = Field(..., description="JWT ID")

class SessionData(BaseModel):
    """Session data model"""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User identifier")
    phone_number: str = Field(..., description="User phone number")
    role: UserRole = Field(UserRole.USER, description="User role")
    telegram_session: Optional[str] = Field(None, description="Encrypted Telegram session data")
    is_authenticated: bool = Field(False, description="Authentication status")
    requires_2fa: bool = Field(False, description="Whether 2FA is required")
    created_at: str = Field(..., description="Session creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    expires_at: str = Field(..., description="Session expiration timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional session metadata")

class AuthStatus(BaseModel):
    """Authentication status model"""
    authenticated: bool = Field(False, description="Whether user is authenticated")
    phone_number: Optional[str] = Field(None, description="User phone number")
    session_valid: bool = Field(False, description="Whether session is valid")
    requires_2fa: bool = Field(False, description="Whether 2FA is required")
    user_id: Optional[str] = Field(None, description="User identifier")
    role: Optional[UserRole] = Field(None, description="User role")
    account_health: Optional[Dict[str, Any]] = Field(None, description="Account health information")

class LoginResponse(BaseModel):
    """Login response model"""
    success: bool = Field(..., description="Whether login was successful")
    message: str = Field(..., description="Response message")
    session_id: Optional[str] = Field(None, description="Session ID")
    requires_2fa: bool = Field(False, description="Whether 2FA is required")
    tokens: Optional[TokenPair] = Field(None, description="JWT tokens if authentication complete")

class RefreshTokenRequest(BaseModel):
    """Refresh token request model"""
    refresh_token: str = Field(..., description="JWT refresh token")

class LogoutRequest(BaseModel):
    """Logout request model"""
    all_sessions: bool = Field(False, description="Logout from all sessions")

class SessionInfo(BaseModel):
    """Session information model"""
    session_id: str = Field(..., description="Session ID")
    user_id: str = Field(..., description="User ID")
    phone_number: str = Field(..., description="Phone number")
    created_at: str = Field(..., description="Creation time")
    last_activity: str = Field(..., description="Last activity time")
    is_current: bool = Field(False, description="Whether this is the current session")

class UserInfo(BaseModel):
    """User information model"""
    user_id: str = Field(..., description="User ID")
    phone_number: str = Field(..., description="Phone number")
    role: UserRole = Field(UserRole.USER, description="User role")
    telegram_authenticated: bool = Field(False, description="Telegram authentication status")
    account_health: Optional[Dict[str, Any]] = Field(None, description="Account health")
    active_sessions: int = Field(0, description="Number of active sessions")
    last_login: Optional[str] = Field(None, description="Last login timestamp")