# Roadmap: ApplyTrail

## Overview

ApplyTrail is a deployed web application for managing job applications and optimizing resumes. v1.0 delivered the core workflow, v1.1 prepared and deployed the public demo, and v2.0 added the end-to-end resume tailoring flow. Milestone v2.1 makes the unauthenticated, shared, disposable nature of the hosted demo unmistakable while keeping the local-first architecture, API contracts, persistence model, and deployment behavior unchanged.

## Milestones

- [x] **v1.0 MVP** - Phases 1-4 (shipped 2026-06-26)
- [x] **v1.1 Release Polish** - Phases 5-8 (shipped 2026-06-27)
- [x] **v2.0 Resume Tailoring Flow** - Phases 9-15 (shipped 2026-07-26)
- [x] **v2.1 Protect and Clearly Label the Hosted Demo** - Phase 16 (planned) (completed 2026-10-02)

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

### v2.1 Protect and Clearly Label the Hosted Demo (Planned)

**Milestone Goal:** Visitors understand the hosted demo's shared, unauthenticated, writable, disposable, and third-party-data boundaries before using it, while local workflows and existing runtime contracts remain unchanged.

- [ ] **Phase 16: Hosted Demo Safety & Documentation** - Add the always-visible client warning, align safety/setup/provider documentation, and verify the client and production checks

## Phase Details

### Phase 16: Hosted Demo Safety & Documentation

**Goal**: Users can recognize the hosted demo's safety boundaries from every client route, and developers can configure and describe the project accurately without changes to authentication, APIs, persistence, or deployment behavior.
**Depends on**: Phase 15
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, TEST-01, TEST-02
**Success Criteria** (what must be TRUE):

  1. A visitor sees an always-visible client-shell warning on every route that identifies the hosted demo as unauthenticated, shared, writable, disposable, and for demonstration purposes only.
  2. The warning clearly tells visitors not to submit real resumes, contact information, credentials, secrets, or other private job-search data, without implying privacy, account isolation, or durable hosted storage.
  3. The README and AI-provider documentation accurately distinguish local JSON-file behavior from disposable hosted behavior, identify the actual runtime versions and development environment file, and disclose that optional AI providers may receive resume and job-posting content while heuristic mode remains local.
  4. Any `render.yaml` change, if needed, is limited to accurately supporting the warning; service type, build commands, persistence settings, and environment handling remain unchanged.
  5. Focused client tests verify the warning's required guidance, existing client tests remain valid, and lint, the full project test command, and the production build pass without API or server/persistence changes.

**Plans**: 1 plan

Plans:

- [x] 16-01-PLAN.md — Add the always-visible hosted-demo warning and align safety, setup, and AI-provider documentation

**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-4 | v1.0 | Complete | Complete | 2026-06-26 |
| 5-8 | v1.1 | Complete | Complete | 2026-06-27 |
| 9-15 | v2.0 | Complete | Complete | 2026-07-26 |
| 16. Hosted Demo Safety & Documentation | v2.1 | 1/1 | Complete    | 2026-10-02 |
