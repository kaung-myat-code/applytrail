---
phase: 17-honest-analysis-output
plan: 02
subsystem: api
tags: [ai-provider, zod, score-normalization, prompt-guardrails, node-test, cjs]

# Dependency graph
requires:
  - phase: 17-01 (scaffold / phase-wide artifact list)
    provides: phase directory and shared patterns (17-PATTERNS.md, 17-RESEARCH.md)
provides:
  - "normalizeReport.js: pure normalizeReportScores() — the single place ai.js delegates score + matchRate normalization"
  - "OUT-06 fix: score [0,1]->*100 rescale deleted; a genuine AI score of 1 renders as 1"
  - "OUT-03 guardrails: both analyzeResume and generateSuggestions prompts forbid inventing content absent from the resume JSON"
  - "OUT-05 provider side: strict suggestionSchema and permissive rawSuggestionSchema accept optional target_entry; generateSuggestions prompt instructs the model to populate it on entry-targeted adds"
  - "normalizeReport.test.js chained into server test chain (score-1 regression + matchRate preservation)"
affects: [17-03, 17-04, analysis-provider, tailor-apply-patches]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-module extraction for testability: normalization split out of ai.js into normalizeReport.js so tests run without loading the ESM 'ai' package (mirrors suggestionSchema.js module-split rationale)"
    - "Plain-Node test(name, fn) + assert + process.exitCode convention (no test runner), chained via && in server/package.json"

key-files:
  created:
    - server/lib/analysis/providers/normalizeReport.js
    - server/lib/analysis/providers/normalizeReport.test.js
  modified:
    - server/lib/analysis/providers/ai.js
    - server/lib/analysis/providers/suggestionSchema.js
    - server/package.json

key-decisions:
  - "OUT-06 resolved contract: score uses Math.round (half-up) then Math.max(0, Math.min(100, ...)); NO [0,1]->*100 branch. matchRate keeps its separate >1 -> /100 then clamp [0,1] handling (Pitfall 1 guard)."
  - "OUT-03 guardrail wording taken verbatim from RESEARCH.md/PATTERNS.md (cited from requirement OUT-03 text) and inserted additively into both prompts after the existing format/verbatim rules — existing strictness/verbatim/education instructions untouched (no over-refusal)."
  - "OUT-05 provider side: target_entry is z.string().nullable().optional() in BOTH the strict suggestionSchema and the permissive rawSuggestionSchema; the per-item suggestionSchema.safeParse drop-invalid loop is unchanged (extended schema now accepts the field instead of stripping it)."
  - "OUT-05 is only partially completed by this plan (provider side). applyPatches attach-by-name, the TARGET_ENTRY_NOT_FOUND skip reason, and the client skipReasons.js mirror land in a later plan — OUT-05 stays open until then."

patterns-established:
  - "Pure normalization module (normalizeReport.js) extracted from provider code for keyless testability"
  - "Anti-fabrication guardrail block shared by both ai.js prompts (additive, after format/verbatim rules)"

requirements-completed: [OUT-03, OUT-06]

# Coverage metadata
coverage:
  - id: D1
    description: "Score/matchRate normalization extracted into normalizeReportScores(); genuine AI score of 1 stays 1 (OUT-06 fix); matchRate >1 -> /100 preserved; chained into server test chain"
    requirement: OUT-06
    verification:
      - kind: unit
        ref: "server/lib/analysis/providers/normalizeReport.test.js (4 tests: score-1 regression, matchRate preservation, score clamp/round, untouched fields)"
        status: pass
      - kind: other
        ref: "cd server && npm test (full chain, exit 0, includes normalizeReport.test.js)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Anti-fabrication guardrail lines present in BOTH ai.js prompts (analyzeResume and generateSuggestions), forbidding inventing skills/employers/titles/metrics/dates/experience absent from the resume JSON (prompt-level presence; live-model compliance is verified by the OUT-04 eval harness, not this plan)"
    requirement: OUT-03
    verification:
      - kind: other
        ref: "node per-prompt count check: 'Never invent' appears exactly 1x in analyzeResume prompt and 1x in generateSuggestions prompt (total grep -c = 2)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Provider-side target_entry: strict suggestionSchema and rawSuggestionSchema both accept optional nullable target_entry; generateSuggestions prompt instructs the model to set it on entry-targeted add suggestions (OUT-05 provider side only — applyPatches attach/fallback is a later plan)"
    requirement: OUT-05
    verification:
      - kind: unit
        ref: "node -e schema check: suggestionSchema.safeParse accepts an add-type experience suggestion with target_entry 'Acme Corp' and preserves the field"
        status: pass
      - kind: other
        ref: "source assertion: rawSuggestionSchema (ai.js) declares target_entry: z.string().nullable().optional(); generateSuggestions prompt contains the target_entry instruction"
        status: pass
    human_judgment: false

# Metrics
duration: 10min
completed: 2026-10-09
status: complete
---

# Phase 17 Plan 02: Honest Analysis Output — AI Provider Hardening Summary

