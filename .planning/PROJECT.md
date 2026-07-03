# ApplyTrail

## What This Is

A deployed web application for managing job applications and optimizing resumes. Users can manage a library of resume versions, analyze job postings against their resume, generate actionable improvement suggestions, create tailored resume versions, and track applications. Live at https://applytrail.onrender.com

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

## Current Milestone: v2.0 Resume Tailoring Flow

**Goal:** Build an end-to-end resume optimization workflow that analyzes a selected resume against a job posting, generates actionable improvement suggestions, lets users review every change, creates a new tailored resume version, and seamlessly starts a job application.

**Target features:**
- Resume Library — Manage multiple resume versions (select, create, rename, delete, organize)
- Job Posting Analysis — Paste a job posting and analyze it against the selected resume
- Resume Match Report — Display overall compatibility with the job posting, including strengths, gaps, missing keywords, and section-level analysis before suggestions are generated
- Section-by-Section Suggestions — Generate improvements for Summary, Skills, Experience, Projects, Education, etc.
- Review Interface — Compare the current and suggested content side-by-side, then accept, reject, or manually edit each suggestion before generating the tailored resume
- Tailored Resume Generation — Create a new resume version (auto-named by target position) without overwriting the original
- Application Pre-fill — Create a new application from the analyzed job posting with the tailored resume linked automatically
- Export — Export any resume version as PDF, DOCX, or JSON

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
- Mobile responsive design — desktop-first for MVP

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
| Provider-agnostic analysis | Analysis engine swappable without UI changes — heuristics, AI (Gemini, OpenRouter, Groq), or third-party | Planned (v2.0) |
| Structured JSON schema | Single source of truth for resume data; formats generated from schema | Planned (v2.0) |
| Resume library | Multiple immutable resume versions; tailoring creates new version | Planned (v2.0) |

## Milestones

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-4 | Complete | 2026-06-26 |
| v1.1 Release Polish | 5-8 | Complete | 2026-06-27 |
| v2.0 Resume Tailoring Flow | TBD | Planning | — |

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
*Last updated: 2026-07-03 — Phase 11.5 AI Analysis Provider INSERTED*
