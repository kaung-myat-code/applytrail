---
phase: 12-tailored-resume
fixed_at: 2026-07-16T11:04:00Z
review_path: .planning/phases/12-tailored-resume/12-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Phase 12: Code Review Fix Report

**Fixed at:** 2026-07-16T11:04:00Z
**Source review:** .planning/phases/12-tailored-resume/12-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 8 (2 critical, 6 warning; fix_scope = critical_warning)
- Fixed: 8
- Skipped: 0

## Fixed Issues

### CR-01: `applyPatches` summary patch is applied unconditionally, unlike every other section

**Files modified:** `server/lib/tailor/applyPatches.js`
**Commit:** eab7adf
**Applied fix:** Added a "current still matches" guard to the `summary` case's `modify` branch, matching the pattern already used by `experience`/`projects`. A `modify` patch is now only applied when `cloned.summary === suggestion.current`; otherwise it logs a warning and skips, preventing a stale suggestion from silently clobbering a manually edited summary. The `add` branch is unchanged (no prior value to guard against).

### CR-02: Draft creation trusts client-supplied `suggestions` array without validating element shape

**Files modified:** `server/index.js`
**Commit:** 7f48c1d
**Applied fix:** Added a validation loop in `POST /api/drafts` that rejects (400) any suggestion missing a string `id`, or with a `section`/`type` outside the known enums (`summary|skills|experience|projects|education` / `add|modify|remove`), before the draft is persisted.

## Warnings Fixed

### WR-01: Duplicate suggestion IDs silently collapse decisions and cause incorrect patch application

**Files modified:** `server/index.js`
**Commit:** 46967bb
**Applied fix:** Extended the suggestion-shape validation loop in `POST /api/drafts` to track seen `id` values in a `Set` and reject (400) the request if a duplicate `id` is found, matching the review's suggested server-side enforcement approach.

### WR-02: `handleSave`/`handleGenerate` have no re-entrancy guard beyond the disabled button

**Files modified:** `client/src/pages/PreviewTailored.jsx`, `client/src/pages/ReviewSuggestions.jsx`
**Commit:** cd6e232
**Applied fix:** Added `if (saving) return` at the top of `handleSave` and `if (generating) return` at the top of `handleGenerate`, exactly as suggested, closing the race window between a fast double-click and the React re-render that applies the `disabled` attribute.

### WR-03: `POST /api/drafts` does not validate `provider` against a known allowlist

**Files modified:** `server/index.js`
**Commit:** 0e62c5a
**Applied fix:** Added a local `VALID_PROVIDERS = ['heuristic', 'gemini', 'openrouter', 'groq']` allowlist in the `POST /api/drafts` handler (the existing `AI_PROVIDERS` constant in `/api/analyze` is function-scoped and not reachable here) and now store `safeProvider` (falls back to `'heuristic'` for unrecognized values) instead of the raw client-supplied string.

### WR-04: `ReviewSuggestions` `useEffect` stale-closure risk when `draftId` changes without remount

**Files modified:** `client/src/pages/ReviewSuggestions.jsx`
**Commit:** e4e7c4a
**Applied fix:** Per the review's suggested option ("reset dependent state at the top of the effect before the async fetch begins"), the draft-hydration branch now resets `hydrating`, `resumeId`, `postingId`, `provider`, `suggestions`, and `decisions` to their initial/empty values immediately when `draftId` changes, before the fetch starts. This prevents the previous draft's stale `postingId`/`resumeId`/`provider` from being read or rendered while the new draft's data is in flight.
**Note:** This is a logic-level fix (effect/state-timing correctness) verified only via re-read (Tier 1) since `.jsx` is not supported by `node -c`. Flagging as **fixed: requires human verification** — please manually confirm the reset-then-refetch sequence behaves correctly when navigating directly between two drafts in the running app.

### WR-05: `validateResume` requires exact contact fields but does not validate their types

**Files modified:** `server/lib/validateResume.js`
**Commit:** 4007b92
**Applied fix:** Extended the contact-field presence loop to also check `typeof data.contact[field] !== 'string'` (allowing empty string), pushing a `contact.{field} must be a string` error otherwise — exactly as suggested in the review.

### WR-06: `applyAddToList` appends new bullets to the *last* entry regardless of relevance

**Files modified:** `server/lib/tailor/applyPatches.js`
**Commit:** ecd67cb
**Applied fix:** The review's own fix guidance for this item was "longer-term, suggestions should carry a target entry identifier... at minimum, document this limitation prominently." Implementing suggestion-carried targeting is a structural/schema change (affects the AI provider, heuristic provider, and suggestion consumers) that is out of scope for a targeted code-review fix pass and risks introducing new bugs without a fuller design. Applied the "at minimum" documentation fix: added a prominent `KNOWN LIMITATION (WR-06)` block to the `applyAddToList` JSDoc explaining the last-entry placement behavior and its correctness impact, so future maintainers are not surprised by it. No behavior change.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-16T11:04:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
