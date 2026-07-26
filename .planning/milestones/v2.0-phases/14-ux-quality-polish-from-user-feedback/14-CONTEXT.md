# Phase 999.1: UX & Quality Polish from User Feedback - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase resolves the 7 GitHub issues (#2-#8) filed against a first-person exploratory UAT of ApplyTrail (`feedback/feedback.md`, 2026-07-05). It bundles several independent, small-to-medium fixes across workflow clarity, navigation, resume-editor safety, a confirmed data bug, analysis quality, generated-text quality, and lint/test debt. It does NOT add new capabilities — only clarifies/repairs how already-shipped features behave.

Note: feedback item #6's "complete or hide 'Generate Tailored Resume (Coming Soon)'" is already resolved — Phase 12 shipped full tailored-resume generation after this feedback was collected. Only the "writing quality" half of that feedback remains relevant here.

</domain>

<decisions>
## Implementation Decisions

### Workflow clarity & feedback (#2, #8-partial)
- **D-01:** After saving a job posting on New Application, redirect straight to the Cover Letter page pre-loaded with the new posting (Claude's discretion, applied) — continues the natural next step instead of leaving a cleared form with no confirmation.
- **D-02:** Add an explicit "Save Application" confirmation step on the Cover Letter page, separate from "Generate Cover Letter" (Claude's discretion, applied) — makes it visible to the user that this is the moment the application record is actually created, then redirect to the Applications list.
- **D-03:** Scope the save-feedback fix to New Application only. Do not build a shared toast/banner component for Applications list or status updates in this pass — those aren't tracked issues (#2-#8) and would be scope creep.
- **D-04:** Add a small clarifying label/tooltip on the Applications list distinguishing "Applied on X" from "Last status change: Y days ago" — directly requested in feedback item #8 even though it's not one of the numbered GitHub issues; low-risk, in scope.

### Navigation restructuring (#7)
- **D-05:** Collapse the 7 top-level nav items into fewer grouped sections (e.g., a "Resume" group covering Resume + Resume Library, a "Tailor" group covering Analysis + Cover Letter) rather than just reordering/renaming in place.
- **D-06:** Add contextual "Continue to [next step]" CTAs on workflow pages (e.g., a footer link on the Analysis page pointing to Review Suggestions) in addition to the nav restructuring — reinforces the linear path beyond the nav bar alone.
- **D-07:** Claude proposes the exact label/order set for the new nav structure during planning — no user-specified wording locked in.

### Editor safety & quality infra (#3, #6-partial, #8)
- **D-08:** Fix the confirmed Resume Library "New Resume" bug: `POST /api/resume-library` in `server/index.js` defaults `contact` to `{}`, which fails `validateResume`'s required `email`/`github`/`location` field checks. Change the default to `contact: { email: '', github: '', location: '' }`.
- **D-09:** Add a contract test for this fix — assert `POST /api/resume-library` with no/empty body succeeds and returns a valid, empty resume version.
- **D-10:** Test scope beyond D-09 (Claude's discretion, recommend): targeted regression tests only, covering fixes made in this phase (resume-library create, any applyPatches touch-points). Do NOT stand up a broader API contract test suite across all routes — that's a larger initiative better suited to its own phase, and would expand this polish phase significantly.
- **D-11:** Resume editor safety — implement all three: (1) confirmation step before deleting an experience/project/education entry or bullet, (2) a visible "Saved" / "Unsaved changes" indicator near the save action, (3) a read-only resume preview panel/modal. Full scope, as feedback explicitly wanted all three.
- **D-12:** Fix all ESLint errors (263 currently): exclude `client/dist` from `client/eslint.config.js`, add `prop-types` to all flagged components, remove unused vars (`navigate` in one page, `draft` in `PreviewTailored.jsx`) — get lint to a clean, enforceable baseline.

### Analysis & writing quality (#4, #5-partial, #6-partial)
- **D-13:** Keyword extraction broadening (Claude's discretion, recommend): expand `TECH_KEYWORDS` in `server/lib/analysis/keywords.js` with additional categories (product/data-analytics/business-soft-skills terms like "dashboarding," "stakeholder communication," "experimentation," "product metrics") rather than switching to a frequency/TF-IDF hybrid approach. Keeps the heuristic simple and swappable per the project's core constraint ("Simple heuristics ... designed to swap in a real LLM service later").
- **D-14:** Fix generated-text grammar bugs AND reduce genericness: correct possessive-apostrophe handling for company names ending in "s" (e.g., "Northstar Analytics's" → "Northstar Analytics'"), proper-case known acronyms instead of naive capitalization, and vary sentence templates / incorporate more than one matched keyword into generated cover-letter paragraphs and suggestion bullets so they read less templated.
- **D-15:** Keyword display casing (Claude's discretion, recommend): maintain a small acronym-exceptions map (e.g., `sql`→`SQL`, `api`→`API`, `aws`→`AWS`) alongside `TECH_KEYWORDS`, consistent with the existing whitelist pattern — predictable and low-risk versus general Title-Casing.

### Claude's Discretion
- Redirect-after-save target and mechanism for New Application (D-01)
- Where/how the explicit Save Application confirmation is implemented (D-02)
- Test coverage scope beyond the resume-library contract test (D-10)
- Keyword-extraction broadening approach (D-13)
- Acronym casing mechanism (D-15)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source feedback
- `feedback/feedback.md` — Raw first-person UAT feedback (2026-07-05) that produced GitHub issues #2-#8; read for full context on each numbered item and the "Top 3 things to fix" summary.

### Resume schema
- `.claude/skills/resume-schema/references/schema.md` — Canonical resume JSON schema referenced by `server/lib/validateResume.js`. Any change to the resume-library create defaults (D-08) must conform to this schema.

### Prior phase decisions
- `.planning/PROJECT.md` — Key Decisions table; confirms tailored-resume generation (Phase 12) already shipped, so feedback item #6's "hide Coming Soon" concern is moot.
- `.planning/REQUIREMENTS.md` — v2.0 requirements; confirms Phase 13 (Application Pre-fill and Export) is separate/upcoming — do not fold PREFILL/EXPORT work into this phase.

[No other external specs/ADRs apply — requirements for this phase are fully captured in decisions above.]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/lib/validateResume.js` — Shared validation used by `PUT /api/resume`, `POST/PUT /api/resume-library`, and `server/lib/tailor/applyPatches.js`. The resume-library bug fix (D-08) only needs a default-value change in `server/index.js`, not a schema change.
- `server/lib/analysis/keywords.js` — Single source of truth for `TECH_KEYWORDS`, `extractKeywords`, `extractResumeKeywords`, shared between cover-letter generation and match analysis. Broadening the whitelist here (D-13) affects both features consistently.
- `client/src/components/Navbar/Navbar.jsx` — Simple `navLinks` array driving the nav; restructuring (D-05/D-07) is a data + minor markup change, not an architectural rewrite.

### Established Patterns
- Resume/library routes follow a "validate before write" pattern (`validateResume` called before `writeResumeVersion`) — any new create/save paths (e.g., a Save Application confirmation) should follow the same defensive pattern.
- CSS Modules per component (`*.module.css`) — new UI (preview panel, save indicator, confirm dialogs, nav grouping) should follow this convention, not introduce a new styling approach.

### Integration Points
- `server/index.js:377-400` (`POST /api/resume-library`) — exact location of the confirmed bug fix (D-08).
- `client/eslint.config.js` — flat-config format (ESLint 9 style); needs an `ignores` entry for `client/dist` (D-12).
- No test runner currently configured in either `client/package.json` or root `package.json` — D-09/D-10 will need to introduce one (research phase should confirm what's already available vs. needs adding).

</code_context>

<specifics>
## Specific Ideas

- Grammar fix example given directly by the user's feedback: "Northstar Analytics's goals" should read "Northstar Analytics' goals" (possessive of a name ending in "s").
- Casing fix example: "Experienced in Sql" should read "Experienced in SQL".
- Keyword coverage example: a Product Analyst posting mentioning "SQL, dashboarding, stakeholder communication, experimentation, product metrics, React, and Python" was reduced to only "react" and "sql" by the current whitelist — this is the concrete bar for D-13's broadened whitelist to clear.

</specifics>

<deferred>
## Deferred Ideas

- **Shared save-feedback/toast component** (raised during Workflow clarity discussion) — applying a consistent save-confirmation pattern across Applications list and status updates, not just New Application. Deferred: not one of the tracked issues #2-#8; would expand this phase's scope. Candidate for a future polish phase if it recurs in feedback.
- **Broader API contract test suite** (raised during Editor safety discussion) — standing up a full test runner + coverage across all API routes (resume, resume-library, applications, job-postings), matching feedback item #10's general concern about missing tests. Deferred beyond the targeted regression tests in D-10: a larger initiative better scoped as its own phase (e.g., a dedicated "Test Infrastructure" phase) rather than folded into this polish phase.
- Existing project-level pending todo (from STATE.md): applyPatches has no `education` section handling and no `summary`+`remove` handling (CR-01/CR-02, deferred from Phase 12) — not raised or folded during this discussion; remains a separate future gap-closure item, not part of this phase's scope.

### Reviewed Todos (not folded)
None — no pending todos matched this phase during `cross_reference_todos` beyond the Phase 12 CR-01/CR-02 item noted above, which was already explicitly deferred in STATE.md prior to this discussion and was not re-opened here.

</deferred>

---

*Phase: 999.1-ux-quality-polish-from-user-feedback*
*Context gathered: 2026-07-17*
