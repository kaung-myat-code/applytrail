---
phase: 14-ux-quality-polish-from-user-feedback
fixed_at: 2026-07-20T15:27:39Z
review_path: .planning/phases/14-ux-quality-polish-from-user-feedback/14-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-07-20T15:27:39Z
**Source review:** .planning/phases/14-ux-quality-polish-from-user-feedback/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (1 critical, 8 warnings — `fix_scope: critical_warning`, Info findings IN-01..IN-05 excluded)
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: Unvalidated AI analysis reports are shipped to the client and can crash the Analysis page

**Files modified:** `server/index.js`, `client/src/pages/Analysis.jsx`
**Commit:** 989e7ea
**Applied fix:** Gated all three `/api/analyze` response paths (AI-provider success, all-providers-failed heuristic fallback, and direct heuristic) on `reportValidation.ok`/`suggestionsValidation.ok`. The AI success path now `continue`s to the next provider in the fallback chain instead of shipping an invalid shape; the two heuristic paths now return `500` if validation fails instead of shipping bad data. On the client, `ScoreDisplay` now guards `strengths`/`gaps` with `Array.isArray(...)  ? ... : []`, `KeywordGroups` destructures `keywords || {}` with per-field defaults, and `SectionFindings` guards `sections || {}` before indexing — matching the drafts/save pattern the reviewer cited.

### WR-01: Naive substring keyword matching produces false-positive skill matches

**Files modified:** `server/lib/analysis/keywords.js`, `server/lib/analysis/providers/heuristic.js`, `server/lib/cover-letter.js`
**Commit:** fbfb3c3
**Applied fix:** Added two shared helpers to `keywords.js`: `keywordsMatch(a, b)` (exact match after normalizing separators, replacing all `sk.includes(pk) || pk.includes(sk)` call sites in `heuristic.js`) and `textContainsKeyword(text, keyword)` (word-boundary-aware regex test, replacing the bare `lower.includes(kw)` bullet-scanning in `cover-letter.js`). Verified `analyzeResume({skills:['Django']}, {posting_text:'Go and Java'})` no longer reports `go`/`java` as matched. All existing tests in `keywords.test.js`, `heuristic.test.js`, and `cover-letter.test.js` still pass.

### WR-02: `'c'` and `'r'` in `TECH_KEYWORDS` can never be extracted

**Files modified:** `server/lib/analysis/keywords.js`
**Commit:** e5c1071
**Applied fix:** Lowered the token length filter in `extractKeywords` from `t.length >= 2` to `t.length >= 1`. Since `TECH_KEYWORDS.has(t)` is the actual whitelist gate, this only re-enables the two single-character entries (`c`, `r`) that were already whitelisted — no other single-character noise can leak through. Verified `extractKeywords('5 years of C experience')` → `['c']` and `extractKeywords('proficient in R for data analysis')` → `['r']`.

### WR-03: `SuggestionCard` uses `||` instead of `??`, silently discarding an intentional empty edit

**Files modified:** `client/src/components/SuggestionCard.jsx`
**Commit:** 0758d28
**Applied fix:** Changed all four `decision?.editedContent || suggestion.suggested` call sites (modify preview, add preview, diff viewer, edit-button seed value) to `decision?.editedContent ?? suggestion.suggested`, so an intentionally-emptied edit (`''`) is respected instead of falling back to the original suggested text.

### WR-04: Resume Version `<select>` has no placeholder option, causing state/UI desync

**Files modified:** `client/src/pages/Analysis.jsx`
**Commit:** 1304d62
**Applied fix:** When `libraryData.selected_id` is falsy, `selectedResumeId` now defaults to `resumeVersions[0]?.id` instead of `''`, so the controlled `<select>` always matches a real `<option>` and the value submitted on analyze matches what's visually highlighted in the dropdown.

### WR-05: Stale-application logic duplicated across `Applications.jsx` and `Dashboard.jsx`

**Files modified:** `client/src/lib/applicationStatus.js` (new), `client/src/pages/Applications.jsx`, `client/src/pages/Dashboard.jsx`
**Commit:** 4846651
**Applied fix:** Extracted `isStale(application)` and `daysSinceLastChange(application)` into a new shared module `client/src/lib/applicationStatus.js`, baking the "exclude withdrawn/rejected" rule directly into `isStale` (single 10-day threshold + exclusion list). Both pages now import from this module; `Dashboard.jsx`'s inline stale-filter loop was replaced with `applications.filter(isStale)`, and `Applications.jsx`'s redundant `&& app.status !== 'withdrawn' && app.status !== 'rejected'` guard at the render call site was removed since `isStale` now encodes it.

### WR-06: Application status list duplicated across three files

**Files modified:** `client/src/lib/applicationStatus.js`, `client/src/components/CreateApplicationModal.jsx`, `client/src/pages/Applications.jsx`, `server/index.js`
**Commit:** 6b62320
**Applied fix:** Added `STATUS_OPTIONS` to the shared `client/src/lib/applicationStatus.js` module (reusing the module created for WR-05) and imported it in both `CreateApplicationModal.jsx` and `Applications.jsx`, removing their independent copies — reducing duplication from three call sites to two (client-shared + server). `server/index.js`'s `VALID_STATUSES` cannot be merged with the client copy (separate npm packages, no shared module boundary — the same documented tradeoff as `IN-03`/`keywordCasing.js`), so a cross-reference comment was added at both definitions pointing to the other file.

### WR-07: Modal dialogs and nav dropdowns are missing ARIA semantics

**Files modified:** `client/src/components/CreateApplicationModal.jsx`, `client/src/pages/Resume.jsx`, `client/src/components/Navbar/Navbar.jsx`
**Commit:** e2b6068
**Applied fix:** Added `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` (pointing to a new `id` on each dialog's `<h2>` title) to the "Create Application" modal and the "Resume Preview" modal. Added `aria-haspopup="true"` and `aria-expanded={isOpen}` to the `Navbar` group-trigger button.

### WR-08: Content-Security-Policy fully disabled in production

**Files modified:** `server/index.js`
**Commit:** 639e749
**Applied fix:** Replaced `helmet({ contentSecurityPolicy: false })` with a scoped CSP: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (inline `style` attributes are used in `Analysis.jsx`/`ResumeLibrary.jsx`; the Google Fonts stylesheet is loaded from `client/index.html`), `font-src 'self' https://fonts.gstatic.com`, `img-src 'self' data:`, `connect-src 'self'` (all API calls are same-origin). No inline `<script>` content exists in the built client, so `script-src` needs no `'unsafe-inline'`.

**Note:** This is a runtime/production-environment config change with no automated test coverage in this repo (CSP violations only surface in an actual browser against the built `client/dist` bundle served in `NODE_ENV=production`). Flagging as `fixed: requires human verification` — please do a manual smoke test of the deployed app (fonts render, styles apply, no console CSP violation errors) before treating this as fully closed.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-20T15:27:39Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
