---
phase: 13-application-pre-fill-and-export
plan: 01
subsystem: api
tags: [express, pdfmake, resume-export, applications]

# Dependency graph
requires:
  - phase: 12-tailored-resume-generation
    provides: resume_library versions, readResumeVersion/writeResumeVersion helpers, VALID_ID guard pattern
provides:
  - "POST /api/applications accepts optional resume_version_id, company, role fields"
  - "server/lib/pdf.js buildResumePdfDefinition pure transform"
  - "GET /api/resume-library/:id/export/json"
  - "GET /api/resume-library/:id/export/pdf"
affects: [13-02-application-prefill-modal, 13-03-resume-library-export-ui]

# Tech tracking
tech-stack:
  added: [pdfmake@^0.3.11]
  patterns:
    - "Pure transform module (no I/O) feeding a route-handler render step, matching server/lib/cover-letter.js shape"
    - "pdfmake font registration at module scope (addFonts + virtualfs.writeFileSync loop), once at startup, not per-request"

key-files:
  created:
    - server/lib/pdf.js
    - server/lib/pdf.test.js
  modified:
    - server/index.js
    - server/package.json
    - server/package-lock.json

key-decisions:
  - "Verified pdfmake@0.3.11's actual installed API via Context7 + direct node inspection before writing Task 3: addFonts() only accepts the flat {fonts} descriptor, and font bytes (vfs) must be separately written via pdfmake.virtualfs.writeFileSync — confirmed both are required together for createPdf().getBuffer() to succeed"
  - "Used plain node assertion scripts for TDD (no test runner installed in this repo) — server/lib/pdf.test.js runs directly via `node lib/pdf.test.js`, consistent with the existing raw `node -e` verification convention used throughout this codebase's PLAN.md files"
  - "resume_version_id validated as format-only (VALID_ID regex), not resolved via readResumeVersion — treated as an optional reference field per plan's explicit instruction, since the resume itself was already validated when saved in Phase 12"

patterns-established:
  - "Export routes follow existing VALID_ID + 404 guard-clause pattern before any file read (path traversal prevention)"

requirements-completed: [PREFILL-03, EXPORT-01, EXPORT-02]

coverage:
  - id: D1
    description: "POST /api/applications accepts and persists an optional, validated resume_version_id without making it required; existing NewApplication.jsx flow unaffected"
    requirement: "PREFILL-03"
    verification:
      - kind: integration
        ref: "manual node http test: POST with only job_posting_id returns 200 with resume_version_id:null; POST with invalid resume_version_id returns 400; POST with invalid status returns 400; POST with company/role override succeeds"
        status: pass
    human_judgment: false
  - id: D2
    description: "GET /api/resume-library/:id/export/json returns the exact stored resume JSON as a downloadable attachment"
    requirement: "EXPORT-01"
    verification:
      - kind: integration
        ref: "manual node http test: 200 status, application/json content-type, Content-Disposition attachment header, body deep-equal to stored resume_library/{id}.json"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/resume-library/:id/export/pdf renders a valid PDF binary from resume data using pdfmake (no headless browser)"
    requirement: "EXPORT-02"
    verification:
      - kind: integration
        ref: "plan's own automated verify script (embedded node script starting server, fetching export/pdf, checking %PDF- magic bytes) — executed directly, PASS with 28493 bytes"
        status: pass
    human_judgment: false
  - id: D4
    description: "Both export routes validate :id format and 404 on missing versions before any file read or PDF render (path traversal prevention)"
    requirement: "EXPORT-01"
    verification:
      - kind: integration
        ref: "manual node http test: invalid id (uppercase) returns 400 on both routes; well-formed non-existent id returns 404 on both routes"
        status: pass
    human_judgment: false
  - id: D5
    description: "buildResumePdfDefinition pure transform produces content blocks in Summary/Skills/Experience/Projects/Education order, handles blank/missing sections defensively, sets defaultStyle.font to Roboto"
    verification:
      - kind: unit
        ref: "server/lib/pdf.test.js (5 assertions: function type, full-resume ordering, blank-resume single-block, missing-keys no-throw, missing-contact no-throw) — all PASS"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-07-17
status: complete
---

# Phase 13 Plan 01: Application Pre-fill Backend and Resume Export Summary

**Backend contract for resume export (JSON/PDF via pdfmake) and application pre-fill (resume_version_id linkage), built and verified before the frontend plans consume it**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-17T19:05:00+08:00 (approx, first commit e48999f at 19:10:47+08:00)
- **Completed:** 2026-07-17T19:15:00+08:00 (approx, last commit 9e7e09e at 19:14:36+08:00)
- **Tasks:** 3 (Task 2 is TDD, 2 commits: test + feat)
- **Files modified:** 5 (server/index.js, server/lib/pdf.js, server/lib/pdf.test.js, server/package.json, server/package-lock.json)

