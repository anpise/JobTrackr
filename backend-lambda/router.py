"""
Request routing logic for the JobTrackr Lambda API
"""

from typing import Dict, Any, Optional
from utils import create_error_response


def get_route_handler(event: Dict[str, Any]) -> str:
    """
    Determine which handler to use based on HTTP method and path
    """
    method = event.get('httpMethod', '').upper()
    path = event.get('path', '')

    if method == 'POST' and path == '/api/jobs/ingest':
        return 'job_ingest'
    elif method == 'GET' and path == '/api/jobs':
        return 'get_jobs'
    elif method == 'OPTIONS':
        return 'cors_preflight'
    else:
        return 'not_found'


def handle_not_found(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle 404 Not Found requests
    """
    return create_error_response(404, "Endpoint not found", "NOT_FOUND")
