# JobTrackr Lambda Backend

AWS Lambda backend for JobTrackr - a job posting scraper and analyzer using Firecrawl and Amazon Bedrock.

## Features

- **Web Scraping**: Scrapes job postings using Firecrawl API
- **AI Analysis**: Analyzes job content using Amazon Bedrock (Claude Sonnet 4)
- **Structured Output**: Extracts job details (title, company, requirements, skills, etc.)
- **Serverless Architecture**: Built with AWS Lambda and SAM

## Architecture

```
├── lambda_function.py  # Main Lambda handler
├── router.py          # Request routing logic
├── handlers.py        # Request handlers
├── processor.py       # Job processing orchestrator
├── scraper.py         # Firecrawl web scraping
├── analyzer.py        # Bedrock AI analysis
├── utils.py           # Utility functions
└── template.yaml      # SAM template
```

## Prerequisites

- AWS CLI configured
- AWS SAM CLI installed
- Python 3.12
- Firecrawl API key
- AWS Bedrock access (Claude Sonnet 4 model enabled)

## Setup

### 1. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your values:

```bash
FIRECRAWL_API_KEY=your-actual-api-key
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0
AWS_DEFAULT_REGION=us-east-2
BEDROCK_MAX_TOKENS=10000
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt -t dependencies/python
```

### 3. Build the Application

```bash
sam build
```

### 4. Deploy

Deploy with parameters:

```bash
sam deploy --guided \
  --parameter-overrides \
    FirecrawlApiKey=your-api-key \
    BedrockModelId=us.anthropic.claude-sonnet-4-20250514-v1:0 \
    BedrockMaxTokens=10000
```

## API Endpoints

### POST /api/jobs/ingest

Ingest and analyze a job posting URL.

**Request:**
```json
{
  "url": "https://jobs.lever.co/company-name/job-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job URL processed successfully",
  "status": "completed",
  "url": "https://jobs.lever.co/company-name/job-id",
  "statusCode": 200,
  "timestamp": "2025-10-03T12:00:00Z"
}
```

**Example URLs that work well:**
- `https://jobs.lever.co/company/position`
- `https://boards.greenhouse.io/company/jobs/123456`
- `https://www.indeed.com/viewjob?jk=abc123`
- `https://company.com/careers/job-title`

## Local Testing

Test locally using SAM:

```bash
sam local start-api
```

Then make requests to `http://localhost:3000/api/jobs/ingest`

## Environment Variables

- **FIRECRAWL_API_KEY** - Firecrawl API key (required)
- **BEDROCK_MODEL_ID** - AWS Bedrock model ID (default: `us.anthropic.claude-sonnet-4-20250514-v1:0`)
- **AWS_DEFAULT_REGION** - AWS region (default: `us-east-2`)
- **BEDROCK_MAX_TOKENS** - Max tokens for Bedrock (default: `10000`)

## IAM Permissions

The Lambda function requires:
- `bedrock:InvokeModel` - To call Amazon Bedrock

## Dependencies

- `boto3` - AWS SDK
- `firecrawl-py` - Firecrawl API client
- `langchain` - LLM framework
- `pydantic` - Data validation

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "statusCode": 400,
  "timestamp": "2025-10-03T12:00:00Z"
}
```