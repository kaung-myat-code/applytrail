# ApplyTrail

## What This Is

A deployed web application for managing job applications and optimizing resumes. Users can manage a library of resume versions, analyze job postings against their resume, generate actionable improvement suggestions, create tailored resume versions, and track applications. Live at https://applytrail.onrender.com

## Core Value

End-to-end job application workflow in a web UI — from resume to cover letter to application tracking — so the user can manage their job search from any browser.

## Current State

**Shipped:** v2.0 Resume Tailoring Flow (2026-07-26)
**Live URL:** https://applytrail.onrender.com
**Deployment:** Render free tier, auto-deploy from main branch
**Status:** v1.0, v1.1, and v2.0 all shipped. Resume library, provider-agnostic match analysis (heuristic + Gemini/OpenRouter/Groq), section-by-section suggestions, tailored resume generation with a hardened patch-application engine, and application pre-fill/export are all live in production. No milestone currently in progress — awaiting `/gsd-new-milestone`.

<details>
<summary>Previous milestone context</summary>

### What This Was (v1.0)

A local web MVP that migrated an existing Claude Code job application workflow into a React + Express web app.

### Migration Context

**Existing workflow (CLI-based):**
- `resume.md` stores resume content
- `applications.json` stores job application entries
- `cover-letter-style` skill generates tailored cover letter paragraphs
- `application-tracker` agent flags applications with no status change in 10+ days

**Migration goal:** Preserve the data format and workflow logic while adding a web UI. The existing `applications.json` schema and `resume.md` format should inform the API and storage design.

</details>

## Next Milestone

Not yet scoped. Run `/gsd-new-milestone` to define the next milestone's goal and requirements.

## Requirements

### Validated (v1.0)

- [x] User can add and edit resume text in the browser (Phase 2)
- [x] User can paste a job posting and associate it with an application (Phase 2)
- [x] User can generate a tailored cover letter paragraph via keyword-matching heuristics (Phase 3)
- [x] User can save an application (company, role, job posting, cover letter, status, date) (Phase 4)
- [x] User can view all saved applications in a list (Phase 4)
- [x] User can see which applications need follow-up (10+ days without status change) (Phase 4)

### Validated (v1.1)

- [x] App is deployment-ready with production configuration (Phase 5)
- [x] App launches with demo data for portfolio visitors (Phase 6)
- [x] App is deployed to a public hosting platform (Phase 7)
- [x] Documentation is polished for public consumption (Phase 8)
- [x] Release assets (screenshots, slides) are created (Phase 8)

### Validated (v2.0)

- [x] User can manage multiple resume versions — create, rename, delete, select as analysis base, migrated from the original single `resume.json` (Phase 9)
- [x] User can analyze a selected resume against a job posting and see a compatibility score, keyword gaps, and section-level findings via a provider-agnostic engine (heuristic + Gemini/OpenRouter/Groq with automatic fallback) (Phase 10, Phase 11.5)
- [x] User can review section-by-section suggestions and accept, reject, or edit each one individually or in bulk, with a side-by-side diff view (Phase 11)
- [x] User can generate a tailored resume that applies only accepted suggestions to a copy of the source resume (Phase 12)
- [x] Tailored resume is saved as a new version with auto-naming ("Company - Role"), without overwriting the source (Phase 12)
- [x] User can preview the tailored resume before final save (Phase 12)
- [x] User can return to suggestion review from preview without losing accept/reject decisions (Phase 12)
- [x] Generated resume conforms to the resume JSON schema before it can be saved (Phase 12)
- [x] Source resume remains unchanged after generating a tailored resume (Phase 12)
- [x] User can create a new application pre-filled from the analyzed job posting with the tailored resume linked automatically (Phase 13)
- [x] User can export any resume library version as PDF or JSON (Phase 13)
- [x] UX/quality issues from 2026-07-05 exploratory UAT resolved: workflow clarity, nav restructuring, resume-library bug fix, editor safety, analysis/writing quality, lint cleanup (Phase 14)
- [x] Every accepted/edited suggestion either applies to the tailored resume or is surfaced to the user as a skipped patch with a reason — no section/patch-type combination silently no-ops (Phase 15, closes the CR-01/CR-02 gap deferred from Phase 12)

### Active

(None — awaiting next milestone scope via `/gsd-new-milestone`)

### Out of Scope

- Authentication — single-user local tool, no login needed
- Job scraping — user pastes postings manually
- Email sending — out of MVP scope
- Payment/billing — no monetization
- Mobile responsive design — desktop-first for MVP
- Auto-optimize resume tailoring — removes user control, may produce dishonest content; user must review every change
- ATS format checking — JSON schema already guarantees parseability
- Real-time score updates — expensive, creates score-chasing behavior; analysis runs on demand
- LinkedIn profile optimization — scope explosion
- AI resume writing from scratch — system suggests improvements, never generates unreviewed content
- DOCX export — PDF/JSON cover the near-term need; revisit if requested

