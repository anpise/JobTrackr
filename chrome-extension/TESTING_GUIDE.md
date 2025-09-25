# JobTrackr Chrome Extension - Testing Guide

## 🧪 Testing Without Backend API

The extension now includes **dummy responses** for testing without needing a backend API. This allows you to test all functionality immediately.

## 🚀 Quick Setup

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `chrome-extension` folder
5. The JobTrackr extension should appear in your extensions list

### 2. Pin the Extension
1. Click the **puzzle piece icon** in Chrome toolbar
2. Find **JobTrackr** and click the **pin icon** 📌
3. The JobTrackr icon should now be visible in your toolbar

## 🧪 Testing Scenarios

### Test 1: Keyboard Shortcut
1. Navigate to any website (e.g., `https://linkedin.com/jobs`)
2. Press **`Ctrl+Shift+K`** (Windows/Linux) or **`Cmd+Shift+K`** (Mac)
3. **Expected Result**: 
   - Chrome notification appears
   - 80% chance of success, 20% chance of error
   - Console shows detailed logs

### Test 2: Manual Capture via Popup
1. Click the **JobTrackr extension icon** in toolbar
2. Click **"Capture Current Job"** button
3. **Expected Result**:
   - Button shows "Capturing..." during process
   - Status message appears in popup
   - Success/error feedback displayed

### Test 3: Error Handling
1. Try capturing on `chrome://` pages (should show "Invalid URL")
2. Try capturing on `file://` pages (should show "Invalid URL")
3. Test multiple captures to see random error responses

## 📊 What You'll See

### Success Response (80% chance)
```
✅ Job captured successfully!
- Chrome notification: "Success - Job URL captured successfully!"
- Popup status: "✅ Job captured successfully!"
- Console log: Mock successful response with job_id
```

### Error Response (20% chance)
```
❌ Error: [Random error message]
- Chrome notification: "Error - [error message]"
- Popup status: "❌ Error: [error message]"
- Console log: Mock error response
```

### Random Error Messages
- "Network connection failed"
- "Backend server is down"
- "Invalid job URL format"
- "Rate limit exceeded"
- "Database connection error"

## 🔍 Debugging

### Check Console Logs
1. **For Popup**: Right-click extension icon → "Inspect popup"
2. **For Background**: Go to `chrome://extensions/` → JobTrackr → "Inspect views: background page"

### Console Output Examples
```javascript
// Success
✅ Mock successful response: {
  success: true,
  job_id: "job_1703123456789_abc123def",
  message: "Job captured successfully",
  data: { url: "https://...", title: "...", ... }
}

// Error
❌ Mock error response: "Network connection failed"
```

## 🎯 Test Checklist

- [ ] Extension loads without errors
- [ ] Keyboard shortcut `Ctrl+Shift+K` works
- [ ] Manual capture via popup works
- [ ] Success notifications appear
- [ ] Error notifications appear
- [ ] URL validation works (chrome://, file:// blocked)
- [ ] Console logs show detailed responses
- [ ] Popup shows current URL
- [ ] Button states change during capture
- [ ] Multiple captures work (success/error mix)

## 🔧 Configuration

### Change Success Rate
In both `background.js` and `popup.js`, modify this line:
```javascript
const shouldSucceed = Math.random() > 0.2; // 80% success rate
// Change 0.2 to 0.0 for 100% success, 0.5 for 50% success
```

### Add Custom Error Messages
In the `errorMessages` array, add your own error messages:
```javascript
const errorMessages = [
  'Network connection failed',
  'Backend server is down',
  'Your custom error message here'
];
```

## 🚀 Next Steps

Once testing is complete:
1. **Replace dummy functions** with real API calls
2. **Update backend URL** in configuration
3. **Test with real backend** when available
4. **Package for production** deployment

## 🐛 Troubleshooting

### Extension Not Loading
- Check `manifest.json` syntax
- Ensure all files are in correct locations
- Check Chrome console for errors

### Keyboard Shortcut Not Working
- Check if shortcut conflicts with other extensions
- Try different shortcut in `manifest.json`
- Restart Chrome after changes

### Notifications Not Showing
- Check Chrome notification permissions
- Ensure `notifications` permission in manifest
- Check if Chrome is blocking notifications

### Popup Not Opening
- Check if extension is pinned
- Try refreshing the extension
- Check for JavaScript errors in popup

## 📝 Notes

- **Dummy responses** simulate real network delays (1-3 seconds)
- **Random success/error** helps test both scenarios
- **Console logging** provides detailed debugging information
- **All functionality** works without backend API
- **Easy to switch** to real API when ready
