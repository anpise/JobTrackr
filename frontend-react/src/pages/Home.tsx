import { useNavigate } from 'react-router-dom';
import { colors, gradients } from '../styles/colors';

function Home() {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: gradients.hero,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>
        {`
          @media (max-width: 768px) {
            .hero-title { font-size: 36px !important; }
            .hero-subtitle { font-size: 16px !important; }
            .hero-padding { padding: 40px 24px !important; }
            .header-padding { padding: 16px 20px !important; }
          }
        `}
      </style>
      {/* Header */}
      <header className="header-padding" style={{
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0px',
          fontSize: '28px',
          fontWeight: 'bold',
          color: colors.calypso[600]
        }}>
          <span>JobTrackr</span>
        </div>
        <button
          onClick={handleLogin}
          style={{
            padding: '12px 32px',
            backgroundColor: colors.calypso[50],
            color: colors.calypso[900],
            border: `2px solid ${colors.calypso[200]}`,
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.calypso[900]}60`;
            e.currentTarget.style.backgroundColor = colors.calypso[100];
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.backgroundColor = colors.calypso[50];
          }}
        >
          Login
        </button>
      </header>

      {/* Hero Section */}
      <main className="hero-padding" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 48px'
      }}>
        <div style={{
          textAlign: 'center',
          color: colors.calypso[50]
        }}>
          <h1 className="hero-title" style={{
            fontSize: '56px',
            fontWeight: 'bold',
            margin: '0 0 24px 0',
            lineHeight: '1.2',
            color: colors.calypso[50]
          }}>
            Track Your Job Applications Effortlessly
          </h1>
          <p className="hero-subtitle" style={{
            fontSize: '20px',
            margin: '0 0 48px 0',
            color: colors.calypso[100],
            lineHeight: '1.6',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Organize your job search with our powerful Chrome extension and dashboard.
            Never lose track of an application again.
          </p>
          <button
            onClick={handleLogin}
            style={{
              padding: '16px 48px',
              backgroundColor: colors.calypso[50],
              color: colors.calypso[900],
              border: `2px solid ${colors.calypso[200]}`,
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 20px ${colors.calypso[900]}60`;
              e.currentTarget.style.backgroundColor = colors.calypso[100];
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = colors.calypso[50];
            }}
          >
            Get Started
          </button>
        </div>

        {/* Features */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginTop: '60px'
        }}>
          <div style={{
            backgroundColor: colors.bgPrimary,
            padding: '28px 24px',
            borderRadius: '16px',
            border: `1px solid ${colors.calypso[200]}`,
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0', color: colors.textPrimary }}>Chrome Extension</h3>
            <p style={{ margin: 0, color: colors.textLight, lineHeight: '1.6' }}>
              Capture job postings with a single click while browsing. Works seamlessly with LinkedIn, Indeed, and more.
            </p>
          </div>

          <div style={{
            backgroundColor: colors.bgPrimary,
            padding: '28px 24px',
            borderRadius: '16px',
            border: `1px solid ${colors.calypso[200]}`,
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0', color: colors.textPrimary }}>Dashboard</h3>
            <p style={{ margin: 0, color: colors.textLight, lineHeight: '1.6' }}>
              View all your applications in one place. Track status, add notes, and stay organized throughout your job search.
            </p>
          </div>

          <div style={{
            backgroundColor: colors.bgPrimary,
            padding: '28px 24px',
            borderRadius: '16px',
            border: `1px solid ${colors.calypso[200]}`,
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
            <h3 style={{ fontSize: '22px', margin: '0 0 12px 0', color: colors.textPrimary }}>Secure & Private</h3>
            <p style={{ margin: 0, color: colors.textLight, lineHeight: '1.6' }}>
              Your data is encrypted and secure. We use AWS Cognito for authentication and never share your information.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: colors.calypso[200]
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          © 2025 JobTrackr. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default Home;
