// Content script for JobTrackr - Injects overlay when job posting detected

console.log('JobTrackr content-overlay.js loaded!');

let isDragging = false;
let currentY = 100; // Initial top position

// Check if overlay already exists
if (!document.getElementById('jobtrackr-overlay')) {
  console.log('Creating JobTrackr overlay...');
  createJobTrackerOverlay();
} else {
  console.log('JobTrackr overlay already exists');
}

function createJobTrackerOverlay() {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'jobtrackr-overlay';
  overlay.innerHTML = `
    <div class="jobtrackr-container">
      <!-- Minimized state (small movable widget) -->
      <div class="jobtrackr-minimized" id="jobtrackr-minimized" style="display: none; top: ${currentY}px;">
        <div class="jobtrackr-mini-content">
          <div class="jobtrackr-mini-logo">JT</div>
        </div>
        <button class="jobtrackr-mini-close" id="jobtrackr-mini-close">✕</button>
      </div>

      <!-- Expanded state (side panel) -->
      <div class="jobtrackr-expanded" id="jobtrackr-expanded">
        <div class="jobtrackr-header">
          <div class="jobtrackr-logo">
            <span class="jobtrackr-icon">💼</span>
            <span class="jobtrackr-title">JobTrackr</span>
          </div>
          <button class="jobtrackr-minimize" id="jobtrackr-minimize">─</button>
        </div>

        <div class="jobtrackr-content">
          <div class="jobtrackr-message">
            <div class="jobtrackr-detected">✨ Job Posting Detected!</div>
            <div class="jobtrackr-subtitle">Capture this opportunity to your job tracker</div>
          </div>

          <div class="jobtrackr-url-preview" id="jobtrackr-url">
            ${window.location.href}
          </div>

          <div class="jobtrackr-actions">
            <button class="jobtrackr-button primary" id="jobtrackr-capture">
              📋 Capture This Job
            </button>
          </div>

          <div class="jobtrackr-status" id="jobtrackr-status"></div>
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .jobtrackr-container {
      position: fixed;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    /* Minimized state - small movable widget */
    .jobtrackr-minimized {
      position: fixed;
      right: 0;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px 0 0 10px;
      box-shadow: -3px 3px 15px rgba(0, 0, 0, 0.25);
      cursor: move;
      transition: all 0.2s ease;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      z-index: 2147483647;
    }

    .jobtrackr-minimized:hover {
      width: 55px;
      box-shadow: -4px 4px 18px rgba(0, 0, 0, 0.35);
    }

    .jobtrackr-minimized:active {
      cursor: grabbing;
    }

    .jobtrackr-mini-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      pointer-events: none;
    }

    .jobtrackr-mini-logo {
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .jobtrackr-mini-logo.success {
      color: #4CAF50;
    }

    .jobtrackr-mini-logo.error {
      color: #f44336;
    }

    /* Loader spinner */
    .jobtrackr-mini-loader {
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .jobtrackr-mini-close {
      position: absolute;
      top: -6px;
      left: -6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .jobtrackr-minimized:hover .jobtrackr-mini-close {
      display: flex;
    }

    .jobtrackr-mini-close:hover {
      background: rgba(0, 0, 0, 0.8);
      transform: scale(1.15);
    }

    /* Expanded state - medium box */
    .jobtrackr-expanded {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 380px;
      max-height: 600px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border-radius: 16px;
      color: white;
      display: flex;
      flex-direction: column;
      animation: slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 2147483647;
    }

    @keyframes slideInFromRight {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    @keyframes slideOutToRight {
      from {
        transform: translateX(0);
      }
      to {
        transform: translateX(100%);
      }
    }

    .jobtrackr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      flex-shrink: 0;
    }

    .jobtrackr-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .jobtrackr-icon {
      font-size: 24px;
    }

    .jobtrackr-title {
      font-weight: 600;
      font-size: 18px;
    }

    .jobtrackr-minimize {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-weight: bold;
    }

    .jobtrackr-minimize:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .jobtrackr-content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .jobtrackr-detected {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .jobtrackr-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .jobtrackr-url-preview {
      background: rgba(0, 0, 0, 0.2);
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 12px;
      word-break: break-all;
      margin-bottom: 20px;
      max-height: 80px;
      overflow-y: auto;
      line-height: 1.4;
    }

    .jobtrackr-url-preview::-webkit-scrollbar {
      width: 4px;
    }

    .jobtrackr-url-preview::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }

    .jobtrackr-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .jobtrackr-button {
      padding: 14px 20px;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      width: 100%;
    }

    .jobtrackr-button.primary {
      background: white;
      color: #667eea;
    }

    .jobtrackr-button.primary:hover {
      background: #f5f5f5;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .jobtrackr-button.secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .jobtrackr-button.secondary:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .jobtrackr-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .jobtrackr-status {
      margin-top: 16px;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 14px;
      display: none;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .jobtrackr-status.success {
      background: rgba(76, 175, 80, 0.3);
      display: block;
    }

    .jobtrackr-status.error {
      background: rgba(244, 67, 54, 0.3);
      display: block;
    }

    .jobtrackr-status.loading {
      background: rgba(255, 255, 255, 0.2);
      display: block;
    }

    /* Scrollbar styling for content */
    .jobtrackr-content::-webkit-scrollbar {
      width: 6px;
    }

    .jobtrackr-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
    }

    .jobtrackr-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .jobtrackr-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  console.log('JobTrackr overlay added to DOM!');

  // Set initial position for minimized widget
  const minimized = document.getElementById('jobtrackr-minimized');
  if (minimized) {
    minimized.style.top = currentY + 'px';
    console.log('Minimized widget position set to:', currentY);
  }

  // Add event listeners
  setupEventListeners();
}

function setupEventListeners() {
  const minimizeBtn = document.getElementById('jobtrackr-minimize');
  const captureBtn = document.getElementById('jobtrackr-capture');
  const miniCloseBtn = document.getElementById('jobtrackr-mini-close');
  const minimized = document.getElementById('jobtrackr-minimized');

  minimizeBtn?.addEventListener('click', minimizeOverlay);
  captureBtn?.addEventListener('click', captureJob);
  miniCloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    removeOverlay();
  });

  // Make widget draggable vertically
  if (minimized) {
    let startY = 0;
    let startTop = 0;

    minimized.addEventListener('mousedown', (e) => {
      if (e.target.id === 'jobtrackr-mini-close') return;

      isDragging = true;
      startY = e.clientY;
      startTop = minimized.offsetTop;
      minimized.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaY = e.clientY - startY;
      let newTop = startTop + deltaY;

      // Constrain to viewport
      const maxTop = window.innerHeight - 50; // 50 is widget height
      newTop = Math.max(0, Math.min(newTop, maxTop));

      minimized.style.top = newTop + 'px';
      currentY = newTop;
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;

      isDragging = false;
      minimized.style.transition = 'all 0.2s ease';

      // Check if it was a click (not a drag)
      if (Math.abs(e.clientY - startY) < 5) {
        expandOverlay();
      }
    });
  }
}

function minimizeOverlay() {
  const expanded = document.getElementById('jobtrackr-expanded');
  const minimized = document.getElementById('jobtrackr-minimized');

  console.log('Minimizing overlay...', { expanded, minimized });

  if (expanded && minimized) {
    expanded.style.display = 'none';
    minimized.style.display = 'flex';

    // Log computed styles to debug
    const computedStyle = window.getComputedStyle(minimized);
    console.log('Minimized widget styles:', {
      display: computedStyle.display,
      position: computedStyle.position,
      right: computedStyle.right,
      top: computedStyle.top,
      width: computedStyle.width,
      height: computedStyle.height,
      zIndex: computedStyle.zIndex,
      visibility: computedStyle.visibility
    });

    console.log('Overlay minimized - widget should be visible at right edge');
  } else {
    console.error('Could not find elements:', { expanded, minimized });
  }
}

function expandOverlay() {
  const expanded = document.getElementById('jobtrackr-expanded');
  const minimized = document.getElementById('jobtrackr-minimized');

  if (expanded && minimized) {
    expanded.style.display = 'flex';
    minimized.style.display = 'none';
  }
}

function removeOverlay() {
  const overlay = document.getElementById('jobtrackr-overlay');
  if (overlay) {
    const expanded = document.getElementById('jobtrackr-expanded');
    if (expanded && expanded.style.display !== 'none') {
      expanded.style.animation = 'slideOutToRight 0.3s ease-in forwards';
    }
    setTimeout(() => overlay.remove(), 300);
  }
}

async function captureJob() {
  const captureBtn = document.getElementById('jobtrackr-capture');
  const statusDiv = document.getElementById('jobtrackr-status');
  const miniContent = document.querySelector('.jobtrackr-mini-content');

  // Disable button
  captureBtn.disabled = true;
  captureBtn.textContent = '⏳ Capturing...';

  // Show loading status
  statusDiv.className = 'jobtrackr-status loading';
  statusDiv.textContent = '🔄 Sending to backend...';

  // Show loader in mini widget
  if (miniContent) {
    miniContent.innerHTML = '<div class="jobtrackr-mini-loader"></div>';
  }

  try {
    // Send message to background script to capture
    const response = await chrome.runtime.sendMessage({
      action: 'captureJob',
      url: window.location.href,
      title: document.title
    });

    if (response && response.success) {
      statusDiv.className = 'jobtrackr-status success';
      statusDiv.textContent = '✅ Job captured successfully!';
      captureBtn.textContent = '✓ Captured';

      // Update mini logo for success - green checkmark
      if (miniContent) {
        miniContent.innerHTML = '<div class="jobtrackr-mini-logo success">✓</div>';
      }

      // Minimize after short delay
      setTimeout(() => {
        minimizeOverlay();
      }, 2000);
    } else {
      throw new Error(response?.error || 'Failed to capture job');
    }
  } catch (error) {
    console.error('Capture error:', error);
    statusDiv.className = 'jobtrackr-status error';
    statusDiv.textContent = `❌ ${error.message}`;
    captureBtn.disabled = false;
    captureBtn.textContent = '📋 Capture This Job';

    // Update mini logo for error - red exclamation
    if (miniContent) {
      miniContent.innerHTML = '<div class="jobtrackr-mini-logo error">!</div>';
    }
  }
}
