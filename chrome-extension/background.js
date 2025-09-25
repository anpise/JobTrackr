// Background service worker for JobTrackr Chrome Extension

// Import shared utilities
importScripts('shared/utils.js');

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

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);
});

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('JobTrackr extension installed successfully');
    Utils.showNotification('JobTrackr', 'Extension installed! Use Ctrl+Shift+K to capture job URLs.');
  }
});
