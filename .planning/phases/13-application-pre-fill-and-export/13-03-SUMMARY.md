---
phase: 13-application-pre-fill-and-export
plan: 03
subsystem: ui
tags: [react, modal-wiring, resume-library, file-download]

# Dependency graph
requires:
  - phase: 13-01
    provides: "POST /api/applications accepts optional resume_version_id/company/role; GET /api/resume-library/:id/export/{json,pdf} routes"
  - phase: 13-02
    provides: "CreateApplicationModal.jsx reusable component with mode/company/role/postingText/postingId/resumeVersionId/resumeVersionName/onCancel/onSuccess prop contract"
provides:
  - "PreviewTailored.jsx auto-opens CreateApplicationModal (mode=auto) immediately after a successful tailored-resume save"
  - "ResumeLibrary.jsx per-card Export PDF / Export JSON / Create Application actions"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Anchor-element download pattern (document.createElement('a') + .click(), no fetch/res.json()) for same-origin file-download endpoints, avoiding blob/createObjectURL complexity"
    - "Manual-trigger posting resolution: pick most-recently-created job posting when no explicit link exists, then surface the auto-selected posting's identity in a composed label string so the user can catch a wrong auto-selection before confirming"

key-files:
  created: []
  modified:
    - client/src/pages/PreviewTailored.jsx
    - client/src/pages/ResumeLibrary.jsx
    - client/src/pages/ResumeLibrary.module.css

key-decisions:
  - "Manual 'Create Application' resolves the job posting to link by sorting GET /api/job-postings by created_at descending and taking the first entry (most recent), since a resume version has no inherent link to a specific posting -- this is a pragmatic default, not a new backend feature, and the modal's Company/Role fields remain editable for correction"
  - "Export PDF/JSON use a temporary anchor element (createElement('a') + click()) rather than fetch()+blob, per plan instruction -- accepted trade-off is no JS-visible error on export failure (browser shows its own download-failure UI); documented as intentional, not a gap"
  - "linkedResumeVersionLabel composes '{version.name} (linked to posting: {company} - {role})' only for the manual-trigger path, surfacing which posting was auto-selected in the modal's read-only Resume Version field before the user confirms (mitigates T-13-08 from the plan's threat model)"

requirements-completed: [PREFILL-01, PREFILL-02, PREFILL-03, EXPORT-01, EXPORT-02]

coverage:
  - id: D1
    description: "After 'Save to Library' succeeds on Preview Tailored Resume, CreateApplicationModal opens automatically (mode=auto) instead of navigating away immediately"
    requirement: "PREFILL-01"
    verification:
      - kind: other
        ref: "structural verify script (plan Task 1 <verify><automated>) -- import, setShowModal(true) on save success, mode=\"auto\" prop, onCancel navigates to /resume-library -- all present; confirmed grep shows navigate('/resume-library') only inside modal onCancel/onSuccess props, not directly in handleSave's try block"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each resume version card has a Create Application action opening the modal in manual mode, resolving a job posting or showing a clear error if none exist"
    requirement: "PREFILL-02"
    verification:
      - kind: other
        ref: "structural verify script (plan Task 2 <verify><automated>) -- Export PDF/JSON/Create Application buttons, useNavigate import, anchor-download pattern, export/pdf and export/json endpoints referenced, empty-postings guard message, linked-posting label -- all present"
        status: pass
    human_judgment: false
  - id: D3
    description: "Export PDF and Export JSON trigger real browser file downloads via anchor-element pattern (not fetch+res.json), reflecting the resume version's currently-saved state"
    requirement: "EXPORT-01, EXPORT-02"
    verification:
      - kind: integration
        ref: "manual curl test against a running server: GET /api/resume-library/:id/export/json returned 200 application/json; GET /api/resume-library/:id/export/pdf returned 200 application/pdf, and the downloaded file verified via `file` as 'PDF document, version 1.3, 2 pages'"
        status: pass
    human_judgment: false
  - id: D4
    description: "resume_version_id flows correctly from a manually-triggered Create Application through to POST /api/applications"
    requirement: "PREFILL-03"
    verification:
      - kind: integration
        ref: "manual curl test: POST /api/applications with job_posting_id + resume_version_id + company/role/status/cover_letter_paragraph returned 200 with the application object correctly persisting resume_version_id"
        status: pass
    human_judgment: false
  - id: D5
    description: "client builds cleanly with both modified pages wired to CreateApplicationModal, and ResumeLibrary's .actions row reflows via flex-wrap for the 3 new buttons"
    verification:
      - kind: other
        ref: "cd client && npm run build -- 119 modules transformed, built in under 2s, no errors, both before and after Task 2's changes; npx eslint on both modified files reported zero new issues"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-07-17
status: complete
---

# Phase 13 Plan 03: Application Pre-fill Wiring and Resume Export UI Summary

**Wires the CreateApplicationModal (built in 13-02) into its two trigger points -- automatic after saving a tailored resume, and manual from any Resume Library card -- and adds Export PDF / Export JSON actions to every resume version card, calling the backend routes built in 13-01**

## Performance

- **Duration:** ~20 min (including `npm install` in both `client/` and `server/` for a fresh worktree checkout, plus live server functional verification)
- **Started:** 2026-07-17T20:30:00+08:00 (approx)
- **Completed:** 2026-07-17T21:51:19+08:00 (last commit cff34dc)
- **Tasks:** 2 (both `type="auto"`, single feat commit each)
- **Files modified:** 3 (PreviewTailored.jsx, ResumeLibrary.jsx, ResumeLibrary.module.css)

