---
status: testing
phase: 14-ux-quality-polish-from-user-feedback
source: [14-VERIFICATION.md]
started: 2026-07-20T00:00:00Z
updated: 2026-07-20T00:00:00Z
---

## Current Test

number: 1
name: Cover Letter double-submit guard
expected: |
  Only one POST /api/applications fires; the button shows 'Saving...' and is disabled on the
  second click; only one application record is created; on success the app navigates to
  /applications with no dangling confirm row.
awaiting: user response

## Tests

### 1. Cover Letter double-submit guard
expected: On Cover Letter, select a job posting, generate a cover letter, click 'Save Application', then double-click 'Confirm & Save' rapidly (or click it twice before the request resolves). Only one POST /api/applications fires; the button shows 'Saving...' and is disabled on the second click; only one application record is created; on success the app navigates to /applications with no dangling confirm row.
result: [pending]

### 2. New Application → Cover Letter redirect/banner timing
expected: On New Application, fill in company/role/posting text and submit; confirm you land on /cover-letter with the 'Job posting saved...' banner visible, and that the banner disappears after ~3 seconds. Then navigate to /cover-letter directly (e.g. via the nav) and confirm no banner appears.
result: [pending]

### 3. Cover Letter save-failure retry path
expected: On a Cover Letter Confirm & Save attempt, force a network failure (e.g. stop the API server) and click 'Confirm & Save'. The confirm row stays expanded, an error message renders below the actions row, and 'Confirm & Save' re-enables for retry.
result: [pending]

### 4. Narrow-viewport visual checks
expected: Resize the browser to a narrow/mobile viewport (~375px wide), open the 'Tailor' nav dropdown, and confirm its panel does not visually clip off the right edge of the screen. Separately, resize the Applications list to a narrow viewport and confirm the 'Applied on' / 'Last status change' labels wrap onto separate lines without overlapping.
result: [pending]

### 5. Analysis page keyword badge visual rendering
expected: On the Analysis page for a job posting containing acronyms (e.g. SQL, API), visually confirm the Matched/Missing/Bonus keyword badges and section-level badges render 'SQL'/'API' in correct casing, not 'Sql'/'Api', and read naturally alongside Title-Cased non-acronym keywords.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
