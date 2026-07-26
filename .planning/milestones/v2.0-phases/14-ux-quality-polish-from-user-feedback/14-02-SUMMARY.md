---
phase: 14-ux-quality-polish-from-user-feedback
plan: 2
subsystem: api
tags: [keyword-extraction, analysis, heuristics, react]

requires:
  - phase: 11-suggestions
    provides: extractKeywords/TECH_KEYWORDS shared module used by the match analysis report
provides:
  - Broadened TECH_KEYWORDS whitelist covering product/data/business-soft-skill terms
  - Multi-word phrase matching in extractKeywords() ("stakeholder communication", "product metrics")
  - ACRONYM_CASING map (server) and displayCase() helper (client) for correct keyword-badge casing
affects: [14-03, analysis, cover-letter-generation]

tech-stack:
  added: []
  patterns:
    - "Client-side mirror of a server whitelist map (client/ and server/ are separate npm packages with no shared module boundary) -- keep both ACRONYM_CASING copies in sync manually"
    - "Multi-word whitelist matching via substring .includes() pass, separate from the single-token split, merged through the existing Set dedupe"

key-files:
  created:
    - server/lib/analysis/keywords.test.js
    - client/src/lib/keywordCasing.js
  modified:
    - server/lib/analysis/keywords.js
    - client/src/pages/Analysis.jsx

key-decisions:
  - "Followed D-13: broadened the existing whitelist heuristic rather than switching to TF-IDF/frequency scoring -- keeps the heuristic simple and swappable per the project's core constraint."
  - "Followed D-15: maintained a small ACRONYM_CASING exceptions map rather than general Title-Casing -- predictable, low-risk, consistent with the existing whitelist pattern."
  - "displayCase() never re-capitalizes a keyword that already contains uppercase letters, protecting future AI-provider output (which may already be correctly cased) from corruption."

patterns-established:
  - "Server whitelist maps that must be visible client-side are duplicated (not imported) across the client/server package boundary, with an explicit sync-reminder comment at the duplicate site."

requirements-completed: [UX-ISSUE-04]

coverage:
  - id: D1
    description: "extractKeywords() extracts all 7 terms (including two multi-word phrases) from the CONTEXT.md Product Analyst posting example, with no regression to existing single-word matching"
    requirement: "UX-ISSUE-04"
    verification:
      - kind: unit
        ref: "server/lib/analysis/keywords.test.js#extractKeywords broadens whitelist to cover the CONTEXT.md Product Analyst posting example"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/keywords.test.js#extractKeywords single-word matching is unchanged for existing technical terms"
        status: pass
    human_judgment: false
  - id: D2
    description: "ACRONYM_CASING exported from server/lib/analysis/keywords.js with correct known-acronym mappings"
    requirement: "UX-ISSUE-04"
    verification:
      - kind: unit
        ref: "server/lib/analysis/keywords.test.js#ACRONYM_CASING maps known acronyms to their conventional display casing"
        status: pass
      - kind: unit
        ref: "server/lib/analysis/keywords.test.js#module exports all four expected names"
        status: pass
    human_judgment: false
  - id: D3
    description: "Analysis page keyword badges (KeywordGroups matched/missing/bonus, SectionFindings matchedItems/missingItems) render through displayCase() so known acronyms display correctly-cased and already-cased strings are left untouched"
    requirement: "UX-ISSUE-04"
    verification:
      - kind: unit
        ref: "node -e import('./client/src/lib/keywordCasing.js') displayCase assertions (sql->SQL, React->React, dashboarding->Dashboarding)"
        status: pass
    human_judgment: true
    rationale: "Visual badge rendering in the browser (correct spacing/wrapping of the newly Title-Cased and acronym-cased badges) was not screenshotted or driven end-to-end in this plan; the displayCase() function itself is fully unit-verified, but actual on-page rendering is best confirmed by a human glancing at the Analysis page during phase-level UAT."

duration: 3min
completed: 2026-07-18
status: complete
---

# Phase 14 Plan 2: Keyword Whitelist Breadth & Acronym Casing Summary

