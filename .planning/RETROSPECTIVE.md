# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Resume Tailoring Flow

**Shipped:** 2026-07-26
**Phases:** 8 (9, 10, 11, 11.5, 12, 13, 14, 15) | **Plans:** 22

### What Was Built
- Resume Library — multi-version resume management with CRUD, migration from the original singular `resume.json`, and version selection
- Provider-agnostic match analysis engine — heuristic keyword matching plus AI providers (Gemini, OpenRouter, Groq) with automatic fallback chain
- Section-by-section suggestions with accept/reject/edit workflow, bulk controls, and a side-by-side diff viewer
- Deterministic tailored-resume generation — structured patches applied to a deep-cloned source resume via a draft-based review flow (`?draft=<id>`), never mutating the source
- Application pre-fill (auto and manual triggers) and PDF/JSON export via `pdfmake`
- Full UX/quality polish pass resolving GitHub #2-#8 from a real exploratory UAT session
- Hardened patch-application engine: closed three silent no-op gaps (summary+remove, skills+modify, education-all-types), added a closed `SKIP_REASON` enum, and surfaced skipped patches in the UI

### What Worked
- Structured patch workflow (analysis engine never mutates the resume directly, only returns patches for user approval) held up across the whole milestone and made Phase 15's correctness pass tractable — bugs were isolated to `applyPatches.js`'s branch coverage, not spread across the stack.
- Provider-agnostic analysis interface (Phase 10 decision) meant Phase 11.5 (AI providers) slotted in as an inserted phase without touching the UI contract.
- Real exploratory UAT (2026-07-05, `feedback/feedback.md`) converted into tracked GitHub issues (#2-#8) gave Phase 14 concrete, verifiable acceptance criteria instead of vague "polish" work.

### What Was Inefficient
- Phase 15 was implemented ad hoc (directly per user direction, ahead of `PLAN.md`) and its GSD tracking artifacts had to be backfilled afterward — the phase-tracking tooling lagged the actual work.
- Formal `/gsd-verify-work` passes were skipped for Phases 9, 10, 11, and 15 (verification_status stayed `missing` even though UAT/tests existed) — closed at milestone boundary via override rather than during phase execution.
- `.planning/REQUIREMENTS.md` checkboxes for LIBRARY-01/02/04/05 were never flipped after Phase 9 shipped them, creating a false "gap" that had to be manually verified against the live codebase at milestone close.

### Patterns Established
- `applyPatches` return shape `{ resume, validation, applied, skipped }` with a closed `SKIP_REASON` enum (`not-found`, `current-mismatch`, `unsupported-combination`) — additive, so existing consumers reading only `resume`/`validation` are unaffected.
- AI provider suggestion validation: permissive Zod schema + per-item `safeParse`, so one invalid suggestion doesn't discard the whole batch.
- `client/` and `server/` have no shared module boundary (separate npm packages) — shared constants like `SKIP_REASON` get mirrored per side (see `client/src/lib/skipReasons.js`, `client/src/lib/keywordCasing.js`).

### Key Lessons
1. When a phase is executed ad hoc outside the normal plan→execute flow, backfill its GSD artifacts immediately, not at milestone close — it's easy to lose track of which phases still owe a verification pass.
2. Flip REQUIREMENTS.md checkboxes in the same commit that ships the requirement, not later — stale unchecked boxes look like real gaps and cost investigation time at every subsequent milestone/audit checkpoint.
3. A provider-agnostic interface designed early (Phase 10) paid for itself twice: once for the Phase 11.5 AI-provider insertion, once for keeping Phase 15's correctness fixes scoped to a single file.

### Cost Observations
- Sessions: not tracked precisely across this milestone (spans 2026-07-02 to 2026-07-26).
- Notable: the milestone's final phase (15) was the cheapest to fix precisely because the structured-patch architecture from Phase 12 confined the defect surface to one function.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Key Change |
|-----------|--------|------------|
| v1.0 | 4 | Initial CLI→web migration, established React+Express+JSON-file baseline |
| v1.1 | 4 | Production deployment hardening (Render, demo data, docs) — no architecture change |
| v2.0 | 8 | Introduced provider-agnostic AI integration, structured patch workflow, and an inserted phase (11.5) mid-milestone without renumbering |

### Top Lessons (Verified Across Milestones)

1. Provider-agnostic interfaces (analysis engine, cover-letter generation) consistently make later swap-in work (AI providers, new heuristics) cheap — worth the small upfront abstraction cost.
2. Decimal phase insertion (11.5) is a clean way to slot urgent/discovered work into a milestone without renumbering downstream phases.
