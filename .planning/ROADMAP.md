# Roadmap: ApplyTrail

## Overview

A local web MVP that migrates a CLI-based job application workflow into a React + Express web app. The roadmap follows the natural user journey: scaffold the app, enter resume and job details, generate a tailored cover letter, then save and track the application. Each phase delivers a complete, verifiable user capability.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Project scaffolding with React + Express, JSON file storage, and basic app shell (completed 2026-06-25)
- [x] **Phase 2: Resume & Job Input** - User can edit resume content and paste job postings in the browser (completed 2026-06-26)
- [x] **Phase 3: Cover Letter Generation** - User can generate a tailored cover letter paragraph from resume and job posting (completed 2026-06-26)
- [ ] **Phase 4: Application Tracking** - User can save, view, update, and follow up on job applications

## Phase Details

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

**Plans**: TBD

Plans:

- [ ] 04-01: TBD

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 1/1 | Complete   | 2026-06-25 |
| 2. Resume & Job Input | 4/4 | Complete | 2026-06-26 |
| 3. Cover Letter Generation | 2/2 | Complete | 2026-06-26 |
| 4. Application Tracking | 0/1 | Not started | - |
