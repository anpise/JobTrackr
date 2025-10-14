# JobTrackr Frontend

Ultra-lightweight React + TypeScript app for job tracking dashboard.

## ✨ Features

- ✅ **TypeScript** - Fully typed for safety
- ✅ **Lightweight** - ~74KB gzipped bundle
- ✅ **AWS Cognito** - OAuth authentication flow
- ✅ **Token Management** - Automatic localStorage handling
- ✅ **React Router** - Clean routing

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
```

Edit `.env` with your Cognito details:
```
VITE_COGNITO_DOMAIN=your-domain.auth.us-east-2.amazoncognito.com
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_API_URL=https://your-api.execute-api.us-east-2.amazonaws.com/dev
```

3. **Run dev server:**
```bash
npm run dev
```

## How it Works

### Landing Page (`/`)
- Checks localStorage for `access_token`
- **If token exists:** Will redirect to dashboard (not implemented yet)
- **If no token:** Redirects to Cognito login page

### Callback Page (`/callback`)
- Handles OAuth redirect from Cognito
- Exchanges authorization code for tokens
- Stores tokens in localStorage
- Redirects to dashboard (not implemented yet)

## Current Flow

```
User visits /
    ↓
Check localStorage for token
    ↓
┌─────────────┬─────────────┐
│             │             │
NO           YES            │
│             │             │
↓             ↓             │
Redirect to   Show message  │
Cognito       (dashboard    │
login         coming soon)  │
    ↓                       │
User logs in                │
    ↓                       │
Cognito redirects           │
to /callback                │
    ↓                       │
Exchange code for tokens    │
    ↓                       │
Store in localStorage       │
    ↓                       │
Show success message        │
(dashboard coming soon)     │
```

## Project Structure

```
frontend-react/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx      # Main entry with token check
│   │   └── Callback.tsx     # OAuth callback handler
│   ├── utils/
│   │   └── auth.ts          # Auth utilities (typed)
│   ├── App.tsx              # Router setup
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Environment types
├── tsconfig.json            # TypeScript config
├── .env.example
└── package.json
```

## Build for Production

```bash
npm run build
```

Output in `dist/` folder (~74KB gzipped).

Deploy to S3:
```bash
aws s3 sync dist/ s3://your-bucket --delete
```

## Dependencies

- **react**: ^19.1.1 (~45KB)
- **react-router-dom**: ^7.9.4 (~25KB)
- **axios**: ^1.12.2 (~15KB) *unused yet*
- **typescript**: ^5.9.3 (dev only)

**Total bundle:** ~74KB gzipped ⚡

## TypeScript Benefits

- Type-safe auth utilities
- Environment variable typing
- Catch errors at compile time
- Better IDE autocomplete

## Next Steps

- [ ] Add Dashboard page
- [ ] Add Jobs list page
- [ ] Add Job detail page
- [ ] Add API integration with Axios
