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

- Markdown — All content files: resume, README, skill definitions, agent definitions, Marp slides
- JavaScript (Node.js) — GSD hooks (`/.claude/hooks/*.js`), utility scripts (`/.claude/scripts/`)
- JSON — Application data (`/applications.json`), MCP config (`/.mcp.json`), Claude settings (`/.claude/settings.local.json`)
- Shell (Bash) — GSD hooks (`/.claude/hooks/*.sh`), session management

## Runtime

- Node.js — Required for MCP server (`npx`), GSD hooks, and scripts
- Homebrew Node.js at `/opt/homebrew/bin/node` (referenced in hook configs)
- npm/npx — Used to run MCP server (`npx -y @modelcontextprotocol/server-filesystem`)
- Lockfile: Not present (no `package-lock.json` at project root)

## Frameworks & Tools

- Claude Code — AI coding assistant; primary interface for all workflows
- GSD (Get Stuff Done) — Workflow orchestration framework layered on Claude Code
- Marp — Markdown-based slide framework
- `@modelcontextprotocol/server-filesystem` — Filesystem access for Claude Code

## Key Dependencies

- `@modelcontextprotocol/server-filesystem` — Enables Claude Code to read `resume.md` and modify `applications.json`
- GSD Core (`/.claude/gsd-core/`) — Full workflow framework with agents, hooks, templates, and commands
- Git — Version control; repo is on `main` branch
- GitHub (implied) — Referenced in resume and README for CI/CD workflows

## Configuration

- `.env` file listed in `.gitignore` — present but contents not readable (forbidden)
- No `.env.example` or environment variable documentation found
- No build step required — this is a documentation/workflow project, not a compiled application
- `/.claude/settings.local.json` — Local settings with MCP server enablement, hook registrations, and permission rules
- `/.claude/package.json` — Declares `{"type":"commonjs"}` for hook script module resolution

## Data Formats

- Array of job application objects
- Fields: `company`, `role`, `date_applied`, `status`, `cover_letter_paragraph`
- Statuses observed: `drafted`, `applied`
- Extended by agent with: `last_status_change`, `status_updated_at`, `updated_at`, `applied_at`
- Structured Markdown resume with sections: Summary, Experience, Projects, Skills, Education
- Used as source material for cover letter generation

## Platform Requirements

- macOS (current environment: Darwin 25.5.0, Apple Silicon via Homebrew)
- Claude Code CLI installed
- Node.js available via Homebrew
- Git installed
- Not applicable — this is a local Claude Code workflow, not a deployed application

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

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Filesystem MCP | Provide Claude read/write access to project files | `.mcp.json` |
| Cover Letter Skill | Match resume to job posting, generate tailored paragraph | `.claude/skills/custom-cover-letter/SKILL.md` |
| Application Tracker Agent | Scan applications.json, flag stale entries needing follow-up | `.claude/agents/application-tracker.md` |
| applications.json | Persist all job application records | `applications.json` |
| resume.md | Store user resume content as skill input | `resume.md` |

## Pattern Overview

- Skill and Agent are Markdown-based instruction sets, not executable code
- MCP server is the only runtime component (stdio-based filesystem access)
- Data is a flat JSON array with no schema enforcement
- No server, no database, no framework — purely Claude Code orchestration

## Layers

- Purpose: Bridge Claude Code to local filesystem
- Location: `.mcp.json`
- Contains: MCP server configuration (stdio transport)
- Depends on: `@modelcontextprotocol/server-filesystem` npm package
- Used by: Both skill and agent (implicit via Claude Code)
- Purpose: Generate tailored cover letter paragraphs
- Location: `.claude/skills/custom-cover-letter/SKILL.md`
- Contains: Tone rules, structure rules, keyword mapping, resume-to-requirement mapping
- Depends on: `resume.md` (read via MCP), job posting (user input)
- Used by: Claude Code when user invokes the skill
- Purpose: Audit applications for follow-up needs
- Location: `.claude/agents/application-tracker.md`
- Contains: Follow-up rules, date priority logic, output format template
- Depends on: `applications.json` (read via MCP)
- Used by: Claude Code when user invokes the agent
- Purpose: Persist application data and resume content
- Location: Project root (`applications.json`, `resume.md`)
- Contains: JSON application records, Markdown resume
- Depends on: Nothing (static files)
- Used by: Skill (reads resume), Agent (reads applications), Skill output (writes applications)

## Data Flow

### Cover Letter Generation

### Follow-up Tracking

- All state lives in `applications.json` — a flat JSON array
- No in-memory state, no caching, no session persistence
- Each Claude Code conversation is stateless; files are the source of truth

## Key Abstractions

- Purpose: Declarative prompt that teaches Claude how to write cover letters
- Examples: `.claude/skills/custom-cover-letter/SKILL.md`
- Pattern: Markdown with frontmatter (name, description) + structured instructions
- Purpose: Declarative prompt that teaches Claude how to audit applications
- Examples: `.claude/agents/application-tracker.md`
- Pattern: Markdown with frontmatter (name, description, tools, model, color) + task rules

## Entry Points

- Location: User pastes job posting in Claude Code CLI
- Triggers: `/custom-cover-letter` skill invocation or natural language request
- Responsibilities: Read resume, match skills, generate paragraph, log application
- Location: User invokes `application-tracker` agent in Claude Code
- Triggers: Explicit agent invocation
- Responsibilities: Read applications, evaluate staleness, produce report

## Architectural Constraints

- **No runtime code:** The project contains zero executable source files. All logic is encoded in Markdown prompts interpreted by Claude Code.
- **Filesystem-only storage:** No database. `applications.json` is a flat file with no schema validation.
- **MCP dependency:** Filesystem MCP must be running for Claude to read/write files. Configured in `.mcp.json`.
- **No schema enforcement:** `applications.json` entries have inconsistent fields (e.g., some have `date_applied`, the agent expects `last_status_change`).

## Anti-Patterns

### Inconsistent Date Fields

### No Schema Validation

## Error Handling

- Agent flags entries with missing dates as "missing/unclear data" rather than crashing
- Skill instructs Claude to "never invent skills, tools, industries, or achievements"
- Agent rule: "Do not modify applications.json" (read-only audit)

## Cross-Cutting Concerns

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
