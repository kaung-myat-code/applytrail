---
phase: 17-honest-analysis-output
plan: 01
subsystem: api
tags: [javascript, node, express, heuristics, keyword-matching, test-driven]

# Dependency graph
requires: []
provides:
  - "Honest per-keyword gap notes in analyzeResume's report.gaps (OUT-02)"
  - "Fabrication-free generateSuggestions limited to honest summary-add-when-empty (OUT-01)"
affects: [17-honest-analysis-output]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Honest-gap-note: one display-cased '{Keyword}: not on your resume; add a bullet only if you have real experience.' line per missing keyword"
    - "No-fabrication suggestions: never claim a skill/experience the resume does not contain"

key-files:
  created: []
  modified:
    - server/lib/analysis/providers/heuristic.js
    - server/lib/analysis/providers/heuristic.test.js

key-decisions:
  - "Replaced the aggregate 'N posting keywords missing from resume' gap with one honest per-keyword note per missing keyword, reusing the existing hoisted displayCase helper (per UI-SPEC copy contract + RESEARCH option 1)."
  - "Preserved the existing per-section match-rate gap strings as-is (lowercase object-key form, e.g. 'experience: only 0% keyword match') — additive with the new per-keyword lines, not a replacement."
  - "Removed EXPERIENCE_TEMPLATES, PROJECT_TEMPLATES, and pickVariant fabrication helpers entirely; removed the skills-add-missing-keyword loop; removed the summary 'Experienced in <missing kw>' append. Kept only the honest summary-add-when-empty path (built from matched keywords)."
  - "No new rephrase logic was built for experience/projects — locked audit answer 4 ('prefer honest low-suggestion output') resolved the OUT-01 rephrase edge probe by producing nothing rather than something false."

patterns-established:
  - "Honest-gap-note: analysis surfaces missing keywords as neutral, actionable, resume-grounded notes in report.gaps rather than generated claims."
  - "No-fabrication suggestions: generateSuggestions never invents experience, projects, skills, or summary claims the resume cannot back up."

requirements-completed: [OUT-01, OUT-02]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "analyzeResume emits one honest, display-cased per-keyword gap note ('{Keyword}: not on your resume; add a bullet only if you have real experience.') for each missing keyword, alongside preserved per-section match-rate gaps, with the aggregate 'N keywords missing' line removed."
    requirement: OUT-02
    verification:
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#analyzeResume emits one honest gap note per missing keyword"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#analyzeResume preserves per-section match-rate gaps and drops the aggregate line"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#analyzeResume emits no per-keyword gap note when nothing is missing"
        status: pass
    human_judgment: false
  - id: D2
    description: "generateSuggestions produces zero experience/projects add suggestions, zero skills-add claims, and no 'Experienced in' summary fabrication for any report with missing keywords; the honest summary-add-when-empty path survives."
    requirement: OUT-01
    verification:
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#generateSuggestions emits no experience or projects add suggestions for missing keywords"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#generateSuggestions never fabricates an \"Experienced in\" summary modification"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#generateSuggestions emits no skills add suggestion for a missing keyword"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/providers/heuristic.test.js#summary 'add' suggestion displays 'SQL' correctly-cased, never 'Sql'"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-10-09
status: complete
---

# Phase 17 Plan 01: Honest Analysis Output Summary

**Heuristic provider made fabrication-free: analyzeResume emits one honest display-cased gap note per missing keyword; generateSuggestions no longer invents experience/projects/skills/summary claims — only the honest summary-add-when-empty path remains.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-10-09T15:42:38Z
- **Completed:** 2026-10-09T15:54:56Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Replaced the aggregate "N posting keywords missing from resume" gap with one honest per-keyword note per missing keyword in the exact UI-SPEC format, using the existing `displayCase` helper (e.g. "SQL: not on your resume; add a bullet only if you have real experience.")
- Removed every fabrication path from `generateSuggestions`: experience/projects bullet templates (`EXPERIENCE_TEMPLATES`, `PROJECT_TEMPLATES`, `pickVariant`), the skills-add-missing-keyword loop, and the summary "Experienced in <missing kw>" append — while preserving the honest summary-add-when-empty suggestion (built from matched keywords)
- Kept the existing per-section match-rate gap strings additive alongside the new per-keyword notes; inverted the two fabrication-asserting tests and added zero-experience/projects, no-"Experienced in", and zero-skills-add tests; all 7 heuristic tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Emit honest per-keyword gap notes from analyzeResume (OUT-02)** - `d24acdf` (feat)
2. **Task 2: Remove fabrication from generateSuggestions and invert tests (OUT-01)** - `9241332` (feat)

