---
phase: 14-ux-quality-polish-from-user-feedback
verified: 2026-07-20T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
behavior_unverified: 1
overrides_applied: 0
human_verification:
  - test: "On Cover Letter, select a job posting, generate a cover letter, click 'Save Application', then double-click 'Confirm & Save' rapidly (or click it twice before the request resolves)."
    expected: "Only one POST /api/applications fires; the button shows 'Saving...' and is disabled on the second click; only one application record is created; on success the app navigates to /applications with no dangling confirm row."
    why_human: "handleConfirmSave's `if (saving) return` guard is present and wired (confirmed by direct code read), but no automated test exercises this cancellation/double-submit invariant — CoverLetter.jsx has no .test.jsx file (unlike Resume.jsx and Navbar.jsx, which do have real interaction tests). Presence and wiring are confirmed; the runtime guarantee is not exercised by any test."
  - test: "On New Application, fill in company/role/posting text and submit; confirm you land on /cover-letter with the 'Job posting saved...' banner visible, and that the banner disappears after ~3 seconds. Then navigate to /cover-letter directly (e.g. via the nav) and confirm no banner appears."
    expected: "Banner shows only on the redirect-driven visit and auto-dismisses after 3s; a direct visit shows no banner."
    why_human: "Timing/visual banner behavior across a client-side redirect has no automated test (no CoverLetter.test.jsx); confirmed only by static code read of the location.state gate and setTimeout duration."
  - test: "On a Cover Letter Confirm & Save attempt, force a network failure (e.g. stop the API server) and click 'Confirm & Save'."
    expected: "The confirm row stays expanded, an error message renders below the actions row, and 'Confirm & Save' re-enables for retry."
    why_human: "Error-path UI has no automated test coverage for this file; confirmed only by static code read of the catch block."
  - test: "Resize the browser to a narrow/mobile viewport (~375px wide), open the 'Tailor' nav dropdown, and confirm its panel does not visually clip off the right edge of the screen. Separately, resize the Applications list to a narrow viewport and confirm the 'Applied on' / 'Last status change' labels wrap onto separate lines without overlapping."
    expected: "The Tailor dropdown panel stays fully visible (right-anchored); Applications list meta labels wrap cleanly with no overlapping text."
    why_human: "CSS right-anchor (`.dropdownPanelRight { right: 0 }`) and `flex-wrap: wrap` are confirmed present in the stylesheets, but actual rendered geometry at narrow viewports requires a human (or screenshot) to confirm no visual clipping/overlap occurs."
  - test: "On the Analysis page for a job posting containing acronyms (e.g. SQL, API), visually confirm the Matched/Missing/Bonus keyword badges and section-level badges render 'SQL'/'API' in correct casing, not 'Sql'/'Api', and read naturally alongside Title-Cased non-acronym keywords."
    expected: "Badges show conventionally-cased acronyms and Title-Cased plain keywords, with no visual awkwardness (e.g. no double-spacing or truncation from longer casing)."
    why_human: "displayCase() is unit-tested directly (sql->SQL, dashboarding->Dashboarding, React->React unchanged) and wired at all 5 badge render sites (grep-confirmed), but actual on-page visual rendering was not screenshotted or driven end-to-end."
---

# Phase 14: UX & Quality Polish from User Feedback Verification Report

