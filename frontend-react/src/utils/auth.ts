// Cognito authentication utilities with PKCE

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN as string;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI as string;

// PKCE helper functions
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const hashed = await sha256(codeVerifier);
  return base64urlencode(hashed);
}

export const auth = {
  /**
   * Check if user has a valid (non-expired) token
   */
  hasValidToken(): boolean {
    const idToken = localStorage.getItem('id_token');
    if (!idToken) return false;
    
    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  },

  /**
   * Check if user has a token in localStorage (legacy method)
   */
  hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get stored token (from localStorage)
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  /**
   * Store token
   */
  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  },

  /**
   * Clear token (logout)
   */
  clearToken(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Redirect to Cognito login page with PKCE (if HTTPS) or without (if HTTP)
   */
  async redirectToLogin(): Promise<void> {
    // Check if we're in a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext;

    let cognitoLoginUrl = `https://${COGNITO_DOMAIN}/login?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=code&` +
      `scope=openid+email+profile&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

    if (isSecureContext) {
      // Use PKCE for secure contexts
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
      cognitoLoginUrl += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    }

    window.location.href = cognitoLoginUrl;
  },

  /**
   * Logout - clear tokens and redirect to home page
   */
  logout(): void {
    this.clearToken();
    sessionStorage.removeItem('pkce_code_verifier');
    window.location.href = '/';
  },

  /**
   * Exchange authorization code for tokens with optional PKCE (called from callback page)
   */
  async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      // Retrieve the code verifier from sessionStorage (if PKCE was used)
      const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

      const params: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: REDIRECT_URI,
      };

      // Add code_verifier only if PKCE was used
      if (codeVerifier) {
        params.code_verifier = codeVerifier;
      }

      const response = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange failed:', errorData);
        throw new Error('Token exchange failed');
      }

      const data: TokenResponse = await response.json();

      // Store tokens
      this.setToken(data.access_token);
      localStorage.setItem('id_token', data.id_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Clean up code verifier
      sessionStorage.removeItem('pkce_code_verifier');

      return true;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return false;
    }
  }
};
