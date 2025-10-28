"""
Request handlers for the JobTrackr Lambda API
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from utils import create_response, create_error_response, create_success_response, parse_request_body, validate_url_input, sanitize_request_data
from processor import process_job
from db import get_user_jobs, delete_job, update_job, get_user_job_stats

logger = logging.getLogger(__name__)


def handle_job_ingest(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle job ingest POST requests
    Expects url in request body, user_id from Cognito
    Optional: resume_url
    """
    try:
        # Extract user_id from Cognito authorizer context
        user_id = None
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})

        # Log for debugging
        logger.info(f"Request context: {request_context}")
        logger.info(f"Authorizer: {authorizer}")

        # Get user_id from Cognito claims
        if 'claims' in authorizer:
            user_id = authorizer['claims'].get('sub')  # Cognito user ID

        if not user_id:
            logger.error(f"No user_id found. Full event: {event}")
            return create_error_response(401, "Unauthorized - No user ID found", "UNAUTHORIZED")

        # Parse request body
        body = parse_request_body(event)
        if not body:
            return create_error_response(400, "Invalid request body", "INVALID_BODY")

        # Sanitize input data
        sanitized_body = sanitize_request_data(body)

        # Extract and validate URL
        url = sanitized_body.get('url')
        validation_result = validate_url_input(url)

        if not validation_result["valid"]:
            return create_error_response(400, validation_result["error"], validation_result["code"])

        # Use the validated/sanitized URL
        url = validation_result["url"]

        # Extract optional resume_url
        resume_url = sanitized_body.get('resume_url')

        # Process the job
        processing_result = process_job(url, user_id, resume_url)

        if processing_result.get("status") == "completed":
            return create_success_response({
                "message": "Job URL processed successfully",
                "status": "completed"
            })
        else:
            return create_error_response(500, "Job processing failed", "PROCESSING_FAILED")

    except Exception as e:
        logger.error(f"Error processing job ingest: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")


def handle_get_jobs(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET request to retrieve user's jobs with pagination
    Query parameters:
        - limit (optional, default: 10, max: 50)
        - last_key (optional, base64 encoded pagination token)
    User ID is extracted from Cognito authorizer
    """
    try:
        # Extract user_id from Cognito authorizer context
        user_id = None
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})

        # Get user_id from Cognito claims
        if 'claims' in authorizer:
            user_id = authorizer['claims'].get('sub')  # Cognito user ID

        if not user_id:
            return create_error_response(401, "Unauthorized - No user ID found", "UNAUTHORIZED")

        # Extract query parameters
        params = event.get('queryStringParameters') or {}

        # Get limit (optional, default 10, max 50)
        limit = int(params.get('limit', 10))
        if limit > 50:
            limit = 50
        if limit < 1:
            limit = 10

        # Get pagination token (optional)
        last_key = None
        if params.get('last_key'):
            try:
                import base64
                last_key_json = base64.b64decode(params['last_key']).decode('utf-8')
                last_key = json.loads(last_key_json)
            except Exception as e:
                logger.warning(f"Failed to decode pagination token: {str(e)}")
                # Continue without pagination token

        # Query database
        result = get_user_jobs(user_id, limit, last_key)

        # Prepare response
        response_data = {
            "jobs": result.get('items', []),
            "count": len(result.get('items', []))
        }

        # Add pagination token if available
        if 'last_key' in result:
            import base64
            last_key_json = json.dumps(result['last_key'])
            response_data['next_page_token'] = base64.b64encode(last_key_json.encode()).decode('utf-8')

        return create_success_response(response_data)

    except ValueError as e:
        logger.error(f"Invalid parameter value: {str(e)}", exc_info=True)
        return create_error_response(400, "Invalid parameter value", "INVALID_PARAMETER")
    except Exception as e:
        logger.error(f"Error retrieving jobs: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")


def handle_update_job(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle PUT request to update a job
    Path: /api/jobs/{job_id}?applied_ts={timestamp}
    Body: { "status": "...", "notes": "..." }
    """
    try:
        # Extract user_id from Cognito authorizer context
        user_id = None
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})

        # Get user_id from Cognito claims
        if 'claims' in authorizer:
            user_id = authorizer['claims'].get('sub')

        if not user_id:
            return create_error_response(401, "Unauthorized - No user ID found", "UNAUTHORIZED")

        # Extract job_id from path
        path = event.get('path', '')
        job_id = path.split('/')[-1]

        if not job_id:
            return create_error_response(400, "Job ID is required", "MISSING_JOB_ID")

        # Extract applied_ts from query parameters
        params = event.get('queryStringParameters') or {}
        applied_ts = params.get('applied_ts')

        if not applied_ts:
            return create_error_response(400, "applied_ts query parameter is required", "MISSING_APPLIED_TS")

        # Parse request body
        body = parse_request_body(event)
        if not body:
            return create_error_response(400, "Invalid request body", "INVALID_BODY")

        # Extract fields to update (status, notes, resume_url)
        updates = {}
        if 'status' in body:
            updates['status'] = body['status']
        if 'notes' in body:
            updates['notes'] = body['notes']
        if 'resume_url' in body:
            updates['resume_url'] = body['resume_url']

        if not updates:
            return create_error_response(400, "No valid fields to update", "NO_UPDATES")

        # Update the job
        success = update_job(user_id, job_id, applied_ts, updates)

        if success:
            return create_success_response({
                "message": "Job updated successfully",
                "job_id": job_id,
                "updated_fields": list(updates.keys())
            })
        else:
            return create_error_response(500, "Failed to update job", "UPDATE_FAILED")

    except Exception as e:
        logger.error(f"Error updating job: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")


