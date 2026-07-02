---
phase: 11-suggestions
plan: 01
subsystem: ui
tags: [react, diff-viewer, suggestions, heuristic-analysis, css-modules]

# Dependency graph
requires:
  - phase: 10-analysis
    provides: Match analysis engine with heuristic provider and Analysis page
provides:
  - generateSuggestions function in heuristic provider
  - Suggestions array in POST /api/analyze response
  - ResumeDiffViewer component wrapping react-diff-viewer-continued
  - SuggestionCard component with accept/reject/edit controls
  - ReviewSuggestions page with bulk operations and section grouping
  - /analysis/review route
affects: [12-tailored-resume]

# Tech tracking
tech-stack:
  added: [react-diff-viewer-continued@4.2.2]
  patterns: [suggestion-review-workflow, diff-viewer-integration, bulk-decision-controls]

key-files:
  created:
    - client/src/components/ResumeDiffViewer.jsx
    - client/src/components/ResumeDiffViewer.module.css
    - client/src/components/SuggestionCard.jsx
    - client/src/components/SuggestionCard.module.css
    - client/src/pages/ReviewSuggestions.jsx
    - client/src/pages/ReviewSuggestions.module.css
  modified:
    - server/lib/analysis/providers/heuristic.js
    - server/index.js
    - client/src/pages/Analysis.jsx
    - client/src/pages/Analysis.module.css
    - client/src/main.jsx

key-decisions:
  - "Suggestions returned alongside report from existing POST /api/analyze endpoint (not a separate call)"
  - "Accept/reject state managed in React useState (ephemeral, not persisted)"
  - "Diff viewer shown on toggle (collapsed by default) to avoid overwhelming display"
  - "Cap total suggestions at 20 to prevent UI overload"

patterns-established:
  - "Suggestion data structure: {id, section, type, current, suggested, reason}"
  - "Decision state pattern: {status: accepted|rejected|edited, editedContent?}"
  - "Bulk operations: Accept All / Reject All with count display"

requirements-completed: [SUGGEST-01, SUGGEST-02, SUGGEST-03, SUGGEST-04]

coverage:
  - id: D1
    description: "generateSuggestions function in heuristic provider generating per-section suggestions"
    requirement: SUGGEST-01
    verification:
      - kind: unit
        ref: "node -e verification script — generates 5 suggestions for test resume/posting"
        status: pass
    human_judgment: false
  - id: D2
    description: "POST /api/analyze returns suggestions array alongside report"
    requirement: SUGGEST-01
    verification:
      - kind: integration
        ref: "server/index.js — analyzeResume + generateSuggestions called and returned"
        status: pass
    human_judgment: false
  - id: D3
    description: "SuggestionCard component with accept/reject/edit controls and visual states"
    requirement: SUGGEST-02
    verification:
      - kind: automated_ui
        ref: "client/src/components/SuggestionCard.jsx — renders with all controls"
        status: pass
    human_judgment: false
  - id: D4
    description: "Bulk Accept All and Reject All controls on ReviewSuggestions page"
    requirement: SUGGEST-03
    verification:
      - kind: automated_ui
        ref: "client/src/pages/ReviewSuggestions.jsx — handleAcceptAll/handleRejectAll functions"
        status: pass
    human_judgment: false
  - id: D5
    description: "ResumeDiffViewer component wrapping react-diff-viewer-continued for side-by-side diff"
    requirement: SUGGEST-04
    verification:
      - kind: automated_ui
        ref: "client/src/components/ResumeDiffViewer.jsx — wraps ReactDiffViewer with split view"
        status: pass
    human_judgment: false
  - id: D6
    description: "Review Suggestions link on Analysis page and /analysis/review route"
    requirement: SUGGEST-02
    verification:
      - kind: automated_ui
        ref: "client/src/main.jsx — route registered, Analysis.jsx — link rendered"
        status: pass
    human_judgment: false

# Metrics
duration: 5min
completed: 2026-07-02
status: complete
---

# Phase 11 Plan 01: Section-by-Section Suggestions Summary

**Heuristic-based per-section suggestion generation with accept/reject/edit workflow, bulk controls, and side-by-side diff comparison using react-diff-viewer-continued**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-02T17:13:32Z
- **Completed:** 2026-07-02T17:18:07Z
- **Tasks:** 4
- **Files modified:** 11

## Accomplishments
- Extended heuristic provider with generateSuggestions function producing actionable per-section suggestions (summary modify, skills add, experience add, projects add)
- Created SuggestionCard component with type badges, content previews, accept/reject/edit controls, diff toggle, and visual state indicators (green border for accepted, dimmed for rejected, blue border for edited)
- Created ReviewSuggestions page with section-grouped display, bulk Accept All/Reject All controls, and disabled "Generate Tailored Resume (Coming Soon)" button
- Integrated react-diff-viewer-continued for side-by-side diff comparison on modify-type suggestions

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend -- extend heuristic provider with suggestion generation** - `51179a6` (feat)
2. **Task 2: Install react-diff-viewer-continued and create diff viewer component** - `3185108` (feat)
3. **Task 3: Create SuggestionCard component** - `7add919` (feat)
4. **Task 4: Create ReviewSuggestions page and wire up routing** - `9d78cee` (feat)

## Files Created/Modified
- `server/lib/analysis/providers/heuristic.js` - Added generateSuggestions(resume, report) function with section-specific suggestion logic
- `server/index.js` - Updated POST /api/analyze to return suggestions alongside report
- `client/src/components/ResumeDiffViewer.jsx` - Wrapper around react-diff-viewer-continued with split view
- `client/src/components/ResumeDiffViewer.module.css` - Minimal diff container styling
- `client/src/components/SuggestionCard.jsx` - Individual suggestion display with accept/reject/edit controls
- `client/src/components/SuggestionCard.module.css` - Card styling with visual state variants
- `client/src/pages/ReviewSuggestions.jsx` - Suggestion review page with section grouping and bulk controls
- `client/src/pages/ReviewSuggestions.module.css` - Page layout and bulk action styling
- `client/src/pages/Analysis.jsx` - Added suggestions state and Review Suggestions link
- `client/src/pages/Analysis.module.css` - Added review link and button styling
- `client/src/main.jsx` - Added /analysis/review route

## Decisions Made
- Suggestions returned alongside report from existing POST /api/analyze endpoint (not a separate call) -- avoids redundant API calls since suggestions derive from the same analysis
- Accept/reject state managed in React useState (ephemeral, not persisted) -- workflow designed to be completed in one session
- Diff viewer shown on toggle (collapsed by default) -- many suggestions are simple adds that don't need a diff view
- Cap total suggestions at 20 -- prevents UI overwhelm while covering all relevant gaps

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Suggestion data structure and review workflow ready for Phase 12 (Tailored Resume Generation)
- Phase 12 can read decisions state to apply accepted suggestions to generate a tailored resume
- Disabled "Generate Tailored Resume" button sets user expectations

---
*Phase: 11-suggestions*
*Completed: 2026-07-02*
