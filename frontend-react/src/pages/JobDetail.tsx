import { useLocation, useNavigate } from 'react-router-dom';
import { JobApplication } from '../services/api';

function JobDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job as JobApplication;

  if (!job) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>Job not found</div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>JobTrackr</h1>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Job Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h1 style={{ margin: '0 0 16px 0', fontSize: '32px', color: '#111827' }}>{job.title}</h1>
          <div style={{ fontSize: '20px', color: '#667eea', fontWeight: '600', marginBottom: '16px' }}>
            {job.company}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', color: '#6b7280' }}>
            {job.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span>
                <span>{job.location}</span>
              </div>
            )}
            {job.employment_type && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💼</span>
                <span>{job.employment_type}</span>
              </div>
            )}
            {job.salary_range && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>💰</span>
                <span>{job.salary_range}</span>
              </div>
            )}
          </div>
        </div>

        {/* Job Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px'
        }}>
          {/* Status & Dates */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Application Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: '#3b82f620',
                  color: '#3b82f6'
                }}>
                  {job.status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Applied Date</div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  {new Date(job.applied_ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Last Updated</div>
                <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                  {new Date(job.last_updated_ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              {job.source && (
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Source</div>
                  <div style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                    {job.source}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Notes</h2>
              <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>
                {job.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Skills & Keywords</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job Link */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Original Posting</h2>
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              View Original Job Posting →
            </a>
          </div>

          {/* Raw Data (for debugging) */}
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>Additional Details</h2>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {JSON.stringify(job, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobDetail;
