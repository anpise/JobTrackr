# JobTrackr Chrome Extension

A Chrome extension for capturing job application URLs and sending them to the JobTrackr backend for processing.

## Features

- **Keyboard Shortcut**: Press `Ctrl+Shift+K` (or `Cmd+Shift+K` on Mac) to quickly capture the current job URL
- **Manual Capture**: Click the extension icon and use the "Capture Current Job" button
- **Success Notifications**: Visual feedback when job URLs are successfully captured
- **URL Validation**: Ensures only valid URLs are captured
- **Dashboard Access**: Quick access to the JobTrackr dashboard

## Installation

### Development Installation

1. **Load the Extension in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

2. **Test with Dummy Responses**:
   - The extension now includes dummy responses for testing
   - No backend API needed for initial testing
   - See `TESTING_GUIDE.md` for detailed testing instructions

3. **Configure Backend URL** (when ready for real API):
   - Update the `BACKEND_URL` in both `background.js` and `popup.js`
   - Default is set to `http://localhost:8000`

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

### Backend API Endpoint
The extension expects the backend to have the following endpoint:
```
POST /api/jobs/capture
Content-Type: application/json

{
  "url": "https://example.com/job-posting",
  "title": "Job Title",
  "captured_at": "2024-01-01T00:00:00.000Z"
}
```

### Response Format
The backend should respond with:
```json
{
  "success": true,
  "job_id": "uuid",
  "message": "Job captured successfully"
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

## Error Handling

The extension handles various error scenarios:
- Invalid URLs
- Network connectivity issues
- Backend API errors
- Missing active tabs

## Development Notes

### Testing
1. Load the extension in Chrome Developer mode
2. Navigate to a job posting website
3. Use the keyboard shortcut or manual capture
4. Check browser console for any errors
5. Verify backend receives the data

### Debugging
- Open Chrome DevTools on the extension popup
- Check the background script in `chrome://extensions/`
- Monitor network requests in DevTools

### Common Issues
- **CORS errors**: Ensure backend has proper CORS headers
- **Permission denied**: Check manifest permissions
- **Network errors**: Verify backend URL and connectivity

## Future Enhancements

- [ ] Add job title and company extraction
- [ ] Support for multiple job sites
- [ ] Offline mode with sync
- [ ] Custom keyboard shortcuts
- [ ] Job application status tracking
