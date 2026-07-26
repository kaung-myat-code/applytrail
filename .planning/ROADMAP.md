# Roadmap: ApplyTrail

## Overview

A deployed web application for managing job applications and optimizing resumes. v1.0 (Phases 1-4) delivered the core workflow: resume editing, job posting input, cover letter generation, and application tracking. v1.1 Release Polish (Phases 5-8) transformed it into a publicly deployed portfolio piece with production server configuration, demo data, live deployment on Render, and polished documentation. v2.0 Resume Tailoring Flow (Phases 9-15) added an end-to-end resume optimization workflow: manage multiple resume versions, analyze against job postings, generate and review section-by-section suggestions, create tailored resumes, export to PDF/JSON, and harden the patch-application engine.

## Milestones

- [x] **v1.0 MVP** - Phases 1-4 (shipped 2026-06-26)
- [x] **v1.1 Release Polish** - Phases 5-8 (shipped 2026-06-27)
- [x] **v2.0 Resume Tailoring Flow** - Phases 9-15 (shipped 2026-07-26)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-06-26</summary>

- [x] **Phase 1: Foundation** - Project scaffolding with React + Express, JSON file storage, and basic app shell (completed 2026-06-25)
- [x] **Phase 2: Resume & Job Input** - User can edit resume content and paste job postings in the browser (completed 2026-06-26)
- [x] **Phase 3: Cover Letter Generation** - User can generate a tailored cover letter paragraph from resume and job posting (completed 2026-06-26)
- [x] **Phase 4: Application Tracking** - User can save, view, update, and follow up on job applications (completed 2026-06-26)

Archive: [v1.0-phases](milestones/v1.0-phases/)

</details>

<details>
<summary>v1.1 Release Polish (Phases 5-8) - SHIPPED 2026-06-27</summary>

- [x] **Phase 5: Deployment Readiness** - Production server serves built React files with security headers, compression, and environment-based config (completed 2026-06-27)
- [x] **Phase 6: Demo Data & Seeding** - App launches with realistic demo data so portfolio visitors see a populated interface (completed 2026-06-27)
- [x] **Phase 7: Production Deployment** - App is live and fully functional on a public Render URL (completed 2026-06-27)
- [x] **Phase 8: Documentation & Release** - Repository is polished with README, LICENSE, screenshots, and presentation materials (completed 2026-06-27)

Archive: [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) | [v1.1-REQUIREMENTS.md](milestones/v1.1-REQUIREMENTS.md)

</details>

<details>
<summary>v2.0 Resume Tailoring Flow (Phases 9-15) - SHIPPED 2026-07-26</summary>

- [x] **Phase 9: Resume Library Foundation** - Multiple resume versions with CRUD, migration from single file, and selection for analysis (completed 2026-07-02)
- [x] **Phase 10: Match Scoring and Gap Analysis** - Provider-agnostic analysis engine with compatibility score, keyword gaps, and section-level findings (completed 2026-07-02)
- [x] **Phase 11: Section-by-Section Suggestions** - Per-section add/modify/remove suggestions with accept/reject workflow (completed 2026-07-03)
- [x] **Phase 11.5: AI Analysis Provider 🔶 INSERTED** - Multi-provider AI analysis (Gemini, OpenRouter, Groq) with provider selection toggle, API key config, and automatic fallback chain to heuristic (completed 2026-07-03)
- [x] **Phase 12: Tailored Resume Generation** - Apply accepted patches to create a new resume version with side-by-side diff review (completed 2026-07-16)
- [x] **Phase 13: Application Pre-fill and Export** - Pre-fill application from job posting, export resume as PDF or JSON (completed 2026-07-17)
- [x] **Phase 14: UX & Quality Polish from User Feedback** - Resolved GitHub issues #2-#8 from 2026-07-05 UAT: workflow clarity, nav restructuring, resume-library bug fix, editor safety, analysis/writing quality, and lint cleanup (completed 2026-07-19)
- [x] **Phase 15: Tailored Resume Patch Correctness** - Closed silent no-ops in the patch-application engine, scoped AI suggestions away from education, and surfaced skipped patches to the user (completed 2026-07-26)

Archive: [v2.0-ROADMAP.md](milestones/v2.0-ROADMAP.md) | [v2.0-REQUIREMENTS.md](milestones/v2.0-REQUIREMENTS.md) | [v2.0-phases](milestones/v2.0-phases/)

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 1/1 | Complete | 2026-06-25 |
| 2. Resume & Job Input | v1.0 | 4/4 | Complete | 2026-06-26 |
| 3. Cover Letter Generation | v1.0 | 2/2 | Complete | 2026-06-26 |
| 4. Application Tracking | v1.0 | 1/1 | Complete | 2026-06-26 |
| 5. Deployment Readiness | v1.1 | 1/1 | Complete | 2026-06-27 |
| 6. Demo Data & Seeding | v1.1 | 1/1 | Complete | 2026-06-27 |
| 7. Production Deployment | v1.1 | 1/1 | Complete | 2026-06-27 |
| 8. Documentation & Release | v1.1 | 1/1 | Complete | 2026-06-27 |
| 9. Resume Library Foundation | v2.0 | 1/1 | Complete | 2026-07-02 |
| 10. Match Scoring and Gap Analysis | v2.0 | 1/1 | Complete | 2026-07-02 |
| 11. Section-by-Section Suggestions | v2.0 | 1/1 | Complete | 2026-07-02 |
| 11.5 AI Analysis Provider 🔶 INSERTED | v2.0 | 2/2 | Complete | 2026-07-03 |
| 12. Tailored Resume Generation | v2.0 | 3/3 | Complete | 2026-07-16 |
| 13. Application Pre-fill and Export | v2.0 | 3/3 | Complete | 2026-07-17 |
| 14. UX & Quality Polish from User Feedback | v2.0 | 9/9 | Complete | 2026-07-19 |
| 15. Tailored Resume Patch Correctness | v2.0 | 1/1 | Complete | 2026-07-26 |

## Next Milestone

No milestone currently planned. Run `/gsd-new-milestone` to scope the next one.
