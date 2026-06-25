# Walking Skeleton — ApplyTrail

**Phase:** 1
**Generated:** 2026-06-26

## Capability Proven End-to-End

A user can start the app with `npm run dev`, navigate between four pages via a top nav bar, and verify that the Express API serves persisted JSON data for applications and resume content.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19 + Vite (library mode, not framework) | Fast dev server, HMR, CSS Modules out of the box. No SSR needed for a local tool. |
| Routing | React Router v7 with createBrowserRouter | Library mode — we need client-side routing only, not the framework/SSR features. |
| Data layer | JSON files on disk (applications.json, resume.json) | Human-readable, easy to inspect/edit, no database setup. Single-user local tool. |
| API server | Express with express.json() middleware | Minimal, well-understood, no extra middleware needed for a local tool. |
| Directory layout | Monorepo: client/ + server/ at root | Simple 2-package setup. Root package.json with concurrently for single-command dev. |
| Styling | CSS Modules (.module.css) | Component-scoped styles, zero config with Vite, no external CSS framework dependency. |
| Linting | ESLint 9 flat config + Prettier | Modern config format, auto-format on save, catches React hooks issues. |
| Testing | Vitest + @testing-library/react | Shares Vite config, fast, jsdom environment for component tests. |

## Stack Touched in Phase 1

- [x] Project scaffold (React + Vite, Express, concurrently, ESLint, Prettier, Vitest)
- [x] Routing — four routes: /, /resume, /new, /applications with React Router
- [x] Database — JSON file read/write for applications.json and resume.json via Express API
- [x] UI — Navbar with NavLink components wired to React Router
- [x] Deployment — local dev with `npm run dev` (Vite 5173 + Express 3000, proxy configured)

## Out of Scope (Deferred to Later Slices)

- Editing resume content in the browser (Phase 2)
- Pasting job postings (Phase 2)
- Cover letter generation (Phase 3)
- Application CRUD (create, update, delete) beyond reading (Phase 4)
- Application status tracking and follow-up flags (Phase 4)
- Authentication (not planned — single-user local tool)
- Database migration from JSON to SQL (not planned)
- Production build/deploy configuration (not planned for MVP)
- TypeScript migration (not planned)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: User can edit resume content and paste job postings in the browser
- Phase 3: User can generate a tailored cover letter paragraph from resume + job posting
- Phase 4: User can save, view, update, and track job applications with follow-up flags
