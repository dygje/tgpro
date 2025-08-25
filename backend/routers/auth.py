"""
Authentication API router with JWT and encrypted sessions
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging

from models.auth import (
    AuthRequest, VerifyCodeRequest, TwoFARequest, LoginResponse,
    RefreshTokenRequest, LogoutRequest, AuthStatus, TokenPayload,
    SessionInfo, UserInfo
)
from services.auth_service import AuthService
from services.config_service import ConfigService
from telegram_service import TelegramService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)

# These will be injected by the main app
auth_service: AuthService = None
config_service: ConfigService = None
telegram_service: TelegramService = None

def get_auth_service():
    if not auth_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not available"
        )
    return auth_service

def get_config_service():
    if not config_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Configuration service not available"
        )
    return config_service

def get_telegram_service():
    if not telegram_service:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram service not available"
        )
    return telegram_service

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    service: AuthService = Depends(get_auth_service)
) -> Optional[TokenPayload]:
    """Get current authenticated user from JWT token"""
    if not credentials:
        return None
    
    token_payload = await service.verify_access_token(credentials.credentials)
    if not token_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return token_payload

async def require_authentication(
    current_user: TokenPayload = Depends(get_current_user)
) -> TokenPayload:
    """Require valid authentication"""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return current_user

@router.post("/login", response_model=LoginResponse)
async def login_with_phone(
    request: AuthRequest,
    auth_svc: AuthService = Depends(get_auth_service),
    config_svc: ConfigService = Depends(get_config_service),
    tg_service: TelegramService = Depends(get_telegram_service)
):
    """Start authentication process with phone number"""
    try:
        # Check if Telegram is configured
        if not await config_svc.is_telegram_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Telegram API not configured. Please configure API credentials first."
            )
        
        # Create session
        session_id = await auth_svc.create_session(request.phone_number)
        
        # Send verification code via Telegram
        success = await tg_service.send_verification_code(request.phone_number)
        
        if success:
            return LoginResponse(
                success=True,
                message=f"Verification code sent to {request.phone_number}",
                session_id=session_id,
                requires_2fa=False
            )
        else:
            # Clean up session on failure
            await auth_svc.invalidate_session(session_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to send verification code. Please check your phone number and try again."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in login process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service temporarily unavailable"
        )

@router.post("/verify", response_model=LoginResponse)
async def verify_code(
    request: VerifyCodeRequest,
    auth_svc: AuthService = Depends(get_auth_service),
    tg_service: TelegramService = Depends(get_telegram_service)
):
    """Verify phone number with code"""
    try:
        if not request.session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session ID is required"
            )
        
        # Get session
        session = await auth_svc.get_session(request.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired session"
            )
        
        # Verify code with Telegram
        result = await tg_service.verify_code(request.verification_code)
        
        if result["success"]:
            # Authentication successful
            await auth_svc.authenticate_session(request.session_id, requires_2fa=False)
            
            # Create JWT tokens
            tokens = await auth_svc.create_tokens(request.session_id)
            
            return LoginResponse(
                success=True,
                message="Authentication successful",
                session_id=request.session_id,
                requires_2fa=False,
                tokens=tokens
            )
        elif result.get("requires_2fa"):
            # 2FA required
            await auth_svc.update_session(request.session_id, {"requires_2fa": True})
            
            return LoginResponse(
                success=False,
                message="2FA password required",
                session_id=request.session_id,
                requires_2fa=True
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get("error", "Invalid verification code")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying code: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification service temporarily unavailable"
        )

@router.post("/2fa", response_model=LoginResponse)
async def verify_2fa(
    request: TwoFARequest,
    auth_svc: AuthService = Depends(get_auth_service),
    tg_service: TelegramService = Depends(get_telegram_service)
):
    """Verify 2FA password"""
    try:
        if not request.session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session ID is required"
            )
        
        # Get session
        session = await auth_svc.get_session(request.session_id)
        if not session or not session.requires_2fa:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session or 2FA not required"
            )
        
        # Verify 2FA with Telegram
        success = await tg_service.verify_2fa(request.password)
        
        if success:
            # Authentication successful
            await auth_svc.authenticate_session(request.session_id, requires_2fa=False)
            
            # Create JWT tokens
            tokens = await auth_svc.create_tokens(request.session_id)
            
            return LoginResponse(
                success=True,
                message="2FA authentication successful",
                session_id=request.session_id,
                requires_2fa=False,
                tokens=tokens
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA password"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying 2FA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="2FA verification service temporarily unavailable"
        )

@router.post("/refresh")
async def refresh_token(
    request: RefreshTokenRequest,
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Refresh access token"""
    try:
        tokens = await auth_svc.refresh_access_token(request.refresh_token)
        
        if tokens:
            return tokens
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh service temporarily unavailable"
        )

