---
status: testing
phase: 14-ux-quality-polish-from-user-feedback
source: [14-VERIFICATION.md]
started: 2026-07-20T00:00:00Z
updated: 2026-07-21T00:00:00Z
---

## Current Test

number: 5
name: Analysis page keyword badge visual rendering
expected: |
  On the Analysis page for a job posting containing acronyms (e.g. SQL, API), run the match analysis with the heuristic provider. The match report and keyword badges render (Matched/Missing/Bonus sections visible, no 'Analysis failed' error); acronym keywords display as 'SQL'/'API', not 'Sql'/'Api', and read naturally alongside Title-Cased non-acronym keywords.
awaiting: user response

## Tests

### 1. Cover Letter double-submit guard
expected: On Cover Letter, select a job posting, generate a cover letter, click 'Save Application', then double-click 'Confirm & Save' rapidly (or click it twice before the request resolves). Only one POST /api/applications fires; the button shows 'Saving...' and is disabled on the second click; only one application record is created; on success the app navigates to /applications with no dangling confirm row.
result: pass

### 2. New Application → Cover Letter redirect/banner timing
expected: On New Application, fill in company/role/posting text and submit; confirm you land on /cover-letter with the 'Job posting saved...' banner visible, and that the banner disappears after ~3 seconds. Then navigate to /cover-letter directly (e.g. via the nav) and confirm no banner appears.
result: pass

### 3. Cover Letter save-failure retry path
expected: On a Cover Letter Confirm & Save attempt, force a network failure (e.g. stop the API server) and click 'Confirm & Save'. The confirm row stays expanded, an error message renders below the actions row, and 'Confirm & Save' re-enables for retry.
result: pass

### 4. Narrow-viewport visual checks
expected: Resize the browser to a narrow/mobile viewport (~375px wide), open the 'Tailor' nav dropdown, and confirm its panel does not visually clip off the right edge of the screen. Separately, resize the Applications list to a narrow viewport and confirm the 'Applied on' / 'Last status change' labels wrap onto separate lines without overlapping.
result: pass

### 5. Analysis page keyword badge visual rendering
expected: On the Analysis page for a job posting containing acronyms (e.g. SQL, API), run the match analysis with the heuristic provider. The match report and keyword badges render (Matched/Missing/Bonus sections visible, no 'Analysis failed' error); acronym keywords display as 'SQL'/'API', not 'Sql'/'Api', and read naturally alongside Title-Cased non-acronym keywords.
result: pending
note: "Blocking bug G-14-5 (POST /api/analyze 500 on every request) fixed by plan 14-09 — server/index.js now checks .valid instead of the nonexistent .ok on validateMatchReport/validateSuggestions results. Verifier independently confirmed HTTP 200 with a live reproduction of this exact posting. The original visual casing check was never reached before and still needs a human/browser pass."

## Summary

total: 5
passed: 4
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps

- gap_id: G-14-5
  truth: "Analysis page returns a match report and keyword badges render acronyms in correct casing"
  status: code_fixed_pending_reverify
  reason: "Root cause (server/index.js checking .ok instead of .valid on validate.js's { valid, errors } return shape) fixed by gap-closure plan 14-09. Verifier independently reproduced the exact failing request (job_posting_id 1782465761338) and confirmed HTTP 200. The visual acronym-casing half of the original truth statement was never exercised (blocked by the 500) and still needs the Test 5 human check above."
  severity: blocker
  test: 5
  root_cause: "Field name mismatch between server/index.js (checked .ok) and server/lib/analysis/validate.js (returns .valid) at index.js lines 796, 835, 859"
  artifacts:
    - path: "server/index.js"
      issue: "RESOLVED — checks reportValidation.valid / suggestionsValidation.valid, verified against live server response"
    - path: "server/lib/analysis/validate.js"
      issue: "unchanged — validateMatchReport and validateSuggestions return { valid, errors }, now correctly consumed"
  missing:
    - "Human confirmation that keyword badges render acronyms (SQL/API) in correct casing now that the endpoint returns data (Test 5 above)"
  debug_session: ""
