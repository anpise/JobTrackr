"""
Request handlers for the JobTrackr Lambda API
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from utils import create_response, create_error_response, create_success_response, parse_request_body, validate_url_input, sanitize_request_data
from processor import process_job
from db import get_user_jobs

logger = logging.getLogger(__name__)


def handle_job_ingest(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle job ingest POST requests
    Expects url and user_id in request body
    Optional: resume_url
    """
    try:
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

        # Extract user_id (required)
        user_id = sanitized_body.get('user_id')
        if not user_id:
            return create_error_response(400, "user_id is required", "MISSING_USER_ID")

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
        - user_id (required)
        - limit (optional, default: 10, max: 50)
        - last_key (optional, base64 encoded pagination token)
    """
    try:
        # Extract query parameters
        params = event.get('queryStringParameters') or {}

        # Get user_id (required)
        user_id = params.get('user_id')
        if not user_id:
            return create_error_response(400, "user_id is required", "MISSING_USER_ID")

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


def handle_cors_preflight(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle CORS preflight OPTIONS requests
    """
    return create_response(200, {"message": "CORS preflight"}, cors_headers=True)


