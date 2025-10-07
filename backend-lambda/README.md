# JobTrackr Lambda Backend

AWS Lambda backend for JobTrackr - a job posting scraper, analyzer, and tracker using Firecrawl, Amazon Bedrock, and DynamoDB.

## Features

- **Web Scraping**: Scrapes job postings using Firecrawl API
- **AI Analysis**: Analyzes job content using Amazon Bedrock (Claude Sonnet 4)
- **Structured Storage**: Stores jobs in DynamoDB with user isolation
- **Pagination**: Efficient job retrieval with pagination support
- **Serverless Architecture**: Built with AWS Lambda, API Gateway, and DynamoDB

## Architecture

```
├── lambda_function.py  # Main Lambda handler (entry point)
├── router.py          # Request routing logic
├── handlers.py        # API request handlers
├── processor.py       # Job processing orchestrator
├── scraper.py         # Firecrawl web scraping
├── analyzer.py        # Bedrock AI analysis
├── db.py              # DynamoDB operations
├── utils.py           # Utility functions
└── template.yaml      # SAM CloudFormation template
```

## Prerequisites

- AWS CLI configured with credentials
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- Python 3.12
- Firecrawl API key ([Get API key](https://www.firecrawl.dev/))
- AWS Bedrock access with Claude Sonnet 4 model enabled in `us-east-2` region

## Quick Start

### 1. Build the Application

```bash
cd backend-lambda
sam build
```

### 2. Deploy to AWS

```bash
sam deploy --guided
```

**You'll be prompted for:**
- **Stack name**: `jobtrackr-backend` (or your preferred name)
- **AWS Region**: `us-east-2` (or your preferred region)
- **FirecrawlApiKey**: Your Firecrawl API key
- **BedrockModelId**: (Press Enter for default: `us.anthropic.claude-sonnet-4-20250514-v1:0`)
- **BedrockMaxTokens**: (Press Enter for default: `10000`)
- **DynamoDBTableName**: (Press Enter for default: `UsersJobs`)
- **Confirm changes**: `Y`
- **Allow SAM CLI IAM role creation**: `Y`
- **Save arguments to config**: `Y`

### 3. Get Your API Endpoint

After deployment, you'll see output like:

```
Outputs:
  JobTrackrApi: https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod/
```

Save this URL - you'll need it for the Chrome extension!

## API Endpoints

### POST /api/jobs/ingest

Ingest, analyze, and store a job posting URL.

**Request:**
```json
{
  "url": "https://jobs.lever.co/company-name/job-id",
  "user_id": "user_123",
  "resume_url": "s3://bucket/resumes/resume.pdf"  // optional
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "message": "Job URL processed successfully",
    "status": "completed"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "message": "Job processing failed",
    "code": "PROCESSING_FAILED"
  }
}
```

**Example cURL:**
```bash
curl -X POST https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod/api/jobs/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://jobs.lever.co/example/senior-engineer",
    "user_id": "user_123"
  }'
```

---

### GET /api/jobs

Retrieve user's jobs with pagination.

**Query Parameters:**
- `user_id` (required): User identifier
- `limit` (optional): Number of jobs to return (default: 10, max: 50)
- `last_key` (optional): Pagination token from previous response

**Request:**
```
GET /api/jobs?user_id=user_123&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "job_id": "a1b2c3d4e5f6",
        "user_id": "user_123",
        "company": "Google",
        "title": "Senior Software Engineer",
        "location": "Remote",
        "status": "Captured",
        "job_url": "https://linkedin.com/jobs/view/123",
        "applied_ts": "2025-10-06T15:30:00Z",
        "salary_range": "$150k-$220k",
        "employment_type": "Full-time",
        "source": "LinkedIn",
        "tags": ["Python", "AWS", "Kubernetes"],
        "resume_url": "s3://bucket/resume.pdf",
        "last_updated_ts": "2025-10-07T10:00:00Z"
      }
    ],
    "count": 10,
    "next_page_token": "eyJQSyI6IlVTRVIj..."  // Only if more results exist
  }
}
```

**Pagination Example:**
```bash
# Get first page
curl "https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod/api/jobs?user_id=user_123&limit=10"

# Get next page using token from previous response
curl "https://xxxxx.execute-api.us-east-2.amazonaws.com/Prod/api/jobs?user_id=user_123&limit=10&last_key=eyJQSyI6..."
```

---

## DynamoDB Data Model

### Table: `UsersJobs`

**Primary Key:**
- **PK** (Partition Key): `USER#<user_id>`
- **SK** (Sort Key): `JOB#<applied_ts>#<job_id>`

**GSI1 - Company Filter:**
- **GSI1PK**: `USER#<user_id>`
- **GSI1SK**: `COMPANY#<company>#<applied_ts>#<job_id>`

**Attributes:**
```json
{
  "PK": "USER#user_123",
  "SK": "JOB#2025-10-06T15:30:00Z#a1b2c3d4e5f6",
  "type": "JOB",
  "user_id": "user_123",
  "job_id": "a1b2c3d4e5f6",
  "applied_ts": "2025-10-06T15:30:00Z",
  "last_updated_ts": "2025-10-07T10:00:00Z",
  "company": "Google",
  "title": "Senior Software Engineer",
  "location": "Remote",
  "status": "Captured",
  "job_url": "https://linkedin.com/jobs/...",
  "GSI1PK": "USER#user_123",
  "GSI1SK": "COMPANY#Google#2025-10-06T15:30:00Z#a1b2c3d4e5f6",
  "salary_range": "$150k-$220k",
  "employment_type": "Full-time",
  "source": "LinkedIn",
  "tags": ["Python", "AWS", "Kubernetes"],
  "resume_url": "s3://bucket/resume.pdf"
}
```

**Status Values:**
- `Captured` - Job URL saved, not yet applied
- `Applied` - Application submitted
- `Interviewing` - In interview process
- `Offer` - Received job offer
- `Rejected` - Application rejected
- `Accepted` - Offer accepted

---

## Local Development

### Start Local API

```bash
sam local start-api --parameter-overrides FirecrawlApiKey=<your-key>
```

### Test Locally

```bash
# Test job ingest
curl -X POST http://localhost:3000/api/jobs/ingest \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/job", "user_id": "test_user"}'

# Test get jobs
curl "http://localhost:3000/api/jobs?user_id=test_user&limit=10"
```

**Note:** Local testing requires DynamoDB Local or will fail on DB operations.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FIRECRAWL_API_KEY` | Firecrawl API key | (required) |
| `BEDROCK_MODEL_ID` | AWS Bedrock model ID | `us.anthropic.claude-sonnet-4-20250514-v1:0` |
| `AWS_DEFAULT_REGION` | AWS region | `us-east-2` |
| `BEDROCK_MAX_TOKENS` | Max tokens for Bedrock | `10000` |
| `DYNAMODB_TABLE_NAME` | DynamoDB table name | `UsersJobs` |

---

## IAM Permissions

The Lambda function requires:

**Bedrock:**
- `bedrock:InvokeModel` - To call Amazon Bedrock

**DynamoDB:**
- `dynamodb:PutItem` - Create new jobs
- `dynamodb:GetItem` - Retrieve specific job
- `dynamodb:Query` - List jobs with filters
- `dynamodb:UpdateItem` - Update job status/resume
- `dynamodb:DeleteItem` - Delete jobs

---

## Dependencies

```
boto3==1.35.0          # AWS SDK
firecrawl-py==0.0.17   # Firecrawl API client
langchain==0.2.0       # LLM framework
pydantic==2.8.0        # Data validation
```

---

## Project Structure

```
backend-lambda/
├── lambda_function.py     # Entry point - routes to handlers
├── router.py             # Route matching (POST /api/jobs/ingest, GET /api/jobs)
├── handlers.py           # Request handlers (handle_job_ingest, handle_get_jobs)
├── processor.py          # Orchestrates: scrape → analyze → store
├── scraper.py           # Firecrawl integration
├── analyzer.py          # Bedrock AI analysis with Pydantic models
├── db.py                # DynamoDB CRUD operations
├── utils.py             # Response helpers, validation
├── template.yaml        # SAM CloudFormation template
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

---

## Error Handling

All API responses follow a standard format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

**Common Error Codes:**
- `INVALID_BODY` - Malformed request body
- `MISSING_USER_ID` - user_id parameter required
- `INVALID_URL` - URL validation failed
- `PROCESSING_FAILED` - Job processing error
- `INTERNAL_ERROR` - Server error

---

## Deployment Commands

```bash
# Build
sam build

# Deploy with guided setup
sam deploy --guided

# Deploy with saved config
sam deploy

# View logs
sam logs -n JobTrackrFunction --tail

# Delete stack
sam delete
```

---

## Supported Job Boards

Works well with:
- ✅ LinkedIn Jobs
- ✅ Lever
- ✅ Greenhouse
- ✅ Indeed
- ✅ Company career pages
- ✅ Most public job postings

---

## Cost Estimation

**Per 1000 job captures:**
- Lambda: ~$0.20 (512MB, 30s avg)
- Bedrock: ~$3.00 (Claude Sonnet 4)
- DynamoDB: ~$0.25 (on-demand)
- API Gateway: ~$0.01
- **Total: ~$3.46 per 1000 jobs**

---

## Troubleshooting

**Build fails:**
```bash
# Clean and rebuild
rm -rf .aws-sam
sam build
```

**Deployment fails:**
- Check AWS credentials: `aws sts get-caller-identity`
- Verify Bedrock model access in chosen region
- Ensure Firecrawl API key is valid

**API returns 500:**
- Check CloudWatch logs: `sam logs -n JobTrackrFunction --tail`
- Verify DynamoDB table exists
- Check IAM permissions

---

## License

MIT
