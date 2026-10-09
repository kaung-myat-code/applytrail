---
status: testing
phase: 17-honest-analysis-output
source: [17-VERIFICATION.md]
started: 2026-10-09T21:25:00Z
updated: 2026-10-09T21:25:00Z
---

## Current Test

number: 1
name: AI-provider eval path with a real key
expected: |
  The AI analysis section appears per pair (no "skipped — no key"), AI suggestions are dumped verbatim with fabrication verdicts, and the run exits 0.
awaiting: user response

## Tests

### 1. AI-provider eval path with a real key
expected: On a machine with an AI provider key set (GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY / GROQ_API_KEY), run `node evals/run-evals.js` once and open evals/reports/report.md. The AI analysis section appears per pair (no "skipped — no key"), AI suggestions are dumped verbatim with fabrication verdicts, and the run exits 0.
result: [pending]

### 2. Analysis page visual rendering of gap notes
expected: In the browser, open the Analysis page for a resume/posting pair with missing keywords and inspect the "Gaps to Address" block. One neutral gap note per missing keyword renders (e.g. "Docker: not on your resume; add a bullet only if you have real experience.") alongside per-section match-rate strings; the block is absent when report.gaps is empty.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
