---
phase: 12-tailored-resume
plan: 01
subsystem: api
tags: [express, resume-schema, patch-engine, draft-storage, json-storage]

# Dependency graph
requires:
  - phase: 11-suggestions
    provides: Suggestion data structure {id, section, type, current, suggested, reason} and decision state {status, editedContent}
provides:
  - server/lib/validateResume.js -- shared, strengthened resume schema validator
  - server/lib/tailor/applyPatches.js -- deterministic patch application engine
  - POST /api/drafts, GET /api/drafts/:id, POST /api/drafts/:id/save, DELETE /api/drafts/:id
  - cleanOldDrafts() startup cleanup for orphaned draft files
affects: [12-02, 13-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [deep-clone-before-mutate, search-all-entries-for-modify, ephemeral-draft-file-storage]

key-files:
  created:
    - server/lib/validateResume.js
    - server/lib/tailor/applyPatches.js
  modified:
    - server/index.js

key-decisions:
  - "validateResume extracted from server/index.js into shared module with strengthened type checks (contact is object, arrays are arrays, summary is string)"
  - "applyPatches searches ALL entries in experience/projects for modify and remove patches, not just the last entry"
  - "Draft files stored at project-root drafts/ (DATA_DIR convention), consistent with resume_library/ and job_postings.json"
  - "provider stored in draft schema so back-navigation from preview to review can restore AI vs heuristic context"

patterns-established:
  - "Patch application always deep-clones via JSON.parse(JSON.stringify()) before mutating, and validates the result against validateResume before returning"
  - "Draft CRUD helpers (readDraft/writeDraft/deleteDraftFile) follow the same file-per-record pattern as readResumeVersion/writeResumeVersion"

requirements-completed: [TAILOR-01, TAILOR-02, TAILOR-04, TAILOR-06]

coverage:
  - id: D1
    description: "applyPatches applies accepted/edited suggestions to a deep copy of the source resume without mutating the original"
    requirement: TAILOR-01
    verification:
      - kind: unit
        ref: "node -e verification script — deep clone verified, original resume.experience[0].bullets[0] unchanged after patch"
        status: pass
    human_judgment: false
  - id: D2
    description: "modify/remove patches search ALL experience and project entries for the matching bullet, not just the last one"
    requirement: TAILOR-01
    verification:
      - kind: unit
        ref: "node -e verification script — modify on first of two experience entries and first of two project entries both applied correctly"
        status: pass
    human_judgment: false
  - id: D3
    description: "validateResume extracted to server/lib/validateResume.js with strengthened type checks, used by both existing routes and applyPatches"
    requirement: TAILOR-06
    verification:
      - kind: integration
        ref: "server started, PUT /api/resume with malformed body returned 400 with field-level errors from shared validateResume module"
        status: pass
    human_judgment: false
  - id: D4
    description: "POST /api/drafts validates resume_id, posting_id, and suggestions structure before creating a draft"
    requirement: TAILOR-01
    verification:
      - kind: integration
        ref: "curl POST /api/drafts with invalid resume_id -> 400, non-array suggestions -> 400, invalid posting_id -> 404, valid payload -> 200 with draft object"
        status: pass
    human_judgment: false
  - id: D5
    description: "GET /api/drafts/:id returns tailored_resume computed via applyPatches plus source_name enrichment from the library index"
    requirement: TAILOR-04
    verification:
      - kind: integration
        ref: "curl GET /api/drafts/:id — source_name: 'Default Resume', tailored_resume.skills includes patched value, validation.ok true"
        status: pass
    human_judgment: false
  - id: D6
    description: "POST /api/drafts/:id/save validates the tailored resume, creates a new library version with source_id pointing to the source resume, and deletes the draft"
    requirement: TAILOR-02
    verification:
      - kind: integration
        ref: "curl POST /api/drafts/:id/save — new version appears in GET /api/resume-library with source_id set; subsequent GET /api/drafts/:id returns 404"
        status: pass
    human_judgment: false
  - id: D7
    description: "DELETE /api/drafts/:id removes the draft file and returns { ok: true }; repeat delete returns 404"
    requirement: TAILOR-01
    verification:
      - kind: integration
        ref: "curl DELETE /api/drafts/:id -> 200 ok:true, second DELETE -> 404"
        status: pass
    human_judgment: false
  - id: D8
    description: "Startup cleanup (cleanOldDrafts) removes orphaned draft files older than 24 hours"
    requirement: TAILOR-01
    verification:
      - kind: integration
        ref: "seeded drafts/oldd1234567890abc.json with mtime 48h in the past, restarted server, log showed 'Cleaned up 1 orphaned draft(s) older than 24 hours', file removed"
        status: pass
    human_judgment: false

# Metrics
duration: 25min
completed: 2026-07-16
status: complete
---

# Phase 12 Plan 01: Backend — Draft Storage API + Patch Application Engine Summary

**Deterministic patch application engine (searches all experience/project entries, deep-clones before mutating) plus ephemeral draft CRUD storage at project-root drafts/, wired through applyPatches for tailored resume generation**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-16T10:07:00Z
- **Completed:** 2026-07-16T10:32:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extracted `validateResume` from `server/index.js` into `server/lib/validateResume.js` with strengthened type checks (contact must be an object, experience/projects/education must be arrays, skills must be an array, summary must be a string)
- Built `server/lib/tailor/applyPatches.js`: deep-clones the source resume, filters suggestions to only accepted/edited decisions, applies section+type-specific patches, and searches ALL entries (not just the last) in experience and projects for modify/remove operations
- Added four draft CRUD endpoints (`POST /api/drafts`, `GET /api/drafts/:id`, `POST /api/drafts/:id/save`, `DELETE /api/drafts/:id`) storing ephemeral draft state at project-root `drafts/`
- `GET /api/drafts/:id` computes `tailored_resume` on read via `applyPatches` and enriches the response with `source_name` from the library index
- `POST /api/drafts/:id/save` validates the tailored resume, writes a new resume library version with `source_id` linking back to the source resume, and deletes the draft file
- Added `cleanOldDrafts()` to the startup sequence, removing draft files older than 24 hours

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract validateResume and create applyPatches module** - `0a8a17f` (feat)
2. **Task 2: Add draft CRUD routes, tailor endpoint, and startup cleanup to server** - `46b4294` (feat)

## Files Created/Modified
- `server/lib/validateResume.js` - Extracted, strengthened resume schema validator (exported as `{ validateResume }`)
- `server/lib/tailor/applyPatches.js` - Patch application engine: deep-clones, filters accepted/edited suggestions, applies by section+type, searches all entries for experience/projects modify+remove, validates output
- `server/index.js` - Imports `validateResume` and `applyPatches` from shared modules; adds `DRAFTS_DIR`, draft file helpers, `cleanOldDrafts()`, and the four draft CRUD routes; wires `cleanOldDrafts()` into the startup sequence after `migrateResumeLibrary()`

## Decisions Made
- `DRAFTS_DIR` resolves to `path.join(DATA_DIR, 'drafts')` (project root), matching the existing convention where `job_postings.json` and `resume_library/` also live at project root — addresses review concern about path inconsistency
- `applyPatches` searches ALL entries in `experience`/`projects` (not just the last) for `modify` and `remove` patch types — addresses the primary review concern raised by all three cross-AI reviewers
- `provider` is stored on the draft record so the client can restore AI-vs-heuristic context when navigating back from preview to review
- Skills `add` patches deduplicate against existing skills to avoid duplicate entries after repeated accept/save cycles
- `editedContent` on a decision always overrides `suggestion.suggested` when present, matching the Phase 11 decision-state pattern

## Deviations from Plan

None — plan executed exactly as written. The plan's verification script referenced `resume_library/mr3ldtxymun8qiljd.json`, which does not exist in a fresh checkout (`resume_library/` is gitignored, runtime-generated data). Verification was adapted to use the committed `server/demo-data/resume.json` fixture and a live server session (seeded via `seedDemoData()`/`migrateResumeLibrary()`) to exercise the same assertions — this is a verification-tooling adaptation, not a change to plan scope or behavior.

## Issues Encountered
- Server `node_modules` were not present in this fresh worktree checkout; ran `npm install` in `server/` before live-server verification. No code changes required.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `applyPatches` and the draft CRUD API are ready for Plan 12-02 (frontend preview page) to consume
- `GET /api/drafts/:id` already returns `tailored_resume`, `validation`, and `source_name` in the shape the frontend needs for a preview/diff view
- `POST /api/drafts/:id/save` response (`{ ok, version }`) matches the shape used elsewhere for library version creation, so the frontend can reuse existing library-refresh logic after save

---
*Phase: 12-tailored-resume*
*Completed: 2026-07-16*