## Accomplishments
- `POST /api/applications` now accepts an optional `resume_version_id` (format-validated via existing `VALID_ID` regex), plus editable `company`/`role` overrides, while the legacy `job_posting_id`-only flow remains fully unchanged
- New `server/lib/pdf.js` pure-transform module maps resume JSON to a pdfmake document definition (Name → Contact → Summary → Skills → Experience → Projects → Education), covered by 5 passing unit tests
- Two new Express routes: `GET /api/resume-library/:id/export/json` (raw stored JSON, downloadable) and `GET /api/resume-library/:id/export/pdf` (rendered PDF binary via pdfmake, no headless browser)
- Correctly registered the Roboto font at module scope using the verified two-step recipe (`addFonts(fonts)` + `virtualfs.writeFileSync` loop over `vfs` entries) — confirmed against the actually-installed pdfmake@0.3.11 API via Context7 docs and direct `node -e` inspection, not assumed from stale documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add resume_version_id to application creation** - `e48999f` (feat)
2. **Task 2: Build server/lib/pdf.js resume-to-PDF transform module** - `7713990` (test, RED) → `4675431` (feat, GREEN)
3. **Task 3: Add JSON and PDF export routes to server/index.js** - `9e7e09e` (feat)

_Note: Task 2 is TDD — RED test commit precedes GREEN implementation commit, confirmed in git log order._

## Files Created/Modified
- `server/lib/pdf.js` - New. `buildResumePdfDefinition(resumeData)` pure transform, no file I/O, no Express dependency
- `server/lib/pdf.test.js` - New. Plain Node `assert`-based tests (no test runner installed in repo), run via `node lib/pdf.test.js`
- `server/index.js` - Modified. `POST /api/applications` gains `resume_version_id`/`company`/`role`; new `pdfmake`/`buildResumePdfDefinition` requires; module-scope Roboto font registration; two new export routes
- `server/package.json` - Modified. Added `pdfmake": "^0.3.11"` dependency
- `server/package-lock.json` - Modified. Lockfile update from `npm install`

## Decisions Made
- Verified pdfmake's real installed API (not just documentation) before writing Task 3, since the plan flagged a known pitfall: `addFonts()` alone is insufficient — font bytes must be separately written into pdfmake's virtual filesystem via `virtualfs.writeFileSync`. Confirmed both steps are required by testing a minimal repro (`node -e` script rendering a PDF and checking for `%PDF-` magic bytes) before integrating into `server/index.js`.
- Chose plain Node `assert` scripts over introducing a test framework (Jest/Mocha) for the TDD task, matching this repo's existing convention of raw `node -e` verification (no test runner currently installed anywhere in the codebase).
- `resume_version_id` is validated only for format (regex), not resolved to an existing file — matches the plan's explicit instruction that this is an optional reference field, not a foreign-key constraint, since the resume was already validated when saved in Phase 12.

## Deviations from Plan

None - plan executed exactly as written. The plan's own inline warnings about pdfmake's font-registration pitfall and the correct `pdfmake.addFonts(RobotoFont.fonts)` + `virtualfs.writeFileSync` recipe were followed precisely, and independently confirmed against Context7 documentation and the actually-installed package before implementation.

## Issues Encountered
- During Task 1 implementation, an initial `Edit` inadvertently removed the `const VALID_STATUSES = [...]` declaration while restructuring the route (the old_string/new_string boundary captured it). Caught immediately via a live functional test (`ReferenceError: VALID_STATUSES is not defined` on the status-validation code path) before committing, and fixed by re-adding the declaration ahead of its first use. No broken state was ever committed — verified via `node --check` and a full functional HTTP test run prior to the Task 1 commit.

## User Setup Required

None - no external service configuration required. `pdfmake` is a pure-JS dependency installed via ordinary `npm install`, no API keys or accounts needed.

## Next Phase Readiness

Backend contract is stable and verified end-to-end (functional HTTP tests against a running server, not just unit tests):
- `resume_version_id` field flows correctly through application creation, ready for plan 13-02's pre-fill modal to populate it
- Export routes return correct content-types, headers, and binary/JSON bodies, ready for plan 13-03's Resume Library UI to wire up download buttons
- No blockers identified for 13-02 or 13-03

## Self-Check: PASSED

All created files verified present on disk; all 5 commits (e48999f, 7713990, 4675431, 9e7e09e, e5ab072) verified present in git log. No missing items.

---
*Phase: 13-application-pre-fill-and-export*
*Completed: 2026-07-17*
