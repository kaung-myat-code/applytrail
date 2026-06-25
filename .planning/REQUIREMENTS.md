# Requirements: ApplyTrail

**Defined:** 2026-06-26
**Core Value:** End-to-end job application workflow in a local web UI — from resume to cover letter to application tracking

## v1 Requirements

### Resume Management

- [ ] **RESUME-01**: User can add and edit resume text in the browser
- [ ] **RESUME-02**: Resume content is stored persistently in a JSON file

### Job Postings

- [ ] **JOB-01**: User can paste a job posting text into an application
- [ ] **JOB-02**: Job posting is associated with the application entry

### Cover Letter Generation

- [ ] **COVER-01**: User can generate a tailored cover letter paragraph from resume + job posting using keyword-matching heuristics
- [ ] **COVER-02**: Cover letter logic matches resume skills and experience to job posting keywords
- [ ] **COVER-03**: Generated cover letter is a concise, professional paragraph assembled from matching sections
- [ ] **COVER-04**: User can copy generated cover letter to clipboard

### Application Tracking

- [ ] **APP-01**: User can save an application with company, role, job posting, cover letter, status, and date
- [ ] **APP-02**: User can view all saved applications in a list
- [ ] **APP-03**: User can update application status (e.g., applied, interviewing, offered, rejected)
- [ ] **APP-04**: User can see which applications need follow-up (10+ days without status change)

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
| Payment/billing | No monetization in Phase 1 |
| External AI API | Heuristics only, real LLM integration deferred to v2 |
| Full mobile optimization | Basic responsive layout included; deep mobile polish deferred |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESUME-01 | — | Pending |
| RESUME-02 | — | Pending |
| JOB-01 | — | Pending |
| JOB-02 | — | Pending |
| COVER-01 | — | Pending |
| COVER-02 | — | Pending |
| COVER-03 | — | Pending |
| COVER-04 | — | Pending |
| APP-01 | — | Pending |
| APP-02 | — | Pending |
| APP-03 | — | Pending |
| APP-04 | — | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 0
- Unmapped: 12 ⚠️

---
*Requirements defined: 2026-06-26*
*Last updated: 2026-06-26 after initial definition*
