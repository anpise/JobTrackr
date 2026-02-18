// API service for JobTrackr backend

import { encryptPayload, decryptResponse } from './crypto';

const API_URL = import.meta.env.VITE_API_URL as string;

export interface JobApplication {
  job_id: string;
  company: string;
  title: string;
  location?: string;
  status: string;
  applied_ts: string;
  salary_range?: string;
  job_url: string;
  user_id: string;
  last_updated_ts: string;
  source?: string;
  employment_type?: string;
  tags?: string[];
  notes?: string;
  resume_url?: string;
  type: string;
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

export interface IngestJobRequest {
  url: string;
  resume_url?: string;
}

export interface IngestJobResponse {
  message: string;
  status: string;
  job_id?: string;
}

export interface UpdateJobRequest {
  status?: string;
  notes?: string;
  resume_url?: string;
}

export interface GetJobsResponse {
  jobs: JobApplication[];
  count: number;
  next_page_token?: string;
}

export interface JobStats {
  total_jobs: number;
  status_breakdown: Record<string, number>;
  company_breakdown: Record<string, number>;
  recent_activity: Array<{
    job_id: string;
    company: string;
    position: string;
    status: string;
    applied_ts: string;
    created_at: string;
  }>;
  application_trends: Record<string, number>;
  weekly_trends: Record<string, number>;
  daily_trends: Record<string, number>;
}

class ApiService {
  /**
   * Get authorization header with access token
   */
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('id_token');
    if (!token) {
      // Clear any stale tokens and redirect to login
      this.handleAuthError();
      throw new Error('No id token found');
    }
    return {
      'Authorization': token,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Handle authentication errors by clearing tokens and redirecting
   */
  private handleAuthError(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  }

  /**
   * Ingest a job URL for processing
   */
  async ingestJob(request: IngestJobRequest): Promise<IngestJobResponse> {
    try {
      const encryptedBody = await encryptPayload(request);
      const response = await fetch(`${API_URL}/api/jobs/ingest`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: encryptedBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Authentication expired. Please login again.');
        }
        const error = await decryptResponse(await response.text()).catch(() => ({}));
        throw new Error(error.error?.message || `Failed to ingest job: ${response.status}`);
      }

      return await decryptResponse(await response.text());
    } catch (error) {
      console.error('Error ingesting job:', error);
      throw error;
    }
  }

  /**
   * Fetch all job applications for the authenticated user
   */
  async getJobs(limit: number = 10, lastKey?: string, status?: string, search?: string): Promise<GetJobsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (lastKey) {
        params.append('last_key', lastKey);
      }
      if (status) {
        params.append('status', status);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_URL}/api/jobs?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await decryptResponse(await response.text());
      return {
        jobs: data.jobs || [],
        count: data.count || 0,
        next_page_token: data.next_page_token
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  /**
   * Update a job application
   */
  async updateJob(jobId: string, appliedTs: string, updates: UpdateJobRequest): Promise<void> {
    try {
      const encryptedBody = await encryptPayload(updates);
      const response = await fetch(`${API_URL}/api/jobs/${jobId}?applied_ts=${encodeURIComponent(appliedTs)}`, {
        method: 'PUT',
        headers: this.getAuthHeader(),
        body: encryptedBody
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error(`Failed to update job: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  /**
   * Delete a job application
   */
  async deleteJob(jobId: string, appliedTs: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}?applied_ts=${encodeURIComponent(appliedTs)}`, {
        method: 'DELETE',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error(`Failed to delete job: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }

  /**
   * Get job application statistics
   */
  async getStats(): Promise<JobStats> {
    try {
      const response = await fetch(`${API_URL}/api/stats`, {
        method: 'GET',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.handleAuthError();
          throw new Error('Authentication expired. Please login again.');
        }
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      return await decryptResponse(await response.text());
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
}

export const api = new ApiService();
