"""
Authentication-related Pydantic models
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserRegistration(BaseModel):
    """User registration request"""
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    """User login request"""
    username: str
    password: str

class UserResponse(BaseModel):
    """User response (without password)"""
    id: str
    username: str
    email: str
    created_at: datetime

class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str
    expires_in: int  # seconds
    user: UserResponse

class LogoutResponse(BaseModel):
    """Logout response"""
    message: str
    success: bool
