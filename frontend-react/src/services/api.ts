// API service for JobTrackr backend

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

export interface GetJobsResponse {
  jobs: JobApplication[];
  count: number;
  next_page_token?: string;
}

class ApiService {
  /**
   * Get authorization header with access token
   */
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('id_token');
    if (!token) {
      throw new Error('No id token found');
    }
    return {
      'Authorization': token,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Ingest a job URL for processing
   */
  async ingestJob(request: IngestJobRequest): Promise<IngestJobResponse> {
    try {
      const response = await fetch(`${API_URL}/api/jobs/ingest`, {
        method: 'POST',
        headers: this.getAuthHeader(),
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to ingest job: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ingesting job:', error);
      throw error;
    }
  }

  /**
   * Fetch all job applications for the authenticated user
   */
  async getJobs(limit: number = 10, lastKey?: string): Promise<GetJobsResponse> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (lastKey) {
        params.append('last_key', lastKey);
      }

      const response = await fetch(`${API_URL}/api/jobs?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }

      const data = await response.json();
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
  async updateJob(jobId: string, appliedTs: string, updates: { status?: string; notes?: string }): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/jobs/${jobId}?applied_ts=${encodeURIComponent(appliedTs)}`, {
        method: 'PUT',
        headers: this.getAuthHeader(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
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
        throw new Error(`Failed to delete job: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  }
}

export const api = new ApiService();
