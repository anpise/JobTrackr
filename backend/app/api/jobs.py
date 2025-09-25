"""
Job-related API endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from app.models.job import JobUrlRequest, JobUrlResponse
from app.models.job_application import JobApplication
from app.api.auth import get_current_user

# Create router for job endpoints
router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/submit", response_model=JobUrlResponse)
async def submit_job_url(
    job_request: JobUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit a job URL for processing
    Required fields: user_id, request_id, url, timestamp
    Requires valid JWT token
    """
    try:
        # Validate the request
        if not job_request.user_id or not job_request.request_id:
            raise HTTPException(
                status_code=400, 
                detail="user_id and request_id are required"
            )
        
        # Validate that the user_id matches the authenticated user
        if job_request.user_id != current_user.get("user_id"):
            raise HTTPException(
                status_code=403,
                detail="You can only submit jobs for your own account"
            )
        
        # Generate job ID based on URL
        job_id = JobApplication.generate_job_id(str(job_request.url))
        
        # Check if job URL already exists for this user
        existing_job = await JobApplication.find_one(
            JobApplication.user_id == job_request.user_id,
            JobApplication.job_id == job_id
        )
        if existing_job:
            raise HTTPException(
                status_code=400,
                detail="Job URL already exists for this user"
            )
        
        # Create job application document
        job_application = JobApplication(
            user_id=job_request.user_id,
            request_id=job_request.request_id,
            url=str(job_request.url),
            job_id=job_id,
            title=None,  # Will be extracted later
            company=None,  # Will be extracted later
            location=None,  # Will be extracted later
            description=None,  # Will be extracted later
            requirements=None  # Will be extracted later
        )
        
        # Save to MongoDB
        await job_application.insert()
        
        return JobUrlResponse(
            success=True,
            message="Job URL submitted successfully",
            request_id=job_request.request_id,
            user_id=job_request.user_id,
            timestamp=job_request.timestamp
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process job URL: {str(e)}"
        )

@router.get("/list/{user_id}")
async def list_user_jobs(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List all jobs for a specific user
    Requires valid JWT token and user can only see their own jobs
    """
    # Validate that the user_id matches the authenticated user
    if user_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own jobs"
        )
    
    # Query jobs from MongoDB
    jobs = await JobApplication.find(JobApplication.user_id == user_id).to_list()
    
    # Convert to response format
    job_list = []
    for job in jobs:
        job_list.append({
            "id": str(job.id),
            "job_id": job.job_id,
            "request_id": job.request_id,
            "url": job.url,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "created_at": job.created_at,
            "updated_at": job.updated_at
        })
    
    return {
        "user_id": user_id,
        "jobs": job_list,
        "total": len(job_list)
    }
