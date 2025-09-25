// Popup script for JobTrackr Chrome Extension

// Configuration
const BACKEND_URL = 'http://localhost:8000';
const DASHBOARD_URL = 'http://localhost:3000';

// DOM elements
const captureBtn = document.getElementById('captureBtn');
const openDashboardBtn = document.getElementById('openDashboard');
const statusDiv = document.getElementById('status');
const currentUrlDiv = document.getElementById('currentUrl');
const recentCaptures = document.getElementById('recentCaptures');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded, setting up...');
  try {
    await updateCurrentUrl();
    await loadRecentCaptures();
    setupEventListeners();
    console.log('Popup setup complete');
  } catch (error) {
    console.error('Error setting up popup:', error);
  }
});

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  if (captureBtn) {
    captureBtn.addEventListener('click', captureCurrentJob);
    console.log('Capture button listener added');
  } else {
    console.error('Capture button not found!');
  }
  
  if (openDashboardBtn) {
    openDashboardBtn.addEventListener('click', openDashboard);
    console.log('Dashboard button listener added');
  } else {
    console.error('Dashboard button not found!');
  }
}

// Utility functions
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

async function sendUrlToBackend(url, title = '') {
  try {
    // Simulate network delay
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate random success/failure for testing
    const shouldSucceed = Math.random() < 0.8; // 80% success rate
    
    if (shouldSucceed) {
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
      const errorMessages = [
        'Network connection failed',
        'Backend server is down',
        'Invalid job URL format',
        'Rate limit exceeded',
        'Database connection error'
      ];
      
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
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
}

async function saveRecentCapture(url, title) {
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
}

async function loadRecentCaptures() {
  try {
    const captures = await chrome.storage.local.get(['recentCaptures']) || { recentCaptures: [] };
    const recentCaptures = captures.recentCaptures || [];
    
    if (recentCaptures.length === 0) {
      recentCaptures.innerHTML = '<div class="no-captures">No captures yet</div>';
      return;
    }
    
    recentCaptures.innerHTML = recentCaptures.map(capture => `
      <div class="capture-item">
        <div style="font-weight: bold; margin-bottom: 4px;">${capture.title}</div>
        <div style="color: rgba(255, 255, 255, 0.7); font-size: 10px; margin-bottom: 4px;">${capture.url}</div>
        <div class="capture-time">${capture.date}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading recent captures:', error);
  }
}

// Update current URL display
async function updateCurrentUrl() {
  try {
    const tab = await getCurrentTab();
    if (tab && tab.url) {
      currentUrlDiv.textContent = tab.url;
      currentUrlDiv.title = tab.url;
    } else {
      currentUrlDiv.textContent = 'No active tab found';
    }
  } catch (error) {
    console.error('Error getting current URL:', error);
    currentUrlDiv.textContent = 'Error getting URL';
  }
}

// Capture current job
async function captureCurrentJob() {
  console.log('Capture button clicked!');
  try {
    // Disable button and show loading
    captureBtn.disabled = true;
    captureBtn.textContent = 'Capturing...';
    showStatus('Capturing job URL...', 'info');

    // Get current tab
    const tab = await getCurrentTab();
    
    if (!tab || !tab.url) {
      showStatus('No active tab found', 'error');
      return;
    }

    // Validate URL
    if (!isValidUrl(tab.url)) {
      showStatus('Invalid URL', 'error');
      return;
    }

    // Send to backend
    const response = await sendUrlToBackend(tab.url, tab.title);
    
    if (response.success) {
      showStatus('✅ Job captured successfully!', 'success');
      // Save to recent captures
      await saveRecentCapture(tab.url, tab.title);
      // Reload recent captures display
      await loadRecentCaptures();
      // Update current URL display
      await updateCurrentUrl();
    } else {
      showStatus(`❌ Error: ${response.error}`, 'error');
    }

  } catch (error) {
    console.error('Error capturing job:', error);
    showStatus('❌ Failed to capture job', 'error');
  } finally {
    // Re-enable button
    captureBtn.disabled = false;
    captureBtn.textContent = '📋 Capture Current Job';
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // Auto-hide after 3 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}


// Open dashboard
function openDashboard() {
  chrome.tabs.create({ url: DASHBOARD_URL });
  window.close();
}

// Handle keyboard shortcuts in popup
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'K') {
    event.preventDefault();
    captureCurrentJob();
  }
});
