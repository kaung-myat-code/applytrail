# Roadmap: ApplyTrail

## Overview

ApplyTrail is a deployed web application for managing job applications and optimizing resumes. v1.0 delivered the core workflow, v1.1 prepared and deployed the public demo, v2.0 added the end-to-end resume tailoring flow, and v2.1 labeled the hosted demo's safety boundaries. Milestone v2.2 makes the hosted demo a trustworthy portfolio artifact for full-stack hiring managers: honest analysis output (no fabricated experience), a demo path that reaches the flagship tailoring feature in two clicks, disposable demo data with honest cold-start surfacing, critical-path reliability, and a README that leads with the patch engine, fallback chain, and tests.

## Milestones

- [x] **v1.0 MVP** - Phases 1-4 (shipped 2026-06-26)
- [x] **v1.1 Release Polish** - Phases 5-8 (shipped 2026-06-27)
- [x] **v2.0 Resume Tailoring Flow** - Phases 9-15 (shipped 2026-07-26)
- [x] **v2.1 Protect and Clearly Label the Hosted Demo** - Phase 16 (shipped 2026-10-02)
- [ ] **v2.2 Honest Output & Demo Path** - Phases 17-21 (planned)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-06-26</summary>

- [x] **Phase 1: Foundation** - React + Express scaffolding, JSON storage, and application shell
- [x] **Phase 2: Resume & Job Input** - Browser-based resume editing and job-posting input
- [x] **Phase 3: Cover Letter Generation** - Heuristic tailored cover-letter generation
- [x] **Phase 4: Application Tracking** - Application saving, listing, status updates, and follow-up visibility

Archive: [v1.0 phases](milestones/v1.0-phases/)

</details>

<details>
<summary>v1.1 Release Polish (Phases 5-8) - SHIPPED 2026-06-27</summary>

- [x] **Phase 5: Deployment Readiness** - Production server configuration and security headers
- [x] **Phase 6: Demo Data & Seeding** - Realistic seeded data for portfolio visitors
- [x] **Phase 7: Production Deployment** - Public Render deployment
- [x] **Phase 8: Documentation & Release** - Public README, release assets, and presentation materials

Archive: [v1.1 Roadmap](milestones/v1.1-ROADMAP.md) | [v1.1 Requirements](milestones/v1.1-REQUIREMENTS.md)

</details>

<details>
<summary>v2.0 Resume Tailoring Flow (Phases 9-15) - SHIPPED 2026-07-26</summary>

- [x] **Phase 9: Resume Library Foundation** - Multiple resume versions and selection
- [x] **Phase 10: Match Scoring and Gap Analysis** - Provider-agnostic compatibility analysis
- [x] **Phase 11: Section-by-Section Suggestions** - Reviewable suggestion workflow
- [x] **Phase 11.5: AI Analysis Provider** - Gemini, OpenRouter, and Groq provider support with fallback
- [x] **Phase 12: Tailored Resume Generation** - Accepted-patch generation and preview
- [x] **Phase 13: Application Pre-fill and Export** - Application pre-fill and PDF/JSON export
- [x] **Phase 14: UX & Quality Polish from User Feedback** - UAT-driven workflow and quality fixes
- [x] **Phase 15: Tailored Resume Patch Correctness** - Visible handling of patch skips and no-ops

Archive: [v2.0 Roadmap](milestones/v2.0-ROADMAP.md) | [v2.0 Requirements](milestones/v2.0-REQUIREMENTS.md) | [v2.0 phases](milestones/v2.0-phases/)

</details>

<details>
<summary>v2.1 Protect and Clearly Label the Hosted Demo (Phase 16) - SHIPPED 2026-10-02</summary>

- [x] **Phase 16: Hosted Demo Safety & Documentation** - Add the always-visible client warning, align safety/setup/provider documentation, and verify the client and production checks

Archive: [v2.1 Roadmap](milestones/v2.1-ROADMAP.md) | [v2.1 Requirements](milestones/v2.1-REQUIREMENTS.md) | [v2.1 phases](milestones/v2.1-phases/)

