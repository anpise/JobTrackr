"""
FastAPI Backend - Main Application
Entry point for the FastAPI application
"""

from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager
from app.api.router import api_router
from app.core.database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

# Create FastAPI application
app = FastAPI(
    title="JobTrackr API",
    description="Job application tracking system",
    version="1.0.0",
    lifespan=lifespan
)

# Include API router
app.include_router(api_router)

@app.get("/health")
def health_check():
    """Health check endpoint - returns API status"""
    return {
        "status": "healthy",
        "message": "API is running",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
