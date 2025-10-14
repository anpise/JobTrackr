import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'white'
        }}>
          JobTrackr
        </div>
        <button
          onClick={handleLogin}
          style={{
            padding: '12px 32px',
            backgroundColor: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 48px'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '56px',
            fontWeight: 'bold',
            margin: '0 0 24px 0',
            lineHeight: '1.2'
          }}>
            Track Your Job Applications<br />Effortlessly
          </h1>
          <p style={{
            fontSize: '20px',
            margin: '0 0 48px 0',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Organize your job search with our powerful Chrome extension and dashboard.<br />
            Never lose track of an application again.
          </p>
          <button
            onClick={handleLogin}
            style={{
              padding: '16px 48px',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Get Started
          </button>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginTop: '80px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '32px',
            borderRadius: '16px',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0' }}>Chrome Extension</h3>
            <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.6' }}>
              Capture job postings with a single click while browsing. Works seamlessly with LinkedIn, Indeed, and more.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '32px',
            borderRadius: '16px',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0' }}>Dashboard</h3>
            <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.6' }}>
              View all your applications in one place. Track status, add notes, and stay organized throughout your job search.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: '32px',
            borderRadius: '16px',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0' }}>Secure & Private</h3>
            <p style={{ margin: 0, opacity: 0.9, lineHeight: '1.6' }}>
              Your data is encrypted and secure. We use AWS Cognito for authentication and never share your information.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: 'white',
        opacity: 0.8
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          © 2025 JobTrackr. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default Home;
