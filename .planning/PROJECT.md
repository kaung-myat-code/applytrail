# ApplyTrail

## What This Is

A deployed web application for managing job applications. Users can edit their resume, paste job postings, generate tailored cover letter paragraphs using keyword-matching heuristics, save applications, and track which ones need follow-up. Live at https://applytrail.onrender.com

## Core Value

End-to-end job application workflow in a web UI — from resume to cover letter to application tracking — so the user can manage their job search from any browser.

## Current State

**Shipped:** v1.1 Release Polish (2026-06-27)
**Live URL:** https://applytrail.onrender.com
**Deployment:** Render free tier, auto-deploy from main branch
**Status:** All 8 phases complete, 36/36 requirements met across both milestones

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

## Next Milestone Goals

Not yet defined. Run `/gsd-new-milestone` to define the next milestone.

**Potential directions** (from requirements backlog):
- Replace keyword heuristics with real LLM API for cover letter generation
- Import resume from PDF/DOCX
- Export applications to CSV
- Customizable cover letter tone/style

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

### Out of Scope

- Authentication — single-user local tool, no login needed
- Job scraping — user pastes postings manually
- Email sending — out of MVP scope
- Payment/billing — no monetization
- External AI API — heuristics only, real LLM integration deferred
- Mobile responsive design — desktop-first for MVP
- Core functionality changes — v1.1 is polish only, not new features

## Tech Stack

- Frontend: React 18 + React Router 6 (SPA)
- Backend: Express 4 (Node.js API)
- Storage: JSON files (applications.json, resume.json, job_postings.json)
- Build: Vite (frontend), npm scripts (backend)
- Deployment: Render free tier
- Cover letter generation: Simple keyword-matching heuristics (designed to swap in LLM later)

## Constraints

- **No auth**: Single-user local tool
- **No external APIs**: No job scraping, no AI API calls, no email
- **JSON file storage**: Keep data human-readable and easy to inspect/edit
- **Commit after each working milestone**: Incremental progress, not big-bang
- **Simple heuristics**: Cover letter logic must be replaceable — designed to swap in a real LLM service later

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

## Milestones

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-4 | Complete | 2026-06-26 |
| v1.1 Release Polish | 5-8 | Complete | 2026-06-27 |

**Archives:** [v1.0](milestones/v1.0-phases/) | [v1.1 Roadmap](milestones/v1.1-ROADMAP.md) | [v1.1 Requirements](milestones/v1.1-REQUIREMENTS.md)

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
*Last updated: 2026-07-02 — Milestone v1.1 archived, both milestones shipped*
