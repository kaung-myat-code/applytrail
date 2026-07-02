# ApplyTrail

## What This Is

A local web MVP that migrates an existing Claude Code job application workflow into a React + Express web app. Users can manage their resume, paste job postings, generate tailored cover letter paragraphs using keyword-matching heuristics, save applications, and track which ones need follow-up.

## Core Value

End-to-end job application workflow in a local web UI — from resume to cover letter to application tracking — so the user can manage their job search without touching the CLI.

## Current Milestone: v1.1 Release Polish

**Goal:** Prepare ApplyTrail for public release and portfolio presentation without changing core functionality.

**Target features:**
- Deployment readiness (env config, build optimization, production-ready server)
- Production deployment (evaluate hosting platforms, select suitable option, automate deployment)
- Documentation and licensing (README polish, LICENSE, contributing guide)
- Screenshots, presentation slides, and release assets

## Requirements

### Validated

- [x] User can add and edit resume text in the browser (Phase 2)
- [x] User can paste a job posting and associate it with an application (Phase 2)
- [x] User can generate a tailored cover letter paragraph via keyword-matching heuristics (Phase 3)
- [x] User can save an application (company, role, job posting, cover letter, status, date) (Phase 4)
- [x] User can view all saved applications in a list (Phase 4)
- [x] User can see which applications need follow-up (10+ days without status change) (Phase 4)

### Validated (v1.1)

- [x] App is deployment-ready with production configuration (Phase 5)
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

## Context

**Existing workflow (CLI-based):**
- `resume.md` stores resume content
- `applications.json` stores job application entries
- `cover-letter-style` skill generates tailored cover letter paragraphs
- `application-tracker` agent flags applications with no status change in 10+ days

**Migration goal:** Preserve the data format and workflow logic while adding a web UI. The existing `applications.json` schema and `resume.md` format should inform the API and storage design.

**Tech stack:**
- Frontend: React (SPA)
- Backend: Express (Node.js API)
- Storage: JSON files (applications.json, resume.json)
- Cover letter generation: Simple keyword-matching heuristics (match resume skills/experience to job posting keywords, assemble paragraph from strongest matching sections)

## Constraints

- **No auth**: Single-user local tool
- **No external APIs**: No job scraping, no AI API calls, no email
- **JSON file storage**: Keep data human-readable and easy to inspect/edit
- **Commit after each working milestone**: Incremental progress, not big-bang
- **Simple heuristics**: Cover letter logic must be replaceable — designed to swap in a real LLM service later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Express | Fast MVP development, clear frontend/backend separation | — Implemented (Phase 1) |
| JSON file storage | Minimal setup, human-readable, matches existing data format | — Implemented (Phase 1) |
| Keyword-matching for cover letters | No external API dependency, simple to implement and replace later | — Implemented (Phase 3) |
| No auth | Single-user local tool, reduces complexity | — Implemented (Phase 1) |
| v1.1 = polish only | Prepare for public release without changing core functionality | — Complete (v1.1) |
| Render free tier | Simple deployment, auto-deploy from GitHub, sufficient for portfolio | — Implemented (Phase 7) |
| Demo data seeding | Portfolio visitors see populated interface on first visit | — Implemented (Phase 6) |

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
*Last updated: 2026-07-02 — Milestone v1.1 Release Polish complete*
