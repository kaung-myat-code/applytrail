---
status: complete
phase: 12-tailored-resume
source: [12-01-SUMMARY.md, 12-02-SUMMARY.md, 12-03-SUMMARY.md]
started: 2026-07-16T11:18:41Z
updated: 2026-07-16T20:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. End-to-End Tailoring Flow (Generate -> Preview -> Save)
expected: Click through Analyze -> Review Suggestions -> accept/edit at least one suggestion -> click "Generate Tailored Resume" (shows "Generating..." then navigates to preview) -> Preview page renders the full tailored resume read-only with a "Company - Role" name pre-filled and editable -> refresh the preview page and confirm it still loads the same draft (URL search param survives refresh) -> click "Back to Suggestions" and confirm decisions are still there, then refresh that page too and confirm decisions survive -> click "Save to Library" and confirm it navigates to /resume-library with the new tailored version listed, and that re-visiting the old draft URL now shows a not-found error linking back to /analysis.
result: pass
reported: "Originally failed: \"new tailored version is listed, when I click edit to see the update resume it stills show the selected resume data.\" Root-caused as G-12-2 (see Gaps section), fixed by gap-closure plan 12-03, and confirmed resolved by live browser re-test in test 20 (edit persisted correctly to the correct version)."
severity: major

### 3. applyPatches deep-clones without mutating source (D1, TAILOR-01)
expected: applyPatches applies accepted/edited suggestions to a deep copy of the source resume without mutating the original
result: pass
source: automated
coverage_id: D1

### 4. modify/remove patches search all entries, not just the last (D2, TAILOR-01)
expected: modify/remove patches search ALL experience and project entries for the matching bullet, not just the last one
result: pass
source: automated
coverage_id: D2

### 5. Shared validateResume with strengthened type checks (D3, TAILOR-06)
expected: validateResume extracted to server/lib/validateResume.js with strengthened type checks, used by both existing routes and applyPatches
result: pass
source: automated
coverage_id: D3

### 6. POST /api/drafts validation (D4, TAILOR-01)
expected: POST /api/drafts validates resume_id, posting_id, and suggestions structure before creating a draft
result: pass
source: automated
coverage_id: D4

### 7. GET /api/drafts/:id computes tailored_resume (D5, TAILOR-04)
expected: GET /api/drafts/:id returns tailored_resume computed via applyPatches plus source_name enrichment from the library index
result: pass
source: automated
coverage_id: D5

### 8. POST /api/drafts/:id/save creates library version and deletes draft (D6, TAILOR-02)
expected: POST /api/drafts/:id/save validates the tailored resume, creates a new library version with source_id pointing to the source resume, and deletes the draft
result: pass
source: automated
coverage_id: D6

### 9. DELETE /api/drafts/:id removes draft (D7, TAILOR-01)
expected: DELETE /api/drafts/:id removes the draft file and returns { ok: true }; repeat delete returns 404
result: pass
source: automated
coverage_id: D7

### 10. Startup cleanup of orphaned drafts (D8, TAILOR-01)
expected: Startup cleanup (cleanOldDrafts) removes orphaned draft files older than 24 hours
result: pass
source: automated
coverage_id: D8

### 11. Generate button enabling + draft creation (D1, TAILOR-02)
expected: Generate Tailored Resume button is enabled once at least one suggestion is accepted/edited, shows Generating... during the API call, and creates a server-side draft via POST /api/drafts
result: pass
source: automated
coverage_id: D1

### 12. Preview navigation via URL search param (D2, TAILOR-05)
expected: Navigation to preview uses URL search param (?draft=<id>), not React Router location state, so browser refresh preserves the preview
result: pass
source: automated
coverage_id: D2

### 13. ReviewSuggestions hydrates from draft on ?draft=<id> (D3, TAILOR-05)
expected: ReviewSuggestions hydrates suggestions and decisions from GET /api/drafts/:id when ?draft=<id> is present in the URL, fixing the TAILOR-05 state-restoration gap
result: pass
source: automated
coverage_id: D3

### 14. PreviewTailored renders full tailored resume (D4, TAILOR-03)
expected: PreviewTailored fetches the draft from GET /api/drafts/:draftId using the URL search param, renders the full tailored resume read-only (contact, summary, skills, experience, projects, education)
result: pass
source: automated
coverage_id: D4

### 15. Name field pre-filled and editable (D5, LIBRARY-03)
expected: Name field pre-filled with 'Company - Role' from draft data and is editable before saving
result: pass
source: automated
coverage_id: D5

