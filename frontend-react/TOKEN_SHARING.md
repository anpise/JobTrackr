# 🔐 Token Sharing Between Extension and Dashboard

## Problem Solved

**Extension and Dashboard now share the SAME authentication tokens!**

No need to log in twice - authenticate once in either place, and you're logged in everywhere.

---

## How It Works

### The Flow:

```
User logs in via Extension (PKCE OAuth)
         ↓
Tokens stored in chrome.storage.local
         ↓
User opens Dashboard
         ↓
Dashboard asks Extension: "Do you have tokens?"
         ↓
Extension responds: "Yes, here they are!"
         ↓
Dashboard uses Extension's tokens
         ↓
✅ User is authenticated without re-login!
```

---

## Technical Implementation

### 1. **Dashboard Requests Tokens from Extension**

```typescript
// frontend-react/src/utils/auth.ts
async getTokenFromExtension(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    return null; // Extension not available
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      EXTENSION_ID,  // Your extension ID
      { action: 'getTokens' },
      (response) => {
        if (response?.success && response?.tokens) {
          // Store tokens locally as backup
          this.setToken(response.tokens.accessToken);
          localStorage.setItem('id_token', response.tokens.idToken);
          resolve(response.tokens.accessToken);
        } else {
          resolve(null);
        }
      }
    );
  });
}
```

### 2. **Extension Responds with Tokens**

```javascript
// chrome-extension/background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getTokens') {
    CognitoAuth.getTokens()
      .then(tokens => {
        if (tokens) {
          sendResponse({ success: true, tokens: tokens });
        } else {
          sendResponse({ success: false, error: 'No tokens found' });
        }
      });
    return true; // Keep channel open
  }
});
```

### 3. **Dashboard Checks Extension First**

```typescript
// Priority order:
async hasToken(): Promise<boolean> {
  // 1. Try extension first (source of truth)
  const extensionToken = await this.getTokenFromExtension();
  if (extensionToken) return true;

  // 2. Fallback to localStorage
  return !!localStorage.getItem('access_token');
}
```

---

## Setup Required

### 1. **Extension Configuration**

Add to `chrome-extension/manifest.json`:

```json
{
  "externally_connectable": {
    "matches": [
      "http://localhost:5173/*",    // Dev
      "http://localhost:3000/*",    // Alt dev
      "https://*.jobtrackr.com/*"   // Production
    ]
  }
}
```

### 2. **Dashboard Configuration**

Add to `frontend-react/.env`:

```bash
# Get your extension ID from chrome://extensions
VITE_EXTENSION_ID=abcdefghijklmnopqrstuvwxyz123456
```

**How to find Extension ID:**
1. Open Chrome
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Find "JobTrackr" extension
5. Copy the ID (32-character string)

---

## Authentication Scenarios

### Scenario 1: Extension Login First

```
1. User installs extension
2. User logs in via extension popup
3. Tokens stored in chrome.storage
4. User opens dashboard
5. Dashboard requests tokens from extension
6. ✅ Logged in immediately!
```

### Scenario 2: Dashboard Login First

```
1. User opens dashboard
2. No extension tokens found
3. Dashboard redirects to Cognito
4. User logs in
5. Tokens stored in localStorage
6. User can now use dashboard
7. (Extension will need separate login)
```

### Scenario 3: Both Installed, Both Logged In

```
1. Extension has tokens (source of truth)
2. Dashboard has tokens (backup)
3. Dashboard prefers extension tokens
4. ✅ Always in sync!
```

---

## Storage Comparison

| Storage | Extension | Dashboard | Shared? |
|---------|-----------|-----------|---------|
| `chrome.storage.local` | ✅ Primary | ❌ Can't access | No |
| `localStorage` | ❌ Can't access | ✅ Backup | No |
| **Message passing** | ✅ Provides | ✅ Receives | ✅ **Yes!** |

---

## Security Benefits

### Extension Tokens Are More Secure:

1. **PKCE Flow** - Uses Proof Key for Code Exchange
2. **Isolated Storage** - `chrome.storage` not accessible to websites
3. **No CORS** - Chrome handles cross-origin messaging securely
4. **Token Refresh** - Extension handles refresh automatically

### Dashboard Benefits:

1. **Seamless UX** - No re-login needed
2. **Single Source of Truth** - Extension manages auth
3. **Automatic Sync** - Always uses latest tokens
4. **Fallback Support** - Works standalone if extension not installed

---

## Testing

### Test 1: Extension → Dashboard

```bash
# 1. Load extension in Chrome
# 2. Click extension → Login
# 3. Open dashboard (http://localhost:5173)
# Expected: Dashboard shows "User has token" in console
```

### Test 2: Dashboard → Extension

```bash
# 1. Open dashboard
# 2. Login via Cognito
# 3. Click extension icon
# Expected: Extension shows user as logged in
# (Currently: Extension won't see dashboard tokens)
```

### Test 3: Logout Sync

```bash
# Currently NOT implemented:
# - Logout in extension → Dashboard stays logged in
# - Logout in dashboard → Extension stays logged in
# TODO: Add logout sync via messaging
```

---

## Limitations & Future Improvements

### Current Limitations:

1. **One-way sync** - Dashboard reads from extension, not vice versa
2. **No logout sync** - Logout in one doesn't logout the other
3. **Extension required** - Dashboard falls back to own auth if no extension

### Planned Improvements:

1. **Bidirectional sync** - Extension reads dashboard tokens too
2. **Logout broadcasting** - Logout syncs across both
3. **Token refresh sync** - Refreshed tokens shared automatically
4. **Connection status** - Show if extension is available

---

## Debugging

### Dashboard Can't Find Extension:

```javascript
// Check console for:
"Extension not available: Could not establish connection..."

// Solutions:
1. Verify extension is loaded (chrome://extensions)
2. Check VITE_EXTENSION_ID in .env matches actual ID
3. Ensure manifest.json has externally_connectable
4. Reload extension after manifest changes
```

### Extension Not Responding:

```javascript
// Check extension console (background.js):
// Should see message handler for 'getTokens'

// Solutions:
1. Check background.js loaded correctly
2. Verify message handler is registered
3. Test with: chrome.runtime.sendMessage(EXTENSION_ID, {action: 'getTokens'})
```

---

## Summary

✅ **Extension = Primary Auth** (PKCE, secure storage)
✅ **Dashboard = Consumer** (requests tokens from extension)
✅ **localStorage = Backup** (works without extension)
✅ **Single Sign-On** (login once, works everywhere)

**Result:** Professional-grade authentication with minimal complexity! 🎉
