# JobTrackr API Test Events

This folder contains curl commands and test events for all JobTrackr API endpoints.

## API Endpoints

### 1. Job Ingest - POST /api/jobs/ingest
**File**: `curl_job_ingest.json`
- **Purpose**: Submit a job URL for AI analysis
- **Authentication**: Required (Cognito JWT)
- **Body**: `{"url": "job_posting_url"}`

### 2. Get Jobs - GET /api/jobs
**File**: `curl_get_jobs.json`
- **Purpose**: Retrieve user's job applications
- **Authentication**: Required (Cognito JWT)
- **Query Params**: `limit` (optional, default: 10, max: 50)

### 3. Update Job - PUT /api/jobs/{job_id}
**File**: `curl_update_job.json`
- **Purpose**: Update job status, notes, or resume URL
- **Authentication**: Required (Cognito JWT)
- **Query Params**: `applied_ts` (required)
- **Body**: `{"status": "...", "notes": "...", "resume_url": "..."}`

### 4. Delete Job - DELETE /api/jobs/{job_id}
**File**: `curl_delete_job.json`
- **Purpose**: Delete a job application
- **Authentication**: Required (Cognito JWT)
- **Query Params**: `applied_ts` (required)

### 5. Get Stats - GET /api/stats
**File**: `curl_get_stats.json`
- **Purpose**: Get job application statistics
- **Authentication**: Required (Cognito JWT)
- **Response**: Analytics data (status breakdown, company breakdown, trends)

## Usage

### For Lambda Console Testing:
1. Copy the `test_event` object from any JSON file
2. Paste into Lambda test console
3. Run the test

### For API Gateway Testing:
1. Replace `your-api-id` with your actual API Gateway ID
2. Replace `YOUR_COGNITO_JWT_TOKEN` with a valid JWT token
3. Run the curl commands

## Authentication

All endpoints require Cognito JWT authentication:
```bash
Authorization: Bearer YOUR_COGNITO_JWT_TOKEN
```

## Response Format

All successful responses follow this format:
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": {
    "message": "Success message",
    "data": {...}
  }
}
```

## Error Responses

Error responses include:
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (missing/invalid JWT)
- **404**: Not Found (job not found)
- **500**: Internal Server Error

## Cost Information

- **Job Ingest**: Variable (depends on AI processing)
- **Get Jobs**: 1 RCU per request
- **Update Job**: 1 WCU per request
- **Delete Job**: 1 WCU per request
- **Get Stats**: 1 RCU per request
