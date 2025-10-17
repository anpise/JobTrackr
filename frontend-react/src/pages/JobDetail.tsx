import { useLocation, useNavigate } from 'react-router-dom';
import { JobApplication } from '../services/api';
import { colors } from '../styles/colors';

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
        backgroundColor: colors.bgPrimary
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', color: colors.textLight, marginBottom: '16px' }}>Job not found</div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 24px',
              backgroundColor: colors.primary,
              color: colors.calypso[50],
              border: 'none',
              borderRadius: '8px',
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
      backgroundColor: colors.bgPrimary,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>
        {`
          @media (max-width: 768px) {
            .job-title {
              font-size: 20px !important;
              margin: 0 0 10px 0 !important;
            }
            .job-company {
              font-size: 16px !important;
              margin-bottom: 12px !important;
            }
            .detail-padding {
              padding: 16px 12px !important;
            }
            .detail-card {
              padding: 16px !important;
            }
            .detail-header-card {
              padding: 16px !important;
            }
            .job-meta {
              font-size: 13px !important;
              gap: 12px !important;
            }
            .job-meta span {
              font-size: 13px !important;
            }
            .status-grid {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            .section-title {
              font-size: 16px !important;
              margin: 0 0 12px 0 !important;
            }
          }
        `}
      </style>
      {/* Header */}
      <header style={{
        backgroundColor: colors.calypso[100],
        borderBottom: `2px solid ${colors.calypso[300]}`,
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: `0 2px 4px ${colors.calypso[200]}60`,
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h1
          onClick={() => navigate('/dashboard')}
          style={{
            margin: 0,
            fontSize: '24px',
            color: colors.calypso[900],
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          JobTrackr
        </h1>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `2px solid ${colors.calypso[600]}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: colors.calypso[900],
            fontWeight: '500',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.calypso[300];
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* Main Content */}
      <main className="detail-padding" style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Job Header */}
        <div className="detail-card detail-header-card" style={{
          backgroundColor: colors.bgLight,
          padding: '32px',
          borderRadius: '12px',
          boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
          border: `1px solid ${colors.calypso[200]}`,
          marginBottom: '20px'
        }}>
          <h1 className="job-title" style={{ margin: '0 0 12px 0', fontSize: '28px', color: colors.textPrimary, lineHeight: '1.3', fontWeight: '700' }}>{job.title}</h1>
          <div className="job-company" style={{ fontSize: '18px', color: colors.primary, fontWeight: '600', marginBottom: '16px' }}>
            {job.company}
          </div>
          <div className="job-meta" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', color: colors.textLight, fontSize: '14px' }}>
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
          gap: '20px'
        }}>
          {/* Status & Dates */}
          <div className="detail-card" style={{
            backgroundColor: colors.bgLight,
            padding: '24px',
            borderRadius: '12px',
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
            border: `1px solid ${colors.calypso[200]}`
          }}>
            <h2 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', color: colors.textPrimary, fontWeight: '600' }}>Application Status</h2>
            <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Status</div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary
                }}>
                  {job.status === 'Captured' ? 'Applied' : job.status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Applied Date</div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: '500' }}>
                  {new Date(job.applied_ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Last Updated</div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: '500' }}>
                  {new Date(job.last_updated_ts).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              {job.source && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Source</div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: '500' }}>
                    {job.source}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="detail-card" style={{
              backgroundColor: colors.bgLight,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
              border: `1px solid ${colors.calypso[200]}`
            }}>
              <h2 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', color: colors.textPrimary, fontWeight: '600' }}>Notes</h2>
              <p style={{ margin: 0, color: colors.textSecondary, lineHeight: '1.6' }}>
                {job.notes}
              </p>
            </div>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="detail-card" style={{
              backgroundColor: colors.bgLight,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
              border: `1px solid ${colors.calypso[200]}`
            }}>
              <h2 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', color: colors.textPrimary, fontWeight: '600' }}>Skills & Keywords</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.tags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: colors.calypso[200],
                      color: colors.textSecondary,
                      border: `1px solid ${colors.calypso[300]}`,
                      borderRadius: '8px',
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
          <div className="detail-card" style={{
            backgroundColor: colors.bgLight,
            padding: '24px',
            borderRadius: '12px',
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
            border: `1px solid ${colors.calypso[200]}`
          }}>
            <h2 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', color: colors.textPrimary, fontWeight: '600' }}>Original Posting</h2>
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.calypso[50],
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                width: '100%',
                maxWidth: '100%',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.primary}
            >
              View Original Job Posting →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JobDetail;