### 16. Save to Library flow (D6, TAILOR-02)
expected: Save to Library sends { name } to POST /api/drafts/:draftId/save, creates a new resume library version with source_id, navigates to /resume-library, and the draft is deleted server-side
result: pass
source: automated
coverage_id: D6

### 17. Back to Suggestions link carries draftId (D7, TAILOR-05)
expected: Back to Suggestions link passes draftId in the URL (/analysis/review?draft=<id>) so ReviewSuggestions can rehydrate accept/reject decisions
result: pass
source: automated
coverage_id: D7

### 18. Draft-not-found error links to /analysis (D8, TAILOR-03)
expected: Draft-not-found (404) on the preview page shows an error with a link to /analysis (full restart), not /analysis/review
result: pass
source: automated
coverage_id: D8

### 19. Frontend build succeeds (D9)
expected: Full frontend build (vite build) succeeds with the new page, updated route, and modified ReviewSuggestions -- no syntax or import errors
result: pass
source: automated
coverage_id: D9

### 20. Live browser click-through of the G-12-2 fix
expected: |
  Start the dev server (npm run dev), navigate to /resume-library, click "Edit" on the tailored
  resume card, confirm the editor loads that card's actual tailored content (not the source/default
  resume), make an edit, save, and re-open the same card to confirm the edit persisted to that
  specific version file only.
result: pass

### 21. Scope decision on CR-01/CR-02 (applyPatches education/summary-remove gaps)
expected: |
  Review 12-REVIEW.md's CR-01 (no 'education' section handling in applyPatches) and CR-02 (no
  'summary'+'remove' handling) -- decide whether these need a follow-up gap-closure plan before
  Phase 13, or are acceptable to defer.
result: pass
reason: "Decision made: deferred, not a code blocker. See ## Deferred Follow-Ups for CR-01/CR-02 detail."

## Summary

total: 21
passed: 21
issues: 0
pending: 0
skipped: 0

## Gaps

- gap_id: G-12-2
  truth: "Saving a tailored resume to the library and then opening it in the Resume editor shows the tailored/patched content, not the original source resume content"
  status: resolved
  reason: "Closed by gap-closure plan 12-03 (adds /resume/:id route, version-aware Edit links, id-aware Resume.jsx fetch/save). Confirmed via re-verification: static code re-inspection, plan 12-03's automated assertions re-run, and a live API round-trip test proving version isolation. Human browser click-through (test 20) confirmed: edit persisted correctly to the specific version."
  severity: major
  test: 2
  root_cause: |
    Not a Phase 12 backend defect -- POST /api/drafts/:id/save (server/index.js:578-613) correctly
    computes the tailored resume via applyPatches and writes it to a new id-keyed library version
    (writeResumeVersion), and GET /api/resume-library/:id (server/index.js:402-412) correctly reads
    that id-specific file. The bug is a pre-existing frontend defect surfaced by Phase 12: the "Edit"
    link on EVERY resume-library card in ResumeLibrary.jsx:194-196 navigates to the static route
    "/resume" with no version id at all. Resume.jsx (loadResume, lines 18-36) has no route param/query
    handling for a version id and unconditionally fetches the legacy singular GET /api/resume (reads
    server/data/resume.json), never GET /api/resume-library/:id. So clicking Edit on ANY library card
    -- tailored or not -- always loads the original default resume, regardless of which version was
    clicked.
  artifacts:
    - client/src/pages/ResumeLibrary.jsx (Edit link missing version id, lines ~194-196)
    - client/src/pages/Resume.jsx (loadResume always calls GET /api/resume, no id-aware fetch, lines ~18-36)
    - server/index.js (GET /api/resume-library/:id already correct, lines ~402-412; PUT /api/resume-library/:id needs checking for symmetric save path)
  missing:
    - "ResumeLibrary.jsx Edit link must carry the version id (e.g. Link to=\"/resume/${version.id}\")"
    - "Router needs a /resume/:id route (client/src/main.jsx or App.jsx)"
    - "Resume.jsx must read the id via useParams and fetch/save against GET and PUT /api/resume-library/:id when an id is present, falling back to the legacy /api/resume endpoint only when no id is given"

## Deferred Follow-Ups

- test: 21
  idea: "CR-01/CR-02 (12-REVIEW.md): applyPatches has no 'education' section handling and no 'summary'+'remove' handling -- both silently no-op. Deferred, not blocking Phase 13. Revisit as a future gap-closure plan."
  deferred_at: 2026-07-16
