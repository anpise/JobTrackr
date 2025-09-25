"""
Main API router - combines all endpoint routers
"""

from fastapi import APIRouter
from app.api.jobs import router as jobs_router
from app.api.auth import router as auth_router

# Create main API router
api_router = APIRouter(prefix="/api")

# Include all endpoint routers
api_router.include_router(jobs_router)
api_router.include_router(auth_router)