## Files Created/Modified
- `server/lib/analysis/providers/heuristic.js` - analyzeResume emits per-keyword honest gap notes; generateSuggestions stripped of all fabrication (templates, skills-add, summary-modify), keeping summary-add-when-empty
- `server/lib/analysis/providers/heuristic.test.js` - Three new analyzeResume gap-note tests; two fabrication-asserting tests inverted/replaced with honest-output assertions; summary-add acronym-casing test kept

## Decisions Made
- **Gap-note carrier = existing `report.gaps` string[]** (RESEARCH option 1): no new structured `gap_notes` field, no `validate.js` change, no client change required — the Analysis page already renders `report.gaps` in the "Gaps to Address" block.
- **Preserved per-section gap strings verbatim (lowercase)**: the plan's illustrative example used a capitalized "Experience:" but the existing code emits the lowercase object-key form (`experience:`). Since the requirement is *preservation* (additive, not replacement), the lowercase form was kept unchanged; the test uses a case-insensitive match to stay robust to this.
- **No rephrase logic built**: per locked audit answer 4, the OUT-01 "rephrase" edge probe was resolved by removing fabrication and emitting NO experience/project rephrase suggestions rather than constructing new rephrase logic.
- **"Experienced in" remains once, in a comment**: the removed summary-modify phrase now appears only in an explanatory code comment ("do NOT fabricate an 'Experienced in <missing keyword>' modification") — not in executable suggestion output. Behaviorally verified absent from all `suggested` text by test.

## Deviations from Plan

None that alter scope or behavior. The plan executed exactly as written: gap notes emitted additively, fabrication removed, tests inverted. The one clarification (lowercase per-section gap strings preserved verbatim rather than the plan's capitalized illustration) is a faithful reading of the "preserved / additive" requirement, not a behavioral deviation.

**Total deviations:** 0 auto-fixed
**Impact on plan:** Plan executed as specified. No scope creep.

## Issues Encountered
- **`server && npm test` shows one unrelated failure**: `analyze-route.test.js` fails with "Cannot find module 'express'" because this git worktree has no `node_modules` installed. This is a pre-existing environment issue, not caused by this plan (the heuristic and validate suites pass; `server/package.json` is unmodified — threat model T-17-SC). Logged to `deferred-items.md`; out of scope per SCOPE BOUNDARY (resolution is worktree dependency installation, owned by the orchestrator).

## TDD Gate Compliance

Both tasks followed RED→GREEN discipline:
- **Task 1**: three gap-note tests written first and confirmed FAILING against the aggregate-line implementation (RED), then implemented and confirmed PASSING (GREEN). `test(...)`/`feat(...)` split collapsed into a single atomic task commit (`d24acdf`) since this is a `type: execute` plan (not plan-level `type: tdd`), so no separate RED commit gate applies.
- **Task 2**: three fabrication-removal tests written first and confirmed FAILING against the still-fabricating implementation (RED), then fabrication removed and confirmed PASSING (GREEN). Single atomic task commit (`9241332`).

## Known Stubs
None. No placeholder text, empty-value stubs, or unwired data sources were introduced.

## Threat Flags
None. No new security-relevant surface beyond the plan's threat model. The gap-note strings (`report.gaps`) are the already-registered T-17-02 information-integrity surface; they render verbatim but are fixed, neutral, and contract-locked. No new endpoints, auth paths, file access, or schema changes. `server/package.json` unmodified (T-17-SC satisfied).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OUT-01 and OUT-02 complete and unit-verified; `heuristic.js` is now honest and fabrication-free, ready for the AI-provider guardrails (OUT-03/OUT-05), eval harness (OUT-04), and score normalization (OUT-06) delivered by sibling plans in this phase.
- No blockers. Note: run `npm install` in the worktree before relying on `analyze-route.test.js` (express-dependent) in the full server test chain.

## Self-Check: PASSED

- Found: `server/lib/analysis/providers/heuristic.js`
- Found: `server/lib/analysis/providers/heuristic.test.js`
- Found: `.planning/phases/17-honest-analysis-output/17-01-SUMMARY.md`
- Found: `.planning/phases/17-honest-analysis-output/deferred-items.md`
- Found commit: `d24acdf`
- Found commit: `9241332`

---
*Phase: 17-honest-analysis-output*
*Completed: 2026-10-09*
