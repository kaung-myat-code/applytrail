# Requirements: ApplyTrail

**Defined:** 2026-06-26
**Core Value:** End-to-end job application workflow in a local web UI — from resume to cover letter to application tracking

## v1 Requirements

### Resume Management

- [x] **RESUME-01**: User can add and edit resume text in the browser
- [x] **RESUME-02**: Resume content is stored persistently in a JSON file

### Job Postings

- [x] **JOB-01**: User can paste a job posting text into an application
- [x] **JOB-02**: Job posting is associated with the application entry

### Cover Letter Generation

- [x] **COVER-01**: User can generate a tailored cover letter paragraph from resume + job posting using keyword-matching heuristics
- [x] **COVER-02**: Cover letter logic matches resume skills and experience to job posting keywords
- [x] **COVER-03**: Generated cover letter is a concise, professional paragraph assembled from matching sections
- [x] **COVER-04**: User can copy generated cover letter to clipboard

### Application Tracking

- [x] **APP-01**: User can save an application with company, role, job posting, cover letter, status, and date
- [x] **APP-02**: User can view all saved applications in a list
- [x] **APP-03**: User can update application status (e.g., applied, interviewing, offered, rejected)
- [x] **APP-04**: User can see which applications need follow-up (10+ days without status change)

## v1.1 Requirements — Release Polish

### Deployment Readiness

- [ ] **DEPLOY-01**: Express serves built React static files from `client/dist/` in production mode with SPA catch-all route for client-side routing
- [ ] **DEPLOY-02**: Health check endpoint (`GET /api/health`) returns server status for hosting platform monitoring
- [ ] **DEPLOY-03**: Security headers are applied via helmet middleware in production mode
- [ ] **DEPLOY-04**: Response compression is applied via compression middleware in production mode
- [ ] **DEPLOY-05**: Environment-based configuration separates dev and prod behavior (`NODE_ENV` toggles)
- [ ] **DEPLOY-06**: Root-level `package.json` has `build` and `start` scripts that build client and run production server
- [ ] **DEPLOY-07**: All frontend fetch calls use relative URLs (`/api/...`) instead of hardcoded `localhost:3000`
- [ ] **DEPLOY-08**: `render.yaml` blueprint exists with build command, start command, and environment configuration
- [ ] **DEPLOY-09**: `.env.example` documents all configurable environment variables

### Demo Data

- [ ] **DEMO-01**: Demo resume data file exists with realistic content (name, experience, skills, education)
- [ ] **DEMO-02**: Demo job postings data file exists with 2-3 realistic entries
- [ ] **DEMO-03**: Demo applications data file exists with entries in various statuses (drafted, applied, interviewing, rejected)
- [ ] **DEMO-04**: Server seeds data from demo files when production data directory is empty on startup

### Production Deployment

- [ ] **PROD-01**: App is deployed to Render free tier as a web service with auto-deploy from GitHub
- [ ] **PROD-02**: Configure required Render environment variables, or document that none are required
- [ ] **PROD-03**: Health check endpoint is verified working on deployed instance
- [ ] **PROD-04**: Live demo URL is accessible and all features work end-to-end

### Documentation & Release

- [ ] **DOC-01**: README is updated with project description, features, tech stack, setup instructions, and live demo link
- [ ] **DOC-02**: README includes links to 3+ screenshots
- [ ] **DOC-03**: README includes tech stack and deployment badges (shields.io)
- [ ] **DOC-04**: MIT LICENSE file exists in repository root
- [ ] **DOC-05**: Architecture diagram is added or confirmed current
- [ ] **DOC-06**: `slides/pitch.md` is updated for web app (currently references CLI workflow)
- [ ] **DOC-07**: Release assets include 3+ screenshot files and optional demo GIF

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced AI

- **AI-01**: Replace keyword heuristics with real LLM API for cover letter generation
- **AI-02**: Allow user to customize cover letter tone/style

### Data Import/Export

- **DATA-01**: Import resume from PDF/DOCX
- **DATA-02**: Export applications to CSV

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentication | Single-user local tool, no login needed |
| Job scraping | User pastes postings manually |
| Email sending | Out of MVP scope |
| Payment/billing | No monetization |
| External AI API | Heuristics only, real LLM integration deferred |
| Core functionality changes | v1.1 is polish only, not new features |
| Database migration | Violates core JSON file storage constraint |
| Docker | Unnecessary complexity for single-service app |
| GitHub Actions CI/CD | No tests to run yet, Render auto-deploy sufficient |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESUME-01 | Phase 2 | Complete |
| RESUME-02 | Phase 1 | Complete |
| JOB-01 | Phase 2 | Complete |
| JOB-02 | Phase 4 | Complete |
| COVER-01 | Phase 3 | Complete |
| COVER-02 | Phase 3 | Complete |
| COVER-03 | Phase 3 | Complete |
| COVER-04 | Phase 3 | Complete |
| APP-01 | Phase 4 | Complete |
| APP-02 | Phase 4 | Complete |
| APP-03 | Phase 4 | Complete |
| APP-04 | Phase 4 | Complete |
| DEPLOY-01 | Phase 5 | Pending |
| DEPLOY-02 | Phase 5 | Pending |
| DEPLOY-03 | Phase 5 | Pending |
| DEPLOY-04 | Phase 5 | Pending |
| DEPLOY-05 | Phase 5 | Pending |
| DEPLOY-06 | Phase 5 | Pending |
| DEPLOY-07 | Phase 5 | Pending |
| DEPLOY-08 | Phase 5 | Pending |
| DEPLOY-09 | Phase 5 | Pending |
| DEMO-01 | Phase 6 | Pending |
| DEMO-02 | Phase 6 | Pending |
| DEMO-03 | Phase 6 | Pending |
| DEMO-04 | Phase 6 | Pending |
| PROD-01 | Phase 7 | Pending |
| PROD-02 | Phase 7 | Pending |
| PROD-03 | Phase 7 | Pending |
| PROD-04 | Phase 7 | Pending |
| DOC-01 | Phase 8 | Pending |
| DOC-02 | Phase 8 | Pending |
| DOC-03 | Phase 8 | Pending |
| DOC-04 | Phase 8 | Pending |
| DOC-05 | Phase 8 | Pending |
| DOC-06 | Phase 8 | Pending |
| DOC-07 | Phase 8 | Pending |

**Coverage:**

- v1 requirements: 12 total, 12 mapped, 0 unmapped
- v1.1 requirements: 24 total, 24 mapped, 0 unmapped

---
*Requirements defined: 2026-06-26*
*Last updated: 2026-06-26 — v1.1 Release Polish roadmap created, all 24 requirements mapped*
