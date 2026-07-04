---
type: summary
status: complete
date: 2026-07-04
---

# Resume Schema Audit — Complete

Audited Phase 9 (Resume Library), Phase 10 (Match Scoring), and Phase 11.5 (AI Analysis Provider) for resume-schema skill application points.

## Findings

9 findings across 3 phases:

- **1 CRITICAL:** `edu.bullets` accessed in keyword extraction (`keywords.js:98`) — should not exist per schema
- **3 HIGH:** `e.institution` used instead of `e.school` in heuristic provider; no resume validation on write endpoints; new resume missing `name` field
- **3 MEDIUM:** No resume validation before analysis; no POST validation on library endpoint; AI provider sends unvalidated resume to external API
- **2 LOW:** Trailing period in skills data; no client-side validation before save

## Key Files Affected

- `server/lib/analysis/keywords.js` — `edu.bullets` loop (line 98), wrong comment (line 86)
- `server/lib/analysis/providers/heuristic.js` — `e.institution` (line 141), `e.bullets` (line 141)
- `server/index.js` — `POST /api/resume-library` default missing `name` (line 307), no validation on write endpoints

## Recommendation

**Fix Findings 1-4 and 6 before Phase 12.** Phase 12 generates tailored resumes — if the source resume is invalid, the generated output will also be invalid.

Priority:
1. Fix `edu.bullets` and `e.institution` bugs (Findings 1+2) — direct analysis accuracy issues
2. Add resume validation on write endpoints (Findings 3+4) — prevents data corruption
3. Add pre-analysis validation (Finding 6) — prevents crashes on malformed data
4. Repair current resume data (Finding 8) — quick win

## Full Report

See: `.planning/quick/20260704-resume-schema-audit/FINDINGS.md`
