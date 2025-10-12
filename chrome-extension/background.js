// Background service worker for JobTrackr Chrome Extension

// Import shared utilities and auth
importScripts('config.js');
importScripts('auth.js');
importScripts('shared/utils.js');

// Check if URL is likely a job posting
function isJobUrl(url) {
  if (!url) return false;

  const urlLower = url.toLowerCase();

  // Check if "jobs" appears anywhere in the URL
  if (urlLower.includes('jobs')) {
    return true;
  }

  // Additional job-related keywords
  const jobKeywords = [
    'career',
    'careers',
    'job',
    'hiring',
    'apply',
    'vacancy',
    'vacancies',
    'position',
    'employment',
    'opportunities'
  ];

  return jobKeywords.some(keyword => urlLower.includes(keyword));
}

// Listen for tab updates to detect job URLs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only trigger when the page has finished loading
  if (changeInfo.status === 'complete' && tab.url) {
    if (isJobUrl(tab.url)) {
      // Set badge to indicate job detected
      chrome.action.setBadgeText({ text: '!', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#667eea', tabId: tabId });

      // Inject the overlay content script
      try {
        console.log('Attempting to inject overlay for tab:', tabId, 'URL:', tab.url);

        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content-overlay.js']
        });

        console.log('Overlay injected successfully!');
      } catch (error) {
        console.error('Failed to inject overlay:', error);

        // Show notification as fallback
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Job Posting Detected! 💼',
          message: 'Click the JobTrackr extension icon to capture this job.',
          priority: 2
        });
      }
    } else {
      // Clear badge if not a job URL
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureJob') {
    handleCaptureFromOverlay(message.url, message.title)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Handle capture job from overlay
async function handleCaptureFromOverlay(url, title) {
  try {
    // Check if user is authenticated
    const isAuthenticated = await CognitoAuth.isAuthenticated();

    if (!isAuthenticated) {
      return {
        success: false,
        error: 'Please login first. Click the extension icon to login.'
      };
    }

    // Send URL to backend
    const response = await Utils.sendUrlToBackend(url, title);

    if (response.success) {
      Utils.showNotification('Success', 'Job captured successfully!');
      return { success: true };
    } else {
      return {
        success: false,
        error: response.error || 'Failed to capture job'
      };
    }
  } catch (error) {
    console.error('Error capturing job:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture job'
    };
  }
}

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-job-url') {
    captureCurrentTabUrl();
  }
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Extension icon click opens popup (handled by manifest)
  // No additional action needed here
});

// Function to capture current tab URL and send to backend
async function captureCurrentTabUrl() {
  try {
    // Check if user is authenticated
    const isAuthenticated = await CognitoAuth.isAuthenticated();

    if (!isAuthenticated) {
      Utils.showNotification('Authentication Required', 'Please login to capture jobs');
      return;
    }

    // Get the current active tab
    const tab = await Utils.getCurrentTab();

    if (!tab || !tab.url) {
      Utils.showNotification('Error', 'No active tab found or URL not available');
      return;
    }

    // Validate URL (basic check)
    if (!Utils.isValidUrl(tab.url)) {
      Utils.showNotification('Error', 'Current page URL is not valid');
      return;
    }

    // Show loading notification
    Utils.showNotification('JobTrackr', 'Capturing job URL...');

    // Send URL to backend
    const response = await Utils.sendUrlToBackend(tab.url, tab.title);

    if (response.success) {
      await Utils.handleCaptureSuccess(tab.url, tab.title, response);
    } else {
      await Utils.handleCaptureError(response.error);
    }

  } catch (error) {
    console.error('Error capturing job URL:', error);
    Utils.showNotification('Error', 'Failed to capture job URL. Please try again.');
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('JobTrackr extension installed successfully');
    Utils.showNotification('JobTrackr', 'Extension installed! Use Ctrl+Shift+K to capture job URLs.');
  }
});
