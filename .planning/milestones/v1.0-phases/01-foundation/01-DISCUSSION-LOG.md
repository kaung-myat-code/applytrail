# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-25
**Phase:** 1-Foundation
**Areas discussed:** Project structure, JSON storage layout, App shell & navigation, Language & tooling

---

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Monorepo (client/ + server/) | Single repo with client/ and server/ directories. Shared root package.json runs both. Simple, familiar structure. | ✓ |
| Root React + server/ subdirectory | React app in root, Express server in a server/ subdirectory. Express serves the built React app in production. | |
| Single directory | Keep it flat — one directory with both frontend and backend code. Fewer folders for a small MVP. | |

**User's choice:** Monorepo (client/ + server/)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Vite | Fast dev server, instant HMR, modern defaults. Industry standard for new React projects in 2026. | ✓ |
| Create React App | Official React scaffolding (deprecated but still works). Heavier, slower dev server. | |

**User's choice:** Vite
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| concurrently | One `npm run dev` starts both Express and React dev server using concurrently. Simple, familiar. | ✓ |
| Vite proxy to Express | React dev server proxies API requests to Express. Needs proxy config in vite.config. | |
| Two terminals (manual) | Run client and server in separate terminals manually. No extra dependency. | |

**User's choice:** concurrently
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal Express | Plain Express with no extra middleware. Minimal, easy to understand. Good for MVP. | ✓ |
| Express + common middleware | Add body-parser, cors, morgan for logging. More features out of the box. | |
| Fastify/Hono instead | Use a lightweight alternative like Fastify or Hono. Faster, but less ecosystem. | |

**User's choice:** Minimal Express
**Notes:** None

---

## JSON Storage Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Project root (keep existing) | Keep applications.json in the project root where it already lives. Express reads/writes it directly. Simple, matches existing data. | ✓ |
| server/data/ directory | Move JSON files to a server/data/ directory. Cleaner separation from source code. | |
| .data/ hidden directory | Store in a .data/ hidden directory. Keeps data out of sight but still accessible. | |

**User's choice:** Project root (keep existing)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing format | Keep the existing applications.json fields (company, role, date_applied, status, cover_letter_paragraph). Add missing fields later as needed. | ✓ |
| Define full schema upfront | Define a clean schema now with all fields we'll need (including last_status_change, job_posting_text, etc.). | |
| JSON Schema validation file | Create a minimal JSON schema file for validation. Enforces structure but adds complexity. | |

**User's choice:** Keep existing format
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| JSON (structured) | Store resume as JSON (structured fields). Easier for the cover letter algorithm to parse. | ✓ |
| Keep as Markdown | Keep resume as Markdown like it is now. Parse it on the server when needed. | |
| Markdown edit / JSON parse | Support both — user edits Markdown, server parses to JSON internally for cover letter logic. | |

**User's choice:** JSON (structured)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| RESTful routes | GET/POST/PUT/DELETE on /api/applications, /api/resume. Standard, well-understood. | ✓ |
| Minimal endpoints | Just a few endpoints like /api/data that return everything. Simpler but less organized. | |
| Direct file I/O (no API layer) | Server reads/writes JSON directly via fs module. No real API — just file I/O helpers. | |

**User's choice:** RESTful routes
**Notes:** None

---

## App Shell & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar navigation | Persistent left sidebar with page links. Good for desktop-first apps with 3-5 sections. | |
| Top navigation bar | Horizontal bar at the top. Simple, familiar, works well with fewer pages. | ✓ |
| Page-level links (no persistent nav) | No persistent nav — just links or buttons on each page. Minimal but less polished. | |

**User's choice:** Top navigation bar
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Applications list | Show the applications list immediately. Users see their job search status right away. | |
| Dashboard / overview | A dashboard with quick stats — total applications, stale ones, recent activity. | ✓ |
| Resume editor | Show the resume editor first. Users start by setting up their resume. | |

**User's choice:** Dashboard / overview
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| 4 pages (Dashboard, Resume, Apps, Cover Letter) | Dashboard, Resume, Applications, Generate Cover Letter. Each maps to a user action. | |
| 3 pages (Dashboard, Resume, Applications) | Dashboard, Resume, Applications. Cover letter generation is part of the application flow. | |
| Placeholder pages only | Just placeholder pages with titles for now. Content comes in Phase 2+. | |

**User's choice:** Dashboard, Resume, New Application, Applications (user specified "New Application" instead of "Cover Letter")
**Notes:** User chose 4 pages with "New Application" as the fourth page, not "Generate Cover Letter"

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind CSS | Utility-first CSS framework. Fast to build with, consistent design system. Popular in 2026. | |
| CSS Modules | Scoped CSS per component. No extra dependency, works with Vite out of the box. | ✓ |
| Plain CSS | Regular .css files imported into components. Simple, no tooling needed. | |

**User's choice:** CSS Modules
**Notes:** None

---

## Language & Tooling

| Option | Description | Selected |
|--------|-------------|----------|
| TypeScript | Type safety, better IDE support, catches bugs early. Standard for React projects in 2026. | |
| JavaScript | No type annotations, faster to write initially. Matches existing project code. | ✓ |

**User's choice:** JavaScript
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| ESLint + Prettier | Standard JS linting + formatting. Widely used, good defaults. | ✓ |
| ESLint only | Linting only, no auto-formatting. Less tooling. | |
| None (add later) | No linting or formatting setup for now. Add later if needed. | |

**User's choice:** ESLint + Prettier
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| React Router | Standard React router. Well-documented, widely used. | ✓ |
| File-based routing | File-based routing. Simpler config, but less control. | |
| Simple state-based navigation | No router yet — just conditional rendering based on state. | |

**User's choice:** React Router
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest | Set up Vitest for unit tests. Fast, works with Vite, good DX. | ✓ |
| None (add in Phase 3+) | No testing setup in Phase 1. Add when there's logic to test. | |
| Jest | Use Jest. Heavier, but more established. | |

**User's choice:** Vitest
**Notes:** None

---

## Claude's Discretion

None — all decisions were made by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
