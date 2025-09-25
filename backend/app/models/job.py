"""
Job-related Pydantic models
"""

from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional

class JobUrlRequest(BaseModel):
    """Request model for job URL submission"""
    user_id: str
    request_id: str
    url: HttpUrl
    timestamp: datetime

class JobUrlResponse(BaseModel):
    """Response model for job URL submission"""
    success: bool
    message: str
    request_id: str
    user_id: str
    timestamp: datetime
