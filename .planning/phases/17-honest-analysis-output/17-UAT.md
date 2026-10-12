---
status: testing
phase: 17-honest-analysis-output
source: [17-VERIFICATION.md]
started: 2026-10-09T21:25:00Z
updated: 2026-10-12T10:00:00Z
---

## Current Test

number: 2
name: Analysis page visual rendering of gap notes
expected: |
  One neutral gap note per missing keyword renders (e.g. "Docker: not on your resume; add a bullet only if you have real experience.") alongside per-section match-rate strings; the block is absent when report.gaps is empty.
awaiting: user response

## Tests

### 1. AI-provider eval path with a real key
expected: On a machine with an AI provider key set (GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY / GROQ_API_KEY), run `node evals/run-evals.js` once and open evals/reports/report.md. The AI analysis section appears per pair (no "skipped — no key"), AI suggestions are dumped verbatim with fabrication verdicts, and the run exits 0.
result: pass
notes: Ran `node --env-file=server/.env evals/run-evals.js` (key lives in server/.env, not root .env; runner does not auto-load .env). Report header: "AI provider: run (gemini)". All 5 pairs have an "### AI analysis (gemini)" section; 0 "skipped — no key", 0 "AI path error", 0 FAIL lines, exit 0. 15 AI suggestions dumped verbatim; every modify fabrication verdict = pass via findInResume.

### 2. Analysis page visual rendering of gap notes
expected: In the browser, open the Analysis page for a resume/posting pair with missing keywords and inspect the "Gaps to Address" block. One neutral gap note per missing keyword renders (e.g. "Docker: not on your resume; add a bullet only if you have real experience.") alongside per-section match-rate strings; the block is absent when report.gaps is empty.
result: [pending]

## Summary

total: 2
passed: 1
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
