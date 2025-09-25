"""
Job Application MongoDB document model
"""

from beanie import Document
from pydantic import BaseModel, HttpUrl
from datetime import datetime, timezone
from typing import Optional
import hashlib

class JobApplication(Document):
    """Job Application MongoDB document"""
    
    # User information
    user_id: str
    request_id: str
    
    # Job information
    url: str
    job_id: str  # Unique identifier based on URL
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    
    # Metadata
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)
    
    @classmethod
    def generate_job_id(cls, url: str) -> str:
        """Generate a unique job ID based on the URL"""
        # Create a hash of the URL for consistent job ID
        url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
        return f"job_{url_hash[:12]}"  # Use first 12 characters of hash
    
    class Settings:
        name = "job_applications"
        indexes = [
            "user_id",
            "request_id",
            "job_id",
            "created_at"
        ]
