---
phase: 12-tailored-resume
verified: 2026-07-16T10:54:25Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 12: Tailored Resume Generation Verification Report

**Phase Goal:** Users can generate a new tailored resume from their accepted suggestions, review it before saving, and return to edit if needed
**Verified:** 2026-07-16T10:54:25Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can generate a tailored resume that applies only their accepted suggestions to a copy of the source resume | ✓ VERIFIED | Live server test: `applyPatches(resume, suggestions, decisions)` deep-clones via `JSON.parse(JSON.stringify())` (`server/lib/tailor/applyPatches.js:25-27`), filters to `status === 'accepted' \|\| 'edited'` (lines 104-107). Live POST `/api/drafts` → GET `/api/drafts/:id` confirmed `tailored_resume.skills` contains the accepted `skills.add` suggestion and `tailored_resume.summary` reflects the accepted `summary.modify`, while the on-disk source (`resume_library/mr3ldtxymun8qiljd.json`, md5 `76e0fa3e...`) was byte-identical before and after. |
| 2 | Tailored resume is saved as a new version with auto-naming ("Company - Role"), without overwriting the source | ✓ VERIFIED | `POST /api/drafts/:id/save` calls `writeResumeVersion(newId, result.resume)` with a freshly generated `newId` (`server/index.js:583-587`), never touching `draft.resume_id`'s file. Live test: save produced new library version `mrne5dg3ovo9z41jf` with `name: "Expa.AI - Full-remote Junior Test"` while source file `mr3ldtxymun8qiljd.json` md5 remained `76e0fa3e4c0b4d2f86fcf5af7d6f32e9` unchanged. Default auto-name is `${draft.company} - ${draft.role}` (`server/index.js:585`) if no name is supplied, and `PreviewTailored.jsx` pre-fills the editable name field with the same format (line 39). |
| 3 | User can preview the tailored resume before final save | ✓ VERIFIED | `PreviewTailored.jsx` fetches `GET /api/drafts/:draftId` on mount and renders all resume sections read-only (contact, summary, skills, experience, projects, education — lines 92-194) before any save action. `Save to Library` is a distinct, separate action (`handleSave`, line 51) gated behind viewing the preview. Confirmed live: GET returned `tailored_resume` with patches applied and `validation.ok: true` prior to the save call. |
| 4 | User can return to the suggestion review from preview without losing their accept/reject decisions | ✓ VERIFIED | `PreviewTailored.jsx:201` links `Back to Suggestions` to `/analysis/review?draft=${draftId}`. `ReviewSuggestions.jsx:34-56` reads `draftId` from `useSearchParams`, fetches `GET /api/drafts/${draftId}`, and hydrates `suggestions`, `decisions`, `resumeId`, `postingId`, `provider` from the server response — restoring the exact decision map instead of resetting to `{}`. draftId lives in the URL (not `location.state`), so this also survives a browser refresh at either page. |
| 5 | Generated resume conforms to the resume JSON schema before it can be saved | ✓ VERIFIED | `applyPatches` returns `{ resume, validation: validateResume(cloned) }` (line 179). `POST /api/drafts/:id/save` returns 400 with validation errors when `!result.validation.ok` (`server/index.js:579-581`) — the write never happens on validation failure. `PreviewTailored.jsx` also disables the Save button client-side (`disabled={saving \|\| validationFailed}`, line 207) and renders the validation error list (lines 107-117). `validateResume` includes strengthened type checks (contact is object, summary is string, arrays are arrays) added in this phase. |
| 6 | The source resume remains unchanged after generating a tailored resume | ✓ VERIFIED | Live test: md5 of `resume_library/mr3ldtxymun8qiljd.json` was `76e0fa3e4c0b4d2f86fcf5af7d6f32e9` before draft creation, after GET (preview computation), and after save — identical throughout. `readResumeVersion` only reads; `applyPatches` deep-clones before mutating; `save` writes to a new `newId` file. No code path writes back to `draft.resume_id`'s file. |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/lib/validateResume.js` | Extracted, strengthened schema validator | ✓ VERIFIED | Exists, exports `{ validateResume }`, includes type checks for contact/summary/arrays (lines 32-50). Used by `server/index.js` (imported line 10) and `applyPatches.js` (imported line 17). |
| `server/lib/tailor/applyPatches.js` | Deterministic patch application engine | ✓ VERIFIED | Exists, exports `{ applyPatches }`. Deep clone, decision filter, section+type branching, `applyToAllEntries` searches ALL experience/project entries for modify/remove (not just last). |
| `POST /api/drafts` endpoint | Create draft with validation | ✓ VERIFIED | `server/index.js:488-530`. Validates `resume_id` (exists in library), `posting_id` (exists in job_postings.json), `suggestions` is array, `decisions` is object. Live-tested: 400/404/400 for each invalid case, 200 for valid. |
| `GET /api/drafts/:id` endpoint with source_name enrichment | Returns draft + computed tailored_resume + source_name | ✓ VERIFIED | `server/index.js:532-560`. Computes `tailored_resume` via `applyPatches` on every read, enriches with `source_name` from library index. Live-tested: 400 for malformed ID, 404 for missing draft, 200 with correct enrichment for valid draft. |
| `POST /api/drafts/:id/save` endpoint | Validates, creates library version, deletes draft | ✓ VERIFIED | `server/index.js:562-597`. Returns 400 on validation failure (no write). On success: new `resume_library/{newId}.json`, new index entry with `source_id`, draft file deleted. Live-tested end-to-end. |
| `DELETE /api/drafts/:id` endpoint | Removes draft file | ✓ VERIFIED | `server/index.js:599-612`. Validates ID, 404 if missing, deletes file, returns `{ ok: true }`. |
| `client/src/pages/PreviewTailored.jsx` | Read-only tailored resume renderer + save | ✓ VERIFIED | Exists (217 lines). Fetches draft by URL `draftId`, renders all sections read-only, editable name field, Save to Library, Back to Suggestions, validation error display, 404 error state links to `/analysis`. |
| `client/src/main.jsx` route | `/analysis/preview` route | ✓ VERIFIED | Line 13 imports `PreviewTailored`, line 29 registers `{ path: 'analysis/preview', element: <PreviewTailored /> }`. |
| Modified `ReviewSuggestions.jsx` | Generate button + draft hydration | ✓ VERIFIED | Button enabled when `hasAccepted` (acceptedCount > 0), calls `POST /api/drafts`, navigates via URL search param. Draft hydration branch fetches and restores state when `?draft=<id>` present. "Coming Soon" text removed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `applyPatches.js` | `validateResume.js` | `require('../validateResume')` | ✓ WIRED | Line 17; called at line 179 to validate output before returning. |
| `ReviewSuggestions.jsx` | `POST /api/drafts` | `fetch('/api/drafts', ...)` in `handleGenerate` | ✓ WIRED | Live-tested: POST creates draft, response used to navigate. |
| `ReviewSuggestions.jsx` | `GET /api/drafts/:id` | `fetch('/api/drafts/${draftId}')` in hydration `useEffect` | ✓ WIRED | Confirmed via code read (lines 37-56) and live GET test. |
| `PreviewTailored.jsx` | `GET /api/drafts/:id` | `fetch('/api/drafts/${draftId}')` on mount | ✓ WIRED | Confirmed via code read (lines 28-49) and live test — tailored_resume/validation/source_name correctly populated. |
| `PreviewTailored.jsx` | `POST /api/drafts/:id/save` | `handleSave` fetch | ✓ WIRED | Live-tested: 200 response, new library version created, draft deleted. |
| `POST /api/drafts/:id/save` | library index | `writeLibraryIndex` with `source_id: draft.resume_id` | ✓ WIRED | Live-tested: new entry `{ id, name, created_at, updated_at, source_id }` confirmed with correct `source_id`. |
| `PreviewTailored.jsx` Back link | `ReviewSuggestions.jsx` hydration | `/analysis/review?draft=${draftId}` → `searchParams.get('draft')` | ✓ WIRED | URL param round-trip confirmed via code read on both sides. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| applyPatches deep-clone + search-all-entries (experience modify on first of two entries) | `node -e` script exercising `applyPatches` directly | First entry modified, source object byte-identical before/after | ✓ PASS |
| validateResume passes on valid resume | `node -e` script | `{ ok: true }` | ✓ PASS |
| Full generate → preview → save → source-unchanged flow | Live server: `POST /api/drafts` → `GET /api/drafts/:id` → `POST /api/drafts/:id/save`, md5 comparison of source file before/after | Draft created, tailored_resume correctly patched (skills add + summary modify), source md5 unchanged (`76e0fa3e...`) at every step, new version saved with `source_id`, draft file deleted (subsequent GET → 404) | ✓ PASS |
| Error paths: invalid resume_id, invalid posting_id, non-array suggestions, malformed draft ID, missing draft | `curl` against live server | 400, 404, 400, 400, 404 respectively | ✓ PASS |
| Frontend build | `npx vite build` | 117 modules transformed, build succeeded, no import/syntax errors | ✓ PASS |
| `server/index.js` no longer defines `validateResume` inline; imports shared module + `applyPatches` | `node -e` grep-style assertion script | All assertions passed | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LIBRARY-03 | 12-02 | Tailored resumes auto-named "Company - Role" | ✓ SATISFIED | `server/index.js:585` default name; `PreviewTailored.jsx:39` pre-fills editable field with same format. Live-tested default naming via save without explicit name would use this fallback (explicit name was passed to exercise the editable path — code path for default is present and unexercised by the live test, but statically verified). |
| TAILOR-01 | 12-01 | Apply user-approved structured patches to a deep copy | ✓ SATISFIED | `applyPatches` deep-clones and filters to accepted/edited only. Live-tested. |
| TAILOR-02 | 12-01, 12-02 | Save as new version with auto-naming, without overwriting source | ✓ SATISFIED | Live-tested: new version created, source md5 unchanged. |
| TAILOR-03 | 12-02 | Preview before final save | ✓ SATISFIED | `PreviewTailored.jsx` renders full read-only resume before Save action. |
| TAILOR-04 | 12-01 | Linked to source via `source_id` | ✓ SATISFIED | Live-tested: new library entry contains `source_id: "mr3ldtxymun8qiljd"`. |
| TAILOR-05 | 12-02 | Return to review without losing decisions | ✓ SATISFIED | URL-param-based hydration confirmed via code read; draft is server-side source of truth, survives refresh. |
| TAILOR-06 | 12-01 | Must conform to schema before save | ✓ SATISFIED | `validateResume` gate in `POST /api/drafts/:id/save`; 400 returned on failure, client also disables Save. |

