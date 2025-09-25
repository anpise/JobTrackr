# JobTrackr - Project Plan

## Project Overview
JobTrackr is a personal job application tracking system that helps capture, store, and manage job application details. The system consists of a Chrome extension for capturing job URLs, a backend API for processing job data, and a frontend dashboard for viewing applications.

## System Architecture

### Components
1. **Chrome Extension** - Captures job URLs from browser
2. **Backend API** - Processes job data using Firecrawl API
3. **Frontend Dashboard** - Displays job applications and resume management
4. **Database** - Stores job application data
5. **File Storage** - S3 bucket for resume storage

### Data Flow
```
Chrome Extension → Backend API → Firecrawl API → Database
                ↓
            Frontend Dashboard ← Database
                ↓
            Resume Upload → S3 Bucket
```

## Detailed Component Specifications

### 1. Chrome Extension

#### Features
- **URL Capture**: Capture current tab URL with keyboard shortcut (Ctrl+Shift+J)
- **Manual Capture**: Click extension icon to capture current page
- **Job Details Form**: Optional form to add additional notes before submission
- **Status Feedback**: Visual confirmation of successful capture

#### Technical Stack
- **Language**: JavaScript/TypeScript
- **Framework**: Chrome Extension Manifest V3
- **Storage**: Chrome local storage for temporary data

#### Key Files
- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Popup logic
- `content.js` - Content script for page interaction
- `background.js` - Background service worker

### 2. Backend API (FastAPI)

#### Features
- **Job Processing**: Accept job URLs and process with Firecrawl API
- **Data Extraction**: Parse job details from crawled content
- **Database Operations**: CRUD operations for job applications
- **Resume Management**: Handle resume uploads to S3
- **CORS Support**: Enable frontend communication

#### API Endpoints
```
POST /api/jobs/capture
- Input: { url: string, notes?: string }
- Output: { job_id: string, status: string }

GET /api/jobs
- Output: List of all job applications

GET /api/jobs/{job_id}
- Output: Specific job application details

PUT /api/jobs/{job_id}
- Input: { status: string, notes?: string }
- Output: Updated job application

DELETE /api/jobs/{job_id}
- Output: Success confirmation

POST /api/resume/upload
- Input: Multipart file upload
- Output: { resume_url: string, resume_id: string }

GET /api/resume/{resume_id}
- Output: Resume details and download URL
```

#### Technical Stack
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (RDS) or DynamoDB
- **File Storage**: AWS S3
- **External API**: Firecrawl API
- **Deployment**: AWS Lambda

### 3. Frontend Dashboard

#### Features
- **Job List View**: Display all job applications in a table/card format
- **Job Details**: View detailed job information
- **Status Management**: Update application status (Applied, Interview, Rejected, etc.)
- **Resume Management**: Upload and manage resumes
- **Search & Filter**: Filter jobs by status, company, date
- **Export**: Export job data to CSV/PDF

#### Pages
- **Dashboard**: Overview of all applications
- **Job Detail**: Individual job application view
- **Resume Manager**: Upload and manage resumes
- **Settings**: Configuration options

#### Technical Stack
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context or Zustand
- **HTTP Client**: Axios
- **Deployment**: AWS S3 + CloudFront

### 4. Database Schema

