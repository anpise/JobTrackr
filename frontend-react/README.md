# JobTrackr Frontend

React + TypeScript job tracking dashboard with AWS Cognito authentication.

## 🚀 Quick Start

```bash
cd frontend-react
npm install
cp .env.example .env
# Edit .env with your AWS Cognito and API Gateway details
npm run dev
```

The application will be available at `http://localhost:5173`

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS Cognito User Pool configured
- Backend API deployed (see [backend-lambda/README.md](../backend-lambda/README.md))
- Chrome Extension ID (if using extension integration)

## ⚙️ Environment Variables

Create a `.env` file in `frontend-react/` directory:

```bash
# AWS Cognito Configuration
VITE_COGNITO_DOMAIN=your-domain.auth.us-east-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

# Backend API
VITE_API_URL=https://your-api.execute-api.us-east-2.amazonaws.com/dev

# Chrome Extension ID (optional - for extension communication)
VITE_EXTENSION_ID=your-extension-id-here
```

### Getting Configuration Values

1. **Cognito Domain**: Found in AWS Cognito Console → App Integration → Domain name
2. **Client ID**: Cognito Console → App clients → Your app client ID
3. **API URL**: Output from `sam deploy` in backend-lambda
4. **Extension ID**: From `chrome://extensions/` after loading the extension

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

### Local Development

```bash
# Start development server with hot reload
npm run dev

# Run linter
npm run lint

# Preview production build locally
npm run preview
```

Access the app at `http://localhost:5173`

### Building for Production

```bash
# TypeScript compilation + Vite build
npm run build

# Output will be in dist/ directory
```

### Deployment to AWS S3 + CloudFront

1. **Create S3 Bucket**:
```bash
aws s3 mb s3://jobtrackr-frontend
aws s3 website s3://jobtrackr-frontend --index-document index.html
```

2. **Build and Deploy**:
```bash
npm run build
aws s3 sync dist/ s3://jobtrackr-frontend --delete
```

3. **Optional: CloudFront Distribution** for HTTPS and CDN:
```bash
# Create distribution (via AWS Console or CLI)
# Update VITE_COGNITO_REDIRECT_URI to CloudFront URL
```

4. **Update Cognito Settings**:
   - Add production callback URL to Cognito allowed callbacks
   - Update logout URL if needed

## 📦 Dependencies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **AWS Cognito** - Authentication

## 🎯 Key Files

- **Dashboard.tsx** - Main dashboard with job list and stats
- **JobDetail.tsx** - Individual job detail view
- **Login.tsx** - Authentication page
- **Callback.tsx** - OAuth callback handler
- **api.ts** - API client with authentication
- **auth.ts** - Token management and validation
- **ProtectedRoute.tsx** - Route protection component

## 🔐 Authentication Flow

1. User clicks "Login" → Redirects to Cognito hosted UI
2. User authenticates → Cognito redirects to `/callback`
3. Callback page extracts tokens from URL
4. Tokens stored in localStorage
5. User redirected to Dashboard
6. Protected routes check for valid tokens
7. API requests include Bearer token

## 🚨 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure API Gateway has CORS enabled
- Check `Access-Control-Allow-Origin` headers in Lambda responses

**Authentication Loop**
- Clear localStorage: `localStorage.clear()`
- Verify Cognito callback URLs match exactly (including port)
- Check browser console for token validation errors

**API 401 Errors**
- Token might be expired (check `auth.ts` validation)
- Verify Cognito User Pool ID matches backend configuration
- Check that backend Lambda has proper Cognito authorizer

**Environment Variables Not Working**
- Restart dev server after changing `.env`
- Vite requires `VITE_` prefix for env vars
- Check `import.meta.env.VITE_*` usage in code

### Debugging

```bash
# Check environment variables loaded correctly
console.log(import.meta.env)

# View token in browser console
localStorage.getItem('id_token')

# Test API directly
curl https://your-api-url/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [AWS Cognito OAuth](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-integration.html)
- [TypeScript](https://www.typescriptlang.org/)