def handle_delete_job(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle DELETE request to delete a job
    Path: /api/jobs/{job_id}?applied_ts={timestamp}
    """
    try:
        # Extract user_id from Cognito authorizer context
        user_id = None
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})

        # Get user_id from Cognito claims
        if 'claims' in authorizer:
            user_id = authorizer['claims'].get('sub')

        if not user_id:
            return create_error_response(401, "Unauthorized - No user ID found", "UNAUTHORIZED")

        # Extract job_id from path
        path = event.get('path', '')
        job_id = path.split('/')[-1]

        if not job_id:
            return create_error_response(400, "Job ID is required", "MISSING_JOB_ID")

        # Extract applied_ts from query parameters
        params = event.get('queryStringParameters') or {}
        applied_ts = params.get('applied_ts')

        if not applied_ts:
            return create_error_response(400, "applied_ts query parameter is required", "MISSING_APPLIED_TS")

        # Delete the job
        success = delete_job(user_id, job_id, applied_ts)

        if success:
            return create_success_response({
                "message": "Job deleted successfully",
                "job_id": job_id
            })
        else:
            return create_error_response(500, "Failed to delete job", "DELETE_FAILED")

    except Exception as e:
        logger.error(f"Error deleting job: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")


def handle_get_stats(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET request to retrieve user's job statistics
    Path: /api/stats
    Uses dedicated optimized database query for stats
    """
    try:
        # Extract user_id from Cognito authorizer context
        user_id = None
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})

        # Get user_id from Cognito claims
        if 'claims' in authorizer:
            user_id = authorizer['claims'].get('sub')  # Cognito user ID

        logger.info(f"Stats request - user_id: {user_id}")
        logger.info(f"Authorizer: {authorizer}")

        if not user_id:
            return create_error_response(401, "Unauthorized - No user ID found", "UNAUTHORIZED")

        # Get job statistics using dedicated optimized query
        stats = get_user_job_stats(user_id)
        
        logger.info(f"Stats result: {stats}")

        return create_success_response(stats)

    except Exception as e:
        logger.error(f"Error retrieving job stats: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")


def handle_cors_preflight(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle CORS preflight OPTIONS requests
    """
    return create_response(200, {"message": "CORS preflight"}, cors_headers=True)


