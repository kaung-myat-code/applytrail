---
phase: 13-application-pre-fill-and-export
plan: 02
subsystem: ui
tags: [react, css-modules, modal, vitest, testing-library]

# Dependency graph
requires:
  - phase: 13-01
    provides: "POST /api/applications accepts optional resume_version_id/company/role; POST /api/generate-cover-letter existing endpoint contract"
provides:
  - "CreateApplicationModal.jsx — reusable confirmation dialog component (first modal in the codebase)"
  - "CreateApplicationModal.module.css — modal styling using only existing design tokens"
  - "First test file + vitest execution path proven working in this repo (client/src/setupTests.js, vitest.config wired via vite.config.js)"
  - "eslint.config.js test-file globals override (globals.node + globals.vitest for **/*.test.{js,jsx})"
affects: [13-03-resume-library-export-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "First React component test in the repo using @testing-library/react + vitest (both were already installed as devDependencies but unused until this plan)"
    - "Modal dialog pattern: backdrop click dismiss with stopPropagation on the inner dialog surface, Escape keydown listener via useEffect, body scroll-lock via document.body.style.overflow"

key-files:
  created:
    - client/src/components/CreateApplicationModal.jsx
    - client/src/components/CreateApplicationModal.module.css
    - client/src/components/CreateApplicationModal.test.jsx
  modified:
    - client/eslint.config.js

key-decisions:
  - "Followed proper TDD (RED/GREEN) rather than the plan's structural-grep-only verify script, since vitest + @testing-library/react were already installed devDependencies (unused until now) — ran `npm install` in the worktree's client/ to materialize node_modules (not present in a fresh worktree checkout), confirmed vitest executes correctly, then wrote real behavioral tests before implementation"
  - "Added a test-file-scoped eslint override (globals.node + globals.vitest for **/*.test.{js,jsx}) since this is the first test file in the project and the existing eslint.config.js had no override for the `global` identifier used in test mocks"

patterns-established:
  - "Modal/dialog structural pattern: .backdrop (fixed, full-viewport, onClick=onCancel) wrapping .dialog (onClick=stopPropagation), Escape via document-level keydown listener cleaned up on unmount, focus-on-mount via useRef, scroll-lock via body overflow toggled in a cleanup-returning useEffect"

requirements-completed: [PREFILL-01, PREFILL-02, PREFILL-03]

coverage:
  - id: D1
    description: "CreateApplicationModal renders pre-filled Company/Role/Status/Job-Posting-excerpt/Resume-Version-name from props, with Company/Role/Status/Cover-Letter editable and excerpt/resume-version read-only"
    requirement: "PREFILL-01"
    verification:
      - kind: unit
        ref: "client/src/components/CreateApplicationModal.test.jsx#auto-generates a cover letter on mount and shows it once loaded"
        status: pass
      - kind: unit
        ref: "client/src/components/CreateApplicationModal.test.jsx#shows \"No job posting text available.\" when postingText is empty"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cover letter auto-generates on mount via POST /api/generate-cover-letter; failure falls back to empty editable field with inline note, without blocking Confirm"
    requirement: "PREFILL-02"
    verification:
      - kind: unit
        ref: "client/src/components/CreateApplicationModal.test.jsx#falls back to an empty editable field with an inline note when cover-letter generation fails, without blocking Confirm"
        status: pass
    human_judgment: false
  - id: D3
    description: "Confirm and only Confirm triggers POST /api/applications with current field values; onSuccess(data.application) called on 200"
    requirement: "PREFILL-03"
    verification:
      - kind: unit
        ref: "client/src/components/CreateApplicationModal.test.jsx#only calls POST /api/applications when Confirm is explicitly clicked, and calls onSuccess on 200"
        status: pass
    human_judgment: false
  - id: D4
    description: "Cancel button, Escape key, and backdrop click all call onCancel() immediately with zero POST /api/applications calls ever fired"
    requirement: "PREFILL-01"
    verification:
      - kind: unit
        ref: "client/src/components/CreateApplicationModal.test.jsx#calls onCancel and never POSTs /api/applications on Cancel click, Escape key, or backdrop click"
        status: pass
    human_judgment: false
  - id: D5
    description: "CreateApplicationModal.module.css defines every class the component references, using only existing design tokens plus the one documented backdrop rgba literal"
    verification:
      - kind: other
        ref: "node -e structural class-presence check (per plan's <verify><automated> script) — all 16 classes + @keyframes fadeInUp present"
        status: pass
    human_judgment: false
  - id: D6
    description: "Component builds cleanly with the rest of the client bundle (no compile errors from the new files)"
    verification:
      - kind: other
        ref: "cd client && npm run build — 117 modules transformed, built in <1s, no errors"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-07-17
status: complete
---

# Phase 13 Plan 02: CreateApplicationModal Component Summary

**First modal/dialog component in the codebase — pre-fills company/role/job-posting-excerpt/resume-version from props, auto-generates a cover letter on mount, and only creates an application on explicit Confirm — built and verified with real vitest + Testing Library tests (RED/GREEN TDD)**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-17T19:43:24+08:00 (first commit 456c6ee)
- **Completed:** 2026-07-17T19:47:00+08:00 (last commit 640dc86)
- **Tasks:** 2 (Task 1 is TDD: test + feat, Task 2 is a single feat commit)
- **Files modified:** 4 (CreateApplicationModal.jsx, CreateApplicationModal.module.css, CreateApplicationModal.test.jsx, eslint.config.js)

## Accomplishments
- `CreateApplicationModal.jsx` renders Company/Role (editable text inputs), Status (editable select, default `drafted`), a read-only Job Posting excerpt (truncated to 280 chars + "…", or "No job posting text available." backstop), and a read-only Resume Version name display — all pre-filled from props per D-03/D-04
- Cover letter auto-generates on mount via `POST /api/generate-cover-letter`, showing "Generating cover letter..." while in flight; on failure the field falls back to empty + editable with an inline note, never blocking Confirm (per D-05)
- `POST /api/applications` fires exclusively from the `handleConfirm` handler — verified both structurally (grep shows the fetch call only inside `handleConfirm`) and behaviorally (a vitest assertion confirms zero `/api/applications` calls after Cancel/Escape/backdrop-click, and exactly one call with the correct body after an explicit Confirm click)
- Cancel button, Escape keydown, and backdrop click all call `onCancel()` immediately with no network call; clicking inside the dialog surface does not propagate to the backdrop's dismiss handler
- `CreateApplicationModal.module.css` defines all 16 required classes plus a locally-scoped `fadeInUp` keyframe (CSS Modules do not share keyframes across files), reusing only existing `--color-*`/`--space-*`/`--radius-*`/`--shadow-*`/`--font-*` tokens plus the one UI-SPEC-documented `rgba(26, 22, 37, 0.4)` backdrop literal
- Discovered and activated previously-unused test infrastructure: `vitest` + `@testing-library/react` + `@testing-library/jest-dom` were already devDependencies in `client/package.json` with a working `vitest.config` (via `vite.config.js`) and `setupTests.js`, but no test file had ever been written in this repo — this plan's test file is the first to exercise that path successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Build CreateApplicationModal component with cover-letter auto-generation** - `456c6ee` (test, RED) → `f9ef0ad` (feat, GREEN)
2. **Task 2: Style the modal per UI-SPEC.md Modal Interaction Contract** - `640dc86` (feat)

_Note: Task 1 is TDD — RED test commit precedes GREEN implementation commit, confirmed in git log order._

## Files Created/Modified
- `client/src/components/CreateApplicationModal.jsx` - New. Default-exports `CreateApplicationModal({ mode, company, role, postingText, postingId, resumeVersionId, resumeVersionName, onCancel, onSuccess })`, no external state/data fetching beyond the two documented endpoints
- `client/src/components/CreateApplicationModal.module.css` - New. All 16 required CSS Modules classes + locally-scoped `fadeInUp` keyframe
- `client/src/components/CreateApplicationModal.test.jsx` - New. 5 vitest + Testing Library tests covering cover-letter success/failure, Confirm-only POST triggering, Cancel/Escape/backdrop dismissal, and the empty-postingText backstop
- `client/eslint.config.js` - Modified. Added a `**/*.test.{js,jsx}` override providing `globals.node` + `globals.vitest` (the `global` identifier used for `fetch` mocking was previously undefined per eslint, since no test files existed before this plan)

## Decisions Made
- Chose real TDD (RED test that fails because the component doesn't exist yet, then GREEN implementation) over the plan's structural-grep-only `<verify><automated>` script, because `vitest` and `@testing-library/react` were already installed as devDependencies — using them properly (rather than skipping to a plain `node -e` structural check) gives stronger behavioral proof and matches the plan's `tdd="true"` frontmatter flag on Task 1. The plan's own structural verify script was also run afterward and passes.
- `npm install` was required inside `client/` because a fresh worktree checkout does not carry over `node_modules` from the main repo checkout — without this, `vitest` could not resolve `vite` at all. This is expected worktree behavior, not a plan deviation; documented here for traceability.
- Added a minimal eslint override for test files (`globals.node` + `globals.vitest`) rather than disabling the `no-undef` rule outright, keeping the rule's protection everywhere except test files where Node/vitest globals are legitimately used.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lint errors introduced by my own new files**
- **Found during:** Task 1 (running `eslint` against the new component/test files as a self-check before considering the task done)
- **Issue:** `catch (err)` with an unused `err` binding (no-unused-vars), an un-escaped apostrophe in inline JSX text (react/no-unescaped-entities), and `global` being undefined per the project's eslint config (no-undef, since no test files existed before this plan to trigger a Node/vitest globals override)
- **Fix:** Changed `catch (err)` to a bare `catch` where the error value was unused; escaped the apostrophe as `&apos;`; added a `**/*.test.{js,jsx}` eslint override providing `globals.node` + `globals.vitest`
- **Files modified:** `client/src/components/CreateApplicationModal.jsx`, `client/eslint.config.js`
- **Verification:** `npx eslint` on both new files now reports only pre-existing `react/prop-types` errors (confirmed present in unrelated existing files `SuggestionCard.jsx`/`ResumeDiffViewer.jsx` too — out of scope per the scope-boundary rule, not introduced by this plan)
- **Committed in:** `f9ef0ad` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug/lint cleanliness)
**Impact on plan:** Purely additive lint-quality fix scoped to files this plan created; no behavior change, no scope creep. The pre-existing `react/prop-types` gap across the whole codebase was left untouched (out of scope for this plan per the scope boundary rule).

## Issues Encountered
- A fresh git worktree checkout does not include `node_modules` (correctly gitignored) — had to run `npm install` inside `client/` before `vitest`/`eslint`/`vite build` could execute. Resolved immediately, no blocking impact; this is expected worktree isolation behavior, not a code issue.
- One test initially produced a benign "not wrapped in act(...)" React warning because it asserted synchronously before the mount-effect's cover-letter fetch settled. Fixed by awaiting the loading-state teardown in that test — no component code change was needed, this was a test-authoring correctness fix.

## User Setup Required

None - no external service configuration required. This plan builds only a frontend component consuming already-existing endpoints from plan 13-01.

## Next Phase Readiness

`CreateApplicationModal` is fully functional in isolation and ready to be mounted by plan 13-03's two trigger points:
- Auto-trigger: `PreviewTailored.jsx` will mount it with `mode="auto"` immediately after a successful `POST /api/drafts/:id/save`
- Manual-trigger: `ResumeLibrary.jsx` will mount it with `mode="manual"` from a "Create Application" button on a resume version card

No blockers identified for 13-03. The component's prop contract (`{ mode, company, role, postingText, postingId, resumeVersionId, resumeVersionName, onCancel, onSuccess }`) is stable and covered by passing tests.

## Self-Check: PASSED

All created files verified present on disk (`CreateApplicationModal.jsx`, `CreateApplicationModal.module.css`, `CreateApplicationModal.test.jsx`); all 3 commits (`456c6ee`, `f9ef0ad`, `640dc86`) verified present in `git log`. No missing items.

---
*Phase: 13-application-pre-fill-and-export*
*Completed: 2026-07-17*
