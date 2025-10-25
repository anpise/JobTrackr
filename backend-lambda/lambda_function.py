"""
Main Lambda handler for JobTrackr API
Entry point for all API requests
"""

import logging
from typing import Dict, Any
from handlers import handle_job_ingest, handle_get_jobs, handle_update_job, handle_delete_job, handle_cors_preflight
from router import get_route_handler, handle_not_found
from utils import create_error_response

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for job ingest API
    Entry point for all API requests
    """
    try:
        # Debug logging
        logger.info(f"Received event: {event}")
        logger.info(f"HTTP Method: {event.get('httpMethod')}")
        logger.info(f"Path: {event.get('path')}")
        
        # Determine which handler to use
        handler_name = get_route_handler(event)
        logger.info(f"Selected handler: {handler_name}")

        # Route to appropriate handler
        if handler_name == 'job_ingest':
            return handle_job_ingest(event, context)
        elif handler_name == 'get_jobs':
            return handle_get_jobs(event, context)
        elif handler_name == 'update_job':
            return handle_update_job(event, context)
        elif handler_name == 'delete_job':
            return handle_delete_job(event, context)
        elif handler_name == 'cors_preflight':
            return handle_cors_preflight(event, context)
        else:  # not_found
            return handle_not_found(event, context)

    except Exception as e:
        logger.error(f"Unexpected error in lambda_handler: {str(e)}", exc_info=True)
        return create_error_response(500, "Internal server error", "INTERNAL_ERROR")
