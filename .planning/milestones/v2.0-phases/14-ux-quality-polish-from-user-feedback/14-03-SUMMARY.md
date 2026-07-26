---
phase: 14-ux-quality-polish-from-user-feedback
plan: 3
subsystem: api
tags: [cover-letter, suggestions, heuristics, acronym-casing, template-variance, grammar-fix]

# Dependency graph
requires:
  - phase: 14-ux-quality-polish-from-user-feedback plan 01/02
    provides: ACRONYM_CASING map in server/lib/analysis/keywords.js
provides:
  - "possessive() grammar helper in server/lib/cover-letter.js"
  - "displayCase() acronym-casing helper in server/lib/analysis/providers/heuristic.js"
  - "pickVariant() deterministic template-variance helper (duplicated in both files)"
  - "server/package.json test script running all 5 server-side test files"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic template variance via pickVariant(variants, seed) — char-code sum modulo variants.length, keyed by (company + role) or joined keyword text, so output stays reproducible across repeat calls with identical inputs but varies across different inputs"
    - "Paired-keyword suggestion loops (for (let i = 0; i < list.length; i += 2)) incorporating up to 2 missing keywords per generated bullet instead of 1"

key-files:
  created:
    - server/lib/cover-letter.test.js
    - server/lib/analysis/providers/heuristic.test.js
  modified:
    - server/lib/cover-letter.js
    - server/lib/analysis/providers/heuristic.js
    - server/package.json

key-decisions:
  - "Exported possessive() from cover-letter.js (in addition to using it internally) so the regression test can call it directly per the plan's literal test description, rather than only asserting indirectly via generateCoverLetter() output"
  - "Reason-clause text in paired experience/project suggestions joins keywords with ' or ' (not ' and ') per the plan's explicit instruction, even though the sentence body uses ' and ' — this was followed literally as specified"

patterns-established:
  - "pickVariant(variants, seed): sum char codes of seed string, modulo variants.length — used identically in both cover-letter.js and heuristic.js for deterministic-but-varied template selection"

requirements-completed: [UX-ISSUE-05]

coverage:
  - id: D1
    description: "generateCoverLetter() never produces a doubled-s possessive for a company name ending in 's' (e.g. 'Northstar Analytics' -> \"Analytics' goals\", not \"Analytics's goals\")"
    requirement: UX-ISSUE-05
    verification:
      - kind: unit
        ref: "server/lib/cover-letter.test.js#possessive('Northstar Analytics') === \"Northstar Analytics'\""
        status: pass
      - kind: unit
        ref: "server/lib/cover-letter.test.js#no generated paragraph contains the literal substring \"s's\" immediately after a company name"
        status: pass
    human_judgment: false
  - id: D2
    description: "generateCoverLetter() still produces the standard possessive for a company name not ending in 's' (e.g. 'Acme' -> \"Acme's goals\")"
    requirement: UX-ISSUE-05
    verification:
      - kind: unit
        ref: "server/lib/cover-letter.test.js#possessive('Acme') === \"Acme's\""
        status: pass
    human_judgment: false
  - id: D3
    description: "generateCoverLetter() output varies (first sentence differs) across two different (company, role) pairs with the same matched resume skills, instead of reading identically templated"
    requirement: UX-ISSUE-05
    verification:
      - kind: unit
        ref: "server/lib/cover-letter.test.js#generateCoverLetter for two different job postings produces paragraphs whose first sentence differs"
        status: pass
    human_judgment: false
  - id: D4
    description: "generateSuggestions() summary/skills/experience/projects suggestion text displays known acronyms correctly-cased (e.g. 'SQL' not 'Sql') by routing every interpolated keyword through displayCase()"
    requirement: UX-ISSUE-05
    verification:
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#summary 'add' suggestion displays 'SQL' correctly-cased, never 'Sql'"
        status: pass
    human_judgment: false
  - id: D5
    description: "generateSuggestions() experience/project 'add' suggestions incorporate more than one missing keyword into a single bullet when two or more are available, and vary their sentence template across different missing-keyword sets"
    requirement: UX-ISSUE-05
    verification:
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#experience add suggestion incorporates two distinct missing keywords in one bullet"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#experience add bullets use different sentence templates for different missing-keyword sets"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-07-20
status: complete
---

# Phase 14 Plan 3: Cover Letter & Suggestion Text Quality Fixes Summary

