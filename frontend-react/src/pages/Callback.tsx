import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';

function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      // Get the authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');

      if (errorParam) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received.');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      // Exchange code for tokens
      const success = await auth.exchangeCodeForTokens(code);

      if (success) {
        console.log('Authentication successful!');
        navigate('/dashboard');
      } else {
        setError('Failed to complete authentication.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <p style={{ color: '#e74c3c', fontSize: '18px' }}>{error}</p>
            <p style={{ color: '#666', fontSize: '14px' }}>Redirecting...</p>
          </>
        ) : (
          <>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }} />
            <p style={{ color: '#666' }}>Completing authentication...</p>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Callback;
