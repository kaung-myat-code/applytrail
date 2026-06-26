# Technology Stack

**Analysis Date:** 2026-06-26

## Languages

**Primary:**
- JavaScript (JSX) — React components and Express API (`client/src/**/*.jsx`, `server/index.js`)
- CSS — Component styles via CSS Modules (`client/src/**/*.module.css`)

**Secondary:**
- JSON — Application data (`server/data/*.json`), configuration files
- Markdown — Documentation, planning files, legacy skills/agents

## Runtime

**Environment:**
- Node.js 18+ — Required for Express server and Vite
- npm — Package management and script runner

**Package Manager:**
- npm — Used for dependency management and script execution
- Lockfile: `package-lock.json` at project root

## Frameworks & Tools

**Frontend:**
- React 18 — Frontend UI library
  - Config: `client/package.json`
  - Entry point: `client/src/main.jsx`
- React Router 6 — Client-side routing
  - Routes: `/`, `/resume`, `/applications/new`, `/applications`
- Vite — Frontend build tool and dev server
  - Config: `client/vite.config.js`
  - Dev server: `http://localhost:5173`
  - API proxy to Express on port 3000

**Backend:**
- Express 4 — Backend API framework
  - Config: `server/package.json`
  - Entry point: `server/index.js`
  - API server: `http://localhost:3000`
- cors — Cross-origin resource sharing middleware

**Styling:**
- CSS Modules — Component-scoped styling
  - Files: `client/src/**/*.module.css`
  - Global styles: `client/src/index.css`

**Development Tools:**
- concurrently — Run client and server in parallel
  - Config: Root `package.json` `dev` script

**Legacy Tools (still present):**
- Claude Code — AI coding assistant; primary interface for all workflows
- GSD (Get Stuff Done) — Workflow orchestration framework layered on Claude Code
  - Version tracked in `/.claude/gsd-core/VERSION`
  - Provides agents, skills, hooks, commands, and planning infrastructure
- Marp — Markdown-based slide framework
  - Config: YAML frontmatter in `/slides/pitch.md`
- `@modelcontextprotocol/server-filesystem` — Filesystem access for Claude Code
  - Configured in `/.mcp.json`

## Key Dependencies

**Frontend (client/package.json):**
- `react`, `react-dom` — UI library
- `react-router-dom` — Client-side routing

**Backend (server/package.json):**
- `express` — API framework
- `cors` — CORS middleware

**Root (package.json):**
- `concurrently` — Run multiple npm scripts in parallel

**Legacy:**
- `@modelcontextprotocol/server-filesystem` — Enables Claude Code to read/write project files
- GSD Core (`/.claude/gsd-core/`) — Full workflow framework with agents, hooks, templates, and commands

## Configuration

**Environment:**
- `.env` file listed in `.gitignore` — present but contents not readable (forbidden)
- No `.env.example` or environment variable documentation found

**Build:**
- Vite builds frontend to `client/dist/`
- Express serves from `server/` directly (no build step)

**Claude Code Settings:**
- `/.claude/settings.local.json` — Local settings with MCP server enablement, hook registrations, and permission rules
- `/.claude/package.json` — Declares `{"type":"commonjs"}` for hook script module resolution

## Data Formats

**`server/data/resume.json`:**
- Object with contact fields (name, email, github, location) and summary
- Arrays: experience, projects, education (each with title, organization, bullets)
- Array: skills (strings)

**`server/data/job_postings.json`:**
- Array of job posting objects
- Fields: `id`, `company`, `role`, `job_posting`, `created_at`

**`server/data/applications.json`:**
- Array of job application objects
- Fields: `company`, `role`, `date_applied`, `status`, `cover_letter_paragraph`
- Statuses observed: `drafted`, `applied`
- Extended by agent with: `last_status_change`, `status_updated_at`, `updated_at`, `applied_at`

## Platform Requirements

**Development:**
- macOS (current environment: Darwin 25.5.0, Apple Silicon via Homebrew)
- Node.js 18+ (for Express and Vite)
- npm (for package management)
- Git installed
- Browser (Chrome, Firefox, Safari)

**Production:**
- Not applicable — this is a local development tool, not a deployed application

---

*Stack analysis: 2026-06-26*
