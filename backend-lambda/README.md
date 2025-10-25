# JobTrackr Lambda Backend

Serverless job tracking API with AI-powered analysis using AWS Lambda, DynamoDB, and Bedrock.

## 🚀 Quick Start

```bash
cd backend-lambda
sam build
sam deploy --guided
```

## 📋 Prerequisites

- AWS CLI configured
- AWS SAM CLI installed
- Firecrawl API key
- Bedrock access (Claude Sonnet 4)

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

## ⚙️ Environment Variables

```bash
FIRECRAWL_API_KEY=your_key
LLM_PROVIDER=bedrock
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20241022-v2:0
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

```bash
# Local testing
sam local start-api

# Deploy changes
sam build && sam deploy
```

## 📊 Features

- ✅ AI-powered job analysis
- ✅ User authentication (Cognito)
- ✅ Job CRUD operations
- ✅ Analytics and statistics
- ✅ Pagination support
- ✅ Error handling