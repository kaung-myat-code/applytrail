---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Resume Tailoring Flow
current_phase: 15
current_phase_name: tailored-resume-patch-correctness
status: complete
stopped_at: "Phase 15 complete (ad hoc session, no PLAN.md) — applyPatches silent no-ops closed, all 15 section×type combinations tested, education scoped out of AI suggestion schema, skipped patches surfaced in PreviewTailored UI"
last_updated: "2026-07-26T04:30:00.000Z"
last_activity: 2026-07-26
last_activity_desc: "Completed Phase 15 (ad hoc): closed applyPatches silent no-ops (summary+remove, skills+modify), dropped education from AI suggestion schema with per-item validation, surfaced skipped patches in PreviewTailored UI (defect/stale/unknown-reason banners), added 15-combination regression coverage + reachability guard wired into npm test, documented education exclusion in AI_PROVIDERS.md"
progress:
  total_phases: 15
  completed_phases: 7
  total_plans: 21
  completed_plans: 21
  percent: 47
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-16)

**Core value:** End-to-end job application workflow in a web UI -- from resume to cover letter to application tracking -- so the user can manage their job search from any browser.
**Current focus:** v2.0 milestone (Phases 9-15) is now fully complete. No further phases defined in ROADMAP.md; awaiting `/gsd-new-milestone` or roadmap update to plan the next milestone.

## Current Position

Phase: 15 (tailored-resume-patch-correctness) — COMPLETE
Status: Phase 15 complete (ad hoc session), v2.0 milestone (Phases 9-15) fully complete, ready to plan next milestone
Last activity: 2026-07-26 - Completed Phase 15: closed applyPatches silent no-ops, scoped AI suggestions away from education, surfaced skipped patches in the UI, full 15-combination test coverage

Progress: [████████░░░] 47%

## Milestones Shipped

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP | 1-4 | 4 | Complete | 2026-06-26 |
| v1.1 Release Polish | 5-8 | 4 | Complete | 2026-06-27 |

**Archives:** [v1.0](milestones/v1.0-phases/) | [v1.1 Roadmap](milestones/v1.1-ROADMAP.md) | [v1.1 Requirements](milestones/v1.1-REQUIREMENTS.md)

## Performance Metrics

**Velocity:**

- Total plans completed: 18 (across both milestones, Phase 11.5 complete)
- Average duration: ~5 min/plan
- Total execution time: ~50 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 Foundation | 1 | ~10 min | ~10 min |
| 02 Resume & Job Input | 4 | ~15 min | ~4 min |
| 03 Cover Letter Generation | 2 | ~10 min | ~5 min |
| 04 Application Tracking | 1 | ~5 min | ~5 min |
| 05 Deployment Readiness | 1 | ~3 min | ~3 min |
| 06 Demo Data & Seeding | 1 | ~3 min | ~3 min |
| 07 Production Deployment | 1 | ~5 min | ~5 min |
| 08 Documentation & Release | 1 | ~5 min | ~5 min |
| Phase 10-match-scoring P01 | 6min | 2 tasks | 9 files |
| Phase 11-suggestions P01 | 5min | 4 tasks | 11 files |
| Phase 11.5-ai-analysis P01 | 3min | 3 tasks | 5 files |
| Phase 11.5-ai-analysis P02 | 2min | 1 task + verification | 2 files |
| Phase 11-5 P03 | 1min | - tasks | - files |
| 12 | 3 | - | - |
| 13 | 3 | - | - |
| 15 (ad hoc, no PLAN.md) | 1 | - | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v2.0]: Provider-agnostic analysis engine -- heuristics first, swappable to AI/third-party later
- [v2.0]: Structured patch workflow -- analysis never modifies resume directly, returns patches for user approval
- [v2.0]: Resume library with separate files per version -- prevents overwrite, enables versioning
- [Phase ?]: Extracted STOP_WORDS and extractKeywords into shared keywords module to eliminate duplication between cover-letter and analysis
- [Phase ?]: Provider registry pattern: engine.js maps provider name to module, getProvider() returns it; new providers need only a file + registry entry
- [Phase 11]: Suggestions returned alongside report from POST /api/analyze (not a separate endpoint) -- avoids redundant computation
- [Phase 11]: Accept/reject state is ephemeral (React useState), not persisted -- workflow designed for single-session completion
- [Phase 11.5]: Multi-provider AI analysis INSERTED between Phases 11 and 12 -- Gemini, OpenRouter, Groq via Vercel AI SDK, provider selector in UI, automatic fallback chain to heuristic -- no renumbering of existing phases
- [Phase 11.5]: Used generateObject exclusively (not generateText) for all AI calls to guarantee structured output matches Zod schema
- [Phase 11.5]: matchRate normalization required -- AI sometimes returns 0-100 instead of 0-1, added post-processing in ai.js
- [Phase 11.5]: Fallback chain order: gemini → openrouter → groq → heuristic -- configurable via ANALYSIS_PROVIDER env var
- [Phase ?]: OpenRouter uses createOpenAI-compatible with llama-3.3-70b-instruct:free as default model
- [Phase ?]: Groq uses llama-3.3-70b-versatile as default model
- [Phase ?]: Fallback chain order: gemini -> openrouter -> groq -> heuristic
- [Phase 12]: Draft-based tailoring flow -- ephemeral drafts (project-root `drafts/`) hold in-progress patch state; `applyPatches` deep-clones the source resume and only writes a new library version on explicit Save, so the source is never mutated
- [Phase 12]: `?draft=<id>` URL search param (not React Router `location.state`) is the source of truth for cross-page draft state, so refresh survives on both Review and Preview pages
- [Phase 12]: Resume.jsx branches on `useParams().id` (added via gap-closure plan 12-03) to fetch/save either a specific library version or the legacy singular resume -- fixed G-12-2 (Edit link on every library card previously always opened the legacy default resume)
- [Phase 15]: Closed the Phase 12 CR-01/CR-02 deferred gap -- audited the full section×type matrix (not just the two known cases) and found a third silent no-op (skills+modify); split the fix by section: implemented summary+remove and skills+modify in applyPatches.js, but dropped education from the AI provider's suggestion schema instead of implementing it (education is factual, not something a writing suggestion should change)
- [Phase 15]: `applyPatches` return shape changed from `{ resume, validation }` to `{ resume, validation, applied, skipped }` with a closed `SKIP_REASON` enum (`not-found`, `current-mismatch`, `unsupported-combination`) -- additive change, existing consumers reading only `resume`/`validation` are unaffected
- [Phase 15]: AI provider's `generateObject` call for suggestions switched from a strict per-item Zod schema to a permissive schema + individual `safeParse` per item -- prevents one invalid suggestion (e.g. a stray education patch) from discarding the entire batch
- [Phase 15]: client/ and server/ have no shared module boundary (separate npm packages), so `SKIP_REASON` is mirrored in `client/src/lib/skipReasons.js` rather than imported -- same pattern already established by `client/src/lib/keywordCasing.js` for `ACRONYM_CASING`

