# External Integrations

**Analysis Date:** 2026-06-26

## APIs & External Services

**Express API Server:**
- REST API for resume, job postings, and applications
  - Transport: HTTP (localhost:3000)
  - Routes: `GET/PUT /api/resume`, `GET/POST /api/job-postings`, `GET /api/applications`
  - Used by: React frontend via fetch

**Vite Dev Server:**
- Frontend development server with API proxy
  - Transport: HTTP (localhost:5173)
  - Proxy: `/api/*` requests forwarded to Express on port 3000
  - Used by: Browser

**No other external APIs or services are directly integrated.** The project is a self-contained local web app.

## Data Storage

**Local JSON Files:**
- `server/data/resume.json` — Resume data (contact, summary, experience, projects, skills, education)
- `server/data/job_postings.json` — Job posting entries (company, role, job posting text)
- `server/data/applications.json` — Job application records (company, role, date, status, cover letter)
  - Format: JSON array of objects
  - Read by: Express API routes
  - Written by: Express API routes

**No databases, file storage services, or caching layers.**

## Authentication & Identity

**Auth Provider:** None

- No user authentication system
- No API keys required for core functionality
- `.env` file exists (gitignored) but purpose is undocumented

## Monitoring & Observability

**Error Tracking:** None

**Logs:** Console.log in Express routes

**GSD Hooks (observability-like):**
- `/.claude/hooks/gsd-context-monitor.js` — Monitors Claude Code context usage
- `/.claude/hooks/gsd-statusline.js` — Status line updates
- `/.claude/hooks/gsd-session-state.sh` — Session state tracking
- These provide workflow observability within Claude Code, not application monitoring

## CI/CD & Deployment

**Hosting:** Not applicable — local development tool only

**CI Pipeline:** None configured for this project

**Version Control:**
- Git repository on `main` branch
- `.gitignore` excludes `node_modules`, `.env`, `client/dist`, `.DS_Store`

## Claude Code Integrations

**Legacy Skills (1 active):**
- `custom-cover-letter` (`/.claude/skills/custom-cover-letter/SKILL.md`)
  - Trigger: User provides a job posting
  - Reads: `resume.md`
  - Produces: Tailored cover letter paragraph
  - Writes to: `applications.json` (appends new entry)

**Legacy Agents (1 active for this project):**
- `application-tracker` (`/.claude/agents/application-tracker.md`)
  - Tools: Read, Grep, Glob
  - Reads: `applications.json`
  - Produces: Follow-up report (does not modify data)
  - Rule: Flag applications with no status change for 10+ days

**GSD Agents (30+ installed):**
- Full GSD workflow framework agents in `/.claude/agents/gsd-*.md`
- These are part of the GSD framework, not project-specific functionality

## GSD Hooks

**PreToolUse (guards):**
- `gsd-prompt-guard.js` — Validates prompts before Write/Edit
- `gsd-read-guard.js` — Validates reads before Write/Edit
- `gsd-workflow-guard.js` — Workflow validation for Bash/Edit/Write
- `gsd-worktree-path-guard.js` — Path validation for Write/Edit
- `gsd-validate-commit.sh` — Commit message validation for Bash

**PostToolUse (monitors):**
- `gsd-context-monitor.js` — Context window usage tracking
- `gsd-read-injection-scanner.js` — Injection detection on Read
- `gsd-graphify-update.sh` — Dependency graph updates
- `gsd-phase-boundary.sh` — Phase boundary detection

**Session hooks:**
- `gsd-check-update.js` — GSD version update checks
- `gsd-session-state.sh` — Session state initialization

## Presentation

**Marp:**
- `/slides/pitch.md` — Marp presentation for project demo
- No external hosting; rendered locally or via Marp CLI

## Environment Configuration

**Required env vars:** None documented

**Secrets:** `.env` file present but gitignored; contents unknown

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None

---

*Integration audit: 2026-06-26*
