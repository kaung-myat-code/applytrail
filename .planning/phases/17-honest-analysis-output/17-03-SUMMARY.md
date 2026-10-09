---
phase: 17-honest-analysis-output
plan: 03
subsystem: api
tags: [applyPatches, target_entry, normalizeText, skip-reason, resume-tailoring, validation]

# Dependency graph
requires:
  - phase: 15
    provides: "applyPatches.js section x type matrix and UNSUPPORTED_COMBINATION reachability guard this plan extends"
provides:
  - "SKIP_REASON.TARGET_ENTRY_NOT_FOUND ('target-entry-not-found') in the frozen server enum, with doc comment (known non-defect bucket)"
  - "applyAddToList(entries, bullet, kind, targetEntry) — normalizeText name-match attach with last-entry fallback returning fellBack; add call sites pass suggestion.target_entry and record a visible skip carrying target_entry on fallback (never silent)"
  - "validate.js exports findInResume/normalizeText — the sanctioned resume matcher for applyPatches.js and the OUT-04 eval script"
  - "validateSuggestions warns (not errors) on an unmatched target_entry predicting the last-entry fallback"
affects: [17-honest-analysis-output-plan-04-client-mirror, 17-honest-analysis-output-plan-05-eval]

# Tech tracking
tech-stack:
  added: []
  patterns: ["sanctioned-matcher-reuse (validate.js normalizeText/findInResume exported, no fuzzy reimplementation)", "visible-mis-target-skip (informational fallback recorded in result.skipped with target_entry, not markApplied)"]

key-files:
  created: []
  modified: [server/lib/tailor/applyPatches.js, server/lib/tailor/applyPatches.test.js, server/lib/analysis/validate.js, server/lib/analysis/validate.test.js]

key-decisions:
  - "Followed the PLAN over PATTERNS.md on the fallback recording: an unmatched target_entry records the suggestion in result.skipped (with TARGET_ENTRY_NOT_FOUND + target_entry) and does NOT markApplied — PATTERNS.md's 'still marked applied' note is stale against the plan's must_haves and task action, which are explicit and self-consistent."
  - "target_entry equality is normalizeText comparison (lowercase, whitespace-collapsed, smart-quote-normalized) — imported from validate.js, never raw string equality and never a new fuzzy matcher."
  - "Targeting tests use a multi-entry fixture (baseResume + second experience/project entry): with a single entry the named entry IS the last entry, so the old always-last code would pass the attach tests by coincidence."
  - "markSkipped gained an optional extra-fields spread param rather than a new helper — one skip-recording path, TARGET_ENTRY_NOT_FOUND skips carry target_entry."
  - "REQUIREMENTS.md left untouched: OUT-05 spans plans 03/04 of this parallel wave; the orchestrator owns shared-artifact writes after the wave."

patterns-established:
  - "Sanctioned matcher reuse: consumers import normalizeText/findInResume from validate.js instead of hand-rolling comparisons"
  - "Informational skip pattern: fallback-with-explanation skips are recorded in result.skipped (not applied) with machine reason + interpolatable fields"

requirements-completed: [OUT-05]

# Coverage metadata
coverage:
  - id: D1
    description: "applyPatches add-type patches honor target_entry: bullet attaches to the named experience company / projects name via normalized comparison; unmatched target falls back to the last entry with a visible TARGET_ENTRY_NOT_FOUND skip carrying target_entry; absent target_entry keeps pre-OUT-05 last-entry behavior"
    requirement: OUT-05
    verification:
      - kind: unit
        ref: "server/lib/tailor/applyPatches.test.js#experience + add with target_entry / unmatched target_entry / without target_entry / projects + add with target_entry / case-different target_entry"
        status: pass
    human_judgment: false
  - id: D2
    description: "validate.js exports the sanctioned matcher (findInResume/normalizeText) and validateSuggestions warns on an unmatched target_entry predicting the last-entry fallback"
    requirement: OUT-05
    verification:
      - kind: unit
        ref: "server/lib/analysis/validate.test.js#validate.js exports the sanctioned matcher / target_entry matching no experience company warns / case-insensitive match / projects target_entry / absent-empty-summary-skills"
        status: pass
    human_judgment: false

# Metrics
duration: 14min
completed: 2026-10-09
status: complete
---

# Phase 17 Plan 03: target_entry Patch Targeting Summary

**target_entry-aware applyAddToList attaches tailored bullets to the named experience/project entry via the exported validate.js normalizeText matcher, with a visible TARGET_ENTRY_NOT_FOUND skip (carrying target_entry) on last-entry fallback — resolving the WR-06 always-last-entry defect**

## Performance

