# JobTrackr Chrome Extension

A Chrome extension for capturing job application URLs and sending them to the JobTrackr backend for AI-powered analysis.

## Features

- **Keyboard Shortcut**: Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) to quickly capture the current job URL
- **Manual Capture**: Click the extension icon and use the "Capture Current Job" button
- **Authentication**: Integrated AWS Cognito OAuth flow
- **Success Notifications**: Visual feedback when job URLs are successfully captured
- **URL Validation**: Ensures only valid URLs are captured
- **Dashboard Access**: Quick access to the JobTrackr dashboard

## Installation

### Prerequisites

- Chrome browser
- Backend API deployed (see [../backend-lambda/README.md](../backend-lambda/README.md))
- AWS Cognito User Pool configured
- Frontend dashboard running (see [../frontend-react/README.md](../frontend-react/README.md))

### Setup Steps

1. **Configure Extension Settings**:
   ```bash
   cd chrome-extension
   cp config.example.js config.js
   ```

2. **Edit `config.js`** with your values:
   ```javascript
   const EXTENSION_CONFIG = {
     COGNITO_DOMAIN: 'your-domain.auth.us-east-2.amazoncognito.com',
     CLIENT_ID: 'your-cognito-client-id',
     REGION: 'us-east-2',
     API_GATEWAY_URL: 'https://your-api.execute-api.us-east-2.amazonaws.com/dev',
     DASHBOARD_URL: 'http://localhost:5173' // or production URL
   };
   ```

3. **Load Extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right corner)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

4. **Pin Extension** (recommended):
   - Click the puzzle icon in Chrome toolbar
   - Find "JobTrackr" and click the pin icon
   - Extension icon will appear in toolbar for easy access

5. **Get Extension ID** (needed for frontend integration):
   - After loading, copy the Extension ID from `chrome://extensions/`
   - Add this ID to `frontend-react/.env` as `VITE_EXTENSION_ID`

### Production Installation

1. **Package the Extension**:
   - Zip the contents of the `chrome-extension` folder
   - Upload to Chrome Web Store (requires developer account)

## Usage

### Keyboard Shortcut
- Press `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Shift+K` (Mac) on any job posting page
- The extension will automatically capture the URL and send it to the backend

### Manual Capture
1. Click the JobTrackr extension icon in the Chrome toolbar
2. Click "📋 Capture Current Job" button
3. Wait for success confirmation

### Dashboard Access
- Click the extension icon
- Click "Open Dashboard" to view your captured jobs

## Configuration

### Configuration File

The `config.js` file contains all extension settings:

```javascript
const EXTENSION_CONFIG = {
  // AWS Cognito - Copy from AWS Console
  COGNITO_DOMAIN: 'your-domain.auth.us-east-2.amazoncognito.com',
  CLIENT_ID: 'your-client-id',
  REGION: 'us-east-2',

  // Backend API - From sam deploy output
  API_GATEWAY_URL: 'https://xxx.execute-api.us-east-2.amazonaws.com/dev',

  // Dashboard - Local dev or production
  DASHBOARD_URL: 'http://localhost:5173'
};
```

### Getting Configuration Values

1. **COGNITO_DOMAIN**: AWS Cognito → User Pool → App Integration → Domain name
2. **CLIENT_ID**: Cognito → App clients → Your app → Client ID
3. **API_GATEWAY_URL**: Output from `sam deploy` command in backend-lambda
4. **DASHBOARD_URL**:
   - Development: `http://localhost:5173`
   - Production: Your S3/CloudFront URL

### Backend API Integration

The extension calls the following endpoint:
```
POST /api/jobs/ingest
Authorization: Bearer <cognito_token>
Content-Type: application/json

{
  "url": "https://example.com/job-posting"
}
```

**Expected Response**:
```json
{
  "success": true,
  "job_id": "abc123def456",
  "message": "Job captured and analyzed successfully",
  "data": {
    "company": "Example Corp",
    "title": "Software Engineer",
    "location": "Remote"
  }
}
```

## File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for keyboard shortcuts
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── test-page.html        # Test page for keyboard shortcuts
├── shared/               # Shared utilities and styles
│   ├── utils.js         # Common utility functions
│   └── styles.css       # Shared CSS styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md             # This file
└── TESTING_GUIDE.md      # Testing instructions
```

## Permissions

- **activeTab**: Access to current tab URL
- **notifications**: Show success/error messages
- **storage**: Store extension settings
- **host_permissions**: Access to all websites for job URL capture

## Keyboard Shortcuts

- `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Shift+K` (Mac): Capture current job URL

## Authentication

The extension uses AWS Cognito OAuth 2.0 flow:

1. User clicks "Login" in popup
2. Opens Cognito hosted UI in new tab
3. User authenticates
4. Cognito redirects with tokens
5. Extension stores tokens in `chrome.storage`
6. Tokens automatically included in API requests

**Token Storage**: Tokens are stored securely using Chrome's storage API and automatically refreshed when needed.

## Testing

### Manual Testing

1. **Load Extension**: Follow installation steps above
2. **Navigate to Job Site**: Open any job posting (LinkedIn, Indeed, etc.)
3. **Capture Job**:
   - Press `Ctrl+Shift+K` OR
   - Click extension icon → "Capture Current Job"
4. **Verify**: Check notification and dashboard for captured job

### Testing Without Backend

For testing the extension UI without a backend:
- See [TESTING_GUIDE.md](TESTING_GUIDE.md) for dummy data setup
- Use [test-page.html](test-page.html) for local testing

### Debug Mode

1. **View Popup Console**:
   - Right-click extension icon → "Inspect popup"
   - Console will show API calls and errors

2. **View Background Script**:
   - Go to `chrome://extensions/`
   - Click "Service worker" under JobTrackr
   - View background script logs

3. **Check Storage**:
   ```javascript
   // In popup console
   chrome.storage.local.get(null, (data) => console.log(data));
   ```

## Troubleshooting

### Common Issues

**Extension Not Loading**
- Ensure `config.js` exists (copy from `config.example.js`)
- Check Chrome console for JavaScript errors
- Verify manifest.json is valid

**Authentication Fails**
- Verify Cognito domain and client ID in `config.js`
- Ensure extension ID is whitelisted in Cognito
- Check that redirect URIs are configured correctly

**API Errors (401 Unauthorized)**
- Token might be expired - click "Login" again
- Verify backend is deployed and accessible
- Check API Gateway URL in `config.js`

**CORS Errors**
- Backend must include proper CORS headers
- API Gateway needs CORS configuration
- Check Lambda response headers

**Keyboard Shortcut Not Working**
- Shortcut might conflict with another extension
- Try changing in `chrome://extensions/shortcuts`
- Ensure page has focus (not DevTools)

### Debugging Commands

```bash
# Check if extension is loaded
chrome://extensions/

# View all keyboard shortcuts
chrome://extensions/shortcuts

# Clear extension storage
# In popup console:
chrome.storage.local.clear()
```

## Production Deployment

### Chrome Web Store

1. **Prepare Package**:
   ```bash
   # Ensure config.js has production values
   zip -r jobtrackr-extension.zip chrome-extension/ -x "*.git*" "node_modules/*" "test-*"
   ```

2. **Upload to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Create new item
   - Upload zip file
   - Fill in store listing details
   - Submit for review

3. **Update Extension Settings**:
   - Set production `DASHBOARD_URL`
   - Set production `API_GATEWAY_URL`
   - Ensure Cognito allows extension ID

## 📚 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Testing Guide](TESTING_GUIDE.md)
- [Extension ID Setup](HOW_TO_PIN_EXTENSION_ID.md)
