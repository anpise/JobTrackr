"""
DynamoDB integration for JobTrackr
Handles all database operations for UsersJobs table
"""

import os
import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

# Configuration
TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'UsersJobs')
AWS_REGION = os.getenv('AWS_DEFAULT_REGION', 'us-east-2')

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)
logger.info(f"DynamoDB table '{TABLE_NAME}' initialized in region {AWS_REGION}")


def generate_job_id(url: str, timestamp: str) -> str:
    """
    Generate unique job ID from URL and timestamp
    """
    content = f"{url}#{timestamp}"
    return hashlib.sha256(content.encode()).hexdigest()[:12]


def create_job_item(
    user_id: str,
    job_url: str,
    analyzed_data: Dict[str, Any],
    resume_url: Optional[str] = None,
    notes: Optional[str] = None,
    status: str = "Captured"
) -> Dict[str, Any]:
    """
    Create a job item for DynamoDB with proper schema

    Args:
        user_id: User identifier
        job_url: Job posting URL
        analyzed_data: Output from Bedrock analyzer
        resume_url: S3 URL of uploaded resume (optional)
        notes: User notes (optional)
        status: Job status (default: Captured)

    Returns:
        Complete DynamoDB item
    """
    now = datetime.now(timezone.utc).isoformat()
    job_id = generate_job_id(job_url, now)

    # Build the item
    item = {
        # Primary key
        'PK': f'USER#{user_id}',
        'SK': f'JOB#{now}#{job_id}',

        # Entity metadata
        'type': 'JOB',
        'user_id': user_id,
        'job_id': job_id,

        # Timestamps
        'applied_ts': now,
        'last_updated_ts': now,

        # Required fields from analyzer
        'company': analyzed_data.get('company', 'Unknown'),
        'title': analyzed_data.get('title', 'Unknown'),
        'location': analyzed_data.get('location', 'Unknown'),

        # Status and URL
        'status': status,
        'job_url': job_url,

        # GSI1 key for company filtering
        'GSI1PK': f'USER#{user_id}',
        'GSI1SK': f'COMPANY#{analyzed_data.get("company", "Unknown")}#{now}#{job_id}'
    }

    # Optional fields from analyzer
    if analyzed_data.get('salary_range'):
        item['salary_range'] = analyzed_data['salary_range']

    if analyzed_data.get('employment_type'):
        item['employment_type'] = analyzed_data['employment_type']

    if analyzed_data.get('source'):
        item['source'] = analyzed_data['source']

    if analyzed_data.get('tags'):
        item['tags'] = analyzed_data['tags']

    # Notes field - use analyzer's notes if available, otherwise use user-provided notes
    if analyzed_data.get('notes'):
        item['notes'] = analyzed_data['notes']
    elif notes:
        item['notes'] = notes

    # Optional user-provided fields
    if resume_url:
        item['resume_url'] = resume_url

    return item


def put_job(item: Dict[str, Any]) -> bool:
    """
    Insert a job into DynamoDB

    Args:
        item: Complete DynamoDB item

    Returns:
        True if successful, False otherwise
    """
    try:
        table.put_item(Item=item)
        logger.info(f"Successfully inserted job: {item['job_id']} for user: {item['user_id']}")
        return True
    except ClientError as e:
        logger.error(f"Failed to insert job into DynamoDB: {str(e)}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Unexpected error inserting job: {str(e)}", exc_info=True)
        return False