@router.post("/logout")
async def logout(
    request: LogoutRequest,
    current_user: TokenPayload = Depends(require_authentication),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Logout user and invalidate session(s)"""
    try:
        if request.all_sessions:
            # Logout from all sessions
            count = await auth_svc.invalidate_user_sessions(current_user.sub)
            return {"message": f"Logged out from {count} sessions"}
        else:
            # Logout from current session only
            success = await auth_svc.invalidate_session(current_user.session_id)
            if success:
                return {"message": "Logged out successfully"}
            else:
                return {"message": "Session already invalid"}
                
    except Exception as e:
        logger.error(f"Error during logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout service temporarily unavailable"
        )

@router.get("/status", response_model=AuthStatus)
async def get_auth_status(
    current_user: Optional[TokenPayload] = Depends(get_current_user),
    auth_svc: AuthService = Depends(get_auth_service),
    tg_service: TelegramService = Depends(get_telegram_service)
):
    """Get current authentication status"""
    try:
        if not current_user:
            return AuthStatus(authenticated=False)
        
        # Get session info
        session = await auth_svc.get_session(current_user.session_id)
        if not session:
            return AuthStatus(authenticated=False)
        
        # Get account health if telegram is available
        account_health = None
        if tg_service and tg_service.is_initialized():
            account_health = await tg_service.get_account_health()
        
        return AuthStatus(
            authenticated=True,
            phone_number=current_user.phone_number,
            session_valid=True,
            requires_2fa=session.requires_2fa,
            user_id=current_user.sub,
            role=current_user.role,
            account_health=account_health
        )
        
    except Exception as e:
        logger.error(f"Error getting auth status: {e}")
        return AuthStatus(authenticated=False)

@router.get("/me", response_model=UserInfo)
async def get_current_user_info(
    current_user: TokenPayload = Depends(require_authentication),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Get current user information"""
    try:
        user_info = await auth_svc.get_user_info(current_user.sub)
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User information not found"
            )
        
        return user_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User info service temporarily unavailable"
        )

@router.get("/sessions")
async def get_user_sessions(
    current_user: TokenPayload = Depends(require_authentication),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Get all active sessions for current user"""
    try:
        sessions = await auth_svc.get_user_sessions(current_user.sub)
        
        # Mark current session
        for session in sessions:
            if session.session_id == current_user.session_id:
                session.is_current = True
        
        return {"sessions": sessions}
        
    except Exception as e:
        logger.error(f"Error getting user sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sessions service temporarily unavailable"
        )

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: TokenPayload = Depends(require_authentication),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Revoke a specific session"""
    try:
        # Ensure user can only revoke their own sessions
        session = await auth_svc.get_session(session_id)
        if not session or session.user_id != current_user.sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        success = await auth_svc.invalidate_session(session_id)
        if success:
            return {"message": "Session revoked successfully"}
        else:
            return {"message": "Session already invalid"}
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session revocation service temporarily unavailable"
        )

# Background task endpoint for cleaning expired sessions
@router.post("/cleanup")
async def cleanup_expired_sessions(
    current_user: TokenPayload = Depends(require_authentication),
    auth_svc: AuthService = Depends(get_auth_service)
):
    """Clean up expired sessions (admin only)"""
    try:
        # Only admin can run cleanup
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        count = await auth_svc.cleanup_expired_sessions()
        return {"message": f"Cleaned up {count} expired sessions"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cleanup service temporarily unavailable"
        )