</details>

### v2.2 Honest Output & Demo Path (Planned)

**Milestone Goal:** Hiring managers who open the hosted demo reach the flagship tailoring feature immediately and see honest, well-targeted resume output — with the patch engine and fallback chain standing up to full-stack scrutiny.

- [x] **Phase 17: Honest Analysis Output** - Remove fabricated suggestions, add gap notes and AI guardrails, fix score normalization and patch targeting, and verify via an eval set (completed 2026-10-09)
- [ ] **Phase 18: Demo Path UX** - Analyze-first CTAs, Dashboard quick action, dead-end fixes, and provider visibility matched to the hosted demo
- [ ] **Phase 19: Hosted Demo Freeze & Cold Start** - Seeded sample data with scheduled reset, a labeled pre-computed AI example, updated warning text, and honest wake-up surfacing
- [ ] **Phase 20: Reliability & Repo Hygiene** - Write-route validation, critical-path tests, fresh-clone setup, and clean repo state
- [ ] **Phase 21: README & Portfolio Pass** - Full-stack headline, demo media, AI-honesty section, and cold-start note

## Phase Details

### Phase 17: Honest Analysis Output

**Goal**: Analysis and tailoring output never fabricates experience — every suggestion traces to the user's resume, missing skills surface as honest gap notes, and the behavior is verifiable via a committed eval set.
**Depends on**: Phase 16
**Requirements**: OUT-01, OUT-02, OUT-03, OUT-04, OUT-05, OUT-06
**Success Criteria** (what must be TRUE):

  1. Given a resume missing a skill the posting asks for, the Analysis page shows an honest gap note ("not on your resume; add a bullet only if you have real experience") instead of a generated suggestion claiming that skill.
  2. Heuristic suggestions for experience/project sections only rephrase bullets already present in the resume — no fabrication templates remain in the output.
  3. When an AI provider is configured, its prompt guardrails forbid inventing skills, employers, metrics, dates, or experience not in the resume JSON, and AI scores render on a 0–100 scale (a raw score of 1 displays as 1, not 100).
  4. An add-type patch with `target_entry` attaches to the named experience/project entry; when the name doesn't match, it falls back to the last entry with a visible skip reason.
  5. Running the committed eval script over 5+ resume×posting pairs produces a markdown report showing zero fabricated claims, with AI runs included when a provider key is present.

**Plans**:
5/5 plans complete

- [x] 17-01-PLAN.md — Heuristic fabrication removal + honest gap notes (OUT-01, OUT-02)
- [x] 17-02-PLAN.md — AI prompt guardrails, score normalization fix, target_entry schemas (OUT-03, OUT-05, OUT-06)
- [x] 17-03-PLAN.md — target_entry patch targeting + visible fallback skip (OUT-05)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 17-04-PLAN.md — Client skip-reason mirror + per-reason skip copy (OUT-05)
- [x] 17-05-PLAN.md — Eval set + plain-Node eval runner (OUT-04)

**UI hint**: yes

### Phase 18: Demo Path UX

**Goal**: A first-time visitor reaches the flagship tailoring feature immediately, dead ends are fixed, and provider options match actual availability — AI hidden on the hosted demo.
**Depends on**: Phase 17
**Requirements**: PATH-01, PATH-02, PATH-03, PATH-04, PATH-05, PATH-06, PATH-07, PATH-08
**Success Criteria** (what must be TRUE):

  1. After saving a job posting, the primary CTA is "Analyze match" and the cover-letter path is secondary.
  2. A first-time visitor reaches Analysis within 2 clicks from the Dashboard via the new "Tailor resume" quick action.
  3. From ReviewSuggestions, "Back to Analysis" rehydrates the prior report via `?resume=&posting=` search params without re-running analysis.
  4. Job-posting dropdowns disambiguate duplicates with date and snippet labels, and "Create Application" from Resume Library opens a posting picker instead of attaching the most-recent posting.
  5. The Analysis provider dropdown renders from `/api/providers` — AI options are hidden on the hosted demo and no env-var names appear anywhere in the UI; the PATH-01 and PATH-02 flows are verified via browser check at 375px.

