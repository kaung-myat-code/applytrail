<!-- GSD:project-start source:PROJECT.md -->

## Project

**ApplyTrail**

A local web MVP that migrates an existing Claude Code job application workflow into a React + Express web app. Users can manage their resume, paste job postings, generate tailored cover letter paragraphs using keyword-matching heuristics, save applications, and track which ones need follow-up.

**Core Value:** End-to-end job application workflow in a local web UI — from resume to cover letter to application tracking — so the user can manage their job search without touching the CLI.

### Constraints

- **No auth**: Single-user local tool
- **No external APIs**: No job scraping, no AI API calls, no email
- **JSON file storage**: Keep data human-readable and easy to inspect/edit
- **Commit after each working milestone**: Incremental progress, not big-bang
- **Simple heuristics**: Cover letter logic must be replaceable — designed to swap in a real LLM service later

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Languages

- JavaScript (JSX) — React components and Express API (`client/src/**/*.jsx`, `server/index.js`)
- CSS — Component styles via CSS Modules (`client/src/**/*.module.css`)
- JSON — Application data (`server/data/*.json`), configuration files
- Markdown — Documentation, planning files, legacy skills/agents

## Runtime

- Node.js — Required for Express server and Vite
- npm — Package management and script runner
- Vite — Frontend dev server and build tool
- Express 4 — Backend API server

## Frameworks & Tools

- React 18 — Frontend UI library
- React Router 6 — Client-side routing
- Vite — Frontend build tool and dev server
- Express 4 — Backend API framework
- CSS Modules — Component-scoped styling
- concurrently — Run client and server in parallel
- Claude Code — AI coding assistant; primary interface for all workflows
- GSD (Get Stuff Done) — Workflow orchestration framework layered on Claude Code

## Key Dependencies

- `react`, `react-dom` — Frontend UI library
- `react-router-dom` — Client-side routing
- `express` — Backend API framework
- `cors` — Cross-origin resource sharing for API
- `concurrently` — Run multiple npm scripts in parallel
- GSD Core (`/.claude/gsd-core/`) — Full workflow framework with agents, hooks, templates, and commands
- Git — Version control; repo is on `main` branch

## Configuration

- `.env` file listed in `.gitignore` — present but contents not readable (forbidden)
- `client/vite.config.js` — Vite config with API proxy to Express
- `/.claude/settings.local.json` — Local settings with MCP server enablement, hook registrations, and permission rules
- `/.claude/package.json` — Declares `{"type":"commonjs"}` for hook script module resolution

## Data Formats

**resume.json:**
- Object with contact fields (name, email, github, location) and summary
- Arrays: experience, projects, education (each with title, organization, bullets)
- Array: skills (strings)

**job_postings.json:**
- Array of job posting objects
- Fields: `id`, `company`, `role`, `job_posting`, `created_at`

**applications.json:**
- Array of job application objects
- Fields: `company`, `role`, `date_applied`, `status`, `cover_letter_paragraph`
- Statuses observed: `drafted`, `applied`
- Extended by agent with: `last_status_change`, `status_updated_at`, `updated_at`, `applied_at`

## Platform Requirements

- macOS (current environment: Darwin 25.5.0, Apple Silicon via Homebrew)
- Node.js 18+ (for Express and Vite)
- npm (for package management)
- Git installed
- Browser (Chrome, Firefox, Safari)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Project Type

## File Formats

- `applications.json` — Flat JSON array of application objects. Use lowercase snake_case keys (`date_applied`, `cover_letter_paragraph`, `status`). No nested objects. No schema version field.
- `resume.md` — Structured markdown with H2 sections (`## Summary`, `## Experience`, `## Skills`, `## Education`). Bullet points use `-` prefix with 4-space indent.
- `.mcp.json` — MCP server definitions. Standard JSON format.
- `.gitignore` — Minimal. Currently only excludes `.env`.
- `README.md` — Project overview with ASCII flow diagrams, `## Section` headers, and fenced code blocks (`text` language).
- `slides/pitch.md` — Marp-format presentation. Uses YAML frontmatter (`marp: true`, `paginate: true`, `transition: fade`, `auto-advance`).

## Markdown Style

- Use `# Title` for document title (one per file)
- Use `## Section` for major sections
- Use `### Subsection` for output categories (in agent files)
- No trailing punctuation on headers
- Use `*` for unordered lists (not `-`)
- Indent nested items with 4 spaces
- No blank lines between list items
- Use ` ```text ``` ` for non-language-specific content (file trees, flow diagrams)
- Use ` ```language ``` ` for syntax-highlighted code
- Skills and agents use YAML frontmatter delimited by `---`
- Fields: `name`, `description`, `tools`, `model`, `color`
- Some files use `---` as section separators (not frontmatter) — see `application-tracker.md` line 15

