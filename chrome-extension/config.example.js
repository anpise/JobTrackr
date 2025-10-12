// Configuration file for JobTrackr Chrome Extension
// Copy this file to config.js and replace with your actual values

const EXTENSION_CONFIG = {
  // AWS Cognito Configuration
  COGNITO_DOMAIN: 'YOUR_COGNITO_DOMAIN.auth.us-east-1.amazoncognito.com',
  CLIENT_ID: 'YOUR_COGNITO_APP_CLIENT_ID',
  REGION: 'us-east-1',

  // Backend API Configuration
  API_GATEWAY_URL: 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev',

  // Dashboard URL
  DASHBOARD_URL: 'http://localhost:3000' // Change to production URL when deployed
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.EXTENSION_CONFIG = EXTENSION_CONFIG;
} else {
  self.EXTENSION_CONFIG = EXTENSION_CONFIG;
}
