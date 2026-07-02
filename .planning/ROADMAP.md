# Roadmap: ApplyTrail

## Overview

A local web MVP that migrates a CLI-based job application workflow into a React + Express web app. v1.0 (Phases 1-4) delivered the core workflow: resume editing, job posting input, cover letter generation, and application tracking. v1.1 Release Polish (Phases 5-8) transforms it into a publicly deployed portfolio piece with production server configuration, demo data, live deployment on Render, and polished documentation.

## Milestones

- [x] **v1.0 MVP** - Phases 1-4 (shipped 2026-06-26)
- [x] **v1.1 Release Polish** - Phases 5-8 (shipped 2026-06-27)

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-06-26</summary>

- [x] **Phase 1: Foundation** - Project scaffolding with React + Express, JSON file storage, and basic app shell (completed 2026-06-25)
- [x] **Phase 2: Resume & Job Input** - User can edit resume content and paste job postings in the browser (completed 2026-06-26)
- [x] **Phase 3: Cover Letter Generation** - User can generate a tailored cover letter paragraph from resume and job posting (completed 2026-06-26)
- [x] **Phase 4: Application Tracking** - User can save, view, update, and follow up on job applications (completed 2026-06-26)

</details>

### v1.1 Release Polish (In Progress)

- [x] **Phase 5: Deployment Readiness** - Production server serves built React files with security headers, compression, and environment-based config (completed 2026-06-27)
- [x] **Phase 6: Demo Data & Seeding** - App launches with realistic demo data so portfolio visitors see a populated interface (completed 2026-06-27)
- [x] **Phase 7: Production Deployment** - App is live and fully functional on a public Render URL (completed 2026-06-27)
- [x] **Phase 8: Documentation & Release** - Repository is polished with README, LICENSE, screenshots, and presentation materials (completed 2026-06-27)

## Phase Details

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-06-26</summary>

### Phase 1: Foundation

**Mode:** mvp
**Goal**: A working React + Express app with JSON file persistence and a navigable shell
**Depends on**: Nothing (first phase)
**Requirements**: RESUME-02
**Success Criteria** (what must be TRUE):

  1. App starts with a single command and loads in the browser
  2. Data persists across server restarts (JSON files survive stop/start)
  3. User can navigate between at least two placeholder pages via the app shell

**Plans**: 1/1 plans complete

Plans:

- [x] 01-01-PLAN.md — Scaffold monorepo, Express API, React Router, and resume.json migration

### Phase 2: Resume & Job Input

**Mode:** mvp
**Goal**: User can enter and persist their resume content, and paste job posting text into the system
**Depends on**: Phase 1
**Requirements**: RESUME-01, JOB-01
**Success Criteria** (what must be TRUE):

  1. User can type or paste resume text into a text area and save it
  2. Saved resume content is displayed when the user returns to the resume page
  3. User can paste a job posting text along with company name and role title
  4. Job posting text is saved and retrievable for later use

**Plans**: 4/4 plans complete

Plans:

- [x] 02-01-PLAN.md — API verification for resume routes
- [x] 02-02-PLAN.md — Basic resume editor UI
- [x] 02-03-PLAN.md — Sections editor (experience, projects, skills, education)
- [x] 02-04-PLAN.md — Job posting input form and API routes

### Phase 3: Cover Letter Generation

**Mode:** mvp
**Goal**: User can generate a tailored cover letter paragraph that connects their resume experience to a specific job posting
**Depends on**: Phase 2
**Requirements**: COVER-01, COVER-02, COVER-03, COVER-04
**Success Criteria** (what must be TRUE):

  1. User can trigger cover letter generation from a resume and job posting pair
  2. Generated paragraph mentions the target role and company name
  3. Generated paragraph includes matched resume experience relevant to the job posting keywords
  4. Generated paragraph includes at least one measurable achievement from the resume when available
  5. User can copy the generated cover letter to the clipboard

**Plans**: 2/2 plans complete

Plans:

- [x] 03-01-PLAN.md — Cover letter engine: keyword matching + paragraph assembly + API endpoint
- [x] 03-02-PLAN.md — Cover letter UI: posting selector, generate button, paragraph display, copy to clipboard

**UI hint**: yes

### Phase 4: Application Tracking

