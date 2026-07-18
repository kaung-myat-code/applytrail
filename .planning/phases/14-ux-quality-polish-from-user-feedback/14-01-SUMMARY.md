---
phase: 14-ux-quality-polish-from-user-feedback
plan: 01
subsystem: api
tags: [express, resume-schema, validation, testing, node-assert]

requires: []
provides:
  - "defaultResumeData() — single source of truth for a schema-valid blank resume, exported from server/lib/defaultResumeData.js"
  - "Fixed POST /api/resume-library fallback: no longer produces a 400 'Invalid resume data' error when resume_data is omitted"
  - "Regression test suite proving the D-08 fix and documenting the original bug"
affects: [resume-library, resume-schema]

tech-stack:
  added: []
  patterns:
    - "Pure zero-dependency default-data factory module (mirrors server/lib/validateResume.js style)"
    - "Plain assert()+test() harness convention (no test framework) for server/lib/*.test.js files"

key-files:
  created:
    - server/lib/defaultResumeData.js
    - server/lib/defaultResumeData.test.js
  modified:
    - server/index.js
    - server/package.json

key-decisions:
  - "Extracted the blank-resume default into its own module rather than inlining a corrected literal in the route, so it is reusable and independently testable"
  - "Kept regression test narrow (this phase's fix only) per plan's D-10 scope decision — not a broader API contract suite"

patterns-established:
  - "Default-data factory modules return a NEW object/array literal on every call — no shared mutable module-level state"

requirements-completed: [UX-ISSUE-03]

coverage:
  - id: D1
    description: "POST /api/resume-library with an empty JSON body ({}) or no resume_data field returns HTTP 200 with a valid version entry, not a 400 error"
    requirement: "UX-ISSUE-03"
    verification:
      - kind: unit
        ref: "server/lib/defaultResumeData.test.js#defaultResumeData() passes validateResume -- this is the D-08 regression guard"
        status: pass
    human_judgment: false
  - id: D2
    description: "The resume file written for a resume-library version created with no resume_data has contact equal to { email: '', github: '', location: '' }, not {}"
    requirement: "UX-ISSUE-03"
    verification:
      - kind: unit
        ref: "server/lib/defaultResumeData.test.js#returns contact with email/github/location empty strings, not an empty object"
        status: pass
    human_judgment: false
  - id: D3
    description: "POST /api/resume-library handler runs fully synchronously (no await between reading the library index and writing the new version file), so two concurrent requests each get a unique version id without interleaving"
    verification: []
    human_judgment: true
    rationale: "This is a backstop/structural claim about the absence of an await in the handler body, verified by direct code reading during execution (confirmed: no await appears between readLibraryIndex() and writeResumeVersion()/writeLibraryIndex()) rather than an automated concurrency test — no test harness for simulating concurrent HTTP requests exists in this repo, and the plan itself designates this truth as 'verification: backstop'."

duration: 5min
completed: 2026-07-19
status: complete
---

# Phase 14 Plan 01: Fix Resume Library Blank-Resume Default Summary

**Fixed `POST /api/resume-library`'s schema-invalid `contact: {}` fallback by extracting a `defaultResumeData()` module and adding a regression test that proves the original bug and its fix.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-18T19:00:00Z (approx)
- **Completed:** 2026-07-18T19:05:12Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- Extracted the canonical blank-resume shape (per the resume-schema skill's "Create a Blank Resume" template) into `server/lib/defaultResumeData.js`, a pure zero-dependency function returning a fresh object on every call
- Wired `POST /api/resume-library`'s fallback to `defaultResumeData()`, removing the old inline `contact: {}` literal that failed `validateResume`'s `CONTACT_FIELDS` check and caused the confirmed GitHub #3 bug
- Added `server/lib/defaultResumeData.test.js` (3 test blocks) following the existing `pdf.test.js` zero-dependency `assert()`+`test()` harness convention, including a regression-proof companion assertion that the original buggy `contact: {}` shape is rejected by `validateResume` — proving the fix actually fixes something
- Extended `server/package.json`'s `test` script to run both `lib/pdf.test.js` and `lib/defaultResumeData.test.js`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract defaultResumeData() and wire the D-08 fix into POST /api/resume-library** - `adf1ac8` (fix)
2. **Task 2: Regression test + npm test wiring** - `d24cd61` (test)

_Note: Both tasks were marked `tdd="true"` in the plan; behavior/tests were verified via the plan's `<verify>` blocks (`node -e` inline assertions for Task 1, `npm test` for Task 2) rather than a separate RED-commit-first cycle, since Task 1's behavior was proven via a one-line verification script and Task 2 IS the test-authoring task itself._

## Files Created/Modified
- `server/lib/defaultResumeData.js` - New module exporting `defaultResumeData()`, the single source of truth for a schema-valid blank resume
- `server/index.js` - `POST /api/resume-library` fallback changed from inline `{ name: '', contact: {}, ... }` literal to `defaultResumeData()`; require added at top of file
- `server/lib/defaultResumeData.test.js` - New test file, 3 `test()` blocks (function existence, contact shape, validateResume acceptance + regression-proof rejection of the old buggy shape)
- `server/package.json` - `test` script extended to `"node lib/pdf.test.js && node lib/defaultResumeData.test.js"`

## Decisions Made
- Followed the plan exactly: extracted the default into its own module (mirroring `validateResume.js`'s style) rather than fixing the literal inline, so the correct blank-resume shape is reusable and independently testable
- Kept the regression test narrow to this phase's fix only (per plan's D-10 note), not expanding into a general API contract test suite

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `POST /api/resume-library` with no `resume_data` now succeeds (200) with a schema-valid blank resume, closing GitHub #3
- `npm test` in `server/` runs both `pdf.test.js` and `defaultResumeData.test.js`, all passing
- No literal `contact: {}` remains anywhere in `server/index.js`
- Ready for subsequent plans in Phase 14 (14-02 through 14-08) to proceed independently — no shared-file conflicts expected since this plan only touched `server/lib/defaultResumeData.js`, `server/lib/defaultResumeData.test.js`, `server/index.js`, and `server/package.json`

---
*Phase: 14-ux-quality-polish-from-user-feedback*
*Completed: 2026-07-19*
