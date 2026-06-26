# Phase 1: Foundation - Context

**Gathered:** 2026-06-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a working React + Express monorepo with JSON file persistence and a navigable app shell. This phase delivers the project structure, dev tooling, basic routing, and placeholder pages — no business logic yet.

</domain>

<decisions>
## Implementation Decisions

### Project Structure
- **D-01:** Monorepo layout with `client/` and `server/` directories
- **D-02:** Scaffold React app with Vite
- **D-03:** Use `concurrently` for single-command dev startup (runs both Express and Vite dev servers)
- **D-04:** Minimal Express server — no extra middleware beyond what's needed

### JSON Storage
- **D-05:** Keep JSON data files (applications.json, resume.json) in the project root
- **D-06:** Keep existing applications.json field format (company, role, date_applied, status, cover_letter_paragraph)
- **D-07:** Store resume as structured JSON (not Markdown) for easier parsing by cover letter logic
- **D-08:** RESTful API routes to expose JSON data to React (GET/POST/PUT/DELETE on /api/applications, /api/resume)

### App Shell & Navigation
- **D-09:** Top navigation bar (horizontal, not sidebar)
- **D-10:** Landing page is a Dashboard/overview showing quick stats
- **D-11:** Four pages: Dashboard, Resume, New Application, Applications
- **D-12:** CSS Modules for component-scoped styling

### Language & Tooling
- **D-13:** JavaScript (not TypeScript) — matches existing project code
- **D-14:** ESLint + Prettier for linting and formatting
- **D-15:** React Router for SPA page routing
- **D-16:** Vitest for test framework (set up in foundation, use in later phases)

### Claude's Discretion
No areas deferred to Claude — all decisions were made by the user.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project definition, core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements with traceability (RESUME-02 is Phase 1)
- `.planning/ROADMAP.md` — Phase definitions, success criteria, execution order

### Existing Data
- `applications.json` — Existing application data format to preserve
- `resume.md` — Existing resume format (will be migrated to JSON in this phase)

### Codebase Maps
- `.planning/codebase/ARCHITECTURE.md` — Current system architecture (CLI-based, no runtime code yet)
- `.planning/codebase/STACK.md` — Current tech stack analysis

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `applications.json` — Existing data with fields: company, role, date_applied, status, cover_letter_paragraph. Preserve this schema.
- `resume.md` — Structured Markdown resume with sections: Summary, Experience, Projects, Skills, Education. Migrate content to JSON.
- `.claude/skills/custom-cover-letter/SKILL.md` — Cover letter generation logic. The keyword-matching algorithm defined here will be reimplemented in Express in Phase 3.

### Established Patterns
- Flat JSON array for data storage — no nesting, no schema version field
- ISO 8601 dates (YYYY-MM-DD)
- Lowercase snake_case keys in JSON

### Integration Points
- `applications.json` — Express server reads/writes this file; React fetches via API
- `resume.json` (new) — Express server reads/writes; React fetches via API
- React app entry point — connects to Express API via fetch/axios

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User selected all recommended options.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-06-25*