### Pending Todos

- None open. Phase 13 (Application Pre-fill and Export) and the Phase 12 CR-01/CR-02 deferred `applyPatches` gap are both resolved (Phase 15).

### Blockers/Concerns

- Render free tier (512MB RAM) may constrain export libraries (pdfmake) -- test during Phase 13
- AI API calls introduce latency and potential cost — user must opt in intentionally

## Session Continuity

Last session: 2026-07-26T04:30:00.000Z
Stopped at: Phase 15 complete (ad hoc session, no PLAN.md) -- v2.0 milestone (Phases 9-15) fully complete
Resume file: None -- next step is planning the following milestone via `/gsd-new-milestone`

## Quick Tasks Completed

| Date | Task | Status |
|------|------|--------|
| 2026-07-26 | Fix README placeholder clone URL, add first-person "Why I built this" section, add CI status badge ([260726-4jn-fix-readme-replace-your-username-clone-u](./quick/260726-4jn-fix-readme-replace-your-username-clone-u/)) | ✅ Complete |
| 2026-07-25 | Add GitHub Actions CI workflow (Node 18.x/20.x matrix — lint, test, build) and Dependabot config (npm for root/client/server, github-actions) ([260725-t92-add-github-actions-ci-and-dependabot-con](./quick/260725-t92-add-github-actions-ci-and-dependabot-con/)) | ✅ Complete |
| 2026-07-22 | Consolidate slides/pitch.md, intro.md, tech-stack.md into one up-to-date deck ([260722-u91-consolidate-slides-into-one-deck](./quick/260722-u91-consolidate-slides-into-one-deck/)) | ✅ Complete |
| 2026-07-21 | Polish UI/UX (spacing, color tokens, mobile responsiveness, unified empty/error/loading states) via frontend-design skill ([260721-wdq-polish-ui-ux-using-frontend-design-tidy-](./quick/260721-wdq-polish-ui-ux-using-frontend-design-tidy-/)) | ⚠️ Needs manual 375px browser check |
| 2026-07-21 | Fix remaining GoatCounter CSP block — beacon origin *.goatcounter.com allowlisted in connectSrc ([260721-vks-fix-remaining-goatcounter-csp-block-add-](./quick/260721-vks-fix-remaining-goatcounter-csp-block-add-/)) | ✅ Complete |
| 2026-07-21 | Fix GoatCounter analytics blocked by production CSP (allowlist gc.zgo.at in scriptSrc/connectSrc, [260721-vc7-fix-goatcounter-analytics-not-receiving-](./quick/260721-vc7-fix-goatcounter-analytics-not-receiving-/)) | ✅ Complete |
| 2026-07-21 | Enable GoatCounter analytics in production via render.yaml (site: kaungmyat) | ✅ Complete |
| 2026-07-21 | Add GoatCounter analytics (env-gated, [260721-t54-goatcounter-analytics](./quick/260721-t54-goatcounter-analytics/)) | ✅ Complete |
| 2026-07-21 | Update README.md for shipped v2.0 Resume Tailoring Flow | ✅ Complete |
| 2026-07-05 | Fix OpenRouter rate limit error handling | ✅ Complete |
| 2026-07-05 | Add Groq/OpenRouter provider keys for fallback options | ✅ Complete |
| 2026-07-04 | Update Phase 11.5 planning for multi-provider support | ✅ Complete |
| 2026-07-04 | Fix fallback error message showing wrong provider's error | ✅ Complete |
| 2026-07-04 | Resume schema audit (Phases 9, 10, 11.5) — 9 findings, 1 critical | ✅ Complete |
