---
phase: 12-tailored-resume
plan: 02
subsystem: ui
tags: [react, react-router, css-modules, draft-api]

# Dependency graph
requires:
  - phase: 12-tailored-resume (plan 01)
    provides: POST /api/drafts, GET /api/drafts/:id, POST /api/drafts/:id/save, DELETE /api/drafts/:id, applyPatches engine
provides:
  - Generate Tailored Resume button wired to server-side draft creation
  - ReviewSuggestions draft hydration via ?draft=<id> URL search param (TAILOR-05 fix)
  - client/src/pages/PreviewTailored.jsx -- read-only tailored resume preview + Save to Library
  - /analysis/preview route in main.jsx
affects: [13-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [url-search-param-as-source-of-truth, draft-hydration-on-mount, inline-read-only-renderer]

key-files:
  created:
    - client/src/pages/PreviewTailored.jsx
    - client/src/pages/PreviewTailored.module.css
  modified:
    - client/src/pages/ReviewSuggestions.jsx
    - client/src/pages/ReviewSuggestions.module.css
    - client/src/main.jsx

key-decisions:
  - "draftId sourced from useSearchParams (URL), not location.state, in both ReviewSuggestions and PreviewTailored -- survives browser refresh"
  - "ReviewSuggestions treats a present ?draft=<id> as authoritative: it fetches the draft and overwrites suggestions/decisions/resumeId/postingId/provider from the server response rather than trusting stale location.state"
  - "PreviewTailored renders resume sections inline (not a separate ResumeViewer component) -- acceptable per plan scope for the single read-only preview use case in Phase 12"
  - "Save button is disabled when draft validation.ok is false, matching the server's own validation gate in POST /api/drafts/:id/save"

patterns-established:
  - "URL search params are the single source of truth for cross-page ephemeral state (draftId) that must survive a refresh; location.state is only a same-navigation convenience"

requirements-completed: [TAILOR-02, TAILOR-03, TAILOR-05, LIBRARY-03]

coverage:
  - id: D1
    description: "Generate Tailored Resume button is enabled once at least one suggestion is accepted/edited, shows Generating... during the API call, and creates a server-side draft via POST /api/drafts"
    requirement: TAILOR-02
    verification:
      - kind: unit
        ref: "node -e verification script -- useNavigate imported, Coming Soon text removed, provider included in POST body, cursor:pointer default state"
        status: pass
      - kind: integration
        ref: "curl POST /api/drafts with resume_id/posting_id/suggestions/decisions/provider -> 200 with draft object containing id, company, role"
        status: pass
    human_judgment: false
  - id: D2
    description: "Navigation to preview uses URL search param (?draft=<id>), not React Router location state, so browser refresh preserves the preview"
    requirement: TAILOR-05
    verification:
      - kind: unit
        ref: "node -e verification script -- navigate() call targets /analysis/preview?draft=${data.draft.id}"
        status: pass
    human_judgment: false
  - id: D3
    description: "ReviewSuggestions hydrates suggestions and decisions from GET /api/drafts/:id when ?draft=<id> is present in the URL, fixing the TAILOR-05 state-restoration gap"
    requirement: TAILOR-05
    verification:
      - kind: integration
        ref: "curl GET /api/drafts/:id after creation -- response includes suggestions, decisions, resume_id, posting_id, provider matching the values POSTed to /api/drafts"
        status: pass
    human_judgment: false
  - id: D4
    description: "PreviewTailored fetches the draft from GET /api/drafts/:draftId using the URL search param, renders the full tailored resume read-only (contact, summary, skills, experience, projects, education)"
    requirement: TAILOR-03
    verification:
      - kind: unit
        ref: "node -e verification script -- useSearchParams present, /api/drafts/ fetch present, source_name/Based on rendered"
        status: pass
      - kind: integration
        ref: "curl GET /api/drafts/:id -- tailored_resume.skills includes patched 'Kubernetes' addition, tailored_resume.summary reflects modify patch, validation.ok true, source_name 'Default Resume'"
        status: pass
    human_judgment: false
  - id: D5
    description: "Name field pre-filled with 'Company - Role' from draft data and is editable before saving"
    requirement: LIBRARY-03
    verification:
      - kind: unit
        ref: "PreviewTailored.jsx -- setName(`${company} - ${role}`) on draft load, controlled <input> with onChange"
        status: pass
    human_judgment: false
  - id: D6
    description: "Save to Library sends { name } to POST /api/drafts/:draftId/save, creates a new resume library version with source_id, navigates to /resume-library, and the draft is deleted server-side"
    requirement: TAILOR-02
    verification:
      - kind: integration
        ref: "curl POST /api/drafts/:id/save -- 200 with { ok: true, version: { id, name, source_id } }; subsequent GET /api/drafts/:id -> 404; GET /api/resume-library shows new version with matching name and source_id"
        status: pass
    human_judgment: false
  - id: D7
    description: "Back to Suggestions link passes draftId in the URL (/analysis/review?draft=<id>) so ReviewSuggestions can rehydrate accept/reject decisions"
    requirement: TAILOR-05
    verification:
      - kind: unit
        ref: "node -e verification script -- PreviewTailored.jsx contains Link to /analysis/review?draft=${draftId}"
        status: pass
    human_judgment: false
  - id: D8
    description: "Draft-not-found (404) on the preview page shows an error with a link to /analysis (full restart), not /analysis/review"
    requirement: TAILOR-03
    verification:
      - kind: unit
        ref: "PreviewTailored.jsx error state renders <Link to=\"/analysis\">Back to Analysis</Link>"
        status: pass
    human_judgment: false
  - id: D9
    description: "Full frontend build (vite build) succeeds with the new page, updated route, and modified ReviewSuggestions -- no syntax or import errors"
    verification:
      - kind: other
        ref: "cd client && npx vite build -- 117 modules transformed, build succeeded"
        status: pass
    human_judgment: false
  - id: D10
    description: "End-to-end manual browser verification of the full generate -> preview -> save flow, including refresh resilience"
    human_judgment: true
    rationale: "Requires a human to click through the actual browser UI (Generate button, preview rendering, refresh behavior, Save to Library redirect) -- the underlying API contract and component logic were verified via curl and static checks, but visual/interactive confirmation needs a human."
    verification: []
---

# Phase 12 Plan 02: Frontend — Generate Button Wiring + Preview Page + Routing Summary

**Generate button creates a server-side draft and navigates via `?draft=<id>` URL param; new PreviewTailored page renders the full tailored resume read-only with an editable auto-filled name and Save to Library; ReviewSuggestions now hydrates decisions from the draft on return, closing the TAILOR-05 refresh gap**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-16T10:25:00Z
- **Completed:** 2026-07-16T10:42:48Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments
- Wired the "Generate Tailored Resume" button in `ReviewSuggestions.jsx`: enabled once `acceptedCount > 0`, calls `POST /api/drafts` with `resume_id`, `posting_id`, `suggestions`, `decisions`, `provider`, and navigates to `/analysis/preview?draft=<id>` on success
- Fixed the TAILOR-05 state-restoration gap: `ReviewSuggestions` now reads `draftId` from `useSearchParams`, fetches `GET /api/drafts/:id` on mount when present, and hydrates `suggestions`, `decisions`, `resumeId`, `postingId`, and `provider` from the server response instead of resetting decisions to `{}`
- Built `client/src/pages/PreviewTailored.jsx`: fetches the draft by `draftId` from the URL, renders the full tailored resume read-only (contact info, summary, skills as badges, experience/projects with bullets, education), shows the source resume name as a subtitle, and exposes an editable name field pre-filled with `"Company - Role"`
- `Save to Library` posts `{ name }` to `POST /api/drafts/:draftId/save` and navigates to `/resume-library` on success; the button is disabled when the draft's server-computed `validation.ok` is `false`, and validation errors are rendered inline
- `Back to Suggestions` on the preview page links to `/analysis/review?draft=<draftId>`, closing the loop so decisions survive both directions of navigation and a page refresh
- Added the `/analysis/preview` route to `main.jsx`
- Updated `ReviewSuggestions.module.css` so the Generate button's disabled/enabled states use `:disabled` instead of a permanently-disabled style

## Task Commits

Each task was committed atomically:

1. **Task 1: Enable Generate button and add draft hydration to ReviewSuggestions** - `ad14ced` (feat)
2. **Task 2: Create PreviewTailored page with read-only resume renderer and route** - `0928ad4` (feat)

## Files Created/Modified
- `client/src/pages/PreviewTailored.jsx` - New read-only tailored resume preview page: fetches draft by URL `draftId`, renders all resume sections, editable name field, Save to Library, Back to Suggestions
- `client/src/pages/PreviewTailored.module.css` - Styling for the preview page (name field, contact info, section headers, skill badges, entry blocks, validation error box, footer buttons)
- `client/src/pages/ReviewSuggestions.jsx` - Generate button now calls `handleGenerate` (POST /api/drafts, navigate with URL param); added draft hydration branch in the mount `useEffect` keyed on `?draft=<id>`; added `hydrating`/`generating`/`generateError` state
- `client/src/pages/ReviewSuggestions.module.css` - `.generateButton` default state changed to `cursor: pointer`; added `.generateButton:disabled` for the opacity/not-allowed styling
- `client/src/main.jsx` - Imported `PreviewTailored` and added the `{ path: 'analysis/preview', element: <PreviewTailored /> }` route after `analysis/review`

## Decisions Made
- `draftId` is read via `useSearchParams` in both `ReviewSuggestions` and `PreviewTailored` and treated as the authoritative source of truth for which draft to load — `location.state` is only used as a same-navigation convenience (e.g. carrying `company`/`role` for the initial preview render before the fetch resolves)
- When `ReviewSuggestions` mounts with a `draftId` in the URL, the fetched draft's `resume_id`, `posting_id`, and `provider` overwrite any stale values from `location.state` or other search params, since the draft record on the server is the single source of truth for that session
- `PreviewTailored` renders resume sections inline rather than extracting a shared `ResumeViewer` component, per the plan's explicit Phase-12 scope guidance (a shared viewer can be extracted later if export/print flows need one)
- Save button disable logic mirrors the server's own validation gate (`validation.ok === false`) so the UI never lets a user attempt to save a tailored resume the server would reject

## Deviations from Plan

None — plan executed exactly as written. All `<behavior>`, `<action>`, and `<done>` items in both tasks were implemented as specified, and the automated `<verify>` scripts for both tasks pass unmodified.

## Issues Encountered
- `client/node_modules` and `server/node_modules` were not present in this fresh worktree checkout; ran `npm install` in both `client/` and `server/` before build and live-server verification. No code changes required.
- The demo resume/job-posting pair produces zero suggestions from the heuristic engine (already well-matched), so live end-to-end verification of the draft API used a synthetic suggestions/decisions payload (one `skills.add` and one `summary.modify`, matching the `Suggestion`/decision shape from Phase 11) posted directly to `POST /api/drafts` — this exercised the exact request/response contract the UI code depends on (create → hydrate/get → save → delete), just without driving it through the browser's Analyze step first.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The full draft-based tailoring flow (analyze → review → generate → preview → save) is now wired end-to-end on both frontend and backend
- `PreviewTailored.jsx`'s inline read-only resume renderer is a natural extraction candidate for Phase 13 (export as PDF/DOCX/JSON) if a shared `ResumeViewer` component is needed there
- Manual browser UAT (D10 in coverage) is recommended before considering the tailoring flow fully verified: click through Analyze → Review → Generate → Preview → refresh → Back to Suggestions → refresh → Save

---
*Phase: 12-tailored-resume*
*Completed: 2026-07-16*

## Self-Check: PASSED

- FOUND: client/src/pages/PreviewTailored.jsx
- FOUND: client/src/pages/PreviewTailored.module.css
- FOUND: .planning/phases/12-tailored-resume/12-02-SUMMARY.md
- FOUND: commit ad14ced (Task 1)
- FOUND: commit 0928ad4 (Task 2)
- FOUND: commit 277cf32 (SUMMARY)