## Agent Conventions

## Skill Conventions

## JSON Data Conventions

- Dates use ISO 8601 format (`YYYY-MM-DD`)
- Status values are lowercase single words
- `cover_letter_paragraph` is a single paragraph, 4-6 sentences

## GSD Framework Conventions

- Follow GSD framework naming: `gsd-<role>.md`
- All use `model: inherit`
- All grant `tools: Read, Grep, Glob` (or subset)
- JavaScript: `.js` extension
- Shell scripts: `.sh` extension
- CommonJS modules: `.cjs` extension
- Naming: `gsd-<purpose>.<ext>`
- Naming: `gsd-<command>.md`
- All lowercase kebab-case

## Where to Add New Content

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

**Development Mode:**

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│              React SPA on localhost:5173                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (Vite proxy)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                          │
│                  localhost:3000                               │
│  GET/PUT /api/resume    — resume.json CRUD                   │
│  GET/POST /api/job-postings — job_postings.json CRUD         │
│  GET/POST /api/applications — applications.json CRUD         │
│  GET /api/health        — health check                       │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│    JSON File Storage     │    │    React Frontend (Vite)      │
│    server/data/          │    │    client/src/                │
└─────────────────────────┘    └──────────────────────────────┘
```

**Production Mode (Render):**

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│            https://applytrail.onrender.com                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Express (serves built React + API)               │
│                  Port from $PORT                             │
│  Static: client/dist/ (built React)                          │
│  GET/PUT /api/resume    — resume.json CRUD                   │
│  GET/POST /api/job-postings — job_postings.json CRUD         │
│  GET/POST /api/applications — applications.json CRUD         │
│  GET /api/health        — health check                       │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│    JSON File Storage     │    │    Built React (client/dist/) │
│    server/data/          │    │    Served by Express static   │
└─────────────────────────┘    └──────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Express API Server | REST API for resume, job postings, applications | `server/index.js` |
| React Frontend | SPA with form-based UI for all user interactions | `client/src/` |
| Vite Dev Server | Dev server with API proxy to Express | `client/vite.config.js` |
| Resume Page | Edit all resume sections | `client/src/pages/Resume.jsx` |
| NewApplication Page | Paste job posting with company and role | `client/src/pages/NewApplication.jsx` |
| SectionEditor | Reusable component for list-based resume sections | `client/src/components/SectionEditor.jsx` |
| resume.json | Persist resume data | `server/data/resume.json` |
| job_postings.json | Persist job posting entries | `server/data/job_postings.json` |
| applications.json | Persist application records | `server/data/applications.json` |

## Pattern Overview

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

### Cover Letter Generation

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

**Legacy Skill (custom-cover-letter):**
- Purpose: Declarative prompt that teaches Claude how to write cover letters
- Examples: `.claude/skills/custom-cover-letter/SKILL.md`
- Pattern: Markdown with frontmatter (name, description) + structured instructions

**Legacy Agent (application-tracker):**
- Purpose: Declarative prompt that teaches Claude how to audit applications
- Examples: `.claude/agents/application-tracker.md`
- Pattern: Markdown with frontmatter (name, description, tools, model, color) + task rules

## Entry Points

**Production:**
- Location: `https://applytrail.onrender.com`
- Express serves both built React files and API from a single origin
- Auto-deploys from GitHub main branch via Render

**Development (Web App):**
- Location: `http://localhost:5173` (Vite dev server)
- Triggers: Browser navigation
- Routes: `/` (Dashboard), `/resume` (Resume Editor), `/applications/new` (Job Posting), `/applications` (Application List)

**Development (API Server):**
- Location: `http://localhost:3000`
- Routes: `/api/resume`, `/api/job-postings`, `/api/applications`, `/api/health`

**Legacy CLI (still available):**
- Location: User pastes job posting in Claude Code CLI
- Triggers: `/custom-cover-letter` skill invocation or natural language request
- Responsibilities: Read resume, match skills, generate paragraph, log application

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

- API routes return 500 with error message on file read/write failure
- Frontend uses alert() for save confirmation (to be improved)
- No input validation on API routes
- Legacy: Agent flags entries with missing dates as "missing/unclear data" rather than crashing

## Cross-Cutting Concerns

**Logging:** Console.log in Express routes
**Validation:** None — no schema validation on JSON files
**Authentication:** None — local filesystem only, no auth needed
**Styling:** CSS Modules for component scoping, shared CSS variables in index.css

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| custom-cover-letter | Drafts a tailored cover letter paragraph by matching resume experience to a job posting. | `.claude/skills/custom-cover-letter/SKILL.md` |
| frontend-design | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics. | `.claude/skills/frontend-design/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
