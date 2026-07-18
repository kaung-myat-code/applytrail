# Roadmap: ApplyTrail

## Overview

A local web MVP that migrates a CLI-based job application workflow into a React + Express web app. v1.0 (Phases 1-4) delivered the core workflow: resume editing, job posting input, cover letter generation, and application tracking. v1.1 Release Polish (Phases 5-8) transformed it into a publicly deployed portfolio piece with production server configuration, demo data, live deployment on Render, and polished documentation. v2.0 Resume Tailoring Flow (Phases 9-14) adds an end-to-end resume optimization workflow: manage multiple resume versions, analyze against job postings, generate and review section-by-section suggestions, create tailored resumes, export to PDF/JSON, and polish the workflow based on user feedback.

## Milestones

- [x] **v1.0 MVP** - Phases 1-4 (shipped 2026-06-26)
- [x] **v1.1 Release Polish** - Phases 5-8 (shipped 2026-06-27)
- [ ] **v2.0 Resume Tailoring Flow** - Phases 9-14 (planned)

## Phases

**Phase Numbering:**

- Integer phases (9, 10, 11): Planned milestone work
- Decimal phases (9.1, 10.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-06-26</summary>

- [x] **Phase 1: Foundation** - Project scaffolding with React + Express, JSON file storage, and basic app shell (completed 2026-06-25)
- [x] **Phase 2: Resume & Job Input** - User can edit resume content and paste job postings in the browser (completed 2026-06-26)
- [x] **Phase 3: Cover Letter Generation** - User can generate a tailored cover letter paragraph from resume and job posting (completed 2026-06-26)
- [x] **Phase 4: Application Tracking** - User can save, view, update, and follow up on job applications (completed 2026-06-26)

</details>

<details>
<summary>v1.1 Release Polish (Phases 5-8) - SHIPPED 2026-06-27</summary>

- [x] **Phase 5: Deployment Readiness** - Production server serves built React files with security headers, compression, and environment-based config (completed 2026-06-27)
- [x] **Phase 6: Demo Data & Seeding** - App launches with realistic demo data so portfolio visitors see a populated interface (completed 2026-06-27)
- [x] **Phase 7: Production Deployment** - App is live and fully functional on a public Render URL (completed 2026-06-27)
- [x] **Phase 8: Documentation & Release** - Repository is polished with README, LICENSE, screenshots, and presentation materials (completed 2026-06-27)

Archive: [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) | [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md)

</details>

### v2.0 Resume Tailoring Flow (Planned)

**Milestone Goal:** Build an end-to-end resume optimization workflow that analyzes a selected resume against a job posting, generates actionable improvement suggestions, lets users review every change, creates a new tailored resume version, and seamlessly starts a job application.

- [x] **Phase 9: Resume Library Foundation** - Multiple resume versions with CRUD, migration from single file, and selection for analysis (completed 2026-07-02)
- [x] **Phase 10: Match Scoring and Gap Analysis** - Provider-agnostic analysis engine with compatibility score, keyword gaps, and section-level findings (analysis only, no suggestions) (completed 2026-07-02)
- [x] **Phase 11: Section-by-Section Suggestions** - Per-section add/modify/remove suggestions with accept/reject workflow (completed 2026-07-03)
- [x] **Phase 11.5: AI Analysis Provider 🔶 INSERTED** - Multi-provider AI analysis (Gemini, OpenRouter, Groq) with provider selection toggle, API key config, and automatic fallback chain to heuristic
- [x] **Phase 12: Tailored Resume Generation** - Apply accepted patches to create a new resume version with side-by-side diff review (completed 2026-07-16)
- [x] **Phase 13: Application Pre-fill and Export** - Pre-fill application from job posting, export resume as PDF or JSON (completed 2026-07-17)
- [ ] **Phase 14: UX & Quality Polish from User Feedback** - Resolve GitHub issues #2-#8 from 2026-07-05 UAT: workflow clarity, nav restructuring, resume-library bug fix, editor safety, analysis/writing quality, and lint cleanup

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

<details>
<summary>v1.1 Release Polish (Phases 5-8) - SHIPPED 2026-06-27</summary>

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

</details>

### Phase 9: Resume Library Foundation

**Goal**: Users can manage multiple resume versions -- create, rename, delete, and select which one to use for analysis
**Depends on**: Phase 8 (v1.1 complete)
**Requirements**: LIBRARY-01, LIBRARY-02, LIBRARY-04, LIBRARY-05
**Success Criteria** (what must be TRUE):

  1. User can see a list of all resume versions on a Resume Library page
  2. User can create a new resume version, rename an existing one, and delete one they no longer need
  3. The existing resume data is preserved in the library after migration (no data loss on first launch)
  4. User can select any resume version as the base for analysis and tailoring

**Plans**: 1/1 plans complete

Plans:

- [x] 09-01-PLAN.md — Resume Library: migration, CRUD API, frontend page, and version selection

### Phase 10: Match Scoring and Gap Analysis

**Goal**: Users can analyze a selected resume against a job posting and see a compatibility report with strengths, gaps, and keyword matches
**Depends on**: Phase 9
**Requirements**: ANALYSIS-01, ANALYSIS-02, ANALYSIS-03, ANALYSIS-04
**Success Criteria** (what must be TRUE):

  1. User can trigger analysis of a selected resume against a pasted job posting and see an overall compatibility score
  2. Match report displays matched keywords, missing keywords, and bonus keywords as categorized groups
  3. Match report shows section-level findings for Summary, Skills, Experience, Projects, and Education
  4. The analysis engine uses a provider-agnostic interface so a different provider (AI, third-party) can be swapped without UI changes

**Plans**: 1/1 plans complete

Plans:

- [x] 10-01-PLAN.md — Analysis engine, shared keywords, API endpoint, and frontend match report page

**UI hint**: yes

### Phase 11: Section-by-Section Suggestions

**Goal**: Users can review actionable improvement suggestions for each resume section and accept, reject, or edit each one
**Depends on**: Phase 10
**Requirements**: SUGGEST-01, SUGGEST-02, SUGGEST-03, SUGGEST-04
**Success Criteria** (what must be TRUE):

  1. User sees section-level suggestions (add, modify, remove) with explanations after running analysis
  2. User can accept or reject each suggestion individually
  3. User can accept all or reject all suggestions with bulk controls
  4. User can compare current and suggested content side-by-side in a diff view

**Plans**: 1/1 plans complete

Plans:

- [x] 11-01-PLAN.md — Suggestion generation, review page with accept/reject/edit, and diff viewer

**UI hint**: yes

### Phase 11.5: AI Analysis Provider 🔶 INSERTED

**Goal:** Users can choose between the heuristic keyword-matching analysis and an AI-powered LLM-based analysis, with provider selection in the UI and automatic fallback if the AI provider is unavailable
**Depends on**: Phase 11
**Requirements**: AI-ANALYSIS-01, AI-ANALYSIS-02, AI-ANALYSIS-03, AI-ANALYSIS-04
**Success Criteria** (what must be TRUE):

  1. User can select "AI Analysis" from a provider dropdown on the Analysis page
  2. Without ANALYSIS_API_KEY set, AI provider shows a clear configuration message
  3. With ANALYSIS_API_KEY set, AI provider returns a valid match report covering score, keywords, and section findings
  4. If AI analysis fails, the system auto-fallbacks to heuristic with a visible banner
  5. Heuristic provider continues to work identically when selected

**Plans**: 2/2 plans

Plans:

- [x] 11-5-01-PLAN.md -- AI provider backend: install Vercel AI SDK, create provider module with Zod validation, register in engine, update API with fallback
- [x] 11-5-02-PLAN.md -- Provider selector UI: dropdown on Analysis page, fallback banner, provider sent to API

**UI hint**: yes

### Phase 12: Tailored Resume Generation

**Goal**: Users can generate a new tailored resume from their accepted suggestions, review it before saving, and return to edit if needed
**Depends on**: Phase 11.5
**Requirements**: LIBRARY-03, TAILOR-01, TAILOR-02, TAILOR-03, TAILOR-04, TAILOR-05, TAILOR-06
**Success Criteria** (what must be TRUE):

  1. User can generate a tailored resume that applies only their accepted suggestions to a copy of the source resume
  2. Tailored resume is saved as a new version with auto-naming ("Company - Role"), without overwriting the source
  3. User can preview the tailored resume before final save
  4. User can return to the suggestion review from preview without losing their accept/reject decisions
  5. Generated resume conforms to the resume JSON schema before it can be saved
  6. The source resume remains unchanged after generating a tailored resume

**Plans**: 3/3 plans complete

Plans:

- [x] 12-03-PLAN.md

- [x] 12-01-PLAN.md — Backend: Draft storage API + patch application engine (validateResume extraction + applyPatches with all-entry modify search + draft CRUD + startup cleanup)
- [x] 12-02-PLAN.md — Frontend: Generate button wiring + Preview page + routing (URL-param draftId for refresh resilience + draft hydration for TAILOR-05 + read-only resume renderer)

**UI hint**: yes

### Phase 13: Application Pre-fill and Export

**Goal**: Users can create a pre-filled application from the analyzed job posting and export any resume version as PDF or JSON
**Depends on**: Phase 12
**Requirements**: PREFILL-01, PREFILL-02, PREFILL-03, EXPORT-01, EXPORT-02
**Success Criteria** (what must be TRUE):

  1. User can create a new application pre-filled with company, role, and job posting text from the analysis
  2. A confirmation dialog shows the pre-filled data before the application is created
  3. Created application is linked to the tailored resume version
  4. User can export any resume version as a PDF file
  5. User can export any resume version as a JSON file
  6. Applications reference a resume version by resume_version_id rather than duplicating resume data

**Plans**: 3/3 plans executed

Plans:
**Wave 1**

- [x] 13-01-PLAN.md — Backend: resume_version_id on POST /api/applications, JSON/PDF export routes, server/lib/pdf.js (pdfmake)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 13-02-PLAN.md — CreateApplicationModal component: pre-filled fields, auto-generated cover letter, confirm/cancel

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 13-03-PLAN.md — Wire modal into PreviewTailored.jsx (auto-trigger) and ResumeLibrary.jsx (manual-trigger + export actions)

**UI hint**: yes

### Phase 14: UX & Quality Polish from User Feedback

**Goal**: Resolve the UX and quality issues surfaced by the 2026-07-05 exploratory UAT (`feedback/feedback.md`, GitHub issues #2-#8) -- clarify the job-posting-vs-application workflow, restructure navigation around the linear job-search path, fix the Resume Library creation bug, add resume-editor safety features, broaden analysis keyword coverage, improve generated-text quality, and get lint to a clean baseline
**Depends on**: Phase 13
**Requirements**: TBD (fully scoped in `14-CONTEXT.md`; formal REQUIREMENTS.md entries to be assigned during planning)
**Success Criteria** (what must be TRUE):

  1. Saving a job posting on New Application redirects to Cover Letter with an explicit "Save Application" confirmation step, and the Applications list clarifies "applied on" vs. "last status change" dates
  2. Top-level navigation is collapsed into grouped sections reflecting the linear workflow, with contextual "Continue to next step" CTAs on workflow pages
  3. `POST /api/resume-library` creates a valid empty resume version (contact defaults to empty strings, not `{}`), covered by a regression test
  4. Resume editor has delete confirmations, a saved/unsaved-changes indicator, and a read-only preview
  5. Match-analysis keyword whitelist covers product/data/business-soft-skill terms in addition to technical terms
  6. Generated cover-letter and suggestion text fixes possessive-apostrophe and acronym-casing bugs and varies templates to reduce genericness
  7. `npx eslint .` passes cleanly (client/dist excluded, prop-types added, unused vars removed)

**Plans**: 0 plans

Plans:

- [ ] TBD (run /gsd-plan-phase 14 to break down; full decisions already captured in `14-CONTEXT.md`)

Tracked issues:

- #2 Clarify job posting vs. application workflow with next-step feedback
- #3 Fix Resume Library "New Resume" creation ("Invalid resume data") and add contract tests
- #4 Broaden match-analysis keyword extraction beyond technical whitelist
- #5 Improve generated writing quality; complete or hide "Generate Tailored Resume (Coming Soon)"
- #6 Reduce risk in resume editor: preview, autosave indicator, and safer remove controls
- #7 Simplify top-level navigation to reflect linear job-search workflow
- #8 Fix lint failures (exclude client/dist, missing prop-types, unused vars) and add API contract test coverage

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 9 -> 10 -> 11 -> 11.5 -> 12 -> 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-06-25 |
| 2. Resume & Job Input | v1.0 | 4/4 | Complete | 2026-06-26 |
| 3. Cover Letter Generation | v1.0 | 2/2 | Complete | 2026-06-26 |
| 4. Application Tracking | v1.0 | 1/1 | Complete | 2026-06-26 |
| 5. Deployment Readiness | v1.1 | 1/1 | Complete | 2026-06-27 |
| 6. Demo Data & Seeding | v1.1 | 1/1 | Complete | 2026-06-27 |
| 7. Production Deployment | v1.1 | 1/1 | Complete | 2026-06-27 |
| 8. Documentation & Release | v1.1 | 1/1 | Complete | 2026-06-27 |
| 9. Resume Library Foundation | v2.0 | 1/1 | Complete | 2026-07-02 |
| 10. Match Scoring and Gap Analysis | v2.0 | 1/1 | Complete | 2026-07-02 |
| 11. Section-by-Section Suggestions | v2.0 | 1/1 | Complete   | 2026-07-02 |
| 11.5 AI Analysis Provider 🔶 INSERTED | v2.0 | 2/2 | Complete | 2026-07-03 |
| 12. Tailored Resume Generation | v2.0 | 3/3 | Complete    | 2026-07-16 |
| 13. Application Pre-fill and Export | v2.0 | 3/3 | Complete    | 2026-07-17 |
| 14. UX & Quality Polish from User Feedback | v2.0 | 0/? | Not started | — |
