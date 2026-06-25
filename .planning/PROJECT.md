# ApplyTrail

## What This Is

A local web MVP that migrates an existing Claude Code job application workflow into a React + Express web app. Users can manage their resume, paste job postings, generate tailored cover letter paragraphs using keyword-matching heuristics, save applications, and track which ones need follow-up.

## Core Value

End-to-end job application workflow in a local web UI — from resume to cover letter to application tracking — so the user can manage their job search without touching the CLI.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can add and edit resume text in the browser
- [ ] User can paste a job posting and associate it with an application
- [ ] User can generate a tailored cover letter paragraph via keyword-matching heuristics (no external AI API)
- [ ] User can save an application (company, role, job posting, cover letter, status, date)
- [ ] User can view all saved applications in a list
- [ ] User can see which applications need follow-up (10+ days without status change)

### Out of Scope

- Authentication — single-user local tool, no login needed
- Job scraping — user pastes postings manually
- Email sending — out of MVP scope
- Payment/billing — no monetization in Phase 1
- External AI API — heuristics only, real LLM integration deferred to Phase 2
- Mobile responsive design — desktop-first for MVP

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
| React + Express | Fast MVP development, clear frontend/backend separation | — Pending |
| JSON file storage | Minimal setup, human-readable, matches existing data format | — Pending |
| Keyword-matching for cover letters | No external API dependency, simple to implement and replace later | — Pending |
| No auth | Single-user local tool, reduces complexity | — Pending |

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
*Last updated: 2026-06-26 after initialization*
