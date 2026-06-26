<!-- refreshed: 2026-06-26 -->
# Architecture

**Analysis Date:** 2026-06-26

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│              React SPA on localhost:5173                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (proxied)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                          │
│                  localhost:3000                               │
│  GET/PUT /api/resume    — resume.json CRUD                   │
│  GET/POST /api/job-postings — job_postings.json CRUD         │
│  GET /api/applications  — applications.json (read-only)      │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│    JSON File Storage     │    │    React Frontend (Vite)      │
│    server/data/          │    │    client/src/                │
│    - resume.json         │    │    - pages/ (Resume, etc.)   │
│    - job_postings.json   │    │    - components/              │
│    - applications.json   │    │    - App.jsx (Router)         │
└─────────────────────────┘    └──────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Express API Server | REST API for resume, job postings, applications | `server/index.js` |
| React Frontend | SPA with form-based UI for all user interactions | `client/src/` |
| Vite Dev Server | Dev server with API proxy to Express | `client/vite.config.js` |
| Resume Page | Edit all resume sections (name, contact, summary, experience, projects, skills, education) | `client/src/pages/Resume.jsx` |
| NewApplication Page | Paste job posting with company and role | `client/src/pages/NewApplication.jsx` |
| SectionEditor | Reusable component for list-based resume sections | `client/src/components/SectionEditor.jsx` |
| resume.json | Persist resume data | `server/data/resume.json` |
| job_postings.json | Persist job posting entries | `server/data/job_postings.json` |
| applications.json | Persist application records | `server/data/applications.json` |

## Pattern Overview

**Overall:** React + Express monorepo with JSON file persistence. The app follows a standard client-server architecture with a Vite dev server proxying API requests to Express.

**Key Characteristics:**
- React SPA with React Router for navigation
- Express REST API with JSON file read/write
- CSS Modules for component-scoped styling
- Vite proxy eliminates CORS in development
- No database — flat JSON files on disk
- No authentication — single-user local tool

## Layers

**Frontend Layer (client/):**
- Purpose: User interface for resume editing, job posting input, cover letter generation, and application tracking
- Location: `client/src/`
- Contains: React components, pages, CSS modules
- Depends on: Express API (via fetch)
- Key files: `App.jsx` (layout + router), `pages/Resume.jsx`, `pages/NewApplication.jsx`

**API Layer (server/):**
- Purpose: REST API bridging frontend to JSON file storage
- Location: `server/index.js`
- Contains: Express routes for resume, job postings, applications
- Depends on: JSON files in `server/data/`
- Key routes: `GET/PUT /api/resume`, `GET/POST /api/job-postings`, `GET /api/applications`

**Data Layer (server/data/):**
- Purpose: Persist all application data as human-readable JSON
- Location: `server/data/`
- Contains: `resume.json`, `job_postings.json`, `applications.json`
- Depends on: Nothing (static files)
- Used by: Express API routes

**Legacy Layer (.claude/):**
- Purpose: Claude Code skills and agents for CLI-based workflow (pre-web-app)
- Location: `.claude/skills/`, `.claude/agents/`
- Contains: Cover letter skill, application tracker agent
- Status: Still present but superseded by web app for primary workflow

## Data Flow

### Resume Editing

1. User navigates to Resume page
2. React fetches `GET /api/resume` on mount
3. User edits fields (controlled inputs)
4. On save, React sends `PUT /api/resume` with updated JSON
5. Express writes to `server/data/resume.json`

### Job Posting Input

1. User navigates to New Application page
2. User fills in company, role, and job posting text
3. On submit, React sends `POST /api/job-postings`
4. Express appends to `server/data/job_postings.json`

### Cover Letter Generation (Phase 3 — planned)

1. User selects a resume and job posting pair
2. Client sends request to API
3. Server matches resume skills/experience to job posting keywords
4. Server returns tailored cover letter paragraph

**State Management:**
- All state lives in JSON files on disk
- No in-memory state, no caching, no session persistence
- Frontend uses React useState for form state
- Files are the source of truth

## Key Abstractions

**Page Component:**
- Purpose: Top-level route component with data fetching and form logic
- Examples: `Resume.jsx`, `NewApplication.jsx`
- Pattern: fetch-on-mount + controlled inputs + save handler

**Section Editor:**
- Purpose: Reusable wrapper for list-based resume sections (experience, projects, education)
- Examples: `SectionEditor.jsx`
- Pattern: Add/remove entries, add/remove bullets, controlled list

## Entry Points

**Web App:**
- Location: `http://localhost:5173` (Vite dev server)
- Triggers: Browser navigation
- Routes: `/` (Dashboard), `/resume` (Resume Editor), `/applications/new` (Job Posting), `/applications` (Application List)

**API Server:**
- Location: `http://localhost:3000`
- Routes: `/api/resume`, `/api/job-postings`, `/api/applications`

## Architectural Constraints

- **JSON file storage:** No database. Data persists as flat JSON files with no schema validation.
- **No authentication:** Single-user local tool. No login, no sessions.
- **Monorepo structure:** Client and server in separate directories with separate package.json files.
- **Vite proxy:** API requests from frontend are proxied through Vite to avoid CORS in development.
- **No input validation:** API routes accept any JSON without schema validation.

## Anti-Patterns

### Inconsistent Date Fields

**What happens:** `applications.json` uses `date_applied` but the agent expects `last_status_change`, `status_updated_at`, `updated_at`, or `applied_at`
**Why it's wrong:** The agent cannot reliably determine staleness without a consistent date field
**Do this instead:** Standardize on `date_applied` and `last_status_change` fields, update the agent to match

### No Schema Validation

**What happens:** Any field can be added or omitted in JSON data files
**Why it's wrong:** Frontend may break if expected fields are missing
**Do this instead:** Define a minimal JSON schema or at least document required fields

## Error Handling

**Strategy:** Minimal — try/catch around file operations, console errors for debugging.

**Patterns:**
- API routes return 500 with error message on file read/write failure
- Frontend uses alert() for save confirmation (to be improved)
- No input validation on API routes

## Cross-Cutting Concerns

**Logging:** Console.log in Express routes
**Validation:** None — no schema validation on JSON files
**Authentication:** None — local filesystem only, no auth needed
**Styling:** CSS Modules for component scoping, shared CSS variables in index.css

---

*Architecture analysis: 2026-06-26*