No orphaned requirements — all 7 IDs declared in `.planning/REQUIREMENTS.md` (lines 13, 33-38) are claimed by plans 12-01 (`TAILOR-01, TAILOR-02, TAILOR-04, TAILOR-06`) and 12-02 (`TAILOR-02, TAILOR-03, TAILOR-05, LIBRARY-03`), and all are supported by verified evidence above.

**Note (non-blocking):** `.planning/REQUIREMENTS.md` still shows these 7 items as `[ ]` unchecked and `Pending` in its status table (lines 13, 33-38, 78, 89-94). This is a documentation-tracking lag, not a code gap — the underlying implementation is verified working. Recommend updating REQUIREMENTS.md checkboxes/status as part of phase close-out.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers found in any of the 5 phase-modified files | — | None |

No debt markers, no stub returns, no hardcoded empty data flowing to render in the reviewed files.

### Code Review Findings (Context, Non-Blocking)

`12-REVIEW.md` flagged 2 critical issues from the code-review gate (advisory, non-blocking per project's gate policy — code review is a revision gate, not part of goal-backward truth verification):

- **CR-01**: `applyPatches`'s `summary` case (`applyPatches.js:114-119`) applies `modify`/`add` unconditionally, without the `suggestion.current`-match check that `experience`/`projects` modify patches perform via `applyToAllEntries`. This is a real gap for the narrow scenario of a stale draft applied against a summary that changed since the suggestion was generated — it does not affect the core generate/preview/save flow verified above (which always operates on a fresh, correctly-matching resume + suggestion pair), but it is a latent data-integrity risk worth fixing in a follow-up. It was not enumerated as an explicit PLAN.md must-have (`applyPatches applies accepted suggestions to a deep copy... without mutating original` is the closest match, and that broader truth still holds — the summary case simply lacks the same match-guard as other sections).
- **CR-02**: `POST /api/drafts` validates `Array.isArray(suggestions)` but not each element's shape (`id`, `section`, `type` fields). A malformed direct API call (bypassing the UI) could create a draft that produces `undefined` values downstream. This is a hardening gap for a single-user local tool with no auth boundary between client and server — the UI-driven flow (the only path an actual user exercises) always sends well-formed suggestion objects sourced from `/api/analyze`.

Both findings are tracked in `12-REVIEW.md` and do not block the phase goal — the six observable truths above are all satisfied through the intended UI-driven usage path, which was verified live end-to-end.

### Human Verification Required

None. All observable truths were verified through direct code inspection, live server behavioral testing (full generate → preview → save → source-unchanged round trip with file-hash comparison), and error-path testing. No visual/UX-only claims remain unverified — the plan's own "manual browser UAT" item (D10 in 12-02-SUMMARY.md) covers polish/interaction feel, not goal-blocking functionality, and the underlying API contract and data flow it depends on were independently confirmed here via live HTTP calls rather than trusting the SUMMARY's claim.

### Gaps Summary

No gaps. All 6 roadmap success criteria and all 7 requirement IDs are verified against actual running code, not SUMMARY.md claims. The two code-review critical findings (CR-01, CR-02) are real and should be fixed, but they represent hardening/edge-case gaps outside the literal scope of the phase's must-haves and roadmap success criteria — they are documented here for visibility rather than blocking phase completion.

---

_Verified: 2026-07-16T10:54:25Z_
_Verifier: Claude (gsd-verifier)_