**Plans**: TBD

**UI hint**: yes

### Phase 19: Hosted Demo Freeze & Cold Start

**Goal**: The hosted demo is a trustworthy disposable artifact — seeded sample data that resets on a schedule, a labeled pre-computed AI example, accurate warning text, and cold start surfaced honestly.
**Depends on**: Phase 18
**Requirements**: FREEZE-01, FREEZE-02, FREEZE-03, FREEZE-04, COLD-01, COLD-02
**Success Criteria** (what must be TRUE):

  1. Opening the hosted demo with empty data shows a sample resume and 2–3 sample job postings seeded on boot (hosted/demo mode only).
  2. Saved data on the hosted demo resets to the seeded state on a schedule — visitors can try the full flow, but nothing they save is durable.
  3. The demo includes one pre-computed AI analysis example, clearly labeled as generated locally rather than by the hosted heuristic.
  4. The Phase 16 hosted-demo warning text accurately describes the new reset/disposable behavior.
  5. First load against a cold (woken) instance shows a friendly wake-up state that polls `/api/health` until the server responds; an external uptime pinger is set up and its setup is documented.

**Plans**: TBD

**UI hint**: yes

### Phase 20: Reliability & Repo Hygiene

**Goal**: Critical paths are validated and tested, a fresh clone runs cleanly on Node 20.19, and repo state is clean for reviewers.
**Depends on**: Phase 19
**Requirements**: REL-01, REL-02, REL-03, REL-04, REL-05, REL-06, REL-07
**Success Criteria** (what must be TRUE):

  1. Invalid write requests (missing or oversized string fields on job-postings, applications, and resume-library routes) return 400 with an error message instead of writing garbage to disk.
  2. `npm test` covers the AI→heuristic fallback chain (mock provider failure → heuristic succeeds), the draft 24h cleanup sweep, resume-library CRUD routes, and one ReviewSuggestions accept → generate → draft-id flow.
  3. A fresh clone runs on Node 20.19 with no manual file creation, and the exact setup commands are documented.
  4. `drafts/` is gitignored, `slides.pdf` is moved out of the repo root, empty directories are removed — `git status` is clean on a fresh clone.

**Plans**: TBD

### Phase 21: README & Portfolio Pass

**Goal**: The README leads with the full-stack story — patch engine, fallback chain, tests/CI — and sets accurate expectations for demo visitors.
**Depends on**: Phase 20
**Requirements**: README-01, README-02, README-03, README-04
**Success Criteria** (what must be TRUE):

  1. The README headline targets full-stack roles, with the patch engine, fallback chain, and tests/CI as the selling points.
  2. A demo GIF or video sits at the top of the README.
  3. An AI-honesty section states: heuristic mode is local; optional AI providers may receive resume and job-posting content; no keys on the hosted demo; fabrication is never generated.
  4. The README notes cold-start behavior and what visitors should expect on first load.

**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v1.0 | Complete | Complete | 2026-06-26 |
| 5-8 | v1.1 | Complete | Complete | 2026-06-27 |
| 9-15 | v2.0 | Complete | Complete | 2026-07-26 |
| 16. Hosted Demo Safety & Documentation | v2.1 | 1/1 | Complete | 2026-10-02 |
| 17. Honest Analysis Output | v2.2 | 5/5 | Complete    | 2026-10-09 |
| 18. Demo Path UX | v2.2 | 0/0 | Not started | - |
| 19. Hosted Demo Freeze & Cold Start | v2.2 | 0/0 | Not started | - |
| 20. Reliability & Repo Hygiene | v2.2 | 0/0 | Not started | - |
| 21. README & Portfolio Pass | v2.2 | 0/0 | Not started | - |
