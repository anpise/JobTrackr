# JobTrackr Lambda Backend

Serverless job tracking API with AI-powered analysis using AWS Lambda, DynamoDB, and Bedrock.

## 🚀 Quick Start

```bash
cd backend-lambda
sam build
sam deploy --guided
```

**Note**: You'll need to manually create the DynamoDB table before deployment (see [Database Setup](#database-setup) below).

## 📋 Prerequisites

- AWS CLI configured with credentials (`aws configure`)
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html))
- Python 3.12+
- Firecrawl API key ([Get one here](https://www.firecrawl.dev/))
- AWS Bedrock access (Claude models) OR Anthropic API key

## 🏗️ Architecture

```
lambda_function.py  # Main handler
├── router.py      # Request routing
├── handlers.py    # API handlers
├── db.py          # DynamoDB operations
└── analyzer.py    # AI analysis
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs/ingest` | Submit job URL for analysis |
| GET | `/api/jobs` | Get user's jobs (paginated) |
| PUT | `/api/jobs/{id}` | Update job status/notes |
| DELETE | `/api/jobs/{id}` | Delete job |
| GET | `/api/stats` | Get job statistics |

## 🧪 Testing

Use test events in `test_events/` folder:
- Copy JSON test events to Lambda console
- Use curl commands for API Gateway testing

## 🗄️ Database Setup

Create the DynamoDB table before deploying:

```bash
aws dynamodb create-table \
    --table-name UsersJobs \
    --attribute-definitions \
        AttributeName=PK,AttributeType=S \
        AttributeName=SK,AttributeType=S \
        AttributeName=GSI1PK,AttributeType=S \
        AttributeName=GSI1SK,AttributeType=S \
    --key-schema \
        AttributeName=PK,KeyType=HASH \
        AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
        "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},BillingMode=PAY_PER_REQUEST" \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-2
```

**Table Schema**:
- **PK**: `USER#{user_id}` - Partition key
- **SK**: `JOB#{timestamp}#{job_id}` - Sort key
- **GSI1**: Index for querying by company
  - **GSI1PK**: `USER#{user_id}`
  - **GSI1SK**: `COMPANY#{company}#{timestamp}#{job_id}`

## ⚙️ Environment Variables

Configured during `sam deploy --guided`:

```bash
FIRECRAWL_API_KEY=your_firecrawl_key
LLM_PROVIDER=bedrock  # or 'anthropic'
BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0
ANTHROPIC_API_KEY=your_anthropic_key  # if using LLM_PROVIDER=anthropic
ANTHROPIC_MODEL_ID=claude-haiku-4-5-20251001
MAX_TOKENS=2000
DYNAMODB_TABLE_NAME=UsersJobs  # default in db.py
AWS_DEFAULT_REGION=us-east-1
```

## 💰 Cost

- **Job Ingest**: Variable (AI processing)
- **CRUD Operations**: 1 RCU/WCU per request
- **Stats**: 1 RCU per request

## 📁 Key Files

- `lambda_function.py` - Entry point
- `handlers.py` - API logic
- `db.py` - Database operations
- `template.yaml` - SAM configuration
- `test_events/` - Test commands

## 🔧 Development

### Local Testing

```bash
# Start API locally
sam local start-api

# Test with curl
curl -X POST http://localhost:3000/api/jobs/ingest \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/job"}'

# Invoke function directly with test event
sam local invoke JobTrackrFunction -e test_events/test_event.json
```

### Deployment

```bash
# Build Lambda layer and function
sam build

# Deploy to AWS
sam deploy --guided

# Or update existing stack
sam build && sam deploy
```

### Deployment Parameters

During `sam deploy --guided`, you'll be prompted for:
- **Stack Name**: `jobtrackr-backend` (or your choice)
- **AWS Region**: `us-east-2` (recommended)
- **FirecrawlApiKey**: Your Firecrawl API key
- **LLMProvider**: `bedrock` or `anthropic`
- **AnthropicApiKey**: If using Anthropic
- **BedrockModelId**: AWS Bedrock model ID
- **Confirm changes**: Y
- **Allow SAM CLI IAM role creation**: Y
- **Save arguments to config file**: Y

## 📊 Features

- ✅ AI-powered job analysis (Claude via Bedrock or Anthropic)
- ✅ User authentication (AWS Cognito JWT validation)
- ✅ Job CRUD operations with DynamoDB
- ✅ Analytics and statistics
- ✅ Pagination support for job lists
- ✅ Error handling and logging
- ✅ Web scraping with Firecrawl
- ✅ Company-based filtering (GSI1)

## 📝 API Response Examples

### POST /api/jobs/ingest
```json
{
  "success": true,
  "job_id": "a1b2c3d4e5f6",
  "message": "Job captured and analyzed successfully",
  "data": {
    "company": "Example Corp",
    "title": "Senior Software Engineer",
    "location": "San Francisco, CA"
  }
}
```

### GET /api/jobs
```json
{
  "success": true,
  "jobs": [...],
  "total": 42,
  "last_key": {...}
}
```

### GET /api/stats
```json
{
  "success": true,
  "stats": {
    "total_jobs": 42,
    "status_breakdown": {
      "Captured": 15,
      "Applied": 20,
      "Interview": 5,
      "Offer": 2
    },
    "company_breakdown": {...},
    "application_trends": {...}
  }
}
```

## 🔐 Authentication

All endpoints require AWS Cognito JWT token:
```bash
Authorization: Bearer <cognito_id_token>
```

The Lambda function extracts `user_id` from the JWT claims to ensure data isolation.

## 🚨 Troubleshooting

### Common Issues

**DynamoDB Table Not Found**
```bash
# Verify table exists
aws dynamodb describe-table --table-name UsersJobs --region us-east-2
```

**Bedrock Access Denied**
- Ensure your AWS account has Bedrock access enabled
- Check IAM policies in `template.yaml`
- Verify model ID is correct for your region

**Firecrawl API Errors**
- Verify API key is valid
- Check Firecrawl rate limits

### Logs

View Lambda logs:
```bash
sam logs -n JobTrackrFunction --stack-name jobtrackr-backend --tail
```

## 📚 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Single-Table Design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
- [AWS Bedrock](https://aws.amazon.com/bedrock/)
- [OpenAPI Spec](openapi.yaml) - Full API documentation