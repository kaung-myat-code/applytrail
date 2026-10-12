# Requirements: v2.2 Honest Output & Demo Path

**Defined:** 2026-10-05
**Core Value:** End-to-end job application workflow in a web UI — from resume to cover letter to application tracking — so the user can manage their job search from any browser.

## Overview

v2.2 makes the hosted demo a trustworthy portfolio artifact for full-stack hiring managers: honest AI output (no fabricated experience), a demo path that reaches the flagship tailoring feature in two clicks, disposable demo data, and a README that leads with the patch engine, fallback chain, and tests. Scope is the 2026-10-05 portfolio audit (Groups A/B/C) adjusted by five prioritization answers. Branch: `gsd/v2.2-honest-output-demo-path`.

## User Stories

* As a hiring manager viewing the hosted demo, I want to reach the tailoring feature immediately and see honest output I can trust.
* As a job seeker using the app locally, I want suggestions that rephrase my real experience, never invent it.
* As a full-stack reviewer of this repo, I want the patch engine, fallback chain, and tests to be the headline.

## Requirements

### Honest Output

- [x] **OUT-01**: Heuristic experience/project suggestions only rephrase bullets already in the resume — fabrication templates are removed.
- [x] **OUT-02**: When the posting asks for something absent from the resume, analysis outputs an honest gap note ("not on your resume; add a bullet only if you have real experience") instead of a generated claim.
- [x] **OUT-03**: AI provider prompts explicitly forbid inventing skills, employers, metrics, dates, or experience not present in the resume JSON.
- [x] **OUT-04**: Eval set of 5+ resume×posting pairs committed under `evals/` with a script that runs analysis (heuristic, and AI when a key is present) and dumps a markdown report for review.
- [x] **OUT-05**: Add-type patches carry `target_entry` (company/project name); applyPatches attaches to the named entry and falls back to last-entry with a skip reason when absent.
- [x] **OUT-06**: AI models must return scores on a 0–100 scale; `score: 1` is not silently scaled to 100.

### Demo Path

- [ ] **PATH-01**: After saving a job posting, the primary CTA is "Analyze match" (cover letter secondary).
- [ ] **PATH-02**: Dashboard gains a "Tailor resume" quick action; a first-time visitor reaches Analysis within 2 clicks from Dashboard.
- [ ] **PATH-03**: "Back to Analysis" from ReviewSuggestions rehydrates the prior report via `?resume=&posting=` search params.
- [ ] **PATH-04**: Job-posting dropdowns disambiguate duplicates with date and snippet labels.
- [ ] **PATH-05**: "Create Application" from Resume Library opens a posting picker instead of attaching the most-recent posting.
- [ ] **PATH-06**: `/api/providers` reports which AI providers are configured; the Analysis dropdown renders accordingly and shows no env-var names.
- [ ] **PATH-07**: On the hosted demo, AI provider options are hidden (heuristic only).
- [ ] **PATH-08**: PATH-01 and PATH-02 flows are verified via browser check at 375px.

### Demo Freeze

- [ ] **FREEZE-01**: In hosted/demo mode, the server seeds a sample resume and 2–3 sample postings on boot if data is empty.
- [ ] **FREEZE-02**: Hosted demo data resets on a schedule back to the seeded state — visitors can try flows; data is not durable.
- [ ] **FREEZE-03**: One pre-computed AI analysis example ships with the demo, clearly labeled as generated locally.
- [ ] **FREEZE-04**: Phase 16 warning text is updated to describe the reset/disposable behavior accurately.

### Cold Start

- [ ] **COLD-01**: First load shows a friendly wake-up loading state that polls `/api/health` until the server responds.
- [ ] **COLD-02**: An external uptime pinger keeps or monitors the Render free-tier service; setup is documented.

### README

- [ ] **README-01**: The README headline targets full-stack roles — patch engine, fallback chain, and tests/CI as the selling points.
- [ ] **README-02**: A demo GIF or video sits at the top of the README.
- [ ] **README-03**: An AI-honesty section states: heuristic mode is local; optional AI providers may receive resume and job-posting content; no keys on the hosted demo; fabrication is never generated.
- [ ] **README-04**: The README notes cold-start behavior and what visitors should expect.