**Broadened `TECH_KEYWORDS` with a Product/Data/Business skills category plus multi-word phrase matching in `extractKeywords()`, and added an `ACRONYM_CASING` map (server) mirrored by a `displayCase()` helper (client) so Analysis page keyword badges show "SQL" instead of "sql".**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-18T19:04:42Z
- **Completed:** 2026-07-18T19:08:00Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `extractKeywords()` now extracts all 7 terms from the CONTEXT.md Product Analyst posting example ("SQL, dashboarding, stakeholder communication, experimentation, product metrics, React, and Python"), up from only "react" and "sql" previously.
- Added a new "Product / Data / Business skills" category to `TECH_KEYWORDS` (dashboarding, stakeholder communication, product metrics, OKRs, KPIs, ROI, SEO, B2B/B2C, etc.) without touching any existing category.
- Added a second, multi-word matching pass to `extractKeywords()` (substring `.includes()` scan against the whitelist's space-containing members) that merges into the existing single-token dedupe, so the function's return shape and existing single-word behavior are unchanged.
- Exported `ACRONYM_CASING` from `server/lib/analysis/keywords.js` alongside the three existing exports.
- Created `client/src/lib/keywordCasing.js` with a byte-for-byte-mirrored `ACRONYM_CASING` and a `displayCase()` helper that title-cases lowercase keywords, maps known acronyms, and never re-capitalizes already-cased strings.
- Routed all 5 keyword-badge render sites in `client/src/pages/Analysis.jsx` (`KeywordGroups`: matched/missing/bonus; `SectionFindings`: matchedItems/missingItems) through `displayCase()`.

## Task Commits

Each task was committed atomically, following the plan's TDD instruction for Task 1:

1. **Task 1: Broaden TECH_KEYWORDS, fix multi-word phrase matching, add ACRONYM_CASING**
   - `b1ec892` (test) - failing test proving the whitelist-breadth gap against the CONTEXT.md example (RED)
   - `76bc777` (feat) - implementation: new whitelist category, multi-word phrase pass, ACRONYM_CASING export (GREEN)
2. **Task 2: Client-side display casing for Analysis page keyword badges** - `c8612eb` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `server/lib/analysis/keywords.test.js` - New regression test file (assert+test() harness, mirrors `pdf.test.js` convention); 4 tests covering the CONTEXT.md example, single-word regression guard, ACRONYM_CASING values, and full module export shape.
- `server/lib/analysis/keywords.js` - Added "Product / Data / Business skills" category to `TECH_KEYWORDS`; added multi-word phrase matching pass to `extractKeywords()`; added and exported `ACRONYM_CASING`.
- `client/src/lib/keywordCasing.js` - New module exporting `ACRONYM_CASING` (mirrors server) and `displayCase(kw)`.
- `client/src/pages/Analysis.jsx` - Imported `displayCase`; wrapped all 5 keyword-badge render sites.

## Decisions Made
- Implemented Task 1 as a strict RED→GREEN TDD cycle: wrote the test against the pre-fix `keywords.js` (via a sanctioned single-file `git checkout --` revert, confirmed 3 of 4 assertions failed), committed the failing test, then re-applied the implementation and confirmed all 4 tests pass before committing.
- Whitelist additions were scoped strictly to genuine, neutral product/data/business-skill vocabulary per the plan's prohibition against protected-characteristic-proxy or coded hiring-language terms — no such terms were added.

## Deviations from Plan

None - plan executed exactly as written. All whitelist entries, the `ACRONYM_CASING` map contents, and the `displayCase()` logic match the plan's `<action>` specifications verbatim.

## Issues Encountered

`npx eslint` could not run against the modified client files (`client/node_modules/@eslint` is not installed in this worktree — a pre-existing environment gap unrelated to this task's changes, out of scope per the deviation rules' scope boundary). The plan's own automated verification (`node server/lib/analysis/keywords.test.js`, `grep -c` checks, and the `displayCase()` node smoke test) all passed and are the plan's authoritative verification method — lint was not part of this plan's `<verification>` block.

## Next Phase Readiness

- `ACRONYM_CASING` is now available in `server/lib/analysis/keywords.js` for Plan 14-03 (grammar/casing fixes for generated cover-letter text) to consume via `require('../keywords').ACRONYM_CASING`, per the plan's documented `key_links`.
- No blockers for subsequent Phase 14 plans.

---
*Phase: 14-ux-quality-polish-from-user-feedback*
*Completed: 2026-07-18*

## Self-Check: PASSED

All created files verified on disk, all 3 task commit hashes (`b1ec892`, `76bc777`, `c8612eb`) verified in git history.
