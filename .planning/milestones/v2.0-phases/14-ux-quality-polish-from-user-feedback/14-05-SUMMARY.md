---
phase: 14-ux-quality-polish-from-user-feedback
plan: 05
subsystem: ui
tags: [react, react-router, css-modules, navigation, vitest]

requires:
  - phase: 14-02
    provides: Analysis page suggestions review flow (Link to /analysis/review with suggestions state)
provides:
  - Grouped top-level navbar (Dashboard, Resume group, New Application, Tailor group, Applications) replacing the flat 7-item nav
  - Click-to-open, single-open-at-a-time dropdown group interaction pattern (Escape/outside-click/child-select to close)
  - "Continue to Review Suggestions →" CTA copy on the Analysis page
affects: [navigation, analysis]

tech-stack:
  added: []
  patterns:
    - "Dropdown group state via single openGroup useState (label or null), closed by mousedown-outside and Escape-keydown document listeners scoped to a navRef, mirroring CreateApplicationModal's Escape idiom"

key-files:
  created:
    - client/src/components/Navbar/Navbar.test.jsx
  modified:
    - client/src/components/Navbar/Navbar.jsx
    - client/src/components/Navbar/Navbar.module.css
    - client/src/pages/Analysis.jsx

key-decisions:
  - "Reused existing .link/.active classes for dropdown-panel children so panel links match standalone link styling with zero duplicated CSS"
  - "Derived isLastGroup from a computed lastGroupLabel constant rather than hardcoding 'Tailor', so the right-anchor modifier stays correct if the group order changes"

requirements-completed: [UX-ISSUE-07]

coverage:
  - id: D1
    description: "Top nav collapses into Dashboard, Resume group (Resume, Resume Library), New Application, Tailor group (Analysis, Cover Letter), Applications — with New Application and Applications remaining standalone top-level links"
    requirement: "UX-ISSUE-07"
    verification:
      - kind: unit
        ref: "client/src/components/Navbar/Navbar.test.jsx#renders \"New Application\" and \"Applications\" as plain links with no dropdown trigger, at every point"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exactly one dropdown open at a time; opening Tailor while Resume is open closes Resume"
    requirement: "UX-ISSUE-07"
    verification:
      - kind: unit
        ref: "client/src/components/Navbar/Navbar.test.jsx#closes the \"Resume\" panel and opens the \"Tailor\" panel when \"Tailor\" is clicked while \"Resume\" is open (only one open at a time)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Open dropdown closes on Escape and on outside click"
    requirement: "UX-ISSUE-07"
    verification:
      - kind: unit
        ref: "client/src/components/Navbar/Navbar.test.jsx#closes an open group when Escape is pressed"
        status: pass
      - kind: unit
        ref: "client/src/components/Navbar/Navbar.test.jsx#closes an open group when clicking outside the navbar"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tailor group's dropdown panel is anchored right:0 so it does not clip off the right edge of narrow viewports (backstop truth)"
    requirement: "UX-ISSUE-07"
    verification: []
    human_judgment: true
    rationale: "Visual clipping on narrow viewports is a rendering/layout concern that requires a human (or automated screenshot UAT) to confirm the CSS right-anchor modifier actually prevents overflow in the browser; unit tests only confirm the modifier class is applied, not the rendered geometry."
  - id: D5
    description: "Analysis page's Review Suggestions link reads 'Continue to Review Suggestions →' with the same to/state/className as before"
    requirement: "UX-ISSUE-07"
    verification:
      - kind: other
        ref: "grep -q 'Continue to Review Suggestions' client/src/pages/Analysis.jsx"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-07-20
status: complete
---

# Phase 14 Plan 05: Grouped Navigation and Analysis Continue-CTA Summary