## Tech Stack

- Frontend: React 18 + React Router 6 (SPA)
- Backend: Express 4 (Node.js API)
- Storage: JSON files (applications.json, resume.json, job_postings.json)
- Build: Vite (frontend), npm scripts (backend)
- Deployment: Render free tier
- Analysis engine: Provider-agnostic pipeline (heuristics, AI models via Vercel AI SDK: Gemini, OpenRouter, Groq)

## Constraints

- **No auth**: Single-user local tool
- **JSON file storage**: Keep data human-readable and easy to inspect/edit
- **Commit after each working milestone**: Incremental progress, not big-bang
- **Provider-agnostic analysis**: Analysis engine must be swappable — heuristics, AI models (Gemini, OpenRouter, Groq), or third-party services without UI changes
- **Structured JSON schema**: Resume data uses a structured JSON schema as the single source of truth; PDF, DOCX, Markdown are generated from this representation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Express | Fast MVP development, clear frontend/backend separation | Implemented (Phase 1) |
| JSON file storage | Minimal setup, human-readable, matches existing data format | Implemented (Phase 1) |
| Keyword-matching for cover letters | No external API dependency, simple to implement and replace later | Implemented (Phase 3) |
| No auth | Single-user local tool, reduces complexity | Implemented (Phase 1) |
| v1.1 = polish only | Prepare for public release without changing core functionality | Complete (v1.1) |
| Render free tier | Simple deployment, auto-deploy from GitHub, sufficient for portfolio | Implemented (Phase 7) |
| Demo data seeding | Portfolio visitors see populated interface on first visit | Implemented (Phase 6) |
| Provider-agnostic analysis | Analysis engine swappable without UI changes — heuristics, AI (Gemini, OpenRouter, Groq), or third-party | Implemented (v2.0, Phase 11.5) |
| Structured JSON schema | Single source of truth for resume data; formats generated from schema | Implemented (v2.0, Phase 12) |
| Resume library | Multiple immutable resume versions; tailoring creates new version | Implemented (v2.0, Phase 09) |
| Ephemeral draft storage for tailoring | Drafts stored as project-root files (`drafts/`), deleted on save, swept on startup — avoids polluting the permanent resume library with in-progress tailoring state | Implemented (Phase 12) |
| URL search params as source of truth for cross-page draft state | `?draft=<id>` (not React Router `location.state`) survives browser refresh across Review ↔ Preview navigation | Implemented (Phase 12) |
| Route-param branching over component forking | `Resume.jsx` branches on `useParams().id` to target either the legacy singular resume or a specific library version, rather than splitting into two components | Implemented (Phase 12) |
| pdfmake for PDF export | Pure-JS PDF generation (no headless browser) to respect the Render free-tier memory ceiling | Implemented (Phase 13) |
| `resume_version_id` existence check on application creation | Format-only validation allowed orphaned/forged references into `applications.json`; existence check matches the sibling `job_posting_id` lookup pattern (code review CR-02) | Implemented (Phase 13) |
| `applyPatches` returns `{ resume, validation, applied, skipped }` with a closed `SKIP_REASON` enum | Additive change so silent no-ops become visible skip reasons (`not-found`, `current-mismatch`, `unsupported-combination`) without breaking existing consumers reading only `resume`/`validation` | Implemented (Phase 15) |
| Education excluded from AI suggestion schema rather than implemented as a patch type | Education is factual content, not something a writing suggestion should change | Implemented (Phase 15) |
| AI provider suggestion validation switched from strict batch Zod schema to permissive schema + per-item `safeParse` | Prevents one invalid suggestion (e.g. a stray education patch) from discarding the entire suggestion batch | Implemented (Phase 15) |

## Milestones

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-4 | Complete | 2026-06-26 |
| v1.1 Release Polish | 5-8 | Complete | 2026-06-27 |
| v2.0 Resume Tailoring Flow | 9-15 | Complete | 2026-07-26 |

**Archives:** [v1.0 phases](milestones/v1.0-phases/) | [v1.1 Roadmap](milestones/v1.1-ROADMAP.md) | [v1.1 Requirements](milestones/v1.1-REQUIREMENTS.md) | [v2.0 Roadmap](milestones/v2.0-ROADMAP.md) | [v2.0 Requirements](milestones/v2.0-REQUIREMENTS.md) | [v2.0 phases](milestones/v2.0-phases/)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-26 after v2.0 milestone*
