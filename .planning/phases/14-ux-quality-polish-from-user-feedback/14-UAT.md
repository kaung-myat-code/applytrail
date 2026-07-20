---
status: complete
phase: 14-ux-quality-polish-from-user-feedback
source: [14-VERIFICATION.md]
started: 2026-07-20T00:00:00Z
updated: 2026-07-20T00:00:00Z
---

## Current Test

[testing complete]

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
expected: On the Analysis page for a job posting containing acronyms (e.g. SQL, API), visually confirm the Matched/Missing/Bonus keyword badges and section-level badges render 'SQL'/'API' in correct casing, not 'Sql'/'Api', and read naturally alongside Title-Cased non-acronym keywords.
result: issue
reported: "Driven via chrome-devtools MCP: submitting the Analyze Match form (resume=mr3ldtxymun8qiljd, posting=1782465761338, provider=heuristic) returns HTTP 500 'Analysis failed. Check server logs for details.' Never reaches the keyword badges to check casing. Root cause found by reproducing the heuristic call directly in Node: server/index.js checks `reportValidation.ok` / `suggestionsValidation.ok` (lines 796, 835, 859) but server/lib/analysis/validate.js's validateMatchReport/validateSuggestions return `{ valid, errors }`, never `.ok`. So the check `!reportValidation.ok` is always true and /api/analyze 500s on every request, on every provider path."
severity: blocker

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-14-5
  truth: "Analysis page returns a match report and keyword badges render acronyms in correct casing"
  status: failed
  reason: "User reported: /api/analyze always returns HTTP 500 because index.js checks .ok on validateMatchReport/validateSuggestions results, but lib/analysis/validate.js returns .valid instead of .ok — so the analysis feature is completely broken, not a casing issue"
  severity: blocker
  test: 5
  root_cause: "Field name mismatch between server/index.js (checks .ok) and server/lib/analysis/validate.js (returns .valid) at index.js lines 796, 835, 859"
  artifacts:
    - path: "server/index.js"
      issue: "checks reportValidation.ok / suggestionsValidation.ok which are always undefined"
    - path: "server/lib/analysis/validate.js"
      issue: "validateMatchReport and validateSuggestions return { valid, errors } not { ok, errors }"
  missing:
    - "Fix index.js to check .valid instead of .ok (or rename validate.js's return field to .ok) at all three call sites in the /api/analyze handler"
  debug_session: ""