**Phase Goal:** Resolve the UX and quality issues surfaced by the 2026-07-05 exploratory UAT (feedback/feedback.md, GitHub issues #2-#8) -- clarify the job-posting-vs-application workflow, restructure navigation around the linear job-search path, fix the Resume Library creation bug, add resume-editor safety features, broaden analysis keyword coverage, improve generated-text quality, and get lint to a clean baseline
**Verified:** 2026-07-20
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (Roadmap Success Criterion) | Status | Evidence |
|---|---|---|---|
| 1 | Saving a job posting on New Application redirects to Cover Letter with an explicit "Save Application" confirmation step, and the Applications list clarifies "applied on" vs. "last status change" dates | ✓ VERIFIED (redirect/labels) + ⚠️ PRESENT_BEHAVIOR_UNVERIFIED (confirm/double-submit/error-retry flow) | `NewApplication.jsx` calls `navigate('/cover-letter', { state: { justSavedPosting: true } })` on success, preserves fields on failure (code-read confirmed). `CoverLetter.jsx` has `confirming`/`saveError` state, `handleConfirmSave` with `if (saving) return` guard, `navigate('/applications')` on success (code-read + grep confirmed) — but no `CoverLetter.test.jsx` exists to behaviorally exercise the guard/retry paths. `Applications.jsx` renders "Applied on {date}" and "Last status change: {N} day(s) ago" with correct pluralization and "Needs follow-up — no status change in {N} days"; `.meta` has `flex-wrap: wrap` (grep-confirmed). |
| 2 | Top-level navigation is collapsed into grouped sections reflecting the linear workflow, with contextual "Continue to next step" CTAs on workflow pages | ✓ VERIFIED | `Navbar.jsx`'s `navItems` array matches exactly: Dashboard (link), Resume (group: Resume, Resume Library), New Application (link), Tailor (group: Analysis, Cover Letter), Applications (link). `Navbar.test.jsx` (5 tests, all passing via `npx vitest run`) behaviorally exercises open-on-click, single-open-at-a-time, Escape-to-close, outside-click-to-close, and standalone-link behavior. `Analysis.jsx` line 382 renders "Continue to Review Suggestions →". |
| 3 | `POST /api/resume-library` creates a valid empty resume version (contact defaults to empty strings, not `{}`), covered by a regression test | ✓ VERIFIED | `server/index.js:411` — `const resumeData = req.body.resume_data || defaultResumeData()`; `defaultResumeData()` returns `contact: { email: '', github: '', location: '' }`; no literal `contact: {}` remains in `server/index.js` (grep confirmed). `server/lib/defaultResumeData.test.js` passes (`npm test` in `server/`), including a regression-proof assertion that the old `contact: {}` shape is rejected by `validateResume`. Route handler confirmed synchronous (no `await` between `readLibraryIndex()` and `writeResumeVersion()`/`writeLibraryIndex()`), satisfying the concurrency backstop truth. |
| 4 | Resume editor has delete confirmations, a saved/unsaved-changes indicator, and a read-only preview | ✓ VERIFIED | `Resume.jsx` — all 5 remove functions (`removeExperienceBullet`, `removeExperience`, `removeProjectBullet`, `removeProject`, `removeEducation`) begin with `window.confirm(...)` guards (grep-confirmed at lines 124, 146, 188, 210, 240). `dirty`/`savedMessage` state drives a persistent "● Unsaved changes"/"✓ Saved" indicator (lines 587-591). `showPreview` modal reads live `resumeData`/`skillsText` state directly (not a snapshot), confirmed by reading the modal JSX (lines 599-680+). `Resume.test.jsx` (11 tests, all passing) behaviorally exercises confirm-cancel/confirm, indicator transitions, and preview modal open/current-value/empty-section/three-dismiss-affordances. |
| 5 | Match-analysis keyword whitelist covers product/data/business-soft-skill terms in addition to technical terms | ✓ VERIFIED | Direct execution: `extractKeywords('SQL, dashboarding, stakeholder communication, experimentation, product metrics, React, and Python')` returns all 7 terms (`["sql","dashboarding","experimentation","react","python","product metrics","stakeholder communication"]`), confirmed by running the module directly. `server/lib/analysis/keywords.test.js` passes (4/4 tests), including a single-word-matching regression guard. `ACRONYM_CASING` exported (`ACRONYM_CASING.sql === 'SQL'`, confirmed by direct execution). |
| 6 | Generated cover-letter and suggestion text fixes possessive-apostrophe and acronym-casing bugs and varies templates to reduce genericness | ✓ VERIFIED | `server/lib/cover-letter.js` — `possessive()` function correctly handles both branches (grep + test confirmed: `possessive('Northstar Analytics') === "Northstar Analytics'"`, `possessive('Acme') === "Acme's"`); no `${company}'s` literal remains (grep count = 0). `server/lib/cover-letter.test.js` (5/5 passing) behaviorally confirms two different job postings produce differing first sentences. `heuristic.js` imports `ACRONYM_CASING`, defines `displayCase()`, routes every suggestion-text interpolation through it (grep-confirmed, no remaining raw `capitalize(kw)` calls inside `generateSuggestions`). `heuristic.test.js` (3/3 passing) behaviorally confirms acronym casing and multi-keyword/template variance in generated suggestion text. |
| 7 | `npx eslint .` passes cleanly (client/dist excluded, prop-types added, unused vars removed) | ✓ VERIFIED | Ran `cd client && npx eslint .` directly: exit code 0, zero output (zero errors, zero warnings). `client/eslint.config.js` has `{ ignores: ['dist/**'] }` as the first array element. `client/package.json` declares `"prop-types": "^15.8.1"` as a direct devDependency. `npm run build` succeeds; `npx vitest run` (21/21 tests across 3 files) passes with no regressions. |

**Score:** 7/7 truths verified (1 present + wired, behavior-unverified sub-item within truth #1)

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `server/lib/defaultResumeData.js` | Schema-valid blank resume factory | ✓ VERIFIED | Exists, exports `defaultResumeData()`, `contact` deep-equals `{email:'',github:'',location:''}` |
| `server/lib/defaultResumeData.test.js` | Regression test | ✓ VERIFIED | 3 tests, all pass, includes regression-proof rejection of old buggy shape |
| `server/lib/analysis/keywords.js` (modified) | Broadened whitelist + ACRONYM_CASING | ✓ VERIFIED | New "Product / Data / Business skills" category, multi-word phrase matching, `ACRONYM_CASING` export confirmed |
| `server/lib/analysis/keywords.test.js` | Regression test | ✓ VERIFIED | 4 tests, all pass |
| `client/src/lib/keywordCasing.js` | Client-side display-casing mirror | ✓ VERIFIED | Exports `ACRONYM_CASING`, `displayCase()`; byte-consistent with server map |
| `server/lib/cover-letter.js` (modified) | possessive() + template variance | ✓ VERIFIED | `possessive()` defined and used at both call sites, no `${company}'s` literal remains |
| `server/lib/cover-letter.test.js` | Regression test | ✓ VERIFIED | 5 tests, all pass |
| `server/lib/analysis/providers/heuristic.js` (modified) | displayCase() + paired-keyword suggestions | ✓ VERIFIED | `displayCase()` defined, wired at all interpolation sites |
| `server/lib/analysis/providers/heuristic.test.js` | Regression test | ✓ VERIFIED | 3 tests, all pass |
| `client/src/pages/NewApplication.jsx` (modified) | Redirect on save | ✓ VERIFIED | `navigate('/cover-letter', {state:{justSavedPosting:true}})` on success; catch block preserves fields |
| `client/src/pages/CoverLetter.jsx` (modified) | Banner + confirm flow | ✓ VERIFIED (wired) / ⚠️ behavior unexercised by test | No `CoverLetter.test.jsx` exists |
| `client/src/pages/Applications.jsx` (modified) | Date-clarity labels | ✓ VERIFIED | "Applied on"/"Last status change" text confirmed |
| `client/src/components/Navbar/Navbar.jsx` (modified) | Grouped nav | ✓ VERIFIED | `navItems` array matches spec exactly |
| `client/src/components/Navbar/Navbar.test.jsx` | Regression test | ✓ VERIFIED | 5 tests, all pass |
| `client/src/pages/Resume.jsx` (modified) | Delete-confirm, indicator, preview | ✓ VERIFIED | All features present and wired |
| `client/src/pages/Resume.test.jsx` | Regression test | ✓ VERIFIED | 11 tests, all pass |
| `client/eslint.config.js` (modified) | dist ignore | ✓ VERIFIED | `{ ignores: ['dist/**'] }` first array element |
| `client/package.json` (modified) | prop-types direct dep | ✓ VERIFIED | `"prop-types": "^15.8.1"` in devDependencies |
| 6 components with PropTypes (`CreateApplicationModal`, `ResumeDiffViewer`, `SectionEditor`, `SuggestionCard`, `Analysis.jsx` internals, `Dashboard.jsx`) | PropTypes + dead-code/entity fixes | ✓ VERIFIED | `npx eslint .` exits 0 with zero errors across the whole tree |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `server/index.js` POST /api/resume-library | `server/lib/defaultResumeData.js` | `defaultResumeData()` call | ✓ WIRED | Confirmed at line 411 |
| `client/src/pages/Analysis.jsx` (KeywordGroups, SectionFindings) | `client/src/lib/keywordCasing.js` | `displayCase(kw)` at 5 render sites | ✓ WIRED | Grep confirms exactly 5 call sites |
| `server/lib/analysis/providers/heuristic.js` | `server/lib/analysis/keywords.js` | `ACRONYM_CASING` import | ✓ WIRED | Line 8 destructure confirmed |
| `client/src/pages/NewApplication.jsx` (handleSubmit) | `client/src/pages/CoverLetter.jsx` | `navigate('/cover-letter', {state:{justSavedPosting}})` | ✓ WIRED | Confirmed both sides read/write the same state key |
| `client/src/pages/CoverLetter.jsx` (handleConfirmSave) | `POST /api/applications` | fetch + `navigate('/applications')` | ✓ WIRED | Confirmed in source; not behaviorally tested (see human verification) |
| `client/src/components/Navbar/Navbar.jsx` (NavGroup) | `react-router-dom useLocation` | `location.pathname` compared to children `to` | ✓ WIRED | Confirmed + behaviorally tested |
| `client/src/pages/Resume.jsx` (Preview modal) | `client/src/components/CreateApplicationModal.module.css` | `modalStyles.backdrop`/`.dialog` reuse | ✓ WIRED | Confirmed + behaviorally tested |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Server regression suite (5 files) | `cd server && npm test` | All PASS, exit 0 | ✓ PASS |
| Client regression suite (3 files, 21 tests) | `cd client && npx vitest run` | 21/21 passed | ✓ PASS |
| Keyword extraction against CONTEXT.md example | `node -e "extractKeywords(...)"` | Returns all 7 expected terms | ✓ PASS |
| ESLint clean baseline | `cd client && npx eslint .` | Exit 0, zero output | ✓ PASS |
| Production build | `cd client && npm run build` | Succeeds, no errors | ✓ PASS |
| No literal `contact: {}` remains | `grep -c "contact: {}" server/index.js` | 0 | ✓ PASS |
| No literal `${company}'s` remains | `grep -c "\${company}'s" server/lib/cover-letter.js` | 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| UX-ISSUE-02 | 14-04 | Workflow redirect/confirm/date clarity | ✓ SATISFIED | Code + `npm run build`; interactive flow partly human-verify (see above) |
| UX-ISSUE-03 | 14-01 | Resume Library blank-default bug fix | ✓ SATISFIED | `server/lib/defaultResumeData.test.js` passes |
| UX-ISSUE-04 | 14-02 | Keyword whitelist breadth | ✓ SATISFIED | `server/lib/analysis/keywords.test.js` passes + direct execution confirmed |
| UX-ISSUE-05 | 14-03 | Cover-letter/suggestion text quality | ✓ SATISFIED | `cover-letter.test.js` + `heuristic.test.js` pass |
| UX-ISSUE-06 | 14-06 | Resume editor safety features | ✓ SATISFIED | `Resume.test.jsx` (11 tests) passes |
| UX-ISSUE-07 | 14-05 | Nav restructuring + continue CTAs | ✓ SATISFIED | `Navbar.test.jsx` (5 tests) passes + grep for CTA text |
| UX-ISSUE-08 | 14-07, 14-08 | ESLint clean baseline | ✓ SATISFIED | `npx eslint .` exits 0 directly confirmed |

No orphaned requirements: all 7 phase-declared requirement IDs (UX-ISSUE-02 through UX-ISSUE-08) appear in exactly one or more plans' `requirements:` frontmatter, matching ROADMAP.md's Phase 14 requirement list exactly.

**Documentation gap (non-blocking):** `.planning/REQUIREMENTS.md`'s checkbox list still shows UX-ISSUE-03, -04, -05, -07, -08 as unchecked (`- [ ]`) and its Traceability table lists them as "Pending", even though the codebase evidence above confirms all are implemented and passing. Only UX-ISSUE-02 and UX-ISSUE-06 are checked/marked "Complete". This is a stale-documentation issue (the requirements tracker wasn't updated as plans completed), not a code-implementation gap — recommend updating `.planning/REQUIREMENTS.md` to reflect actual completion status before shipping.

### Anti-Patterns Found

None. Scanned all 28 phase-modified files (server + client) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/"not yet implemented"/"coming soon" — zero matches. No `eslint-disable` suppressions were introduced (confirmed via the plans' own prohibitions and the zero-error `npx eslint .` result achieved through real fixes, not rule-weakening — `client/eslint.config.js`'s only change from Plan 14-07 is the `dist` ignore entry).

### Human Verification Required

See YAML frontmatter `human_verification` list. Summary:

1. **Cover Letter double-submit guard** — `handleConfirmSave`'s `if (saving) return` guard is present and wired but has no automated test exercising the invariant (no `CoverLetter.test.jsx` exists). Click "Confirm & Save" twice rapidly and confirm only one POST fires.
2. **New Application → Cover Letter redirect/banner timing** — confirm the banner appears only on redirect-driven visits and auto-dismisses after ~3s.
3. **Cover Letter save-failure retry path** — confirm the confirm row stays expanded with an error message and re-enables on a failed save.
4. **Narrow-viewport visual checks** — confirm the Tailor nav dropdown doesn't clip off-screen and the Applications list date labels wrap without overlapping.
5. **Analysis page keyword badge visual rendering** — confirm acronym-cased badges (SQL, API) render correctly and read naturally alongside Title-Cased keywords in the browser.

### Gaps Summary

No blocking gaps. All 7 roadmap Success Criteria and all 7 UX-ISSUE-0X requirements have direct, reproducible codebase evidence: passing automated test suites (26 server + client tests across 8 test files), a clean `npx eslint .` run, a successful production build, and direct grep/code confirmation of every must-have wiring point described in the 8 plan files. The only open item is a set of human-verification checks for visual/interactive behaviors that either have no automated test coverage (Cover Letter's confirm/cancel/retry flow) or are inherently visual (narrow-viewport layout, badge rendering) — none of these indicate missing or broken implementation, only unexercised runtime confirmation. A secondary, non-blocking documentation gap exists: `.planning/REQUIREMENTS.md`'s checkboxes/traceability table were not updated to reflect the 5 requirements this phase actually completed beyond UX-ISSUE-02/-06.

---

*Verified: 2026-07-20*
*Verifier: Claude (gsd-verifier)*