**Mode:** mvp
**Goal**: User can save complete job applications with their cover letters, track status, and identify stale applications that need follow-up
**Depends on**: Phase 3
**Requirements**: APP-01, APP-02, APP-03, APP-04, JOB-02
**Success Criteria** (what must be TRUE):

  1. User can save an application with company, role, job posting, cover letter, status, and date
  2. All saved applications appear in a list view with key details visible
  3. User can change an application's status (e.g., applied, interviewing, offered, rejected)
  4. Updated status is reflected immediately in the list view
  5. Applications with no status change for 10+ days are visually flagged as needing follow-up

**Plans**: 1/1 plans complete

Plans:

- [x] 04-01-PLAN.md — Application API endpoints, list view UI, and save flow from cover letter

**UI hint**: yes

</details>

### Phase 5: Deployment Readiness

**Goal**: App runs in production mode with Express serving built React files, security headers, compression, and environment-based configuration
**Depends on**: Phase 4
**Requirements**: DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04, DEPLOY-05, DEPLOY-06, DEPLOY-07, DEPLOY-08, DEPLOY-09
**Success Criteria** (what must be TRUE):

  1. User can run `npm run build && npm start` at the project root and see the app at localhost:3000
  2. All frontend pages and API endpoints work correctly when served from a single Express origin (no CORS errors, no blank pages)
  3. `GET /api/health` returns a JSON status response
  4. Security headers (helmet) and response compression are active when `NODE_ENV=production`
  5. All frontend fetch calls use relative URLs (`/api/...`) with no hardcoded `localhost:3000`

**Plans**: 1/1 plans complete

Plans:

- [x] 05-01-PLAN.md — Production server setup (helmet, compression, health endpoint, static serving) and deployment configuration (render.yaml, .env.example, build/start scripts)

### Phase 6: Demo Data & Seeding

**Goal**: App launches with representative demo data so portfolio visitors see a populated interface
**Depends on**: Phase 5
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DEMO-04
**Success Criteria** (what must be TRUE):

  1. App displays representative demo resume, job postings, and applications on first launch
  2. Demo applications cover multiple statuses (drafted, applied, interviewing, rejected) to showcase tracking features
  3. Demo data contains fictional or intentionally shared sample information suitable for a public repository

**Plans**: 1/1 plans complete

Plans:

- [x] 06-01-PLAN.md — Demo data files and server seeding mechanism

### Phase 7: Production Deployment

**Goal**: App is live and fully functional on a public URL via Render free tier
**Depends on**: Phase 6
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):

  1. App is accessible at a public `*.onrender.com` URL
  2. All features work end-to-end on the deployed instance (resume editing, job posting input, cover letter generation, application tracking)
  3. Production health check endpoint returns a successful response
  4. Pushing to the main branch triggers automatic redeployment on Render

**Plans**: 1/1 plans complete

Plans:

- [x] 07-01-PLAN.md — Deploy to Render and verify end-to-end functionality

### Phase 8: Documentation & Release

**Goal**: Repository is polished for public consumption with comprehensive documentation, screenshots, and presentation materials
**Depends on**: Phase 7
**Requirements**: DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, DOC-07
**Success Criteria** (what must be TRUE):

  1. README contains project description, features list, tech stack, local setup instructions, and a working live demo link
  2. README displays 3+ screenshots and tech/deployment badges
  3. MIT LICENSE file exists in the repository root
  4. Marp slides at `slides/pitch.md` describe the web app (not the CLI workflow)
  5. Architecture documentation, if included, accurately reflects the production deployment, OR remove it if DOC-05 is optional

**Plans**: 1/1 plans complete

Plans:

- [x] 08-01-PLAN.md — LICENSE, README, Marp slides, and architecture diagram for public release

## Progress

**Execution Order:**
Phases execute in numeric order: 5 -> 6 -> 7 -> 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-06-25 |
| 2. Resume & Job Input | v1.0 | 4/4 | Complete | 2026-06-26 |
| 3. Cover Letter Generation | v1.0 | 2/2 | Complete | 2026-06-26 |
| 4. Application Tracking | v1.0 | 1/1 | Complete | 2026-06-26 |
| 5. Deployment Readiness | v1.1 | 1/1 | Complete | 2026-06-27 |
| 6. Demo Data & Seeding | v1.1 | 1/1 | Complete | 2026-06-27 |
| 7. Production Deployment | v1.1 | 1/1 | Complete | 2026-06-27 |
| 8. Documentation & Release | v1.1 | 1/1 | Complete    | 2026-06-27 |