#### Job Applications Table
```sql
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    requirements TEXT,
    salary_range TEXT,
    job_type TEXT,
    status TEXT DEFAULT 'applied',
    notes TEXT,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Resumes Table
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    s3_key TEXT NOT NULL,
    s3_url TEXT NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### 5. External Services

#### Firecrawl API Integration
- **Purpose**: Extract structured data from job posting URLs
- **Data Extracted**: Job title, company, location, description, requirements
- **Rate Limiting**: Handle API rate limits
- **Error Handling**: Graceful fallback for failed extractions

#### AWS Services
- **S3**: Resume file storage
- **Lambda**: Backend API hosting
- **RDS**: PostgreSQL database (or DynamoDB for NoSQL)
- **CloudFront**: CDN for frontend
- **API Gateway**: API routing (if needed)

## Development Phases

### Phase 1: Core Backend (Week 1-2)
- [ ] Set up FastAPI project structure
- [ ] Implement basic CRUD operations
- [ ] Integrate Firecrawl API
- [ ] Set up database schema
- [ ] Create API documentation

### Phase 2: Chrome Extension (Week 2-3)
- [ ] Create extension manifest and basic structure
- [ ] Implement URL capture functionality
- [ ] Add keyboard shortcut support
- [ ] Integrate with backend API
- [ ] Test extension functionality

### Phase 3: Frontend Dashboard (Week 3-4)
- [ ] Set up React TypeScript project
- [ ] Create basic UI components
- [ ] Implement job list and detail views
- [ ] Add resume upload functionality
- [ ] Integrate with backend API

### Phase 4: Integration & Testing (Week 4-5)
- [ ] End-to-end testing
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation completion

### Phase 5: Deployment (Week 5-6)
- [ ] Set up AWS infrastructure
- [ ] Deploy backend to Lambda
- [ ] Deploy frontend to S3
- [ ] Configure domain and SSL
- [ ] Production testing

## Security Considerations

### Data Protection
- **API Authentication**: JWT tokens for API access
- **CORS Configuration**: Restrict frontend origins
- **Input Validation**: Sanitize all inputs
- **File Upload Security**: Validate file types and sizes

### Privacy
- **Data Encryption**: Encrypt sensitive data at rest
- **Secure Communication**: HTTPS for all communications
- **Access Control**: User authentication for dashboard access

## Scalability Considerations

### Current Scope (Single User)
- **Database**: Single user data, no multi-tenancy
- **Storage**: Personal resume files only
- **API**: Simple CRUD operations
- **Frontend**: Single-page application

### Future Enhancements
- **Multi-user Support**: User authentication and data isolation
- **Advanced Analytics**: Job application statistics
- **Integration**: LinkedIn, Indeed API integration
- **Mobile App**: React Native mobile application

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| Chrome Extension | JavaScript/TypeScript | URL capture |
| Backend API | FastAPI (Python) | Data processing |
| Frontend | React + TypeScript | User interface |
| Database | PostgreSQL/DynamoDB | Data storage |
| File Storage | AWS S3 | Resume storage |
| Deployment | AWS Lambda + S3 | Cloud hosting |
| External API | Firecrawl | Job data extraction |

## Cost Estimation

### AWS Services (Monthly)
- **Lambda**: ~$1-5 (based on API calls)
- **RDS**: ~$15-25 (t3.micro instance)
- **S3**: ~$1-3 (storage and requests)
- **CloudFront**: ~$1-2 (CDN usage)
- **Total**: ~$18-35/month

### External Services
- **Firecrawl API**: Pay-per-use pricing
- **Domain**: ~$12/year (optional)

## Success Metrics

### Functional Requirements
- [ ] Successfully capture job URLs from any job site
- [ ] Extract job details with >90% accuracy
- [ ] Store and retrieve job applications
- [ ] Upload and manage resumes
- [ ] Display job data in user-friendly format

### Performance Requirements
- [ ] API response time <2 seconds
- [ ] Frontend load time <3 seconds
- [ ] Extension capture time <1 second
- [ ] 99% uptime for backend services

## Risk Assessment

### Technical Risks
- **Firecrawl API Reliability**: Mitigation - implement fallback parsing
- **Chrome Extension Permissions**: Mitigation - minimal required permissions
- **Database Performance**: Mitigation - proper indexing and query optimization

### Business Risks
- **External API Changes**: Mitigation - API versioning and monitoring
- **Cost Overruns**: Mitigation - usage monitoring and alerts
- **Data Loss**: Mitigation - regular backups and versioning

## Next Steps

1. **Review and Approve Plan**: Stakeholder review of this plan
2. **Environment Setup**: Development environment configuration
3. **Backend Development**: Start with FastAPI implementation
4. **Database Setup**: Configure database schema
5. **API Testing**: Test backend functionality
6. **Extension Development**: Build Chrome extension
7. **Frontend Development**: Create React dashboard
8. **Integration Testing**: End-to-end testing
9. **Deployment**: AWS infrastructure setup
10. **Production Testing**: Final testing and optimization

---

*This plan serves as a living document and should be updated as the project evolves.*
