# External Integrations

**Analysis Date:** 2026-06-26

## APIs & External Services

**MCP Filesystem Server:**
- `@modelcontextprotocol/server-filesystem` — Provides Claude Code with local filesystem access
  - Transport: stdio (local process, not network)
  - Config: `/.mcp.json`
  - Scope: Project root directory (`.`)
  - Used for: Reading `resume.md`, reading/writing `applications.json`

**No other external APIs or services are directly integrated.** The project is a self-contained Claude Code workflow.

## Data Storage

**Local JSON File:**
- `/applications.json` — Primary data store for job applications
  - Format: JSON array of objects
  - Fields: `company`, `role`, `date_applied`, `status`, `cover_letter_paragraph`
  - Read by: Claude Code via MCP filesystem server, `application-tracker` agent
  - Written by: Claude Code during cover letter workflow

**No databases, file storage services, or caching layers.**

## Authentication & Identity

**Auth Provider:** None

- No user authentication system
- No API keys required for core functionality
- `.env` file exists (gitignored) but purpose is undocumented

## Monitoring & Observability

**Error Tracking:** None

**Logs:** None — no logging infrastructure

**GSD Hooks (observability-like):**
- `/.claude/hooks/gsd-context-monitor.js` — Monitors Claude Code context usage
- `/.claude/hooks/gsd-statusline.js` — Status line updates
- `/.claude/hooks/gsd-session-state.sh` — Session state tracking
- These provide workflow observability within Claude Code, not application monitoring

## CI/CD & Deployment

**Hosting:** Not applicable — local workflow only

**CI Pipeline:** None configured for this project

**Version Control:**
- Git repository on `main` branch
- `.gitignore` excludes `.env` and `.DS_Store`

## Claude Code Integrations

**Skills (1 active):**
- `custom-cover-letter` (`/.claude/skills/custom-cover-letter/SKILL.md`)
  - Trigger: User provides a job posting
  - Reads: `resume.md`
  - Produces: Tailored cover letter paragraph
  - Writes to: `applications.json` (appends new entry)

**Agents (1 active for this project):**
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