def get_job(user_id: str, job_id: str, applied_ts: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a specific job by user_id and full SK

    Args:
        user_id: User identifier
        job_id: Job identifier
        applied_ts: ISO timestamp when job was applied

    Returns:
        Job item or None if not found
    """
    try:
        response = table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'JOB#{applied_ts}#{job_id}'
            }
        )
        return response.get('Item')
    except ClientError as e:
        logger.error(f"Failed to get job from DynamoDB: {str(e)}", exc_info=True)
        return None


def get_user_jobs(user_id: str, limit: int = 10, last_key: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Get jobs for a user with pagination (sorted by applied_ts descending)

    Args:
        user_id: User identifier
        limit: Maximum number of jobs to return (default: 10)
        last_key: Pagination token (LastEvaluatedKey from previous response)

    Returns:
        Dict with 'items' and optional 'last_key' for pagination
    """
    try:
        query_params = {
            'KeyConditionExpression': 'PK = :pk AND begins_with(SK, :sk_prefix)',
            'ExpressionAttributeValues': {
                ':pk': f'USER#{user_id}',
                ':sk_prefix': 'JOB#'
            },
            'ScanIndexForward': False,  # Descending order (newest first)
            'Limit': limit
        }

        # Add pagination token if provided
        if last_key:
            query_params['ExclusiveStartKey'] = last_key

        response = table.query(**query_params)

        result = {
            'items': response.get('Items', [])
        }

        # Include pagination token if there are more results
        if 'LastEvaluatedKey' in response:
            result['last_key'] = response['LastEvaluatedKey']

        return result
    except ClientError as e:
        logger.error(f"Failed to query user jobs: {str(e)}", exc_info=True)
        return {'items': []}


def get_jobs_by_company(user_id: str, company: str, limit: int = 50) -> List[Dict[str, Any]]:
    """
    Get all jobs for a user filtered by company (using GSI1)

    Args:
        user_id: User identifier
        company: Company name
        limit: Maximum number of jobs to return

    Returns:
        List of job items
    """
    try:
        response = table.query(
            IndexName='GSI1',
            KeyConditionExpression='GSI1PK = :pk AND begins_with(GSI1SK, :sk_prefix)',
            ExpressionAttributeValues={
                ':pk': f'USER#{user_id}',
                ':sk_prefix': f'COMPANY#{company}#'
            },
            ScanIndexForward=False,
            Limit=limit
        )
        return response.get('Items', [])
    except ClientError as e:
        logger.error(f"Failed to query jobs by company: {str(e)}", exc_info=True)
        return []


def update_job_status(
    user_id: str,
    job_id: str,
    applied_ts: str,
    new_status: str
) -> bool:
    """
    Update job status

    Args:
        user_id: User identifier
        job_id: Job identifier
        applied_ts: ISO timestamp
        new_status: New status value

    Returns:
        True if successful, False otherwise
    """
    try:
        table.update_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'JOB#{applied_ts}#{job_id}'
            },
            UpdateExpression='SET #status = :status, last_updated_ts = :updated',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': new_status,
                ':updated': datetime.now(timezone.utc).isoformat()
            }
        )
        logger.info(f"Updated job {job_id} status to {new_status}")
        return True
    except ClientError as e:
        logger.error(f"Failed to update job status: {str(e)}", exc_info=True)
        return False


def update_job_resume(
    user_id: str,
    job_id: str,
    applied_ts: str,
    resume_url: str
) -> bool:
    """
    Update job with resume URL

    Args:
        user_id: User identifier
        job_id: Job identifier
        applied_ts: ISO timestamp
        resume_url: S3 URL of resume

    Returns:
        True if successful, False otherwise
    """
    try:
        table.update_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'JOB#{applied_ts}#{job_id}'
            },
            UpdateExpression='SET resume_url = :resume, last_updated_ts = :updated',
            ExpressionAttributeValues={
                ':resume': resume_url,
                ':updated': datetime.now(timezone.utc).isoformat()
            }
        )
        logger.info(f"Updated job {job_id} with resume URL")
        return True
    except ClientError as e:
        logger.error(f"Failed to update resume URL: {str(e)}", exc_info=True)
        return False


def update_job(
    user_id: str,
    job_id: str,
    applied_ts: str,
    updates: Dict[str, Any]
) -> bool:
    """
    Update a job with multiple fields

    Args:
        user_id: User identifier
        job_id: Job identifier
        applied_ts: ISO timestamp
        updates: Dictionary of fields to update (status, notes, etc.)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Build update expression dynamically
        update_expr_parts = []
        expr_attr_names = {}
        expr_attr_values = {}

        # Always update last_updated_ts
        update_expr_parts.append('last_updated_ts = :updated')
        expr_attr_values[':updated'] = datetime.now(timezone.utc).isoformat()

        # Add other fields to update
        allowed_fields = ['status', 'notes', 'resume_url']
        for field, value in updates.items():
            if field in allowed_fields and value is not None:
                update_expr_parts.append(f'#{field} = :{field}')
                expr_attr_names[f'#{field}'] = field
                expr_attr_values[f':{field}'] = value

        if len(update_expr_parts) == 1:
            logger.warning("No valid fields to update")
            return False

        update_expr = 'SET ' + ', '.join(update_expr_parts)

        # Perform update
        update_params = {
            'Key': {
                'PK': f'USER#{user_id}',
                'SK': f'JOB#{applied_ts}#{job_id}'
            },
            'UpdateExpression': update_expr,
            'ExpressionAttributeValues': expr_attr_values
        }

        if expr_attr_names:
            update_params['ExpressionAttributeNames'] = expr_attr_names

        table.update_item(**update_params)
        logger.info(f"Updated job {job_id} with fields: {list(updates.keys())}")
        return True
    except ClientError as e:
        logger.error(f"Failed to update job: {str(e)}", exc_info=True)
        return False


def delete_job(user_id: str, job_id: str, applied_ts: str) -> bool:
    """
    Delete a job

    Args:
        user_id: User identifier
        job_id: Job identifier
        applied_ts: ISO timestamp

    Returns:
        True if successful, False otherwise
    """
    try:
        table.delete_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': f'JOB#{applied_ts}#{job_id}'
            }
        )
        logger.info(f"Deleted job {job_id} for user {user_id}")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete job: {str(e)}", exc_info=True)
        return False
