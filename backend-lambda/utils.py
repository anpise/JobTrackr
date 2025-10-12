"""
Utility functions for the JobTrackr Lambda API
"""

import json
import re
from datetime import datetime
from urllib.parse import urlparse
from typing import Dict, Any, Optional


def parse_request_body(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Parse JSON request body from Lambda event
    Returns None if parsing fails
    """
    try:
        body = event.get('body')
        if not body:
            return None
        
        if isinstance(body, str):
            return json.loads(body)
        elif isinstance(body, dict):
            return body
        else:
            return None
    except json.JSONDecodeError:
        return None


def create_response(status_code: int, data: Dict[str, Any], cors_headers: bool = False) -> Dict[str, Any]:
    """
    Create standardized Lambda response with consistent structure
    All responses include timestamp and request_id for traceability
    """
    headers = {
        'Content-Type': 'application/json'
    }

    if cors_headers:
        headers.update({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        })

    # Standardize response structure
    response_body = {
        'statusCode': status_code,
        'timestamp': json.dumps(datetime.utcnow().isoformat() + 'Z').strip('"'),
        **data
    }

    # Add success flag for consistency
    if 'success' not in response_body:
        response_body['success'] = status_code < 400

    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(response_body)
    }


def create_error_response(status_code: int, error_message: str, error_code: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Create standardized error response
    """
    error_data = {
        'success': False,
        'error': {
            'message': error_message,
            'code': error_code or 'UNKNOWN_ERROR'
        }
    }

    if details:
        error_data['error']['details'] = details

    return create_response(status_code, error_data)


def create_success_response(data: Dict[str, Any], status_code: int = 200) -> Dict[str, Any]:
    """
    Create standardized success response
    """
    success_data = {
        'success': True,
        **data
    }

    return create_response(status_code, success_data)


def is_valid_job_url(url: str) -> bool:
    """
    Check if the URL appears to be from a major job board
    Returns True if it's a recognized job posting URL
    """
    try:
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        path = parsed_url.path.lower()
        
        # Major job board domains
        job_domains = [
            'linkedin.com',
            'indeed.com',
            'glassdoor.com',
            'monster.com',
            'ziprecruiter.com',
            'careerbuilder.com',
            'dice.com',
            'angel.co',
            'stackoverflow.com',
            'github.com',
            'lever.co',
            'greenhouse.io',
            'workday.com',
            'bamboohr.com',
            'smartrecruiters.com',
            'jobvite.com',
            'icims.com',
            'ashbyhq.com',
            'jobs.lever.co',
            'boards.greenhouse.io',
            'jobs.workday.com',
            'jobs.ashbyhq.com',
            'apply.workable.com',
            'jobs.smartrecruiters.com',
            'jobs.jobvite.com',
            'careers.smartrecruiters.com'
        ]
        
        # Check if domain contains any job site
        for job_domain in job_domains:
            if job_domain in domain:
                return True
        
        # Check for common job-related paths (for other domains)
        job_paths = [
            '/jobs/',
            '/careers/',
            '/job/',
            '/position/',
            '/opportunities/',
            '/openings/',
            '/vacancies/',
            '/employment/'
        ]
        
        for job_path in job_paths:
            if job_path in path:
                return True
        
        # Check if URL contains "jobs" or "job" anywhere (case insensitive)
        url_lower = url.lower()
        if 'jobs' in url_lower or 'job' in url_lower:
            return True
                
        return False
        
    except Exception:
        return False


def validate_url_input(url: str) -> Dict[str, Any]:
    """
    Comprehensive URL validation with detailed error reporting
    Returns validation result with success status and error details
    """
    if not url:
        return {"valid": False, "error": "URL is required", "code": "MISSING_URL"}

    if not isinstance(url, str):
        return {"valid": False, "error": "URL must be a string", "code": "INVALID_TYPE"}

    # Remove whitespace and check length
    url = url.strip()
    if len(url) == 0:
        return {"valid": False, "error": "URL cannot be empty", "code": "EMPTY_URL"}

    if len(url) > 2048:  # Reasonable URL length limit
        return {"valid": False, "error": "URL too long (max 2048 characters)", "code": "URL_TOO_LONG"}

    # Check for suspicious characters
    if re.search(r'[<>"\{\}|\\^`\[\]]', url):
        return {"valid": False, "error": "URL contains invalid characters", "code": "INVALID_CHARACTERS"}

    # Parse URL structure
    try:
        parsed = urlparse(url)
        if not parsed.scheme:
            return {"valid": False, "error": "URL must include protocol (http/https)", "code": "MISSING_PROTOCOL"}

        if parsed.scheme not in ['http', 'https']:
            return {"valid": False, "error": "URL must use http or https protocol", "code": "INVALID_PROTOCOL"}

        if not parsed.netloc:
            return {"valid": False, "error": "URL must include domain name", "code": "MISSING_DOMAIN"}

        # Check domain format
        domain_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$'
        if not re.match(domain_pattern, parsed.netloc.split(':')[0]):
            return {"valid": False, "error": "Invalid domain format", "code": "INVALID_DOMAIN"}

    except Exception:
        return {"valid": False, "error": "Malformed URL", "code": "MALFORMED_URL"}

    # Check if it's a job-related URL
    if not is_valid_job_url(url):
        return {"valid": False, "error": "URL does not appear to be from a recognized job board", "code": "NOT_JOB_URL"}

    return {"valid": True, "url": url}


def sanitize_request_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize request data by removing potentially harmful content
    """
    if not isinstance(data, dict):
        return {}

    sanitized = {}
    for key, value in data.items():
        # Only allow specific known fields
        if key not in ['url', 'resume_url']:
            continue

        if isinstance(value, str):
            # Remove control characters and limit length
            sanitized[key] = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', value)[:2048]
        else:
            sanitized[key] = value

    return sanitized
