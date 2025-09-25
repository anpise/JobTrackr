"""
User MongoDB document model
"""

from beanie import Document
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import Optional

class User(Document):
    """User MongoDB document"""
    
    # User information
    username: str
    email: EmailStr
    password_hash: str
    
    # Metadata
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    is_active: bool = True
    
    # Profile information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    class Settings:
        name = "users"
        indexes = [
            "username",
            "email"
        ]
