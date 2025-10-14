import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { api, JobApplication } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState<boolean>(false);
  const [newJobUrl, setNewJobUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([undefined]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs(0);
  }, []);

  const fetchJobs = async (pageIndex: number) => {
    try {
      setLoading(true);
      setError(null);
      const lastKey = pageTokens[pageIndex];
      const response = await api.getJobs(10, lastKey);
      setJobs(response.jobs);
      setCurrentPage(pageIndex);

      // If there's a next page token and we haven't stored it yet
      if (response.next_page_token && !pageTokens[pageIndex + 1]) {
        setPageTokens(prev => [...prev, response.next_page_token]);
        setTotalPages(pageIndex + 2);
      } else if (!response.next_page_token) {
        setTotalPages(pageIndex + 1);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load job applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (pageIndex: number) => {
    fetchJobs(pageIndex);
  };

  const handleAddJob = async () => {
    if (!newJobUrl.trim()) {
      alert('Please enter a job URL');
      return;
    }

    try {
      setSubmitting(true);
      await api.ingestJob({ url: newJobUrl });
      setNewJobUrl('');
      setShowAddJobModal(false);
      // Refresh the job list (go back to page 1)
      await fetchJobs(0);
      alert('Job added successfully! It may take a moment to process.');
    } catch (err) {
      console.error('Failed to add job:', err);
      alert('Failed to add job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (jobId: string, newStatus: JobApplication['status']) => {
    try {
      await api.updateJobStatus(jobId, newStatus);
      // Update local state
      setJobs(jobs.map(job =>
        job.job_id === jobId ? { ...job, status: newStatus } : job
      ));
    } catch (err) {
      console.error('Failed to update job status:', err);
      alert('Failed to update job status. This feature will be available soon.');
    }
  };

  const handleDeleteJob = async (jobId: string, appliedTs: string) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await api.deleteJob(jobId, appliedTs);
      // Refresh current page
      await fetchJobs(currentPage);
      alert('Job deleted successfully');
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleLogout = () => {
    auth.logout();
  };

  const filteredJobs = filterStatus === 'All'
    ? jobs
    : jobs.filter(job => job.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Captured': return '#3b82f6';
      case 'Applied': return '#3b82f6';
      case 'Interview': return '#f59e0b';
      case 'Offer': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const stats = {
    total: jobs.length,
    captured: jobs.filter(j => j.status === 'Captured').length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interview: jobs.filter(j => j.status === 'Interview').length,
    offer: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading your job applications...</div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '16px' }}>{error}</div>
          <button
            onClick={() => fetchJobs(0)}
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
            Try Again
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddJobModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Add Job
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Applications</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>{stats.total}</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Captured</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.captured}</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Interview</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.interview}</div>
          </div>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Offers</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{stats.offer}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: '600', color: '#333' }}>Filter:</span>
          {['All', 'Captured', 'Applied', 'Interview', 'Offer', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 16px',
                backgroundColor: filterStatus === status ? '#667eea' : 'white',
                color: filterStatus === status ? 'white' : '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {filteredJobs.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No applications found</div>
              <div style={{ fontSize: '14px' }}>Try changing your filter or add new applications using the Chrome extension</div>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: '#f9fafb',
                  borderBottom: '2px solid #e5e7eb'
                }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Company</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Position</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Location</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Applied</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Salary</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.job_id} style={{
                    borderBottom: '1px solid #e5e7eb',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '16px 24px', fontWeight: '600', color: '#111827' }}>
                      <span
                        onClick={() => navigate(`/job/${job.job_id}`, { state: { job } })}
                        style={{
                          cursor: 'pointer',
                          color: '#667eea',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {job.company}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#374151' }}>{job.title}</td>
                    <td style={{ padding: '16px 24px', color: '#6b7280' }}>{job.location || '-'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status)
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#6b7280', fontSize: '14px' }}>
                      {new Date(job.applied_ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 24px', color: '#374151', fontSize: '14px' }}>{job.salary_range || '-'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#667eea',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          View →
                        </a>
                        <button
                          onClick={() => handleDeleteJob(job.job_id, job.applied_ts)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px'
          }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === 0 ? '#e5e7eb' : '#667eea',
                color: currentPage === 0 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  minWidth: '40px',
                  backgroundColor: currentPage === pageNum ? '#667eea' : 'white',
                  color: currentPage === pageNum ? 'white' : '#374151',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === pageNum ? '600' : '400'
                }}
              >
                {pageNum + 1}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              style={{
                padding: '8px 12px',
                backgroundColor: currentPage === totalPages - 1 ? '#e5e7eb' : '#667eea',
                color: currentPage === totalPages - 1 ? '#9ca3af' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Next
            </button>
          </div>
        )}
      </main>

      {/* Add Job Modal */}
      {showAddJobModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: '#333' }}>Add New Job</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Job URL
              </label>
              <input
                type="url"
                value={newJobUrl}
                onChange={(e) => setNewJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/123456789"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                disabled={submitting}
              />
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Paste the URL of the job posting you want to track
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddJobModal(false);
                  setNewJobUrl('');
                }}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: submitting ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddJob}
                disabled={submitting || !newJobUrl.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (submitting || !newJobUrl.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: (submitting || !newJobUrl.trim()) ? 0.5 : 1
                }}
              >
                {submitting ? 'Adding...' : 'Add Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
