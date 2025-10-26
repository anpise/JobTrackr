import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../utils/auth';
import { api, JobApplication, JobStats } from '../services/api';
import { colors } from '../styles/colors';

function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddJobModal, setShowAddJobModal] = useState<boolean>(false);
  const [newJobUrl, setNewJobUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [pageTokens, setPageTokens] = useState<(string | undefined)[]>([undefined]);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    resume_url: ''
  });

  // Fetch jobs and stats on component mount
  useEffect(() => {
    // Check if token is still valid before making API calls
    if (!auth.hasValidToken()) {
      auth.logout();
      return;
    }
    
    fetchJobs(0);
    fetchStats();
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

  const fetchStats = async () => {
    try {
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Don't show error for stats, just log it
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
      // Refresh the job list and stats (go back to page 1)
      await fetchJobs(0);
      await fetchStats();
      alert('Job added successfully! It may take a moment to process.');
    } catch (err) {
      console.error('Failed to add job:', err);
      alert('Failed to add job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string, appliedTs: string) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await api.deleteJob(jobId, appliedTs);
      // Refresh current page and stats
      await fetchJobs(currentPage);
      await fetchStats();
      alert('Job deleted successfully');
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleEditJob = (job: JobApplication) => {
    setEditingJob(job);
    setEditForm({
      status: job.status,
      notes: job.notes || '',
      resume_url: job.resume_url || ''
    });
    setShowEditModal(true);
  };

  const determineDropdownPosition = (buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 200; // Approximate dropdown height
    
    // Check if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // If there's more space above or not enough space below, open above
    if (spaceAbove > spaceBelow || spaceBelow < dropdownHeight) {
      return 'above';
    }
    return 'below';
  };

  const handleDropdownToggle = (jobId: string, buttonElement: HTMLElement) => {
    if (openDropdownId === jobId) {
      setOpenDropdownId(null);
    } else {
      const position = determineDropdownPosition(buttonElement);
      setDropdownPosition(position);
      setOpenDropdownId(jobId);
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;

    try {
      setSubmitting(true);
      await api.updateJob(editingJob.job_id, editingJob.applied_ts, editForm);
      setShowEditModal(false);
      setEditingJob(null);
      // Refresh current page and stats
      await fetchJobs(currentPage);
      await fetchStats();
      alert('Job updated successfully');
    } catch (err) {
      console.error('Failed to update job:', err);
      alert('Failed to update job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
  };

  const filteredJobs = filterStatus === 'All'
    ? jobs
    : filterStatus === 'Applied'
    ? jobs.filter(job => job.status === 'Applied' || job.status === 'Captured')
    : jobs.filter(job => job.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Applied':
      case 'Captured': return colors.primary;
      case 'Interview': return colors.warning;
      case 'Offer': return colors.success;
      case 'Rejected': return colors.error;
      default: return colors.neutral[500];
    }
  };

  // Use stats from API if available, otherwise fallback to calculated stats
  const displayStats = stats ? {
    total: stats.total_jobs,
    applied: stats.status_breakdown['Applied'] || stats.status_breakdown['Captured'] || 0,
    interview: stats.status_breakdown['Interview'] || 0,
    offer: stats.status_breakdown['Offer'] || 0,
    rejected: stats.status_breakdown['Rejected'] || 0
  } : {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'Applied' || j.status === 'Captured').length,
    interview: jobs.filter(j => j.status === 'Interview').length,
    offer: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: colors.bgPrimary,
        fontFamily: 'system-ui, sans-serif'
      }}>
        <style>
          {`
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            @keyframes modalSlideIn {
              0% { 
                opacity: 0;
                transform: scale(0.95) translateY(-20px);
              }
              100% { 
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @media (max-width: 768px) {
              .mobile-hidden { display: none !important; }
            }
          `}
        </style>
        {/* Header Skeleton */}
        <header style={{
          backgroundColor: colors.calypso[100],
          borderBottom: `2px solid ${colors.calypso[300]}`,
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: `0 2px 4px ${colors.calypso[200]}60`
        }}>
          <div style={{
            width: '140px',
            height: '28px',
            background: `linear-gradient(90deg, ${colors.calypso[300]} 0%, ${colors.calypso[400]} 50%, ${colors.calypso[300]} 100%)`,
            backgroundSize: '1000px 100%',
            animation: 'shimmer 2s infinite linear',
            borderRadius: '4px'
          }}></div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              width: '90px',
              height: '36px',
              background: `linear-gradient(90deg, ${colors.calypso[300]} 0%, ${colors.calypso[400]} 50%, ${colors.calypso[300]} 100%)`,
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite linear',
              borderRadius: '6px'
            }}></div>
            <div style={{
              width: '90px',
              height: '36px',
              background: `linear-gradient(90deg, ${colors.calypso[300]} 0%, ${colors.calypso[400]} 50%, ${colors.calypso[300]} 100%)`,
              backgroundSize: '1000px 100%',
              animation: 'shimmer 2s infinite linear',
              borderRadius: '6px'
            }}></div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '16px 12px'
        }}>
          {/* Stats Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: `linear-gradient(90deg, ${colors.calypso[200]} 0%, ${colors.calypso[100]} 50%, ${colors.calypso[200]} 100%)`,
                backgroundSize: '1000px 100%',
                animation: 'shimmer 2s infinite linear',
                padding: '20px',
                borderRadius: '12px',
                height: '100px',
                border: `2px solid ${colors.calypso[200]}`
              }}></div>
            ))}
          </div>

          {/* Filter Bar Skeleton */}
          <div style={{
            background: `linear-gradient(90deg, ${colors.calypso[100]} 0%, ${colors.calypso[50]} 50%, ${colors.calypso[100]} 100%)`,
            backgroundSize: '1000px 100%',
            animation: 'shimmer 2s infinite linear',
            padding: '16px 24px',
            borderRadius: '12px',
            marginBottom: '24px',
            height: '56px',
            border: `2px solid ${colors.calypso[200]}`
          }}></div>

          {/* Table Skeleton */}
          <div style={{
            backgroundColor: colors.calypso[50],
            borderRadius: '12px',
            boxShadow: `0 2px 8px ${colors.calypso[200]}40`,
            border: `2px solid ${colors.calypso[200]}`,
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              backgroundColor: colors.bgLight,
              borderBottom: `2px solid ${colors.calypso[200]}`,
              padding: '16px 24px',
              display: 'grid',
              gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr 1fr 2fr',
              gap: '16px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} style={{
                  height: '20px',
                  background: `linear-gradient(90deg, ${colors.calypso[200]} 0%, ${colors.calypso[200]} 50%, ${colors.calypso[200]} 100%)`,
                  backgroundSize: '1000px 100%',
                  animation: 'shimmer 2s infinite linear',
                  borderRadius: '4px'
                }}></div>
              ))}
            </div>

            {/* Table Rows */}
            {[1, 2, 3, 4, 5].map(row => (
              <div key={row} style={{
                backgroundColor: colors.bgLight,
                borderBottom: `1px solid ${colors.calypso[200]}`,
                padding: '16px 24px',
                display: 'grid',
                gridTemplateColumns: '1.5fr 2fr 1.5fr 1fr 1fr 1fr 2fr',
                gap: '16px'
              }}>
                {[1, 2, 3, 4, 5, 6, 7].map(col => (
                  <div key={col} style={{
                    height: '16px',
                    background: `linear-gradient(90deg, ${colors.calypso[100]} 0%, ${colors.calypso[100]} 50%, ${colors.calypso[200]} 100%)`,
                    backgroundSize: '1000px 100%',
                    animation: 'shimmer 2s infinite linear',
                    borderRadius: '4px'
                  }}></div>
                ))}
              </div>
            ))}
          </div>
        </main>
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
        backgroundColor: colors.bgPrimary
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', color: colors.textLight, marginBottom: '16px' }}>{error}</div>
          <button
            onClick={() => fetchJobs(0)}
            style={{
              padding: '10px 24px',
              backgroundColor: colors.primary,
              color: colors.calypso[50],
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
      backgroundColor: colors.bgPrimary,
      fontFamily: 'system-ui, sans-serif'
    }}>
      <style>
        {`
          @media (max-width: 768px) {
            .mobile-hidden { display: none !important; }
            .desktop-table { display: none !important; }
            .mobile-cards { display: block !important; }
          }
          @media (min-width: 769px) {
            .mobile-cards { display: none !important; }
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
            onClick={() => setShowAddJobModal(true)}
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
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.calypso[300];
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            + Add
          </button>
          <button
            onClick={handleLogout}
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
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '16px 12px'
      }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: colors.calypso[100],
            padding: '20px 16px',
            borderRadius: '12px',
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
            border: `1px solid ${colors.calypso[200]}`
          }}>
            <div style={{ fontSize: '13px', color: colors.textLight, marginBottom: '8px', fontWeight: '500', letterSpacing: '0.3px' }}>Total Applications</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>{displayStats.total}</div>
          </div>
          <div style={{
            backgroundColor: colors.calypso[100],
            padding: '20px 16px',
            borderRadius: '12px',
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
            border: `1px solid ${colors.calypso[200]}`
          }}>
            <div style={{ fontSize: '13px', color: colors.textLight, marginBottom: '8px', fontWeight: '500', letterSpacing: '0.3px' }}>Applied</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>{displayStats.applied}</div>
          </div>
          <div style={{
            backgroundColor: colors.calypso[100],
            padding: '20px 16px',
            borderRadius: '12px',
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
            border: `1px solid ${colors.calypso[200]}`
          }}>
            <div style={{ fontSize: '13px', color: colors.textLight, marginBottom: '8px', fontWeight: '500', letterSpacing: '0.3px' }}>Interview</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>{displayStats.interview}</div>
          </div>
          <div style={{
            backgroundColor: colors.calypso[100],
            padding: '20px 16px',
            borderRadius: '12px',
            boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
            border: `1px solid ${colors.calypso[200]}`
          }}>
            <div style={{ fontSize: '13px', color: colors.textLight, marginBottom: '8px', fontWeight: '500', letterSpacing: '0.3px' }}>Offers</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>{displayStats.offer}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: `linear-gradient(135deg, ${colors.calypso[100]} 0%, ${colors.calypso[50]} 100%)`,
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: `0 2px 8px ${colors.calypso[200]}40`,
          border: `2px solid ${colors.calypso[200]}`,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '14px' }}>Filter:</span>
          {['All', 'Applied', 'Interview', 'Offer', 'Rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 12px',
                backgroundColor: filterStatus === status ? colors.primary : colors.calypso[200],
                color: filterStatus === status ? colors.calypso[50] : colors.textSecondary,
                border: `1px solid ${filterStatus === status ? colors.primaryDark : colors.calypso[300]}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseOver={(e) => {
                if (filterStatus !== status) {
                  e.currentTarget.style.backgroundColor = colors.calypso[300];
                  e.currentTarget.style.borderColor = colors.primary;
                }
              }}
              onMouseOut={(e) => {
                if (filterStatus !== status) {
                  e.currentTarget.style.backgroundColor = colors.calypso[200];
                  e.currentTarget.style.borderColor = colors.calypso[300];
                }
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Jobs List - Desktop Table */}
        <div className="desktop-table" style={{
          backgroundColor: colors.calypso[50],
          borderRadius: '12px',
          boxShadow: `0 2px 8px ${colors.calypso[200]}40`,
          border: `2px solid ${colors.calypso[200]}`,
          overflow: 'auto'
        }}>
          {filteredJobs.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: colors.textLight
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600', color: colors.textSecondary }}>No applications found</div>
              <div style={{ fontSize: '14px' }}>Try changing your filter or add new applications using the Chrome extension</div>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  backgroundColor: colors.bgLight,
                  borderBottom: `2px solid ${colors.calypso[200]}`
                }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Company</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Position</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Location</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Applied</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Salary</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: colors.textSecondary, fontSize: '13px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.job_id} style={{
                    borderBottom: `1px solid ${colors.calypso[200]}`,
                    backgroundColor: colors.bgLight,
                    transition: 'background-color 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    // Don't navigate if clicking on the actions button or dropdown
                    if (!(e.target as HTMLElement).closest('[data-actions-menu]')) {
                      navigate(`/job/${job.job_id}`, { state: { job } });
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.calypso[200]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.bgLight}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: colors.textPrimary, fontSize: '14px' }}>
                      {job.company}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.textSecondary, fontSize: '14px' }}>{job.title}</td>
                    <td style={{ padding: '12px 16px', color: colors.textLight, fontSize: '13px' }}>{job.location || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: `${getStatusColor(job.status)}20`,
                        color: getStatusColor(job.status),
                        whiteSpace: 'nowrap'
                      }}>
                        {job.status === 'Captured' ? 'Applied' : job.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.textLight, fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(job.applied_ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.textSecondary, fontSize: '13px' }}>{job.salary_range || '-'}</td>
                    <td style={{ padding: '12px 16px', position: 'relative' }} data-actions-menu>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownToggle(job.job_id, e.currentTarget);
                        }}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: colors.calypso[200],
                          color: colors.textPrimary,
                          border: `2px solid ${colors.calypso[300]}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: '600',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = colors.calypso[300];
                          e.currentTarget.style.borderColor = colors.primary;
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = colors.calypso[200];
                          e.currentTarget.style.borderColor = colors.calypso[300];
                        }}
                      >
                        ⋮
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdownId === job.job_id && (
                        <>
                          {/* Backdrop to close dropdown when clicking outside */}
                          <div
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 999
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                            }}
                          ></div>

                          {/* Dropdown content */}
                          <div style={{
                            position: 'absolute',
                            right: '0',
                            ...(dropdownPosition === 'above' 
                              ? { bottom: '100%', marginBottom: '8px' }
                              : { top: '100%', marginTop: '8px' }
                            ),
                            backgroundColor: colors.bgLight,
                            border: `1px solid ${colors.calypso[200]}`,
                            borderRadius: '8px',
                            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.15)`,
                            zIndex: 1000,
                            minWidth: '180px',
                            overflow: 'hidden'
                          }}>
                            <a
                              href={job.job_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: `1px solid ${colors.calypso[100]}`,
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: colors.textPrimary,
                                textAlign: 'left',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxSizing: 'border-box'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = colors.calypso[50];
                                e.currentTarget.style.paddingLeft = '20px';
                                e.currentTarget.style.color = colors.primary;
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.paddingLeft = '16px';
                                e.currentTarget.style.color = colors.textPrimary;
                              }}
                            >
                              <span style={{ fontSize: '16px', opacity: 0.8 }}>🔗</span>
                              Open Job Link
                            </a>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/job/${job.job_id}`);
                                setOpenDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: colors.textPrimary,
                                borderBottom: `1px solid ${colors.calypso[100]}`,
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.calypso[50];
                                e.currentTarget.style.paddingLeft = '20px';
                                e.currentTarget.style.color = colors.primary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.paddingLeft = '16px';
                                e.currentTarget.style.color = colors.textPrimary;
                              }}
                            >
                              <span style={{ fontSize: '16px', opacity: 0.8 }}>👁️</span>
                              View Details
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditJob(job);
                                setOpenDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: colors.textPrimary,
                                borderBottom: `1px solid ${colors.calypso[100]}`,
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.calypso[50];
                                e.currentTarget.style.paddingLeft = '20px';
                                e.currentTarget.style.color = colors.primary;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.paddingLeft = '16px';
                                e.currentTarget.style.color = colors.textPrimary;
                              }}
                            >
                              <span style={{ fontSize: '16px', opacity: 0.8 }}>✏️</span>
                              Quick Edit Status
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteJob(job.job_id, job.applied_ts);
                                setOpenDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: colors.error,
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = colors.error;
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.paddingLeft = '20px';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = colors.error;
                                e.currentTarget.style.paddingLeft = '16px';
                              }}
                            >
                              <span style={{ fontSize: '16px', opacity: 0.8 }}>🗑️</span>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Jobs List - Mobile Cards */}
        <div className="mobile-cards" style={{ display: 'none' }}>
          {filteredJobs.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              color: colors.textLight,
              backgroundColor: colors.calypso[50],
              borderRadius: '12px',
              border: `2px solid ${colors.calypso[200]}`
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '600', color: colors.textSecondary }}>No applications found</div>
              <div style={{ fontSize: '14px' }}>Try changing your filter or add new applications</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredJobs.map(job => (
                <div
                  key={job.job_id}
                  onClick={(e) => {
                    // Don't navigate if clicking on the actions button or dropdown
                    if (!(e.target as HTMLElement).closest('[data-actions-menu]')) {
                      navigate(`/job/${job.job_id}`, { state: { job } });
                    }
                  }}
                  style={{
                    backgroundColor: colors.bgLight,
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.calypso[200]}`,
                    boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1)`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.calypso[300]}60`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 1px 3px rgba(0, 0, 0, 0.1)`;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Company & Position */}
                  <div style={{ marginBottom: '16px', paddingRight: '40px' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: colors.textPrimary,
                      marginBottom: '6px',
                      lineHeight: '1.3'
                    }}>
                      {job.company}
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: colors.textSecondary,
                      marginBottom: '12px',
                      lineHeight: '1.4'
                    }}>
                      {job.title}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      backgroundColor: `${getStatusColor(job.status)}15`,
                      color: getStatusColor(job.status)
                    }}>
                      {job.status === 'Captured' ? 'Applied' : job.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px'
                  }}>
                    {job.location && (
                      <div>
                        <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px', fontWeight: '500' }}>Location</div>
                        <div style={{ color: colors.textPrimary }}>{job.location}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px', fontWeight: '500' }}>Applied</div>
                      <div style={{ color: colors.textPrimary }}>
                        {new Date(job.applied_ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    {job.salary_range && (
                      <div>
                        <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px', fontWeight: '500' }}>Salary</div>
                        <div style={{ color: colors.textPrimary }}>{job.salary_range}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions Button */}
                  <div
                    data-actions-menu
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px'
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropdownToggle(job.job_id, e.currentTarget);
                      }}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: colors.calypso[200],
                        color: colors.textPrimary,
                        border: `2px solid ${colors.calypso[300]}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      ⋮
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdownId === job.job_id && (
                      <>
                        <div
                          style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(null);
                          }}
                        ></div>

                        <div style={{
                          position: 'absolute',
                          right: '0',
                          ...(dropdownPosition === 'above' 
                            ? { bottom: '100%', marginBottom: '8px' }
                            : { top: '100%', marginTop: '8px' }
                          ),
                          backgroundColor: colors.bgLight,
                          border: `1px solid ${colors.calypso[200]}`,
                          borderRadius: '8px',
                          boxShadow: `0 4px 16px rgba(0, 0, 0, 0.15)`,
                          zIndex: 1000,
                          minWidth: '180px',
                          overflow: 'hidden'
                        }}>
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderBottom: `1px solid ${colors.calypso[100]}`,
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: colors.textPrimary,
                              textAlign: 'left',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              boxSizing: 'border-box'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = colors.calypso[50];
                              e.currentTarget.style.paddingLeft = '20px';
                              e.currentTarget.style.color = colors.primary;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.paddingLeft = '16px';
                              e.currentTarget.style.color = colors.textPrimary;
                            }}
                          >
                            <span style={{ fontSize: '16px', opacity: 0.8 }}>🔗</span>
                            Open Job Link
                          </a>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/job/${job.job_id}`);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: colors.textPrimary,
                              borderBottom: `1px solid ${colors.calypso[100]}`,
                              transition: 'all 0.2s ease',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.calypso[50];
                              e.currentTarget.style.paddingLeft = '20px';
                              e.currentTarget.style.color = colors.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.paddingLeft = '16px';
                              e.currentTarget.style.color = colors.textPrimary;
                            }}
                          >
                            <span style={{ fontSize: '16px', opacity: 0.8 }}>👁️</span>
                            View Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditJob(job);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: colors.textPrimary,
                              borderBottom: `1px solid ${colors.calypso[100]}`,
                              transition: 'all 0.2s ease',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.calypso[50];
                              e.currentTarget.style.paddingLeft = '20px';
                              e.currentTarget.style.color = colors.primary;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.paddingLeft = '16px';
                              e.currentTarget.style.color = colors.textPrimary;
                            }}
                          >
                            <span style={{ fontSize: '16px', opacity: 0.8 }}>✏️</span>
                            Quick Edit Status
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(job.job_id, job.applied_ts);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: colors.error,
                              textAlign: 'left',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = colors.error;
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.paddingLeft = '20px';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = colors.error;
                              e.currentTarget.style.paddingLeft = '16px';
                            }}
                          >
                            <span style={{ fontSize: '16px', opacity: 0.8 }}>🗑️</span>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                backgroundColor: currentPage === 0 ? colors.neutral[200] : colors.primary,
                color: currentPage === 0 ? colors.neutral[400] : colors.calypso[50],
                border: 'none',
                borderRadius: '8px',
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
                  backgroundColor: currentPage === pageNum ? colors.primary : colors.bgLight,
                  color: currentPage === pageNum ? colors.calypso[50] : colors.textSecondary,
                  border: `1px solid ${currentPage === pageNum ? colors.primary : colors.calypso[200]}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: currentPage === pageNum ? '600' : '400',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (currentPage !== pageNum) {
                    e.currentTarget.style.backgroundColor = colors.calypso[100];
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseOut={(e) => {
                  if (currentPage !== pageNum) {
                    e.currentTarget.style.backgroundColor = colors.bgLight;
                    e.currentTarget.style.borderColor = colors.calypso[200];
                  }
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
                backgroundColor: currentPage === totalPages - 1 ? colors.neutral[200] : colors.primary,
                color: currentPage === totalPages - 1 ? colors.neutral[400] : colors.calypso[50],
                border: 'none',
                borderRadius: '8px',
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
            background: `linear-gradient(135deg, ${colors.calypso[50]} 0%, ${colors.calypso[100]} 100%)`,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: `0 10px 40px ${colors.calypso[800]}60`,
            border: `2px solid ${colors.calypso[200]}`
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', color: colors.textPrimary, fontWeight: '700' }}>Add New Job</h2>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: colors.textSecondary
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
                  backgroundColor: colors.calypso[50],
                  border: `2px solid ${colors.calypso[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: colors.textPrimary
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.primary}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.calypso[300]}
                disabled={submitting}
              />
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                color: colors.textLight
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
                  backgroundColor: colors.calypso[200],
                  border: `2px solid ${colors.calypso[400]}`,
                  borderRadius: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: colors.textSecondary,
                  fontWeight: '500',
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
                  backgroundColor: colors.primary,
                  color: colors.calypso[50],
                  border: 'none',
                  borderRadius: '8px',
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

      {/* Edit Job Modal */}
      {showEditModal && editingJob && (
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
            maxWidth: '520px',
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
                  setEditingJob(null);
                  setEditForm({ status: '', notes: '', resume_url: '' });
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

            <div style={{ marginBottom: '32px' }}>
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
              <div style={{
                marginTop: '8px',
                fontSize: '13px',
                color: colors.textLight,
                fontStyle: 'italic'
              }}>
                Update the status of this job application
              </div>
            </div>

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
                  setEditingJob(null);
                  setEditForm({ status: '', notes: '', resume_url: '' });
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

export default Dashboard;
