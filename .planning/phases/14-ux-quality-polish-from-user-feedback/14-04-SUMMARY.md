---
phase: 14-ux-quality-polish-from-user-feedback
plan: 4
subsystem: ui
tags: [react, react-router, css-modules]

# Dependency graph
requires: []
provides:
  - "NewApplication.jsx redirects to /cover-letter on save instead of clearing the form in place"
  - "CoverLetter.jsx transitional 'Job posting saved' banner, gated on router state"
  - "CoverLetter.jsx inline Save Application confirm/cancel flow that navigates to /applications on success"
  - "Applications.jsx unambiguous 'Applied on' vs 'Last status change' date labels, wrapping on narrow viewports"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reusing CreateApplicationModal.module.css's .btn/.btnPrimary classes via a second styles import instead of duplicating button CSS"
    - "location.state?.flag with optional chaining to gate a one-time transitional banner across a React Router navigate() redirect"

key-files:
  created: []
  modified:
    - client/src/pages/NewApplication.jsx
    - client/src/pages/CoverLetter.jsx
    - client/src/pages/CoverLetter.module.css
    - client/src/pages/Applications.jsx
    - client/src/pages/Applications.module.css

key-decisions:
  - "Executed the two CoverLetter.jsx edits (Task 1 banner, Task 2 confirm-row) as separate isolated diffs via revert-and-reapply so each task keeps its own atomic commit, since both tasks touch the same file"
  - "daysSinceLastChange(app) is computed once per card (block-body map callback) and reused across the meta row and stale banner instead of calling it three times per render pass"

requirements-completed: [UX-ISSUE-02]

coverage:
  - id: D1
    description: "Saving a job posting on New Application navigates to /cover-letter with a transitional confirmation banner instead of clearing the form in place"
    requirement: "UX-ISSUE-02"
    verification:
      - kind: other
        ref: "grep justSavedPosting in NewApplication.jsx and CoverLetter.jsx; npm run build"
        status: pass
    human_judgment: true
    rationale: "Visual/navigation behavior (banner timing, redirect UX) needs a human to click through the flow in the browser to confirm it feels right."
  - id: D2
    description: "Save Application on Cover Letter expands an inline Confirm & Save / Cancel row, guards double-submit, and navigates to /applications on success"
    requirement: "UX-ISSUE-02"
    verification:
      - kind: other
        ref: "grep 'if (saving) return' and navigate('/applications') in CoverLetter.jsx; npm run build"
        status: pass
    human_judgment: true
    rationale: "Confirm/cancel/error-retry interaction and button disabled states need a human click-through to verify the UX matches intent."
  - id: D3
    description: "Applications list distinguishes Applied on vs Last status change dates, pluralizes correctly, and wraps on narrow viewports"
    requirement: "UX-ISSUE-02"
    verification:
      - kind: other
        ref: "grep 'Applied on', 'Last status change', flex-wrap in Applications.jsx/.module.css; npm run build"
        status: pass
    human_judgment: true
    rationale: "Narrow-viewport wrapping is a visual/backstop criterion that needs a human to resize the browser and confirm no overlap."

duration: 15min
completed: 2026-07-18
status: complete
---

# Phase 14 Plan 4: Job-Posting-to-Application Flow Clarity Summary

**NewApplication redirects to Cover Letter with a transitional banner; Cover Letter's Save Application now expands an inline Confirm & Save/Cancel row that navigates to /applications; Applications list clarifies "Applied on" vs "Last status change" date labels.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-18T19:17:25Z
- **Tasks:** 3
- **Files modified:** 5 (NewApplication.jsx, CoverLetter.jsx, CoverLetter.module.css, Applications.jsx, Applications.module.css)

## Accomplishments
- New Application → Cover Letter now flows as one clear redirect instead of a form that silently clears with a transient message; the transitional banner only appears when arriving via that redirect (gated on `location.state?.justSavedPosting`), and failed saves preserve the user's typed fields.
- Cover Letter's Save Application button now expands an inline confirm row (mirroring CreateApplicationModal's `.btn`/`.btnPrimary` styling and submitting-guard idiom) instead of immediately POSTing and showing a dead-end "View in Applications" link; on success it navigates straight to `/applications`.
- Applications list now reads "Applied on {date}" / "Last status change: {N} day(s) ago" (correctly pluralized) and "Needs follow-up — no status change in {N} days", with `.meta` wrapping instead of overflowing on narrow viewports.

## Task Commits

Each task was committed atomically:

1. **Task 1: NewApplication redirect + Cover Letter transitional banner** - `d2c69e1` (feat)
2. **Task 2: Inline Save Application confirmation on Cover Letter** - `0da2e2a` (feat)
3. **Task 3: Applications list date-clarity labels** - `1486ab1` (feat)

**Plan metadata:** committed alongside this SUMMARY (see final commit)

## Files Created/Modified
- `client/src/pages/NewApplication.jsx` - `handleSubmit` navigates to `/cover-letter` with `{ state: { justSavedPosting: true } }` on success; catch block (failure path) unchanged, still preserves typed fields
- `client/src/pages/CoverLetter.jsx` - transitional `showSavedBanner` state/effect gated on router state; `confirming`/`saveError` state replacing `savedApplication`; `handleSaveClick`/`handleCancelSave`/`handleConfirmSave` (double-submit guarded, navigates to `/applications` on success)
- `client/src/pages/CoverLetter.module.css` - `.savedBanner`, `.confirmRow`, `.confirmPrompt`, `.confirmActions` rules
- `client/src/pages/Applications.jsx` - `days` computed once per card via block-body map callback, reused across the meta row and stale banner; updated copy per D-04
- `client/src/pages/Applications.module.css` - `.meta` gains `flex-wrap: wrap`

## Decisions Made
- Tasks 1 and 2 both modify `CoverLetter.jsx`; to keep atomic per-task commits I applied Task 1's edits, verified/committed, then applied Task 2's edits on top and committed separately (rather than committing both tasks' changes in a single combined diff).
- Reused `CreateApplicationModal.module.css`'s `.btn`/`.btnPrimary` classes via a second `modalStyles` import in `CoverLetter.jsx` per the plan's explicit instruction, rather than duplicating button CSS in `CoverLetter.module.css`.
- Converted the Applications list `.map(app => (...))` (implicit-return arrow) to a block-body arrow function (`.map(app => { const days = ...; return (...) })`) so `daysSinceLastChange(app)` is computed exactly once per card, per the plan's instruction to avoid a third redundant call.

## Deviations from Plan

None - plan executed exactly as written. `npm install` was run in the worktree to make `eslint`/`vite build` available for verification (dependencies already declared in `package.json`, not a new package addition).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three tasks' automated verification greps pass; `npm run build` succeeds with no new eslint errors on the touched files.
- Manual UAT still needed to confirm the redirect timing, confirm-row interaction, and narrow-viewport `.meta` wrapping look/feel right in the browser (see `coverage` entries above, all flagged `human_judgment: true`).
- No blockers for subsequent Phase 14 plans.

---
*Phase: 14-ux-quality-polish-from-user-feedback*
*Completed: 2026-07-18*

## Self-Check: PASSED

All modified files verified present on disk; all three task commit hashes (`d2c69e1`, `0da2e2a`, `1486ab1`) verified present in git log.