- **Duration:** 14 min
- **Started:** 2026-10-09T15:43:07Z
- **Completed:** 2026-10-09T15:57:39Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Add-type experience/projects patches now attach to the entry named by suggestion.target_entry (normalized case/whitespace/smart-quote-insensitive comparison) instead of blindly using the last entry — fixing the WR-06 correctness defect for tailored resumes
- Unmatched target_entry never silently mis-targets: the bullet still lands on the last entry (informational fallback) but the suggestion is recorded in result.skipped with reason TARGET_ENTRY_NOT_FOUND and the target_entry value for client copy interpolation
- validate.js now exports the sanctioned matcher (findInResume/normalizeText) so applyPatches.js and the OUT-04 eval script reuse one comparison implementation; validateSuggestions warns up-front when a target_entry will predictably miss
- Full TDD cycle honored: 5 target_entry tests committed failing (RED), then implementation (GREEN); full server suite green (64 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Export the sanctioned matcher and add target_entry validation to validate.js** - `ffa6094` (feat)
2. **Task 2: Implement target_entry targeting in applyAddToList (TDD)** - `b429263` (test, RED) + `7f31e41` (feat, GREEN)

## Files Created/Modified
- `server/lib/analysis/validate.js` - Exports findInResume/normalizeText; validateSuggestions warns on unmatched target_entry (experience/projects only; absent/empty target_entry and summary/skills sections stay silent)
- `server/lib/analysis/validate.test.js` - Export assertion + matched/unmatched/case-insensitive/projects/absent-and-summary-skills target_entry warning cases
- `server/lib/tailor/applyPatches.js` - SKIP_REASON.TARGET_ENTRY_NOT_FOUND; applyAddToList gains targetEntry param + fellBack return; experience/projects add call sites branch on fellBack and record the visible skip carrying target_entry; WR-06 comment updated to RESOLVED; imports normalizeText from validate.js
- `server/lib/tailor/applyPatches.test.js` - Five OUT-05 behavior cases on a multi-entry fixture (named-entry attach, unmatched fallback + skip, absent-target regression guard, projects name match, case-insensitive match)

## Decisions Made
- **Plan overrides PATTERNS.md on fallback recording:** the plan's must_haves and Task 2 action state the suggestion is recorded in `result.skipped` (not applied) on unmatched target_entry; PATTERNS.md's older "still marked applied" note was treated as stale. The skip-not-apply choice makes the client's existing staleSkips explanation block render (per the plan's decision traceability).
- **Multi-entry test fixture:** baseResume() has one entry per list, where "named entry" and "last entry" coincide — targeting tests append a second experience/project entry so a targeted attach is genuinely distinguishable from the old always-last behavior.
- **markSkipped extension:** added an optional `extra` spread param instead of a second skip helper, keeping a single skip-recording path.
- **normalizeText equality as the match contract:** matches the plan's resolved edge-probe contract (lowercase, whitespace-collapsed, smart-quote-normalized) — no byte/grapheme-specific comparison.
- **Empty-list edge (plan's resolved contract):** entries.length === 0 keeps the create-new-entry path with fellBack=false — a newly created entry cannot match any target name anyway.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fresh worktree had no server/node_modules — test suite could not run**
- **Found during:** Baseline verification before Task 1
- **Issue:** `cd server && npm test` failed with `Cannot find module 'express'` — the worktree checkout had no installed dependencies
- **Fix:** Ran `npm install` in the worktree's server/ (installing the project's own already-declared dependencies — no new packages added); restored the incidental package-lock.json engines-field sync with a targeted `git checkout -- server/package-lock.json` so task commits stayed scoped
- **Verification:** Baseline suite green (all tests pass) before any code changes
- **Committed in:** not committed (environment-only)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Environment setup only; no scope creep, no plan-content changes.

## Issues Encountered
- None beyond the node_modules setup above. `npm audit` reports advisories in existing dependencies during install — pre-existing and out of scope for this plan (logged here, not fixed).

## Known Stubs
None — no placeholder values, TODOs, or unwired data sources in the files this plan created/modified.

## Next Phase Readiness
- Plan 04 (client mirror): `client/src/lib/skipReasons.js` must mirror `TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found'` (keep `isDefectSkip` untouched per PATTERNS.md) and render the OUT-05 target-entry-not-found copy from the UI-SPEC Copywriting Contract
- Plan 05 (OUT-04 eval): the eval script can now `require('../server/lib/analysis/validate')` for findInResume/normalizeText — no hand-rolled matcher
- OUT-05 is engine-complete; the client enum mirror (Plan 04) is the remaining OUT-05 surface in this phase

## Self-Check: PASSED

- FOUND: server/lib/tailor/applyPatches.js
- FOUND: server/lib/tailor/applyPatches.test.js
- FOUND: server/lib/analysis/validate.js
- FOUND: server/lib/analysis/validate.test.js
- FOUND: ffa6094, b429263, 7f31e41 (all in HEAD history)

---
*Phase: 17-honest-analysis-output*
*Completed: 2026-10-09*
