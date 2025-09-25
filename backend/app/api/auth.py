"""
Authentication API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
import uuid
from app.models.auth import *
from app.models.user import User
from app.core.auth import get_password_hash, verify_password, create_access_token, verify_token, security

# Create router for auth endpoints
router = APIRouter(prefix="/auth", tags=["authentication"])

# MongoDB user storage

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegistration):
    """
    Register a new user
    """
    try:
        # Check if user already exists
        existing_user = await User.find_one(User.username == user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Username already exists"
            )
        
        # Check if email already exists
        existing_email = await User.find_one(User.email == user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        
        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=hashed_password
        )
        
        # Save to MongoDB
        await user.insert()
        
        return UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            created_at=user.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin):
    """
    Login user and return JWT token
    """
    try:
        # Find user in MongoDB
        user = await User.find_one(User.username == login_data.username)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )
        
        # Create access token
        access_token_expires = timedelta(hours=24)
        access_token = create_access_token(
            data={"sub": user.username, "user_id": str(user.id)},
            expires_delta=access_token_expires
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=24 * 60 * 60,  # 24 hours in seconds
            user=UserResponse(
                id=str(user.id),
                username=user.username,
                email=user.email,
                created_at=user.created_at
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout", response_model=LogoutResponse)
async def logout_user():
    """
    Logout user (JWT tokens are stateless, so this is mainly for client-side cleanup)
    """
    return LogoutResponse(
        message="Successfully logged out",
        success=True
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Get current user from JWT token (for protected endpoints)
    """
    token = credentials.credentials
    
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )
    
    username = payload.get("sub")
    user = await User.find_one(User.username == username)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    
    return {
        "user_id": str(user.id),
        "username": user.username,
        "email": user.email
    }

