import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { api, JobApplication } from '../services/api';
import { colors } from '../styles/colors';

function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    resume_url: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!auth.hasValidToken()) {
      auth.logout();
      return;
    }
    
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);
      // For now, we'll get all jobs and find the specific one
      // In a real app, you'd have a GET /api/jobs/{id} endpoint
      const response = await api.getJobs(100); // Get more jobs to find the specific one
      const foundJob = response.jobs.find(j => j.job_id === jobId);
      
      if (foundJob) {
        setJob(foundJob);
        setEditForm({
          status: foundJob.status,
          notes: foundJob.notes || '',
          resume_url: foundJob.resume_url || ''
        });
      } else {
        setError('Job not found');
      }
    } catch (err) {
      console.error('Failed to fetch job:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!job) return;

    try {
      setSubmitting(true);
      await api.updateJob(job.job_id, job.applied_ts, editForm);
      setShowEditModal(false);
      // Refresh job data
      await fetchJob();
      alert('Job updated successfully');
    } catch (err) {
      console.error('Failed to update job:', err);
      alert('Failed to update job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;
    
    if (!confirm('Are you sure you want to delete this job application?')) {
      return;
    }

    try {
      await api.deleteJob(job.job_id, job.applied_ts);
      alert('Job deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        // For demo purposes, we'll create a mock URL
        // In a real app, you'd upload to S3 and get the URL
        const mockUrl = `https://example.com/resumes/${file.name}`;
        setEditForm({...editForm, resume_url: mockUrl});
      } else {
        alert('Please select a PDF file only.');
        event.target.value = '';
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingFile(true);
      // Simulate file upload - in a real app, you'd upload to S3
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockUrl = `https://example.com/resumes/${selectedFile.name}`;
      setEditForm({...editForm, resume_url: mockUrl});
      setSelectedFile(null);
      alert('Resume uploaded successfully!');
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied': return colors.primary;
      case 'Captured': return colors.primary;
      case 'Interview': return colors.warning;
      case 'Offer': return colors.success;
      case 'Rejected': return colors.error;
      default: return colors.neutral[500];
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bgPrimary,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${colors.calypso[200]}`,
            borderTop: `4px solid ${colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bgPrimary,
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😞</div>
          <div style={{ fontSize: '18px', marginBottom: '8px', color: colors.textPrimary }}>
            {error || 'Job not found'}
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              marginTop: '16px'
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
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <header style={{
        backgroundColor: colors.calypso[100],
        borderBottom: `2px solid ${colors.calypso[300]}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: `0 2px 4px ${colors.calypso[200]}60`
      }}>
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            color: colors.calypso[900],
            fontWeight: '700'
          }}>
          JobTrackr
        </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: `2px solid ${colors.calypso[600]}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              color: colors.calypso[900],
              fontWeight: '500',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.calypso[600];
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.calypso[900];
            }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDeleteJob}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: `2px solid ${colors.error}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              color: colors.error,
              fontWeight: '500',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.error;
              e.currentTarget.style.color = 'white';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.error;
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Job Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
          border: `1px solid ${colors.calypso[200]}`
        }}>
          {/* Job Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: `1px solid ${colors.calypso[200]}`
          }}>
            <div>
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: colors.textPrimary,
                lineHeight: '1.2'
              }}>
                {job.title}
              </h2>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.textSecondary,
                marginBottom: '8px'
              }}>
            {job.company}
          </div>
            {job.location && (
                <div style={{
                  fontSize: '14px',
                  color: colors.textLight
                }}>
                  📍 {job.location}
              </div>
            )}
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <div style={{
                padding: '6px 12px',
                backgroundColor: `${getStatusColor(job.status)}20`,
                color: getStatusColor(job.status),
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: '600',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                {job.status === 'Captured' ? 'Applied' : job.status}
              </div>
              <div style={{
                fontSize: '13px',
                color: colors.textLight
              }}>
                Applied: {new Date(job.applied_ts).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 16px',
                backgroundColor: colors.primary,
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🔗 View Job Posting
            </a>
        </div>

        {/* Job Details Grid */}
        <div style={{
          display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            {job.salary_range && (
              <div style={{
                backgroundColor: colors.calypso[50],
                padding: '16px',
                borderRadius: '8px',
            border: `1px solid ${colors.calypso[200]}`
          }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  💰 Salary Range
                </div>
                <div style={{
                  fontSize: '15px',
                  color: colors.textPrimary,
                  fontWeight: '500'
                }}>
                  {job.salary_range}
                </div>
              </div>
            )}
            
            {job.employment_type && (
              <div style={{
                backgroundColor: colors.calypso[50],
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${colors.calypso[200]}`
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  💼 Employment Type
                </div>
                <div style={{
                  fontSize: '15px',
                  color: colors.textPrimary,
                  fontWeight: '500'
                }}>
                  {job.employment_type}
                </div>
              </div>
            )}

              {job.source && (
              <div style={{
                backgroundColor: colors.calypso[50],
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${colors.calypso[200]}`
              }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📱 Source
                </div>
                <div style={{
                  fontSize: '15px',
                  color: colors.textPrimary,
                  fontWeight: '500'
                }}>
                    {job.source}
                  </div>
                </div>
              )}
          </div>

          {/* Notes Section */}
          {job.notes && (
            <div style={{
              backgroundColor: colors.calypso[50],
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '16px',
              border: `1px solid ${colors.calypso[200]}`
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📝 Notes
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {job.notes}
              </div>
            </div>
          )}

          {/* Resume URL */}
          {job.resume_url && (
            <div style={{
              backgroundColor: colors.calypso[50],
              borderRadius: '8px',
              padding: '20px',
              border: `1px solid ${colors.calypso[200]}`
            }}>
              <div style={{
                fontSize: '15px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                📄 Resume Used
              </div>
              <a
                href={job.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '14px',
                  color: colors.primary,
                  textDecoration: 'none',
                  wordBreak: 'break-all',
                  display: 'inline-block',
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: `1px solid ${colors.calypso[200]}`,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.calypso[100];
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = colors.calypso[200];
                }}
              >
                {job.resume_url}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${colors.calypso[200]}`,
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${colors.calypso[200]}`
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: colors.primary
                }} />
                Edit Job Application
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm({
                    status: job.status,
                    notes: job.notes || '',
                    resume_url: job.resume_url || ''
                  });
                }}
              style={{
                  width: '32px',
                  height: '32px',
                borderRadius: '8px',
                  border: 'none',
                  backgroundColor: colors.neutral[100],
                  color: colors.textLight,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.neutral[200];
                  e.currentTarget.style.color = colors.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.neutral[100];
                  e.currentTarget.style.color = colors.textLight;
                }}
              >
                ×
              </button>
            </div>

            {/* Status Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.textPrimary,
                letterSpacing: '0.3px'
              }}>
                Application Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: colors.calypso[50],
                  border: `2px solid ${colors.calypso[200]}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                fontWeight: '500',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.calypso[200];
                  e.currentTarget.style.backgroundColor = colors.calypso[50];
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={submitting}
              >
                <option value="Applied">📝 Applied</option>
                <option value="Interview">🎯 Interview</option>
                <option value="Offer">🎉 Offer</option>
                <option value="Rejected">❌ Rejected</option>
              </select>
            </div>

            {/* Notes Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.textPrimary,
                letterSpacing: '0.3px'
              }}>
                📝 Notes
              </label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                placeholder="Add any notes about this application, interview feedback, salary discussions, etc..."
                rows={4}
                style={{
                width: '100%',
                  padding: '14px 16px',
                  backgroundColor: colors.calypso[50],
                  border: `2px solid ${colors.calypso[200]}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '400',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: colors.textPrimary,
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.primary;
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.calypso[200];
                  e.currentTarget.style.backgroundColor = colors.calypso[50];
                  e.currentTarget.style.boxShadow = 'none';
                }}
                disabled={submitting}
              />
            </div>

            {/* Resume Upload Section */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.textPrimary,
                letterSpacing: '0.3px'
              }}>
                📄 Resume Upload
              </label>
              
              {/* File Upload Area */}
              <div style={{
                border: `2px dashed ${colors.calypso[300]}`,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: colors.calypso[50],
                marginBottom: '16px',
                transition: 'all 0.2s ease'
              }}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="resume-upload"
                  disabled={uploadingFile}
                />
                <label
                  htmlFor="resume-upload"
                  style={{
                    cursor: uploadingFile ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: uploadingFile ? 0.6 : 1
                  }}
                >
                  <div style={{ fontSize: '32px' }}>📁</div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.textPrimary
                  }}>
                    {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: colors.textLight
                  }}>
                    PDF files only, max 10MB
                  </div>
                </label>
              </div>

              {/* Upload Button */}
              {selectedFile && (
                <button
                  onClick={handleFileUpload}
                  disabled={uploadingFile}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: uploadingFile ? 'not-allowed' : 'pointer',
                    opacity: uploadingFile ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {uploadingFile ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      📤 Upload Resume
                    </>
                  )}
                </button>
              )}

              {/* Manual URL Input */}
              <div style={{ marginTop: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.textSecondary
                }}>
                  Or enter URL manually:
                </label>
                <input
                  type="url"
                  value={editForm.resume_url}
                  onChange={(e) => setEditForm({...editForm, resume_url: e.target.value})}
                  placeholder="https://example.com/resume.pdf"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    backgroundColor: colors.calypso[50],
                    border: `2px solid ${colors.calypso[200]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '400',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: colors.textPrimary,
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.calypso[200];
                    e.currentTarget.style.backgroundColor = colors.calypso[50];
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
              paddingTop: '24px',
              borderTop: `1px solid ${colors.calypso[200]}`
            }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm({
                    status: job.status,
                    notes: job.notes || '',
                    resume_url: job.resume_url || ''
                  });
                }}
                disabled={submitting}
                style={{
                  padding: '14px 28px',
                  backgroundColor: colors.neutral[100],
                  color: colors.textSecondary,
                  border: `2px solid ${colors.neutral[200]}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = colors.neutral[200];
                    e.currentTarget.style.borderColor = colors.neutral[300];
                    e.currentTarget.style.color = colors.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = colors.neutral[100];
                    e.currentTarget.style.borderColor = colors.neutral[200];
                    e.currentTarget.style.color = colors.textSecondary;
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateJob}
                disabled={submitting}
                style={{
                  padding: '14px 28px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: `2px solid ${colors.primary}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.3px',
                  boxShadow: submitting ? 'none' : `0 4px 12px ${colors.primary}30`
                }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                    e.currentTarget.style.borderColor = colors.primaryHover;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${colors.primary}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}30`;
                  }
                }}
              >
                {submitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Updating...
                  </span>
                ) : (
                  '✨ Update Job'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetail;