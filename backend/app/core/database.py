"""
MongoDB database configuration
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.job_application import JobApplication
from app.models.user import User
from app.core.config import settings

# Global database client
client: AsyncIOMotorClient = None

async def connect_to_mongo():
    """Create database connection"""
    global client
    client = AsyncIOMotorClient(settings.mongodb_url)
    
    # Initialize Beanie with the database
    await init_beanie(
        database=client[settings.database_name],
        document_models=[JobApplication, User]
    )
    
    print(f"Connected to MongoDB: {settings.database_name}")

async def close_mongo_connection():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")
