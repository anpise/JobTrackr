"""
Request handlers for the JobTrackr Lambda API
"""

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from utils import create_response, create_error_response, create_success_response, parse_request_body, validate_url_input, sanitize_request_data
from processor import process_job

logger = logging.getLogger(__name__)


def handle_job_ingest(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle job ingest POST requests
    Expects url in request body
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
        
        # Process the job
        processing_result = process_job(url)
        
        if processing_result.get("status") == "completed":
            return create_success_response({
                "message": "Job URL processed successfully",
                "status": "completed",
                "url": url
            })
        else:
            return create_error_response(500, "Job processing failed", "PROCESSING_FAILED", {
                "status": processing_result.get("status"),
                "step": processing_result.get("step"),
                "url": url
            })
        
    except Exception as e:
        logger.error(f"Error processing job ingest: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")


def handle_cors_preflight(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle CORS preflight OPTIONS requests
    """
    return create_response(200, {"message": "CORS preflight"}, cors_headers=True)


