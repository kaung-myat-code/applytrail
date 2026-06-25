# Technology Stack

**Analysis Date:** 2026-06-26

## Languages

**Primary:**
- Markdown — All content files: resume, README, skill definitions, agent definitions, Marp slides

**Secondary:**
- JavaScript (Node.js) — GSD hooks (`/.claude/hooks/*.js`), utility scripts (`/.claude/scripts/`)
- JSON — Application data (`/applications.json`), MCP config (`/.mcp.json`), Claude settings (`/.claude/settings.local.json`)
- Shell (Bash) — GSD hooks (`/.claude/hooks/*.sh`), session management

## Runtime

**Environment:**
- Node.js — Required for MCP server (`npx`), GSD hooks, and scripts
- Homebrew Node.js at `/opt/homebrew/bin/node` (referenced in hook configs)

**Package Manager:**
- npm/npx — Used to run MCP server (`npx -y @modelcontextprotocol/server-filesystem`)
- Lockfile: Not present (no `package-lock.json` at project root)

## Frameworks & Tools

**Core Platform:**
- Claude Code — AI coding assistant; primary interface for all workflows
- GSD (Get Stuff Done) — Workflow orchestration framework layered on Claude Code
  - Version tracked in `/.claude/gsd-core/VERSION`
  - Provides agents, skills, hooks, commands, and planning infrastructure

**Presentation:**
- Marp — Markdown-based slide framework
  - Config: YAML frontmatter in `/slides/pitch.md` (`marp: true`, `paginate: true`, `transition: fade`)
  - Used for project pitch/demo slides

**MCP (Model Context Protocol):**
- `@modelcontextprotocol/server-filesystem` — Filesystem access for Claude Code
  - Configured in `/.mcp.json`
  - Grants Claude read/write access to project files

## Key Dependencies

**Critical:**
- `@modelcontextprotocol/server-filesystem` — Enables Claude Code to read `resume.md` and modify `applications.json`
- GSD Core (`/.claude/gsd-core/`) — Full workflow framework with agents, hooks, templates, and commands

**Infrastructure:**
- Git — Version control; repo is on `main` branch
- GitHub (implied) — Referenced in resume and README for CI/CD workflows

## Configuration

**Environment:**
- `.env` file listed in `.gitignore` — present but contents not readable (forbidden)
- No `.env.example` or environment variable documentation found

**Build:**
- No build step required — this is a documentation/workflow project, not a compiled application

**Claude Code Settings:**
- `/.claude/settings.local.json` — Local settings with MCP server enablement, hook registrations, and permission rules
- `/.claude/package.json` — Declares `{"type":"commonjs"}` for hook script module resolution

## Data Formats

**`/applications.json`:**
- Array of job application objects
- Fields: `company`, `role`, `date_applied`, `status`, `cover_letter_paragraph`
- Statuses observed: `drafted`, `applied`
- Extended by agent with: `last_status_change`, `status_updated_at`, `updated_at`, `applied_at`

**`/resume.md`:**
- Structured Markdown resume with sections: Summary, Experience, Projects, Skills, Education
- Used as source material for cover letter generation

## Platform Requirements

**Development:**
- macOS (current environment: Darwin 25.5.0, Apple Silicon via Homebrew)
- Claude Code CLI installed
- Node.js available via Homebrew
- Git installed

**Production:**
- Not applicable — this is a local Claude Code workflow, not a deployed application

---

*Stack analysis: 2026-06-26*
