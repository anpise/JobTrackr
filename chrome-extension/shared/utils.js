// Shared utilities for JobTrackr Chrome Extension

// Configuration
const CONFIG = {
  BACKEND_URL: 'http://localhost:8000',
  DASHBOARD_URL: 'http://localhost:3000',
  API_ENDPOINT: '/api/jobs/capture',
  SUCCESS_RATE: 0.8, // 80% success rate for dummy responses
  NETWORK_DELAY_MIN: 1000,
  NETWORK_DELAY_MAX: 3000
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

  // Send URL to backend (with dummy responses for testing)
  async sendUrlToBackend(url, title = '') {
    try {
      // Simulate network delay
      const delay = CONFIG.NETWORK_DELAY_MIN + Math.random() * (CONFIG.NETWORK_DELAY_MAX - CONFIG.NETWORK_DELAY_MIN);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate random success/failure for testing
      const shouldSucceed = Math.random() < CONFIG.SUCCESS_RATE;
      
      if (shouldSucceed) {
        // Simulate successful response
        const mockResponse = {
          success: true,
          job_id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          message: 'Job captured successfully',
          data: {
            url: url,
            title: title,
            captured_at: new Date().toISOString(),
            status: 'captured'
          }
        };
        
        console.log('✅ Mock successful response:', mockResponse);
        return { success: true, data: mockResponse };
      } else {
        // Simulate error response
        const randomError = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
        console.log('❌ Mock error response:', randomError);
        return { 
          success: false, 
          error: randomError 
        };
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      return { 
        success: false, 
        error: 'Unexpected error occurred' 
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