**Fixed the doubled-s possessive grammar bug and naive acronym capitalization in generated cover letters and resume suggestions, and added deterministic template variance so generated text no longer reads identically templated across different job postings.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-20
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Added `possessive(name)` helper to `server/lib/cover-letter.js` — company names ending in "s" get a bare trailing apostrophe instead of a doubled-s possessive; routed both `buildClosing` and the no-match fallback paragraph through it
- Added `pickVariant(variants, seed)` deterministic template-variance helper to both `cover-letter.js` and `heuristic.js`, keyed respectively by `(company + role)` and joined keyword text, so output stays reproducible/testable while varying across different inputs
- Added 2 more phrasing variants each to `buildIntro` and `buildClosing` in `cover-letter.js` (3 total each)
- Added `displayCase(kw)` helper to `heuristic.js` — consumes `ACRONYM_CASING` from `keywords.js` (added in Plan 14-02), falls back to `capitalize()` for unmapped terms; replaced every raw `capitalize(kw)` call and raw lowercase `kw` interpolation inside `generateSuggestions()`
- Converted the experience-add and projects-add suggestion loops from one-keyword-per-iteration to paired loops that incorporate up to 2 missing keywords per generated bullet, each with 2 new phrasing variants (3 total each) selected via `pickVariant`
- Created `server/lib/cover-letter.test.js` (5 tests) and `server/lib/analysis/providers/heuristic.test.js` (3 tests), both following the existing `pdf.test.js` zero-dependency `assert()`+`test()` harness convention
- Extended `server/package.json`'s `test` script to run all 5 server-side test files: `pdf.test.js`, `defaultResumeData.test.js`, `analysis/keywords.test.js`, `analysis/providers/heuristic.test.js`, `cover-letter.test.js`

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix possessive apostrophe + vary cover-letter templates** - `40bf3a8` (fix)
2. **Task 2: Fix acronym casing + reduce genericness in generateSuggestions(), consolidate npm test** - `9e39569` (fix)

_Note: Both tasks were TDD-flagged (`tdd="true"`) but implemented as combined fix+test commits rather than separate RED/GREEN commits, since the plan's `<action>` blocks specified writing the implementation and its test file together as a single unit of work per task — this matches the granularity the plan's task boundaries were written at._

## Files Created/Modified
- `server/lib/cover-letter.js` - Added `possessive()` and `pickVariant()` helpers; `buildIntro`/`buildClosing` now select from 3 phrasing variants each; both possessive call sites (`buildClosing`, no-match fallback) route through `possessive(company)`; exported `possessive` for direct testing
- `server/lib/cover-letter.test.js` - New: 5 regression tests covering possessive grammar (both branches) and template variance
- `server/lib/analysis/providers/heuristic.js` - Imported `ACRONYM_CASING`; added `displayCase()` and `pickVariant()` helpers; all `capitalize(kw)` calls and raw `kw` interpolations inside `generateSuggestions()` replaced with `displayCase(kw)`; experience/project add-suggestion loops paired (up to 2 keywords/bullet) with 3-variant template selection each
- `server/lib/analysis/providers/heuristic.test.js` - New: 3 regression tests covering acronym casing and multi-keyword/template-variance in suggestions
- `server/package.json` - `test` script extended to run all 5 server-side test files

## Decisions Made
- Exported `possessive()` from `cover-letter.js` so the test file could call it directly, matching the plan's literal test description (`possessive('Northstar Analytics') === "Northstar Analytics'"`) rather than only inferring correctness from `generateCoverLetter()`'s full output
- Followed the plan's explicit (and slightly asymmetric) instruction to join paired keywords with `' and '` in the suggestion body text but `' or '` in the reason-clause text — kept as specified rather than normalizing both to the same conjunction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `server/lib/cover-letter.js` and `server/lib/analysis/providers/heuristic.js` are both fixed and covered by targeted regression tests
- `cd server && npm test` runs all 5 server-side test files and exits 0
- No remaining `${company}'s` literal fragments in `cover-letter.js`; no remaining `capitalize(kw)` calls inside `generateSuggestions()`
- Phase 14 wave 2 plan 3 complete; ready for orchestrator to merge and advance state

---
*Phase: 14-ux-quality-polish-from-user-feedback*
*Completed: 2026-07-20*

## Self-Check: PASSED

All created/modified files and task commit hashes verified present on disk and in git history:
- server/lib/cover-letter.js, server/lib/cover-letter.test.js
- server/lib/analysis/providers/heuristic.js, server/lib/analysis/providers/heuristic.test.js
- server/package.json
- Commit 40bf3a8 (Task 1), Commit 9e39569 (Task 2)
