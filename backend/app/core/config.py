"""
Application configuration
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB Configuration
    mongodb_url: str
    database_name: str
    
    # JWT Configuration
    secret_key: str
    algorithm: str
    access_token_expire_hours: int
    
    # Application Configuration
    debug: bool
    log_level: str
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Create settings instance
settings = Settings()