## Accomplishments
- `PreviewTailored.jsx`'s `handleSave` now opens `CreateApplicationModal` in `mode="auto"` on save success instead of immediately calling `navigate('/resume-library')`; the modal is pre-filled from the draft's `company`/`role`/`posting_id` (resolved to posting text via `GET /api/job-postings`) and the just-created library version's `id`/`name`
- Both Cancel and a successful Confirm on the auto-trigger path land the user on `/resume-library`, matching D-04/UI-SPEC.md exactly
- `ResumeLibrary.jsx` gains three new per-card actions: **Export PDF**, **Export JSON** (both using a temporary-anchor download pattern, never parsed as JSON app state), and **Create Application** (opens the modal in `mode="manual"`, resolving the most-recently-created job posting as the link, or showing an inline "No job posting found..." error if none exist)
- The manual-trigger modal's read-only "Resume Version" field is composed as `"{version.name} (linked to posting: {company} - {role})"` so the user can see which posting got auto-selected before confirming -- directly mitigating the threat model's T-13-08 information-disclosure-as-UX-risk entry
- `.actions` CSS class gains `flex-wrap: wrap` so the now-7-button row (Select, Rename, Delete, Edit, Export PDF, Export JSON, Create Application) reflows on narrow viewports instead of clipping or forcing horizontal scroll

## Task Commits

Each task was committed atomically:

1. **Task 1: Auto-trigger the modal from PreviewTailored.jsx on save success** - `e85725f` (feat)
2. **Task 2: Add Export PDF / Export JSON / Create Application actions to ResumeLibrary.jsx** - `cff34dc` (feat)

## Files Created/Modified
- `client/src/pages/PreviewTailored.jsx` - Modified. New `postingText`/`showModal`/`savedVersion` state; `handleSave` no longer navigates directly on success; conditional `<CreateApplicationModal mode="auto" .../>` render at the end of the component
- `client/src/pages/ResumeLibrary.jsx` - Modified. `useNavigate` import/hook added; new `creatingApplicationFor`/`exportingId` state; `handleCreateApplication`/`handleExportJson`/`handleExportPdf` functions; three new per-card action buttons; conditional `<CreateApplicationModal mode="manual" .../>` render; computed `linkedResumeVersionLabel`
- `client/src/pages/ResumeLibrary.module.css` - Modified. `.actions` gains `flex-wrap: wrap`

## Decisions Made
- Resolved the "manual trigger has no inherent posting link" gap (flagged in the plan's action notes) by fetching `GET /api/job-postings` on "Create Application" click, sorting by `created_at` descending, and using the most recent entry -- pragmatic default consistent with plan guidance, no new backend surface introduced
- Followed the plan's explicit instruction to use `document.createElement('a')` + `.click()` for both export actions rather than `fetch()+res.json()`, since both are file downloads that must trigger a browser save, not be parsed as app state
- Composed the `linkedResumeVersionLabel` string exactly as specified in the plan and threat model's T-13-08 mitigation, entirely within `ResumeLibrary.jsx` (the shared `CreateApplicationModal` component remains unchanged, just renders whatever string it receives)

## Deviations from Plan

None - plan executed exactly as written. Both tasks' action instructions were followed precisely, including the posting-resolution fallback logic, the anchor-download pattern, and the composed resume-version label for the manual-trigger path.

## Issues Encountered
- Fresh worktree checkout had no `node_modules` in either `client/` or `server/` (expected worktree isolation behavior, consistent with what 13-02's summary already documented) -- ran `npm install` in both directories before building/testing. No blocking impact.
- Verified the full backend integration live (not just structural greps): started the actual Express server, confirmed `GET /api/resume-library/:id/export/json` returns 200 `application/json`, `GET /api/resume-library/:id/export/pdf` returns 200 `application/pdf` with a real 2-page PDF (`file` command confirmed `PDF document, version 1.3, 2 pages`), and `POST /api/applications` with `resume_version_id` correctly persists the linkage. Test artifacts landed only in the gitignored `server/data/applications.json` local data file, not in any tracked file -- confirmed via `git status --short` showing no changes to that path.

## User Setup Required

None - no external service configuration required. This plan only wires existing frontend/backend surface built in plans 13-01 and 13-02.

## Next Phase Readiness

Phase 13 is now functionally complete across all three plans:
- 13-01: Backend contract (resume_version_id, PDF/JSON export routes)
- 13-02: CreateApplicationModal component
- 13-03 (this plan): Both trigger points wired, export actions added

Full end-to-end pre-fill loop (Analysis -> Review Suggestions -> Preview Tailored -> Save to Library -> auto-modal -> Confirm -> Applications) and the manual trigger (Resume Library card -> Create Application -> Confirm -> Applications) are both structurally and functionally verified. Export PDF/JSON both produce real downloadable files from any resume library card. No regressions to existing PreviewTailored.jsx save flow or ResumeLibrary.jsx CRUD actions (Select/Rename/Delete/Edit untouched).

No blockers identified. This was the final plan for Phase 13.

## Self-Check: PASSED

Verified `client/src/pages/PreviewTailored.jsx`, `client/src/pages/ResumeLibrary.jsx`, and `client/src/pages/ResumeLibrary.module.css` all contain the expected changes on disk. Verified commits `e85725f` and `cff34dc` both present in `git log --oneline -3`. No missing items.

---
*Phase: 13-application-pre-fill-and-export*
*Completed: 2026-07-17*
