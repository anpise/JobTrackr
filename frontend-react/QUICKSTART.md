# Quick Start Guide

## ✅ What's Done

**Ultra-lightweight React app with Cognito authentication:**

- ✅ Landing page with token check
- ✅ Automatic redirect to Cognito login
- ✅ OAuth callback handler
- ✅ Token storage in localStorage
- ✅ Only ~85KB bundle size

## 🚀 Run Locally

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env with your Cognito details
# VITE_COGNITO_DOMAIN=your-domain.auth.us-east-2.amazoncognito.com
# VITE_COGNITO_CLIENT_ID=your-client-id
# VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

# 3. Start dev server
npm run dev
```

## 📋 How It Works

### Flow:

1. User visits `http://localhost:5173/`
2. App checks `localStorage` for `access_token`
3. **No token?** → Redirects to Cognito login
4. User logs in with Cognito
5. Cognito redirects back to `/callback?code=xxx`
6. App exchanges code for tokens
7. Tokens stored in localStorage
8. **Success!** (Dashboard coming next)

## 🔑 Files Overview

```
frontend-react/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx      # Main entry - checks for token
│   │   └── Callback.jsx     # Handles OAuth redirect
│   ├── utils/
│   │   └── auth.js          # Authentication utilities
│   ├── App.jsx              # Router setup
│   └── main.jsx             # Entry point
├── .env.example             # Environment template
└── package.json             # Dependencies (React, Router, Axios)
```

## 🧪 Test Authentication

**Without Cognito setup:**
- Visit `/` → Will try to redirect (will fail if Cognito not configured)

**With Cognito setup:**
- Visit `/` → Redirects to Cognito login
- Login → Returns to `/callback`
- Check browser console → Should see "Authentication successful!"
- Check localStorage → Should have `access_token`

## 🛠️ Next Steps

Dashboard page with:
- Job list
- Job details
- Add new job
- Update job status

**Want me to build the dashboard next?**
