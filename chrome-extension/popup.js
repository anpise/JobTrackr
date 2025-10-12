// Popup script for JobTrackr Chrome Extension

// Get configuration from config.js
const BACKEND_URL = typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.API_GATEWAY_URL : '';
const DASHBOARD_URL = typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.DASHBOARD_URL : 'http://localhost:3000';

// DOM elements
const captureBtn = document.getElementById('captureBtn');
const openDashboardBtn = document.getElementById('openDashboard');
const statusDiv = document.getElementById('status');
const currentUrlDiv = document.getElementById('currentUrl');
const authSection = document.getElementById('authSection');
const loggedInSection = document.getElementById('loggedInSection');
const loggedOutSection = document.getElementById('loggedOutSection');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailDiv = document.getElementById('userEmail');

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded, setting up...');
  try {
    await checkAuthStatus();
    await updateCurrentUrl();
    setupEventListeners();
    console.log('Popup setup complete');
  } catch (error) {
    console.error('Error setting up popup:', error);
  }
});

// Check authentication status
async function checkAuthStatus() {
  try {
    const isAuthenticated = await CognitoAuth.isAuthenticated();

    authSection.style.display = 'block';

    if (isAuthenticated) {
      // Show logged in state
      const userInfo = await CognitoAuth.getUserInfo();
      userEmailDiv.textContent = userInfo?.email || 'User';
      loggedInSection.style.display = 'block';
      loggedOutSection.style.display = 'none';
      captureBtn.classList.remove('disabled');
    } else {
      // Show logged out state
      loggedInSection.style.display = 'none';
      loggedOutSection.style.display = 'block';
      captureBtn.classList.add('disabled');
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    loggedInSection.style.display = 'none';
    loggedOutSection.style.display = 'block';
    captureBtn.classList.add('disabled');
  }
}

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

  if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
    console.log('Login button listener added');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
    console.log('Logout button listener added');
  }
}

// Handle login
async function handleLogin() {
  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    const result = await CognitoAuth.login();

    if (result.success) {
      showStatus('✅ Login successful!', 'success');
      await checkAuthStatus();
    } else {
      showStatus(`❌ Login failed: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Login error:', error);
    showStatus('❌ Login failed', 'error');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Login with Cognito';
  }
}

// Handle logout
async function handleLogout() {
  try {
    const result = await CognitoAuth.logout();

    if (result.success) {
      showStatus('Logged out successfully', 'success');
      await checkAuthStatus();
    }
  } catch (error) {
    console.error('Logout error:', error);
    showStatus('❌ Logout failed', 'error');
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
    // Get valid ID token (auto-refreshes if needed)
    const idToken = await CognitoAuth.getValidIdToken();

    if (!idToken) {
      return {
        success: false,
        error: 'Not authenticated. Please login first.'
      };
    }

    // Validate backend URL
    if (!BACKEND_URL || BACKEND_URL === '') {
      console.error('Backend URL not configured!');
      return {
        success: false,
        error: 'Backend URL not configured. Please check config.js'
      };
    }

    console.log('Sending to backend:', BACKEND_URL);

    // Send request to backend
    const response = await fetch(`${BACKEND_URL}/api/jobs/ingest`, {
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
}


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

// Update current URL display and highlight if job URL
async function updateCurrentUrl() {
  try {
    const tab = await getCurrentTab();
    if (tab && tab.url) {
      currentUrlDiv.textContent = tab.url;
      currentUrlDiv.title = tab.url;

      // Highlight capture button if it's a job URL
      if (isJobUrl(tab.url)) {
        captureBtn.classList.add('job-detected');
        captureBtn.textContent = '✨ Capture This Job!';
      } else {
        captureBtn.classList.remove('job-detected');
        captureBtn.textContent = '📋 Capture Current Job';
      }
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
      await updateCurrentUrl();
    } else {
      showStatus(`❌ Error: ${response.error}`, 'error');
    }

  } catch (error) {
    console.error('Error capturing job:', error);
    showStatus('❌ Failed to capture job', 'error');
  } finally {
    // Re-enable button and restore text based on URL
    captureBtn.disabled = false;
    const tab = await getCurrentTab();
    if (tab && isJobUrl(tab.url)) {
      captureBtn.textContent = '✨ Capture This Job!';
    } else {
      captureBtn.textContent = '📋 Capture Current Job';
    }
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
