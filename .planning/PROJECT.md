# ApplyTrail

## What This Is

A deployed web application for managing job applications and optimizing resumes. Users can manage a library of resume versions, analyze job postings against their resume, generate actionable improvement suggestions, create tailored resume versions, and track applications. Live at https://applytrail.onrender.com

## Core Value

End-to-end job application workflow in a web UI — from resume to cover letter to application tracking — so the user can manage their job search from any browser.

## Current State

**Shipped:** v2.1 Protect and Clearly Label the Hosted Demo (2026-10-02)
**Live URL:** https://applytrail.onrender.com
**Deployment:** Render free tier, auto-deploy from main branch
**Status:** v1.0 through v2.1 shipped. Hosted-demo safety warning live in production (PR #38). v2.2 (Honest Output & Demo Path) kicking off — scope set by the 2026-10-05 portfolio audit (verdict 6/10) and the five prioritization answers recorded in `.planning/.continue-here.md`.

## Current Milestone: v2.2 Honest Output & Demo Path

**Goal:** Hiring managers who open the hosted demo reach the flagship tailoring feature immediately and see honest, well-targeted resume output — with the patch engine and fallback chain standing up to full-stack scrutiny.

**Target features:**
- Honest AI output — rephrase-only heuristic templates with gap notes ("not on your resume; add a bullet only if you have real experience") instead of invented claims; anti-fabrication AI prompt guardrails; eval set as verification tooling; `target_entry` patch targeting; score-normalization fix
- Demo-path UX — Analyze as primary CTA after posting save; Tailor quick action on Dashboard; dead-end fixes (Back-to-Analysis rehydration, posting dropdown labels, Create-Application posting picker); `/api/providers` with AI options hidden on hosted demo; B1/B2 verified via browser check at 375px
- Reliability — input validation limits on write routes; tests for fallback chain, draft cleanup, library CRUD, ReviewSuggestions flow; fresh-clone setup fix; repo hygiene (`drafts/` gitignore, root clutter)
- Demo freeze — seeded sample resume + 2–3 sample postings on boot; scheduled reset of saved data (visitors can try flows; data is not durable); one pre-computed AI example labeled as generated locally; Phase 16 "writable" warning text updated to match
- Cold start — friendly wake-up loading state + health polling + external uptime pinger + README note (no paid Render tier)
- README / portfolio pass — full-stack headline (patch engine, fallback chain, tests/CI); demo GIF/video at top; AI-honesty section; cold-start note

**Scope source:** 2026-10-05 portfolio audit (`.planning/.continue-here.md`, Groups A/B/C) adjusted by five prioritization answers: hosted Render demo is the primary hiring-manager artifact; no AI API keys on Render; target full-stack roles; remove fabricated-bullet templates (honest low-suggestion output preferred); freeze hosted demo data read-mostly.

**Deferred:** PDF export pass (B4), visual/a11y sweep (B5), cut-list removals (standalone Cover Letter page fold, bonus keywords display, server-side drafts refactor).

<details>
<summary>Previous milestone context</summary>

### What This Was (v2.1)

Protect and Clearly Label the Hosted Demo — always-visible client-shell warning distinguishing local JSON behavior from disposable hosted behavior; README/AI_PROVIDERS alignment; Phase 16 shipped 2026-10-02 (PR #38).

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

### Validated (v2.1)

- [x] Users see a clear hosted-demo safety warning in the application shell (Phase 16)
- [x] README documents hosted-demo risks, local data behavior, runtime versions, and environment setup (Phase 16)
- [x] AI-provider documentation states that optional providers may receive resume and job-posting content (Phase 16)
- [x] Client tests verify the warning content; lint, tests, and production build pass (Phase 16)

### Active

- [ ] Users get honest analysis output: rephrase-only suggestions, gap notes instead of invented claims, no fabricated experience (v2.2)
- [ ] A first-time visitor reaches Analysis within 2 clicks from the Dashboard, and provider options match actual availability — AI hidden on hosted demo (v2.2)
- [ ] Hosted demo data is disposable: seeded on boot, resets on a schedule, includes a labeled pre-computed AI example; Phase 16 warning text matches the new behavior (v2.2)
- [ ] README tells the full-stack story: patch engine, fallback chain, tests/CI, demo media at top, AI-honesty section, cold-start note (v2.2)
- [ ] Critical-path reliability: input limits on write routes, fallback/draft/library tests, fresh-clone dev setup, clean git status (v2.2)
- [ ] Cold start surfaced honestly: wake-up loading state, health polling, external uptime pinger, README note (v2.2)

### Out of Scope

- Authentication — single-user local tool, no login needed
- Job scraping — user pastes postings manually
- Email sending — out of MVP scope
- Payment/billing — no monetization
- Mobile responsive design — desktop-first for MVP (375px browser check applies only to B1/B2 demo-path verification, not a responsive redesign)
- Auto-optimize resume tailoring — removes user control, may produce dishonest content; user must review every change
- ATS format checking — JSON schema already guarantees parseability
- Real-time score updates — expensive, creates score-chasing behavior; analysis runs on demand
- LinkedIn profile optimization — scope explosion
- AI resume writing from scratch — system suggests improvements, never generates unreviewed content
- DOCX export — PDF/JSON cover the near-term need; revisit if requested
- Paid Render tier — cold start handled via loading UX + uptime pinger, not spend
- C5 write serialization — replaced by demo freeze (seed + scheduled reset) per 2026-10-05 answer 5
- PDF export pass (B4) and visual/a11y sweep (B5) — deferred from v2.2 scope decision 2026-10-05
- Cut-list removals (standalone Cover Letter page, bonus keywords display, server-side drafts refactor) — deferred; removals/refactors are not this milestone's headline

## Tech Stack

- Frontend: React 19 + React Router 7 (SPA)
- Backend: Express 5 (Node.js API)
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
- **No AI API keys on Render**: Hosted demo runs heuristic-only; no-keys policy is deliberate (2026-10-05 answer 2)
- **Honest output over volume**: Suggestions never fabricate experience; gap notes preferred over padded lists (2026-10-05 answer 4)

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
| Always-visible hosted-demo warning rather than a hosted/demo-mode flag | Avoids new configuration complexity for the first safety milestone | Implemented (v2.1, Phase 16) |
| 2026-10-05 audit answers gate v2.2 scope | Hosted demo primary; no AI keys on Render; full-stack target; remove fabrication; freeze demo read-mostly | Set v2.2 scope |
| Demo freeze = seed on boot + scheduled reset (not write-blocking) | Visitors can try the full flow; data never durable; avoids C5 write serialization | v2.2 |
| Gap notes in heuristic output | Honest "not on your resume" notes instead of generated claims — Q4 prefers honest low-suggestion output | v2.2 |
| Cold start = loading UX + external uptime pinger, no paid Render tier | Cost stays at free tier; ~31s wake is documented and surfaced honestly | v2.2 |
| Defer PDF export (B4), visual/a11y sweep (B5), cut-list removals | Keep milestone focused on output quality + demo path | v2.2 |

## Milestones

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-4 | Complete | 2026-06-26 |
| v1.1 Release Polish | 5-8 | Complete | 2026-06-27 |
| v2.0 Resume Tailoring Flow | 9-15 | Complete | 2026-07-26 |
| v2.1 Protect and Clearly Label the Hosted Demo | 16 | Complete | 2026-10-02 |
| v2.2 Honest Output & Demo Path | 17+ | Planning | — |

**Archives:** [v1.0 phases](milestones/v1.0-phases/) | [v1.1 Roadmap](milestones/v1.1-ROADMAP.md) | [v1.1 Requirements](milestones/v1.1-REQUIREMENTS.md) | [v2.0 Roadmap](milestones/v2.0-ROADMAP.md) | [v2.0 Requirements](milestones/v2.0-REQUIREMENTS.md) | [v2.0 phases](milestones/v2.0-phases/) | [v2.1 Roadmap](milestones/v2.1-ROADMAP.md) | [v2.1 Requirements](milestones/v2.1-REQUIREMENTS.md) | [v2.1 phases](milestones/v2.1-phases/)

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
*Last updated: 2026-10-05 after v2.2 milestone kickoff*
