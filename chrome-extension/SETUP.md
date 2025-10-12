# JobTrackr Chrome Extension - Setup Guide

## Prerequisites

1. AWS Account with:
   - Cognito User Pool configured
   - API Gateway deployed with Cognito authorizer
   - Lambda function deployed

## Configuration Steps

### 1. Configure Cognito for Chrome Extension

#### A. Get your Cognito User Pool details
```bash
aws cognito-idp list-user-pools --max-results 10 --region us-east-1
```

Note down your User Pool ID.

#### B. Create or Update App Client

The app client must support **Authorization Code Flow with PKCE** (recommended for public clients):

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name "JobTrackr-ChromeExtension" \
  --allowed-o-auth-flows "authorization_code" \
  --allowed-o-auth-scopes "openid" "email" "profile" \
  --allowed-o-auth-flows-user-pool-client \
  --callback-urls "https://<EXTENSION_ID>.chromiumapp.org/" \
  --supported-identity-providers "COGNITO" \
  --prevent-user-existence-errors "ENABLED" \
  --region us-east-1
```

**Important:** You'll get the `<EXTENSION_ID>` after loading the extension (Step 3).

#### C. Configure Cognito Hosted UI

1. Go to AWS Console → Cognito → Your User Pool → App integration
2. Edit your app client
3. Under **Hosted UI**:
   - Add callback URL: `https://<EXTENSION_ID>.chromiumapp.org/`
   - Add sign-out URL (optional): `https://<EXTENSION_ID>.chromiumapp.org/`
   - Enable **"Authorization code grant"** flow (NOT implicit grant)
   - Select scopes: `openid`, `email`, `profile`
4. Save changes

**Security Note:** This extension now uses Authorization Code Flow with PKCE instead of the deprecated implicit flow. This provides better security as tokens are not exposed in URLs.

### 2. Configure the Extension

#### A. Copy and update config.js

1. Copy the example config file:
```bash
cp config.example.js config.js
```

2. Edit `config.js` with your actual values:
```javascript
const EXTENSION_CONFIG = {
  // AWS Cognito Configuration
  COGNITO_DOMAIN: 'https://your-domain.auth.us-east-1.amazoncognito.com',
  CLIENT_ID: 'your-app-client-id',
  REGION: 'us-east-1',

  // Backend API Configuration
  API_GATEWAY_URL: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev',

  // Dashboard URL
  DASHBOARD_URL: 'http://localhost:3000'
};
```

**Important:** Never commit `config.js` to git. It's already in `.gitignore`.

### 3. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. **Copy the Extension ID** from the card (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 4. Update Cognito with Extension ID

Now that you have the extension ID, update Cognito:

```bash
aws cognito-idp update-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --allowed-o-auth-flows "authorization_code" \
  --allowed-o-auth-flows-user-pool-client \
  --callback-urls "https://ACTUAL_EXTENSION_ID.chromiumapp.org/" \
  --region us-east-1
```

Or via Console:
1. Go to Cognito → User Pool → App Integration → Your App Client
2. Edit Hosted UI settings
3. Update callback URL with actual extension ID: `https://ACTUAL_EXTENSION_ID.chromiumapp.org/`
4. Ensure **Authorization code grant** is enabled (NOT implicit grant)
5. Save

### 5. Test the Extension

1. Click the JobTrackr extension icon
2. Click "Login with Cognito"
3. You should see the Cognito Hosted UI login page
4. Sign in with your credentials
5. After successful login, you'll be redirected back to the extension
6. The extension should now show your email address
7. Try capturing a job URL!

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the callback URL in Cognito matches exactly: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
- Extension ID changes if you reload the unpacked extension - update Cognito if needed

### "Not authenticated" when capturing jobs
- Check browser console for errors
- Verify ID token is being stored: Open DevTools → Application → Storage → Local Storage → Extension
- Try logging out and logging in again

### Network errors
- Verify API Gateway URL is correct
- Check CORS is configured on API Gateway
- Verify Cognito authorizer is attached to the routes

### Token expired errors
- The extension now uses authorization code flow with PKCE and supports automatic token refresh
- Refresh tokens are stored securely and used automatically when access tokens expire
- If refresh fails, user will be prompted to login again

## API Gateway CORS Configuration

Make sure your API Gateway has CORS enabled:

1. Go to API Gateway Console → Your API → Resources
2. Select a resource → Actions → Enable CORS
3. Add allowed origins (or use `*` for development):
   - `chrome-extension://YOUR_EXTENSION_ID`
4. Deploy API after changes

## Security Notes

- **PKCE Implementation**: Uses Authorization Code Flow with PKCE (Proof Key for Code Exchange) for enhanced security
- **No Token Exposure**: Authorization codes are exchanged server-side, tokens never appear in URLs
- **Refresh Tokens**: Supports automatic token refresh for seamless user experience
- **Secure Storage**: Tokens are stored in `chrome.storage.local` which is encrypted by Chrome
- **Config Security**: Never commit `config.js` with actual credentials to git (it's in `.gitignore`)
- **HTTPS Only**: All communication with Cognito and API Gateway uses HTTPS

## Next Steps

1. Create test users in Cognito for testing
2. Test job capture functionality end-to-end
3. Build the dashboard UI for viewing captured jobs
4. Package extension for Chrome Web Store (for production)

## Development Tips

### View Extension Logs
- Background service worker: `chrome://extensions/` → JobTrackr → "service worker" link
- Popup: Right-click extension icon → Inspect popup

### Clear stored data
```javascript
// In extension console:
chrome.storage.local.clear();
```

### Get current tokens
```javascript
// In extension console:
chrome.storage.local.get(['cognitoTokens'], (result) => {
  console.log(result);
});
```

## Support

For issues or questions:
1. Check browser console for errors
2. Check CloudWatch logs for Lambda errors
3. Verify Cognito configuration
4. Test API endpoints directly with Postman