**Collapsed the 7-item flat navbar into Dashboard / Resume-group / New Application / Tailor-group / Applications with click-to-open, single-open-at-a-time dropdowns, and relabeled the Analysis page's suggestions link as an explicit "Continue to Review Suggestions →" step.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-19T23:52:00Z (approx, prior wave-1 tracking commit)
- **Completed:** 2026-07-20T00:04:09+08:00
- **Tasks:** 2
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- `Navbar.jsx` now renders a mixed `navItems` array (standalone links + dropdown groups) instead of a flat `navLinks` list, grouping Resume/Resume Library under "Resume" and Analysis/Cover Letter under "Tailor" per D-05
- Dropdown groups open on click, close on Escape, outside click, or child selection, and only one group is open at a time (mirrors `CreateApplicationModal`'s Escape idiom via `useRef` + document listeners scoped to `openGroup !== null`)
- New CSS: `.groupWrapper`, `.groupTrigger`/`.groupTrigger.active`, `.dropdownPanel`, and a `.dropdownPanelRight` modifier applied to the last group ("Tailor") so its panel anchors `right: 0` instead of clipping off narrow viewports; mobile (`max-width: 640px`) falls back to `position: static`
- `Navbar.test.jsx` added (5 tests) covering: open-on-click, single-open-at-a-time, Escape-to-close, outside-click-to-close, and standalone-link-no-dropdown-affordance for New Application/Applications
- Analysis page's Review Suggestions `Link` text changed from `Review {N} Suggestions` to `Continue to Review Suggestions →` with `to`/`state`/`className` unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Grouped nav dropdown structure and interaction** - `fb75686` (feat)
2. **Task 2: Continue-to-Review-Suggestions CTA on Analysis page** - `bb64b53` (feat)

_Note: Task 1 was authored TDD-style (tests and implementation together) rather than as separate RED/GREEN commits — the plan's `tdd="true"` flag paired with a single `<action>` block describing both the component and its test file in one pass; both were verified passing before the single commit._

## Files Created/Modified
- `client/src/components/Navbar/Navbar.jsx` - Replaced flat `navLinks` with `navItems` (link/group shapes), added `openGroup` state, `navRef`, outside-click and Escape close handlers, `useLocation`-based active-group styling
- `client/src/components/Navbar/Navbar.module.css` - Added `.groupWrapper`, `.groupTrigger`, `.groupTrigger.active`, `.dropdownPanel`, `.dropdownPanelRight`, mobile `position: static` override
- `client/src/components/Navbar/Navbar.test.jsx` - New vitest + @testing-library/react test file, 5 tests, `MemoryRouter`-wrapped
- `client/src/pages/Analysis.jsx` - Review Suggestions link text changed to "Continue to Review Suggestions →"

## Decisions Made
- Computed `lastGroupLabel` from `navItems` at module scope rather than hardcoding `'Tailor'` as the right-anchored group, so the right-anchor modifier logic stays correct if a future edit reorders groups
- Reused `.link`/`.link.active` classes unmodified for dropdown-panel children (per plan's read_first note) — no new link-item CSS needed beyond the panel container itself

## Deviations from Plan

**1. [Environment/tooling] Missing `node_modules` in the git worktree required temporary symlinks to run tests and build**
- **Found during:** Task 1 verification (`npx vitest run`)
- **Issue:** This worktree was created via `git worktree add` without a `node_modules` install; running `npx vitest` failed with `ERR_MODULE_NOT_FOUND: Cannot find package 'vite'`
- **Fix:** Created temporary symlinks `node_modules -> ../../../node_modules` and `client/node_modules -> ../../../../client/node_modules` pointing at the main checkout's already-installed, already-vetted dependencies (no new packages installed, no `npm install` run). Symlinks were removed after verification completed, leaving `git status` clean (both paths are gitignored regardless).
- **Files modified:** None (symlinks only, gitignored, removed before final commit)
- **Verification:** `npx vitest run` (21/21 tests pass) and `npm run build` (production build succeeds) both ran successfully via the symlinks
- **Committed in:** N/A — symlinks were never staged or committed

---

**Total deviations:** 1 (environment/tooling workaround, not a code change)
**Impact on plan:** No scope creep; purely a local verification-environment fix. No commit contains the symlinks.

## Issues Encountered
None beyond the node_modules workaround documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Navbar and Analysis page changes are self-contained UI changes with no API or data-layer impact; no blockers for subsequent Phase 14 plans
- D4 (right-anchor visual clipping backstop) is flagged `human_judgment: true` — recommend a quick browser check at a narrow viewport width during phase-level UAT to confirm the Tailor dropdown panel doesn't visually clip

---
*Phase: 14-ux-quality-polish-from-user-feedback*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: client/src/components/Navbar/Navbar.jsx
- FOUND: client/src/components/Navbar/Navbar.module.css
- FOUND: client/src/components/Navbar/Navbar.test.jsx
- FOUND: client/src/pages/Analysis.jsx
- FOUND: .planning/phases/14-ux-quality-polish-from-user-feedback/14-05-SUMMARY.md
- FOUND commit: fb75686 (Task 1)
- FOUND commit: bb64b53 (Task 2)
