# JobTrackr Frontend

React + TypeScript job tracking dashboard with AWS Cognito authentication.

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your Cognito details
npm run dev
```

## ⚙️ Environment Variables

```bash
VITE_COGNITO_DOMAIN=your-domain.auth.us-east-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=https://your-api.execute-api.us-east-2.amazonaws.com/dev
```

## 🏗️ Architecture

```
src/
├── pages/
│   ├── Dashboard.tsx    # Main dashboard
│   ├── Login.tsx        # Login page
│   └── Callback.tsx     # OAuth callback
├── services/
│   └── api.ts           # API client
├── utils/
│   └── auth.ts          # Authentication
└── components/
    └── ProtectedRoute.tsx
```

## 🔗 API Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/jobs/ingest` | POST | Submit job URL |
| `/api/jobs` | GET | Get user's jobs |
| `/api/jobs/{id}` | PUT | Update job |
| `/api/jobs/{id}` | DELETE | Delete job |
| `/api/stats` | GET | Get statistics |

## 🔐 Authentication

- **AWS Cognito** - OAuth 2.0 with PKCE
- **JWT Tokens** - Automatic validation and refresh
- **Token Expiration** - Auto-logout on expired tokens
- **Protected Routes** - Route-level authentication

## 📊 Features

- ✅ **Job Management** - Add, view, update, delete jobs
- ✅ **Statistics** - Real-time job application analytics
- ✅ **Responsive Design** - Mobile and desktop optimized
- ✅ **TypeScript** - Full type safety
- ✅ **Error Handling** - Graceful error management

## 🛠️ Development

```bash
# Development
npm run dev

# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket --delete
```

## 📦 Dependencies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **AWS Cognito** - Authentication

## 🎯 Key Files

- `Dashboard.tsx` - Main dashboard with job list and stats
- `api.ts` - API client with authentication
- `auth.ts` - Token management and validation
- `ProtectedRoute.tsx` - Route protection