### Reliability

- [ ] **REL-01**: Write routes (job-postings, applications, resume-library) validate required string fields and max lengths; invalid input returns 400.
- [ ] **REL-02**: A test covers the AI→heuristic fallback chain (mock provider failure → heuristic succeeds).
- [ ] **REL-03**: A test covers the draft cleanup lifecycle (24h sweep).
- [ ] **REL-04**: Tests cover resume-library CRUD API routes.
- [ ] **REL-05**: One ReviewSuggestions page test covers accept → generate → draft id.
- [ ] **REL-06**: A fresh clone runs on Node 20.19 with no manual file creation; README documents the exact setup commands.
- [ ] **REL-07**: Repo hygiene — `drafts/` gitignored, `slides.pdf` moved out of repo root, empty dirs removed; `git status` clean on fresh clone.

## Out of Scope

| Feature | Reason |
|---------|--------|
| PDF export pass (B4) | Deferred 2026-10-05 — keep milestone on output quality + demo path |
| Visual/a11y sweep (B5) | Deferred 2026-10-05 — 375px check applies only to PATH-01/02 verification |
| Cut-list removals (Cover Letter page fold, bonus keywords, server-side drafts refactor) | Removals/refactors are not this milestone's headline; deferred |
| C5 write serialization | Replaced by demo freeze (seed + scheduled reset) per answer 5 |
| Paid Render tier | Cold start handled via loading UX + uptime pinger, not spend |
| Authentication | Single-user local tool |
| Mobile responsive redesign | Desktop-first; 375px check is verification only |
| AI API keys on hosted demo | No-keys policy stands (answer 2); heuristic-only demo |

## Definition of Done

* Eval pairs show zero fabricated claims; gap notes appear where the posting asks for absent experience.
* New-user walkthrough reaches Analysis within 2 clicks from Dashboard; provider options match availability.
* Hosted demo seeds on boot, resets on schedule, and shows a labeled pre-computed AI example; Phase 16 warning text matches.
* README leads with the full-stack story, includes demo media, AI-honesty, and cold-start note.
* `npm test` covers fallback chain, draft lifecycle, and library CRUD; lint and production build pass.
* Fresh clone runs on Node 20.19; `git status` clean.

## Traceability

Which phases cover which requirements. Updated during roadmap creation (2026-10-06).

| Requirement | Phase | Status |
|-------------|-------|--------|
| OUT-01 | Phase 17 | Complete |
| OUT-02 | Phase 17 | Complete |
| OUT-03 | Phase 17 | Complete |
| OUT-04 | Phase 17 | Complete |
| OUT-05 | Phase 17 | Complete |
| OUT-06 | Phase 17 | Complete |
| PATH-01 | Phase 18 | Pending |
| PATH-02 | Phase 18 | Pending |
| PATH-03 | Phase 18 | Pending |
| PATH-04 | Phase 18 | Pending |
| PATH-05 | Phase 18 | Pending |
| PATH-06 | Phase 18 | Pending |
| PATH-07 | Phase 18 | Pending |
| PATH-08 | Phase 18 | Pending |
| FREEZE-01 | Phase 19 | Pending |
| FREEZE-02 | Phase 19 | Pending |
| FREEZE-03 | Phase 19 | Pending |
| FREEZE-04 | Phase 19 | Pending |
| COLD-01 | Phase 19 | Pending |
| COLD-02 | Phase 19 | Pending |
| REL-01 | Phase 20 | Pending |
| REL-02 | Phase 20 | Pending |
| REL-03 | Phase 20 | Pending |
| REL-04 | Phase 20 | Pending |
| REL-05 | Phase 20 | Pending |
| REL-06 | Phase 20 | Pending |
| REL-07 | Phase 20 | Pending |
| README-01 | Phase 21 | Pending |
| README-02 | Phase 21 | Pending |
| README-03 | Phase 21 | Pending |
| README-04 | Phase 21 | Pending |

**Coverage:**

- v2.2 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-10-05*
*Last updated: 2026-10-06 after roadmap creation (Phases 17-21; 31/31 mapped)*
