import { useEffect } from 'react';
import { auth } from '../utils/auth';

function Login() {
  useEffect(() => {
    // Immediately redirect to Cognito login
    auth.redirectToLogin();
  }, []);

  // Return null to prevent any flash (redirects happen immediately)
  return null;
}

export default Login;
