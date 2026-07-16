---
phase: 12-tailored-resume
plan: 03
subsystem: ui
tags: [react, react-router, resume-library, gap-closure]

# Dependency graph
requires:
  - phase: 12-tailored-resume
    provides: GET/PUT /api/resume-library/:id server routes (already correct per 12-UAT.md root-cause analysis)
provides:
  - "/resume/:id client route rendering the Resume editor for a specific library version"
  - "Version-aware Edit links on every Resume Library card"
  - "Id-aware Resume.jsx that fetches/saves the correct library version, or falls back to the legacy singular resume when no id is present"
affects: [13-application-prefill-and-export]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route param branching in a shared page component (Resume.jsx checks useParams().id to decide legacy vs library-scoped fetch/save target) instead of forking into two components"

key-files:
  created: []
  modified:
    - client/src/main.jsx
    - client/src/pages/ResumeLibrary.jsx
    - client/src/pages/Resume.jsx

key-decisions:
  - "Kept the existing no-id /resume route and Resume component untouched in behavior -- added a second /resume/:id route pointing at the same component, with all branching handled inside Resume.jsx via useParams()"
  - "Used explicit if/else request construction (const request = id ? fetch(...) : fetch(...)) rather than ternary URL selection inline in fetch(), so the legacy /api/resume call remains a literal, easily-greppable fetch('/api/resume') for verification and future maintenance"

requirements-completed: [LIBRARY-03, TAILOR-02]

coverage:
  - id: D1
    description: "main.jsx registers /resume/:id route alongside the existing /resume route, both rendering the Resume component"
    requirement: "LIBRARY-03"
    verification:
      - kind: unit
        ref: "node -e static regex assertion against client/src/main.jsx (Task 1 verify block, 12-03-PLAN.md)"
        status: pass
    human_judgment: false
  - id: D2
    description: "ResumeLibrary.jsx Edit link for every card navigates to /resume/${version.id} instead of the static /resume"
    requirement: "LIBRARY-03"
    verification:
      - kind: unit
        ref: "node -e static regex assertion against client/src/pages/ResumeLibrary.jsx (Task 1 verify block, 12-03-PLAN.md)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Resume.jsx reads id via useParams and branches loadResume/handleSave between /api/resume-library/:id (with { resume_data } PUT body) and legacy /api/resume, re-fetching when id changes"
    requirement: "TAILOR-02"
    verification:
      - kind: unit
        ref: "node -e static regex assertion against client/src/pages/Resume.jsx (Task 2 verify block, 12-03-PLAN.md)"
        status: pass
    human_judgment: true
    rationale: "Static regex checks confirm the correct URLs/body shapes are wired, but full end-to-end confirmation (clicking Edit on a freshly tailored card and seeing that card's actual content, then verifying the save persists to the right file and not to server/data/resume.json) requires running the app in a browser, which this worktree's environment could not do (node_modules not installed, see Issues Encountered). Closing G-12-2 for real needs that live-browser check."

# Metrics
duration: 6min
completed: 2026-07-16
status: complete
---

# Phase 12 Plan 03: Gap Closure -- Resume Editor Version-Aware Routing (G-12-2) Summary

**Added `/resume/:id` route, version-aware Edit links on Resume Library cards, and made Resume.jsx branch between `/api/resume-library/:id` and the legacy `/api/resume` based on the URL param, closing the frontend gap that made every "Edit" click land on the default resume regardless of which card was clicked.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-16T11:33:00Z
- **Completed:** 2026-07-16T11:39:08Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Registered `resume/:id` route in `main.jsx` alongside the existing `resume` route, both rendering the same `Resume` component
- `ResumeLibrary.jsx` Edit link now carries the clicked card's `version.id` in the URL (`/resume/${version.id}`) instead of always pointing at the static `/resume`
- `Resume.jsx` reads the `id` route param via `useParams()` and branches `loadResume`/`handleSave` between the library-scoped endpoint (`GET/PUT /api/resume-library/:id`, PUT body shaped `{ resume_data }`) and the legacy singular endpoint (`GET/PUT /api/resume`, raw body) -- with zero behavior change to the no-id path
- `loadResume` now re-runs whenever `id` changes (added to the `useEffect` dependency array), so navigating between two different `/resume/:id` URLs without a full reload re-fetches the correct version

## Task Commits

Each task was committed atomically:

1. **Task 1: Add /resume/:id route and version-aware Edit links** - `607e064` (feat)
2. **Task 2: Make Resume.jsx id-aware for fetch and save** - `ab60b32` (feat)

**Plan metadata:** committed separately via SDK commit step (SUMMARY.md)

## Files Created/Modified
- `client/src/main.jsx` - Added `{ path: 'resume/:id', element: <Resume /> }` route entry
- `client/src/pages/ResumeLibrary.jsx` - Edit link changed from `to="/resume"` to `to={`/resume/${version.id}`}`
- `client/src/pages/Resume.jsx` - Added `useParams` import and `id` destructure; `loadResume` and `handleSave` branch on `id` presence to target `/api/resume-library/:id` (library-scoped) vs `/api/resume` (legacy); `useEffect` dependency array now includes `id`

## Decisions Made
- Kept the fetch/save branching logic inside the existing `Resume` component rather than creating a separate component for the id-aware path -- the plan's `<behavior>` block specified this explicitly ("Resume.jsx itself branches on the presence of the param"), and it avoids duplicating ~500 lines of form JSX
- Used `const request = id ? fetch(A) : fetch(B)` / `const saveRequest = id ? fetch(A, opts) : fetch(B, opts)` rather than building the URL/body inline with ternaries inside a single `fetch()` call, so the legacy `fetch('/api/resume')` and `PUT` calls remain literal substrings matching the plan's own verification regexes (and stay easy to grep for later)

## Deviations from Plan

None - plan executed exactly as written. Both tasks' automated `<verify>` blocks passed on first run for Task 1; Task 2's automated verify initially failed once because a first-pass ternary-inside-fetch() implementation broke the literal `fetch('/api/resume')` string match the plan's own verify script requires -- refactored to explicit branching (still functionally identical, per Rule 1 same-task fix) and the verify block passed on the second run before committing.

## Issues Encountered

The full manual `<verification>` steps in the plan (steps 1-6: `npx vite build`, starting the app, clicking through the UI in a browser, curling the persisted file) could not be executed in this worktree because `node_modules` is not installed here (`npx vite build` attempted to auto-install a mismatched `vite@8` and failed with `ERR_MODULE_NOT_FOUND`), and no browser is available in this execution environment. This is a pre-existing environment limitation, not a regression introduced by this plan's code changes. All of the plan's automated `<verify>` blocks (the authoritative per-task gates) passed, and a manual code-level trace confirms: (a) the route/link changes are syntactically correct (balanced braces/parens checked), (b) `Resume.jsx`'s new branches target exactly the server contract documented in `server/index.js:402-439` (`GET /api/resume-library/:id` returns the raw resume object; `PUT /api/resume-library/:id` expects `{ resume_data }`). Live browser verification of G-12-2 closure is deferred to the orchestrator/user's UAT pass with a running dev server.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- G-12-2's frontend fix is complete and committed; recommend a live UAT pass (start `npm run dev`, click Edit on a freshly tailored resume-library card, confirm the correct content loads and Save persists to that specific version file) to close out the gap with end-to-end confidence before Phase 13 begins
- No blockers for Phase 13 (Application Pre-fill and Export) -- this plan touched only the Resume editor's routing/fetch layer and introduced no new dependencies or schema changes

---
*Phase: 12-tailored-resume*
*Completed: 2026-07-16*
