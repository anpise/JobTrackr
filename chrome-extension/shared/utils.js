// Shared utilities for JobTrackr Chrome Extension

// Configuration - Use EXTENSION_CONFIG if available
const CONFIG = {
  get BACKEND_URL() {
    return typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.API_GATEWAY_URL : 'http://localhost:8000';
  },
  get DASHBOARD_URL() {
    return typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.DASHBOARD_URL : 'http://localhost:3000';
  },
  API_ENDPOINT: '/api/jobs/ingest'
};

// Error messages for dummy responses
const ERROR_MESSAGES = [
  'Network connection failed',
  'Backend server is down',
  'Invalid job URL format',
  'Rate limit exceeded',
  'Database connection error'
];

// Utility functions
const Utils = {
  // Get current active tab
  async getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  },

  // Validate URL
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  // Send URL to backend with authentication
  async sendUrlToBackend(url, title = '') {
    try {
      // Check if CognitoAuth is available
      const auth = typeof CognitoAuth !== 'undefined' ? CognitoAuth : self.CognitoAuth;

      if (!auth) {
        throw new Error('CognitoAuth not available');
      }

      // Get valid ID token (auto-refreshes if needed)
      const idToken = await auth.getValidIdToken();

      if (!idToken) {
        return {
          success: false,
          error: 'Not authenticated. Please login first.'
        };
      }

      // Determine backend URL
      const backendUrl = CONFIG.BACKEND_URL;

      if (!backendUrl || backendUrl === '') {
        console.error('Backend URL not configured!');
        return {
          success: false,
          error: 'Backend URL not configured. Please check config.js'
        };
      }

      console.log('Sending to backend:', backendUrl);

      // Send request to backend
      const response = await fetch(`${backendUrl}${CONFIG.API_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': idToken
        },
        body: JSON.stringify({
          url,
          title
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Backend error:', response.status, data);

        // Handle 401 (token expired)
        if (response.status === 401) {
          return {
            success: false,
            error: 'Session expired. Please login again.'
          };
        }

        return {
          success: false,
          error: data.message || data.error || `HTTP error ${response.status}`
        };
      }

      console.log('✅ Job captured successfully:', data);
      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Unexpected error:', error);

      return {
        success: false,
        error: `Network error: ${error.message}`
      };
    }
  },

  // Show Chrome notification
  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: title,
      message: message
    });
  },

  // Show on-screen popup notification
  async showOnScreenPopup(title, message) {
    try {
      // Get the current active tab
      const tab = await this.getCurrentTab();
      
      if (!tab || !tab.id) return;
      
      // Inject popup into the current page
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (title, message) => {
          // Create popup element
          const popup = document.createElement('div');
          popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 300px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            border: 1px solid rgba(255, 255, 255, 0.2);
            animation: slideIn 0.3s ease-out;
          `;
          
          popup.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${title}</div>
            <div style="font-size: 14px; opacity: 0.9;">${message}</div>
            <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">JobTrackr</div>
          `;
          
          // Add animation styles if not already added
          if (!document.getElementById('jobtrackr-popup-styles')) {
            const style = document.createElement('style');
            style.id = 'jobtrackr-popup-styles';
            style.textContent = `
              @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }
          
          // Add to page
          document.body.appendChild(popup);
          
          // Auto-remove after 4 seconds
          setTimeout(() => {
            popup.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
              if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
              }
            }, 300);
          }, 4000);
        },
        args: [title, message]
      });
    } catch (error) {
      console.error('Error showing on-screen popup:', error);
    }
  },

  // Save recent capture to local storage
  async saveRecentCapture(url, title) {
    try {
      const captures = await chrome.storage.local.get(['recentCaptures']) || { recentCaptures: [] };
      const recentCaptures = captures.recentCaptures || [];
      
      const newCapture = {
        url: url,
        title: title,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
      };
      
      recentCaptures.unshift(newCapture);
      
      // Keep only last 10 captures
      if (recentCaptures.length > 10) {
        recentCaptures.splice(10);
      }
      
      await chrome.storage.local.set({ recentCaptures });
    } catch (error) {
      console.error('Error saving recent capture:', error);
    }
  },

  // Load recent captures from local storage
  async loadRecentCaptures() {
    try {
      const captures = await chrome.storage.local.get(['recentCaptures']) || { recentCaptures: [] };
      return captures.recentCaptures || [];
    } catch (error) {
      console.error('Error loading recent captures:', error);
      return [];
    }
  },

  // Handle capture success
  async handleCaptureSuccess(url, title, response) {
    this.showNotification('Success', 'Job URL captured successfully!');
    console.log('Job captured:', response.data);
    await this.showOnScreenPopup('Job Captured!', 'Successfully captured job application');
    await this.saveRecentCapture(url, title);
  },

  // Handle capture error
  async handleCaptureError(error) {
    this.showNotification('Error', error || 'Failed to capture job URL');
    await this.showOnScreenPopup('Capture Failed', error || 'Failed to capture job URL');
  },


  // Open dashboard
  openDashboard() {
    chrome.tabs.create({ url: CONFIG.DASHBOARD_URL });
  }
};

// Make Utils available globally
if (typeof window !== 'undefined') {
  window.Utils = Utils;
  window.CONFIG = CONFIG;
} else {
  // For service worker context
  self.Utils = Utils;
  self.CONFIG = CONFIG;
}
