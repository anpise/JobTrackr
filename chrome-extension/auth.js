// Authentication module for JobTrackr Chrome Extension
// Handles AWS Cognito authentication using Authorization Code Flow with PKCE

// Load config from config.js
const AUTH_CONFIG = {
  get COGNITO_DOMAIN() {
    return (typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.COGNITO_DOMAIN : '').replace('https://', '');
  },
  get CLIENT_ID() {
    return typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.CLIENT_ID : '';
  },
  get REDIRECT_URI() {
    return chrome.identity.getRedirectURL();
  },
  RESPONSE_TYPE: 'code', // Authorization code flow
  SCOPE: 'openid email profile',
  get REGION() {
    return typeof EXTENSION_CONFIG !== 'undefined' ? EXTENSION_CONFIG.REGION : 'us-east-1';
  },
  get TOKEN_ENDPOINT() {
    return `https://${this.COGNITO_DOMAIN}/oauth2/token`;
  }
};

// PKCE Helper Functions
const PKCEHelper = {
  /**
   * Generate a cryptographically secure random string for code verifier
   */
  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  },

  /**
   * Generate code challenge from verifier using SHA-256
   */
  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(hash));
  },

  /**
   * Base64 URL encode (without padding)
   */
  base64URLEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
};

const CognitoAuth = {
  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const tokens = await this.getTokens();
      if (!tokens || !tokens.idToken) {
        return false;
      }

      // Check if token is expired
      const isExpired = this.isTokenExpired(tokens.idToken);
      return !isExpired;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  /**
   * Get stored tokens from chrome.storage
   */
  async getTokens() {
    try {
      const result = await chrome.storage.local.get(['cognitoTokens']);
      return result.cognitoTokens || null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  },

  /**
   * Get ID token for API calls
   */
  async getIdToken() {
    const tokens = await this.getTokens();
    return tokens?.idToken || null;
  },

  /**
   * Get user info from stored tokens
   */
  async getUserInfo() {
    try {
      const tokens = await this.getTokens();
      if (!tokens || !tokens.idToken) {
        return null;
      }

      // Decode JWT to get user info
      const payload = this.decodeJWT(tokens.idToken);
      return {
        email: payload.email,
        sub: payload.sub,
        username: payload['cognito:username'] || payload.email
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  },

  /**
   * Launch Cognito authentication flow with PKCE
   */
  async login() {
    try {
      // Generate PKCE parameters
      const codeVerifier = PKCEHelper.generateCodeVerifier();
      const codeChallenge = await PKCEHelper.generateCodeChallenge(codeVerifier);

      // Store code verifier for later use in token exchange
      await chrome.storage.local.set({ pkceCodeVerifier: codeVerifier });

      // Build Cognito Hosted UI URL with PKCE
      const authUrl = `https://${AUTH_CONFIG.COGNITO_DOMAIN}/oauth2/authorize?` +
        `client_id=${AUTH_CONFIG.CLIENT_ID}&` +
        `response_type=${AUTH_CONFIG.RESPONSE_TYPE}&` +
        `scope=${encodeURIComponent(AUTH_CONFIG.SCOPE)}&` +
        `redirect_uri=${encodeURIComponent(AUTH_CONFIG.REDIRECT_URI)}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`;

      console.log('Launching PKCE auth flow with URL:', authUrl);

      // Launch web auth flow
      const redirectUrl = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      console.log('Auth redirect URL:', redirectUrl);

      // Extract authorization code from redirect URL
      const code = this.extractAuthCodeFromUrl(redirectUrl);

      if (!code) {
        throw new Error('No authorization code received from Cognito');
      }

      // Exchange authorization code for tokens
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);

      if (!tokens.id_token) {
        throw new Error('No ID token received from token exchange');
      }

      // Store tokens
      await this.saveTokens({
        idToken: tokens.id_token,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type
      });

      // Clean up code verifier
      await chrome.storage.local.remove(['pkceCodeVerifier']);

      return { success: true, user: await this.getUserInfo() };
    } catch (error) {
      console.error('Login error:', error);
      // Clean up on error
      await chrome.storage.local.remove(['pkceCodeVerifier']);
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout user and clear tokens
   */
  async logout() {
    try {
      await chrome.storage.local.remove(['cognitoTokens']);
      console.log('User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Extract authorization code from redirect URL
   */
  extractAuthCodeFromUrl(url) {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');
    return code;
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code, codeVerifier) {
    const tokenEndpoint = AUTH_CONFIG.TOKEN_ENDPOINT;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH_CONFIG.CLIENT_ID,
      code: code,
      redirect_uri: AUTH_CONFIG.REDIRECT_URI,
      code_verifier: codeVerifier
    });

    console.log('Exchanging code for tokens at:', tokenEndpoint);

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error:', errorText);
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Save tokens to chrome.storage
   */
  async saveTokens(tokens) {
    const tokenData = {
      ...tokens,
      timestamp: Date.now()
    };

    await chrome.storage.local.set({ cognitoTokens: tokenData });
    console.log('Tokens saved successfully');
  },

  /**
   * Decode JWT token
   */
  decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    try {
      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      // Add 5 minute buffer
      return payload.exp < (now + 300);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens() {
    try {
      const tokens = await this.getTokens();

      if (!tokens || !tokens.refreshToken) {
        console.log('No refresh token available');
        return { success: false, error: 'No refresh token available' };
      }

      const tokenEndpoint = AUTH_CONFIG.TOKEN_ENDPOINT;

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: AUTH_CONFIG.CLIENT_ID,
        refresh_token: tokens.refreshToken
      });

      console.log('Refreshing tokens at:', tokenEndpoint);

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh error:', errorText);

        // If refresh fails, clear tokens and require re-login
        await this.logout();
        return { success: false, error: 'Token refresh failed, please login again' };
      }

      const newTokens = await response.json();

      // Store new tokens (keep existing refresh token if not provided)
      await this.saveTokens({
        idToken: newTokens.id_token,
        accessToken: newTokens.access_token,
        refreshToken: newTokens.refresh_token || tokens.refreshToken,
        expiresIn: newTokens.expires_in,
        tokenType: newTokens.token_type
      });

      console.log('Tokens refreshed successfully');
      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return { success: false, error: error.message };
    }
  },

  /**
   * Get valid ID token, refreshing if necessary
   */
  async getValidIdToken() {
    const tokens = await this.getTokens();

    if (!tokens || !tokens.idToken) {
      return null;
    }

    // Check if token is expired or about to expire
    if (this.isTokenExpired(tokens.idToken)) {
      console.log('Token expired, attempting refresh...');
      const refreshResult = await this.refreshTokens();

      if (!refreshResult.success) {
        return null;
      }

      // Get refreshed token
      const newTokens = await this.getTokens();
      return newTokens?.idToken || null;
    }

    return tokens.idToken;
  }
};

// Make CognitoAuth available globally
if (typeof window !== 'undefined') {
  window.CognitoAuth = CognitoAuth;
} else {
  // For service worker context
  self.CognitoAuth = CognitoAuth;
}