**AI provider hardened against fabrication and score inflation: both prompts now forbid inventing resume content, a genuine score of 1 renders as 1 (not 100), and add-type suggestions can target a specific entry via target_entry**

## Performance

- **Duration:** 10 min
- **Started:** 2026-10-09T15:43:26Z
- **Completed:** 2026-10-09T15:53:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Fixed the OUT-06 score-inflation bug: deleted the score `<=1 -> *100` rescale branch from ai.js; a raw AI score of 1 now clamps/rounds to 1 instead of silently becoming 100
- Extracted score + matchRate normalization into a pure, keyless-testable module (normalizeReportScores) and preserved the separate matchRate `>1 -> /100` handling (Pitfall 1 guard)
- Added a score-1 regression test to the server test chain so the bug cannot silently return
- Added anti-fabrication guardrails to BOTH ai.js prompts (OUT-03) — additive, so legitimate verbatim-copied rephrase/modify suggestions remain generatable (no over-refusal)
- Extended both the strict suggestionSchema and the permissive rawSuggestionSchema with optional target_entry (OUT-05 provider side) and instructed the model to populate it on entry-targeted add suggestions

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD): Extract and fix score normalization (OUT-06)** - RED `ae01f8e` (test) -> GREEN `07541ff` (feat)
2. **Task 2: Anti-fabrication guardrails + target_entry schema (OUT-03, OUT-05 provider side)** - `d94dd82` (feat)

## Files Created/Modified
- `server/lib/analysis/providers/normalizeReport.js` - Pure `normalizeReportScores()`: matchRate `>1 -> /100` then clamp `[0,1]`; score round-half-up then clamp `[0,100]`; no `[0,1]` rescale
- `server/lib/analysis/providers/normalizeReport.test.js` - 4 plain-Node regression tests (score-1 stays 1, matchRate preserved, score clamp, untouched fields)
- `server/lib/analysis/providers/ai.js` - Delegates normalization to `normalizeReportScores`; both prompts gain anti-fabrication guardrails; `rawSuggestionSchema` + generateSuggestions prompt gain target_entry
- `server/lib/analysis/providers/suggestionSchema.js` - Strict schema gains optional nullable target_entry
- `server/package.json` - Test script chained with `&& node lib/analysis/providers/normalizeReport.test.js`

## Decisions Made
- Followed the RESEARCH.md/PATTERNS.md resolved OUT-06 contract exactly: `Math.round` (half-up) then `Math.max(0, Math.min(100, ...))` for score; matchRate keeps its independent `>1 -> /100` then clamp `[0,1]` path. The two normalizations live in one function but use separate logic (Pitfall 1).
- Guardrail wording inserted verbatim from the RESEARCH/PATTERNS citation of OUT-03, placed additively after the existing format (analyzeResume) and verbatim-current (generateSuggestions) rules — no existing strictness/education instructions were altered.
- target_entry is optional + nullable in both schemas; the per-item safeParse drop-invalid loop is untouched, so the extended strict schema now accepts (rather than strips) the field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fresh worktree lacked server/node_modules, blocking the full test-chain verification**
- **Found during:** Task 1 (GREEN verification — `cd server && npm test`)
- **Issue:** The isolated worktree checkout had no `server/node_modules`, so `analyze-route.test.js` (and the rest of the chain) crashed on `Cannot find module 'express'` before reaching the new test. This was a pre-existing environment gap, not caused by the task's changes.
- **Fix:** Ran `cd server && npm ci` to install the existing declared dependencies from the committed `package-lock.json`. This is environment restoration, not a package addition — `server/package.json` was not changed by the install (its only diff remains the planned test-script append) and `server/package-lock.json` is unmodified, satisfying threat T-17-SC ("adds no packages... lockfiles unmodified").
- **Verification:** Full chain then passed with exit 0; `git diff --stat server/package-lock.json` empty.
- **Committed in:** n/a (no repo files changed by the install; node_modules is gitignored)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Environment-only fix required to run the plan's own verification; no code/scope change. All planned artifacts delivered exactly as specified.

## Issues Encountered
- None beyond the environment gap above. The TDD RED phase failed exactly as intended (module-not-found) before GREEN.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OUT-06 and OUT-03 are complete and covered by deterministic tests/checks.
- **OUT-05 is NOT complete** — this plan delivered only the provider side (schema + prompt). The `applyPatches` attach-by-name logic, the `TARGET_ENTRY_NOT_FOUND` skip reason, the `validate.js` target_entry warning, and the `client/src/lib/skipReasons.js` mirror are required before OUT-05 can be marked complete (handled by a later Phase 17 plan).
- No blockers. The normalizeReport.js pure module and the extended schemas are ready for downstream plans (17-03 applyPatches, 17-04 eval harness).

---
*Phase: 17-honest-analysis-output*
*Completed: 2026-10-09*

## Self-Check: PASSED

- All 5 claimed created/modified files verified present on disk
- All 3 task commits verified in git log (`ae01f8e`, `07541ff`, `d94dd82`)
- Full server test chain exits 0; normalizeReport.test.js (4 PASS) and target_entry schema check both green
