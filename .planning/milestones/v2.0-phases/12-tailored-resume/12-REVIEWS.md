---
phase: 12
reviewers: [codex, opencode, cursor]
reviewed_at: 2026-07-05
plans_reviewed: [12-01-PLAN.md, 12-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 12

## Codex Review

### Summary

The two plans are directionally aligned with Phase 12, but they leave several important integration details underspecified. The biggest risk is that the current suggestion model is not actually a patch model: suggestions only contain `section`, `type`, `current`, and `suggested`, so applying them reliably to nested resume JSON will be ambiguous. The frontend plan also underestimates the state-preservation requirement: current review decisions are local component state only, while the product decision explicitly requires persisted server-side draft state that survives refresh/navigation.

### Plan 12-01: Backend

**Strengths:**
- Extracting `validateResume` is a good prerequisite. It currently lives inside `server/index.js:44`, but it is already reused by resume update/create paths at `server/index.js:391`, `server/index.js:423`, and `server/index.js:468`.
- Saving tailored resumes as new library versions fits the existing storage model. Resume versions already live in `resume_library/index.json`, with `source_id` present in version metadata at `resume_library/index.json:5`.
- The "do not overwrite source" goal matches the current library architecture: `POST /api/resume-library` creates a new ID and writes a separate resume file at `server/index.js:415` through `server/index.js:437`.
- Server-side draft files are consistent with the app's existing JSON-file persistence pattern: helpers read/write JSON synchronously at `server/index.js:26` and `server/index.js:35`.

**Concerns:**
- **HIGH: Current suggestions are not structured enough to be safely applied as patches.** The heuristic provider emits suggestions with only `section`, `type`, `current`, and `suggested`, for example summary modify at `server/lib/analysis/providers/heuristic.js:270`, skills add at `server/lib/analysis/providers/heuristic.js:303`, and experience add at `server/lib/analysis/providers/heuristic.js:317`. There is no target path, item ID, array index, insertion policy, or section-specific operation data. For `experience` and `projects`, the engine will not know which entry receives a new bullet.
- **HIGH: Extracting `validateResume` unchanged will not fully satisfy TAILOR-06.** The current validator checks required top-level field presence at `server/index.js:52`, but only validates `experience`, `projects`, `education`, and `skills` if they are arrays at `server/index.js:70`, `server/index.js:93`, `server/index.js:116`, and `server/index.js:135`. If `experience` is a string or `contact` is not an object, the current validator may not reject it.
- **MEDIUM: `source_id` support exists but creation currently always sets it to null.** Existing library creation hardcodes `{ source_id: null }` at `server/index.js:429`. The draft save route must not simply delegate to the current `POST /api/resume-library` behavior unless that endpoint is extended.
- **MEDIUM: Draft creation must validate both source resume and posting existence.** Existing analysis does this explicitly: job posting lookup and 404 are at `server/index.js:558`, and resume ID validation/read are at `server/index.js:567`. The draft route needs equivalent checks or it can create orphaned drafts.
- **MEDIUM: On-the-fly preview recomputation is useful, but only if drafts persist edited decisions.** Review edits produce `status: 'edited'` plus `editedContent` in `client/src/pages/ReviewSuggestions.jsx:87`; the backend plan should specify how edited content overrides `suggestion.suggested`.
- **LOW: Draft cleanup policy is unspecified.** Server-side files in `server/data/drafts/` can accumulate indefinitely if users preview but never save/delete.

**Suggestions:**
- Define the exact patch contract before implementing `applyPatches`. At minimum include section-specific target rules, such as `summary.replace`, `skills.add`, `experience.addBullet({ entryIndex | entryMatcher })`, and `projects.addBullet(...)`.
- Strengthen `validateResume` while extracting it: assert required object/array/string types, not just presence.
- Add backend tests for `applyPatches`: deep-copy behavior, accepted-only filtering, edited-content application, invalid `current` mismatch, no source mutation, schema failure, and source_id persistence.
- Make `POST /api/drafts/:id/save` write the library metadata itself or extend the library create endpoint to accept validated `source_id`.

**Risk Assessment:** HIGH — The backend is the correctness boundary for Phase 12, and the existing suggestion format does not yet carry enough information to apply patches deterministically.

### Plan 12-02: Frontend

**Strengths:**
- The plan attaches to the right disabled UI. The Generate button is currently disabled at `client/src/pages/ReviewSuggestions.jsx:195`.
- The review page already tracks accept/reject/edit decisions in one place: `decisions` state is initialized at `client/src/pages/ReviewSuggestions.jsx:24`, and the handlers update it at `client/src/pages/ReviewSuggestions.jsx:65`, `client/src/pages/ReviewSuggestions.jsx:76`, and `client/src/pages/ReviewSuggestions.jsx:87`.
- Routing is centralized in `client/src/main.jsx:15`, with `/analysis/review` already registered at `client/src/main.jsx:27`, so adding a preview route is straightforward.
- The library destination exists and can refresh from `/api/resume-library` at `client/src/pages/ResumeLibrary.jsx:14`.

**Concerns:**
- **HIGH: "Back to Suggestions" via navigation state does not meet persisted draft state.** Current review decisions are local React state only at `client/src/pages/ReviewSuggestions.jsx:24`. Existing navigation from analysis passes suggestions in location state at `client/src/pages/Analysis.jsx:352`, which is lost on refresh. The user decision requires server-side draft state that survives refresh/navigation.
- **HIGH: `/analysis/preview` without a draft ID is under-specified.** A dedicated preview page needs a durable identifier, likely `/analysis/preview/:draftId` or `/analysis/preview?draft=...`, otherwise refresh/deep-link recovery cannot work.
- **MEDIUM: The plan does not say how review reloads from an existing draft.** `ReviewSuggestions` currently fetches fresh analysis when it lacks `location.state?.suggestions` at `client/src/pages/ReviewSuggestions.jsx:28`, which would reset decisions after returning without a draft-aware code path.
- **MEDIUM: Preview rendering needs a resume display component, but the current resume page is an editor, not a read-only renderer.** `client/src/pages/Resume.jsx:244` renders editable inputs and textareas, so reusing it directly would violate "preview before final save" as read-only review.
- **LOW: Route dependency note is stale against the actual repo.** Project context says React Router 6, but `client/package.json:15` uses `react-router-dom` 7. The plan should follow the installed API, not the roadmap label.

**Suggestions:**
- Use a draft ID as the durable state key: Generate should `POST /api/drafts`, then navigate to `/analysis/preview/:draftId`.
- Store `suggestions` and `decisions` in the draft, and update the draft whenever decisions change or before navigating to preview.
- Let ReviewSuggestions initialize from either analysis navigation state or `GET /api/drafts/:id`, preserving edited decisions.
- Build a small reusable read-only resume renderer for preview rather than adapting the editor form.
- Add frontend tests or at least manual acceptance checks for refresh on preview, back to review, save success, save validation failure, and zero accepted suggestions.

**Risk Assessment:** MEDIUM-HIGH — The UI wiring is modest, but state restoration is central to the phase and the plan currently relies too much on transient React navigation state.

### Overall Risk: HIGH

The phase goals are achievable with this architecture, but the plans need a sharper patch schema and a draft-centered navigation model before implementation. Without those, the app can appear to generate previews while still applying suggestions incorrectly or losing user decisions across refresh/back navigation.

---

## OpenCode Review

### Summary

Well-structured plan that correctly decomposes the backend work into three tasks: patch application engine, draft CRUD routes, and a shared validator extraction. The plan accurately references the codebase (suggestion shape, validation function, existing helpers) and the acceptance criteria are testable. However, there's a **critical data path discrepancy** and a few edge cases that need attention.

### Plan 12-01: Backend

**Strengths:**
- **Accurate code references**: The plan correctly identifies `validateResume` at `server/index.js:44-144`, the suggestion shape from `server/lib/analysis/providers/heuristic.js:270-331`, and the existing `generateId()`/`readJSON`/`writeJSON`/`readResumeVersion`/`writeResumeVersion` helpers.
- **Deep clone strategy is sound**: `JSON.parse(JSON.stringify(resume))` is correct for this data shape (no functions, dates, or special objects).
- **Validation gate before save**: `POST /api/drafts/:id/save` correctly checks `validation.ok` before persisting — prevents corrupted resumes from entering the library.
- **Draft deletion after save**: Clean lifecycle — ephemeral drafts don't accumulate.
- **On-the-fly patch application on GET**: `GET /api/drafts/:id` recomputes `tailored_resume` via `applyPatches` rather than storing a pre-computed copy. This means edits to decisions in the draft always reflect in the preview — good design.
- **The `editedContent` fallback chain** (`decisions[id].editedContent || suggestion.suggested`) matches the SuggestionCard display logic at `client/src/components/SuggestionCard.jsx:46,55,72`.

**Concerns:**
- **HIGH — Data path mismatch**: The plan says drafts go in `server/data/drafts/` (plan line 71, CONTEXT.md line 54), but `DATA_DIR` is defined as `path.join(__dirname, '..')` at `server/index.js:12`, which resolves to the **project root**, not `server/data/`. The existing data files (`resume.json`, `job_postings.json`, `applications.json`) all live at the project root. The `server/data/` directory exists but is **empty** (`server/data/` has zero entries). If the plan uses `DRAFTS_DIR = path.join(DATA_DIR, 'drafts')`, drafts will be created at the project root level (`/Users/kmpg/VibeCodeTours/applytrail/drafts/`), not inside `server/data/`. This is actually consistent with how the rest of the codebase works (DATA_DIR = project root), but the plan's description is misleading. **Recommendation**: Rename the target to `drafts/` at project root in the plan text, or explicitly note this aligns with the existing `DATA_DIR` convention.
- **MEDIUM — `validateResume` is labeled "optional refactor" but is actually required**: Task 3 says "optional refactor" (plan line 106), but `applyPatches` needs to import `validateResume` (plan line 56: "validate with `validateResume(cloned)` — inline the validation logic or import from a shared module"). If the implementer skips Task 3, they'd need to inline ~100 lines of validation logic in `applyPatches.js`. **Recommendation**: Make Task 3 a mandatory prerequisite, or explicitly state that `applyPatches` must inline validation if Task 3 is skipped.
- **MEDIUM — No draft cleanup mechanism**: The CONTEXT.md mentions "auto-cleaned" (line 54) but neither plan implements any cleanup. Orphaned drafts from crashes or abandoned sessions will accumulate indefinitely. **Recommendation**: Add a simple cleanup strategy — either on server startup (delete drafts older than N days) or on `POST /api/drafts` (delete drafts older than 24h). This is a local tool, so even a simple `fs.readdirSync` + age check at startup would suffice.
- **LOW — `experience` + `modify` only searches the "last entry"**: Plan line 52 says "find bullet matching `suggestion.current` in last experience entry, replace with...". But `suggestion.current` could match a bullet in any experience entry, not just the last one. The `validate.js:findInResume` function (line 182-185) searches **all** experience entries. If the AI provider generates a modify suggestion targeting a bullet in the first experience entry, the plan's "last entry" logic would fail to find it. **Recommendation**: Search all experience/project entries for the matching bullet, not just the last one. Use a pattern similar to `findInResume` at `server/lib/analysis/validate.js:170-195`.
- **LOW — No input size limits on draft creation**: The `POST /api/drafts` route accepts `suggestions` and `decisions` arrays without bounds. A malicious or buggy client could send megabytes of suggestion data. Low risk for a single-user local tool, but worth noting. **Recommendation**: Add a reasonable limit (e.g., max 200 suggestions, matching the heuristic provider's cap at `heuristic.js:344`).

**Suggestions:**
1. **Make Task 3 mandatory**: Change "optional refactor" to "required." The ~100 lines of `validateResume` logic at `server/index.js:44-144` is not trivial to inline, and having it in a shared module prevents drift.
2. **Search all entries for `modify` patches**: Replace the "find in last entry" logic with a full search across all experience/project entries. The existing `findInResume` function in `validate.js:170-195` already does this correctly — reuse its pattern.
3. **Add startup cleanup for orphaned drafts**: A simple `cleanOldDrafts()` function called during the startup sequence (after `seedDemoData()` at `server/index.js` ~line 250) that deletes draft files older than 24 hours.
4. **Clarify the data path in plan text**: The plan should say `DRAFTS_DIR = path.join(DATA_DIR, 'drafts')` creates drafts at the project root (consistent with existing convention), not "in `server/data/drafts/`."
5. **Add a `POST /api/drafts` validation check**: Ensure `suggestions` is an array and `decisions` is an object before writing. The `validateSuggestions` function from `server/lib/analysis/validate.js:85` could be used as a lightweight check.

**Risk Assessment:** LOW-MEDIUM — The core design is sound and well-aligned with the existing codebase. The data path issue is the most significant risk — it won't cause a runtime error (drafts will work at either location), but it creates a confusing inconsistency between the plan text and actual behavior. The "last entry" search limitation for modify patches is a real correctness issue that would surface with AI-generated suggestions.

### Plan 12-02: Frontend

**Strengths:**
- **Correctly identifies the disabled button**: References `ReviewSuggestions.jsx:195-197` and the CSS at `ReviewSuggestions.module.css:121-131` with `cursor: not-allowed; opacity: 0.5`. Verified — the button is indeed disabled with that exact styling.
- **Correctly identifies missing `useNavigate`**: Line 2 of `ReviewSuggestions.jsx` imports `Link, useSearchParams, useLocation` — no `useNavigate`. The plan correctly adds this import.
- **`hasAccepted` reuses existing computation**: The plan references `acceptedCount` which already exists at `ReviewSuggestions.jsx:142`: `Object.values(decisions).filter(d => d.status === 'accepted' || d.status === 'edited').length`. The `hasAccepted` flag just needs `acceptedCount > 0`.
- **"Back to Suggestions" state preservation**: Navigating back with `navigate('/analysis/review', { state: { resumeId, postingId, provider, suggestions, decisions } })` passes the full state. This matches how `ReviewSuggestions.jsx` already reads from `location.state` (lines 18-21). Decisions will be preserved.
- **Preview page reads draft from server**: `GET /api/drafts/:draftId` returns the draft with `tailored_resume`. This means the preview page doesn't depend on React Router state for the resume content — it fetches fresh data from the server. Good for resilience.
- **Route addition is minimal**: Just one new route in `main.jsx:27` — `{ path: 'analysis/preview', element: <PreviewTailored /> }`. Clean and isolated.

**Concerns:**
- **MEDIUM — "Back to Suggestions" loses decisions on server restart**: The plan passes `decisions` via React Router state for the "Back" flow. But if the user refreshes the browser while on the preview page, `location.state` is lost. The draft file still has the decisions, but the `ReviewSuggestions` page would need to re-fetch them from the draft. The plan doesn't address this recovery path. **Recommendation**: When `ReviewSuggestions` loads with no `location.state` but has a `draftId` query param, fetch decisions from `GET /api/drafts/:id` and restore them.
- **MEDIUM — Preview page doesn't handle draft-not-found gracefully**: If the draft was deleted (e.g., server restart cleared files, or user opened a stale link), the `GET /api/drafts/:draftId` call returns 404. The plan mentions "Error state shows the error with a link back to `/analysis/review`" (plan line 77), but doesn't specify what state to pass when the draft is gone. The review page would need to re-run analysis. **Recommendation**: The error link should navigate to `/analysis` (not `/analysis/review`) since there's no draft to recover from.
- **LOW — CSS module import path**: Plan line 127 says `import PreviewTailored from './pages/PreviewTailored.jsx'` but `main.jsx` is in `client/src/`, so the path is correct. However, the existing imports in `main.jsx` (lines 5-12) don't use `.jsx` extensions — they use `./pages/Dashboard.jsx`, `./pages/Resume.jsx`, etc. Wait, actually they DO use `.jsx` extensions (line 5: `import Dashboard from './pages/Dashboard.jsx'`). So this is consistent. No issue.
- **LOW — No loading skeleton for preview page**: The plan mentions "Loading state shows 'Loading tailored resume...'" but the existing pages (e.g., `Analysis.jsx`) use similar minimal loading states. Consistent with the codebase pattern, so this is fine.
- **LOW — The preview page renders resume sections manually**: The plan describes rendering name/contact, summary, skills, experience, projects, education sections. There's no shared "ResumeViewer" component — the preview page would duplicate rendering logic. This is acceptable for a single-use page, but if resume display is needed elsewhere, it would cause drift. **Recommendation**: Consider extracting a `ResumeViewer` component if the pattern is needed in 2+ places. Not blocking for Phase 12.

**Suggestions:**
1. **Add draft recovery for "Back to Suggestions"**: When `ReviewSuggestions` loads with no `location.state` but a `draftId` is available (from URL query param or localStorage), fetch the draft and restore decisions. This makes the flow robust against refreshes.
2. **Clarify the 404 error link destination**: The preview page error link should go to `/analysis` (full restart) rather than `/analysis/review` (which would also fail without state).
3. **Consider a `ResumeViewer` component**: If the preview page's resume rendering logic is more than ~50 lines, extract it to `client/src/components/ResumeViewer.jsx` for potential reuse.
4. **Add optimistic UI for the Generate button**: Show "Generating..." immediately on click (plan line 55 already does this), but also disable the button to prevent double-clicks. The plan correctly handles this with `disabled={generating || !hasAccepted}`.

**Risk Assessment:** LOW — The plan is well-aligned with the existing codebase patterns. The main risk is the state recovery on "Back to Suggestions" after a refresh, but this is a usability edge case, not a correctness issue. The draft-based architecture (server-side persistence) already handles the core TAILOR-05 requirement well.

### Overall Risk: LOW

Both plans are well-researched, reference the actual codebase accurately, and produce testable artifacts. The most significant issue is the **data path description mismatch** in Plan 12-01 (drafts at project root vs. `server/data/drafts/`), which is a documentation issue rather than a code defect. The `validateResume` extraction being labeled "optional" when it's effectively required is a minor process risk.

### Key Recommendations

1. **Make `validateResume` extraction mandatory** (Plan 12-01 Task 3)
2. **Fix the "last entry" search for `modify` patches** to search all entries (Plan 12-01 Task 1)
3. **Clarify draft storage path** to say project root, consistent with `DATA_DIR` (Plan 12-01 Task 2)
4. **Add draft recovery for browser refresh on preview page** (Plan 12-02 Task 2)
5. **Add orphaned draft cleanup** (either plan)

---

## Cursor Review

### Summary

Plans 12-01 and 12-02 are well-scoped, correctly sequenced (backend before frontend), and align with existing server patterns for resume library CRUD, schema validation, and suggestion shapes from Phase 11/11.5. The backend plan reuses real infrastructure (`readResumeVersion`, `writeResumeVersion`, `source_id`, `validateResume`) that already exists in `server/index.js`. The frontend plan correctly targets the disabled Generate button in `ReviewSuggestions.jsx` and the missing `/analysis/preview` route in `main.jsx`. However, verification against the codebase reveals critical gaps in **TAILOR-05** (return-to-review state restoration) and **refresh resilience**: server-side drafts are planned, but the frontend never hydrates `decisions` on return and stores `draftId` only in React Router location state. There are also internal inconsistencies on draft storage path and patch-application edge cases for AI-generated `modify` suggestions.

### Plan 12-01: Backend

**Strengths:**
- **Reuses proven library primitives.** `readResumeVersion` / `writeResumeVersion`, `generateId()`, `VALID_ID`, and `source_id` on index entries already exist (`server/index.js:146-187`, `282`, `429`), so the save flow in Task 2 fits the current architecture without new abstractions.
- **`validateResume` is the right gate for TAILOR-06.** The canonical validator at `server/index.js:44-144` is already invoked before every library write (`390-394`, `423-426`, `468-471`); extracting it to `server/lib/validateResume.js` (Task 3) avoids duplication in `applyPatches`.
- **Patch matrix matches the heuristic provider today.** `heuristic.js:238-344` emits `summary` add/modify, `skills` add, and `experience`/`projects` add only — matching the Task 1 acceptance criteria. Education is intentionally skipped (`341`), consistent with `validate.js:149-152`.
- **On-the-fly `tailored_resume` computation on GET** keeps drafts small (decisions + suggestions only) and guarantees preview reflects latest patch logic without stale cached resumes.
- **Source immutability is structurally sound.** Deep clone via `JSON.parse(JSON.stringify(resume))` plus reading source via `readResumeVersion(draft.resume_id)` ensures the library file for the source ID is never overwritten; save creates a new ID (`12-01-PLAN.md` Task 2 action).

**Concerns:**
- **HIGH — Draft directory path is inconsistent within the plan.** Acceptance criteria say `server/data/drafts/` (`12-01-PLAN.md:71`), but the action specifies `DRAFTS_DIR = path.join(DATA_DIR, 'drafts')` (`12-01-PLAN.md:79`). In code, `DATA_DIR` is the **project root**, not `server/data/` (`server/index.js:12`). No `server/data/` directory exists in the repo. Implementers will pick the wrong path unless clarified.
- **MEDIUM — `experience`/`projects` modify patches only search the last entry.** Task 1 action (`12-01-PLAN.md:52-54`) limits modify to the last experience/project entry, but `validateSuggestions` checks `current` against **all** entries (`server/lib/analysis/validate.js:182-190`). The AI provider can emit `modify` suggestions on any bullet (`server/lib/analysis/providers/ai.js:218-238`, schema at `46`), so AI-driven patches may silently no-op.
- **MEDIUM — No input validation on `POST /api/drafts`.** `/api/analyze` validates suggestions via `validateSuggestions(suggestions, resume)` before returning them (`server/index.js:604`, `653`), but the draft create route accepts raw `suggestions` and `decisions` with no structural checks. Malformed payloads could produce invalid tailored resumes that only fail at save time.
- **MEDIUM — No draft update/upsert.** `POST /api/drafts` always creates a new file. If a user generates, goes back, changes decisions, and generates again, the first draft is orphaned with no cleanup path specified.
- **LOW — Skill deduplication not handled.** `skills` + `add` pushes unconditionally (`12-01-PLAN.md:50`); accepting a skill suggestion for a keyword already present (partial match in heuristic filter at `heuristic.js:297-300`) could duplicate entries while still passing `validateResume`.
- **LOW — No automated tests.** Verification is manual curl only; `applyPatches` has many section/type branches with silent failure modes (e.g., modify with no matching bullet).

**Suggestions:**
- Resolve draft path explicitly: use `path.join(DATA_DIR, 'drafts')` (project-root `drafts/`, consistent with `job_postings.json` and `resume_library/` at root) and update acceptance criteria to match; add `drafts/` to `.gitignore` (currently only ignores specific data files at `.gitignore:26-32`).
- For `modify` on `experience`/`projects`, search all entries' `bullets` arrays (mirror `findInResume` in `validate.js:182-190`) and return a per-suggestion warning or error if no match.
- Call `validateSuggestions(req.body.suggestions, sourceResume)` on `POST /api/drafts` and reject invalid payloads with 400.
- Add `PUT /api/drafts/:id` (or upsert keyed by `resume_id` + `posting_id`) so re-generate updates the existing draft instead of orphaning files.
- Add a small unit test file for `applyPatches` covering summary modify, skills add, experience add-to-empty, and modify-no-match cases.

### Plan 12-02: Frontend

**Strengths:**
- **Correct starting point.** The Generate button is disabled with a Phase 12 placeholder (`client/src/pages/ReviewSuggestions.jsx:195-197`); CSS enforces disabled styling (`ReviewSuggestions.module.css:121-131`). Plan Task 1 directly addresses this.
- **Acceptance gating matches existing decision model.** `acceptedCount` already counts `accepted` and `edited` statuses (`ReviewSuggestions.jsx:142`), matching `applyPatches` filter criteria in 12-01 (`decisions[id]?.status === 'accepted' || 'edited'`).
- **Route gap is real.** `/analysis/preview` is absent from `main.jsx:15-28`; only `analysis/review` exists. Adding the route is straightforward.
- **Navigation from Analysis already passes suggestions via state.** `Analysis.jsx:352-355` passes `{ suggestions, resumeId, postingId, provider }` — the same shape the preview back-link needs for suggestions (though not decisions).
- **Preview-before-save matches CONTEXT.md decision #4.** Generate creates draft; save is a separate explicit action on preview — no premature library write.

**Concerns:**
- **HIGH — TAILOR-05 is not fully specified; current ReviewSuggestions will lose decisions on return.** `decisions` initializes to `{}` on every mount (`ReviewSuggestions.jsx:24`) and is never hydrated from `location.state`. Only `suggestions` is read from navigation state (`ReviewSuggestions.jsx:21-22`). Plan 12-02 Task 2 action says "Back to Suggestions" passes `{ suggestions, decisions }` (`12-02-PLAN.md:101`), but **no task updates ReviewSuggestions to consume `location.state?.decisions`**. Server-side draft persistence alone does not fix this unless the review page also loads decisions from the draft.
- **HIGH — Browser refresh breaks the preview flow despite CONTEXT.md requirement.** `draftId` is passed only via `navigate(..., { state: { draftId } })` (`12-02-PLAN.md:38`, `49`, `75`). React Router location state is lost on refresh. CONTEXT.md:32-36 explicitly requires persisted draft state to survive refresh, but the plan has no URL param (`?draft=`), sessionStorage fallback, or redirect-to-draft recovery.
- **MEDIUM — Generate and Back navigation state is inconsistent.** Generate navigates with `{ draftId, company, role }` (`12-02-PLAN.md:49`), but the Back handler expects `resumeId`, `postingId`, `provider`, `suggestions`, `decisions` from `location.state` (`12-02-PLAN.md:94`, `101`). Preview can recover `resume_id`, `posting_id`, `suggestions`, `decisions` from `GET /api/drafts/:id`, but `provider` is not stored in the draft schema (`12-01-PLAN.md:87`). Returning to review and re-fetching analysis would use the default `'heuristic'` (`ReviewSuggestions.jsx:20`) unless provider is persisted somewhere.
- **MEDIUM — No shared read-only resume renderer.** Plan Task 2 builds a one-off full resume render in `PreviewTailored.jsx` (`12-02-PLAN.md:97`) rather than reusing `Resume.jsx` or `SectionEditor.jsx` in read-only mode. This duplicates layout logic across ~450 lines in `Resume.jsx` and risks drift (e.g., education field names `degree`/`school`/`year` at `Resume.jsx:451+`).
- **MEDIUM — "Based on: KMP" subtitle lacks a specified data source.** Draft stores `resume_id` only (`12-01-PLAN.md:87`); library index holds the display name (`resume_library/index.json:6-7`). Plan acceptance criteria require showing source resume name (`12-02-PLAN.md:88`) but no fetch of `/api/resume-library` or enriched draft response is specified.
- **LOW — Validation errors on preview may be unreachable in happy path.** `GET /api/drafts/:id` returns `validation` alongside `tailored_resume` (`12-01-PLAN.md:93`), and preview shows validation errors (`12-02-PLAN.md:102`), but if validation fails the user cannot save (correct) and has no path to fix the resume inline — only "Back to Suggestions." Acceptable for MVP but worth UX consideration.
- **LOW — Orphan draft cleanup on abandon.** No UI calls `DELETE /api/drafts/:id` when user navigates away from the flow entirely (e.g., clicks "Back to Analysis" from preview).

**Suggestions:**
- Add a **Plan 12-02 Task 1.5 (or extend Task 1)**: hydrate `decisions` (and optionally `suggestions`) from `location.state` on mount in `ReviewSuggestions.jsx`, mirroring the existing `initialStateSuggestions` pattern at lines 21-24. Alternatively, pass `draftId` back and `GET /api/drafts/:id` to restore full state — more reliable than location state alone.
- Put `draftId` in the URL: `/analysis/preview?draft=<id>` so refresh works; read from `useSearchParams` with `location.state` as fallback.
- Extend draft schema to include `provider` (from `ReviewSuggestions.jsx:20`) so back-navigation can preserve AI vs heuristic context.
- Enrich `GET /api/drafts/:id` response with `source_name` (lookup from library index) to avoid an extra client fetch for the subtitle.
- Consider extracting a `<ResumeReadOnly data={...} />` component shared between preview and future export/print flows.
- Wire `DELETE /api/drafts/:id` on preview unmount or explicit "Discard" if user leaves without saving.

### Cross-Cutting Observations

| Requirement | Plan Coverage | Codebase Evidence |
|---|---|---|
| TAILOR-01 (apply accepted patches to deep copy) | Covered in 12-01 Task 1 | No `applyPatches` module exists yet |
| TAILOR-02 (save as new version, no overwrite) | Covered in 12-01 Task 2 save route | `writeResumeVersion` creates new file per ID (`server/index.js:177-186`) |
| TAILOR-03 (preview before save) | Covered in 12-02 Task 2 | No preview page/route exists |
| TAILOR-04 (`source_id` link) | Covered in 12-01 save action | Index schema supports `source_id` (`server/index.js:429`) |
| TAILOR-05 (return without losing decisions) | **Gap** — server draft exists but review page won't reload decisions | `ReviewSuggestions.jsx:24` resets decisions |
| TAILOR-06 (schema validation before save) | Covered in 12-01 save + applyPatches | `validateResume` at `server/index.js:44-144` |
| LIBRARY-03 (auto-name "Company - Role") | Covered in 12-02 preview name field | Posting has `company`/`role` (`server/index.js:325-326`) |

**Dependency ordering:** Wave 1 → Wave 2 is correct. Phase 11.5 (AI provider) is complete; `/api/analyze` returns suggestions for both heuristic and AI paths (`server/index.js:551-667`), and the review UI already supports `provider` via URL/state (`ReviewSuggestions.jsx:20`).

**Scope creep check:** CONTEXT.md mentions `POST /api/tailor` and `DraftIndicator.jsx` (`CONTEXT.md:43-49`) — correctly omitted from executable plans. No over-engineering concern.

**Security:** Single-user local tool; no auth needed. Draft endpoints should still validate `VALID_ID` (planned) and cap payload size on `suggestions`/`decisions` arrays to prevent accidental megabyte writes.

**Performance:** On-the-fly patch computation on every GET is fine for single-user JSON files. No concern at current scale.

### Risk Assessment: MEDIUM-HIGH

The backend plan (12-01) is implementable with low technical risk and strong alignment to existing code. The frontend plan (12-02) has the right UX shape but **will not satisfy TAILOR-05 or CONTEXT.md refresh requirements as written** because `ReviewSuggestions` never reloads `decisions` and `draftId` lives only in ephemeral navigation state. These are fixable with small additive tasks (hydrate decisions from draft/location state, URL-param draft ID) but are blocking for phase success criteria #4 and #5. Secondary risks include silent patch failures for AI `modify` suggestions and orphaned draft files on repeated generate cycles. Recommend addressing the HIGH items before execution begins; the rest can be handled during implementation.

---

## Consensus Summary

### Agreed Strengths

- **validateResume extraction is correct and necessary.** All three reviewers agree this is the right approach for TAILOR-06.
- **Draft-based server-side persistence is the right architecture.** Survives navigation, keeps drafts small, and aligns with existing JSON file patterns.
- **On-the-fly patch computation on GET** keeps drafts lightweight and guarantees preview reflects latest decisions.
- **Deep clone strategy is sound.** `JSON.parse(JSON.stringify(resume))` is correct for the data shape.
- **Wave 1 → Wave 2 dependency ordering is correct.** Backend before frontend is the right sequence.
- **Generate button wiring targets the correct disabled element.** All reviewers verified the reference.

### Agreed Concerns

1. **HIGH — TAILOR-05 state restoration gap.** All three reviewers identify that `ReviewSuggestions.jsx:24` resets `decisions` to `{}` on every mount and never hydrates from `location.state`. Server-side drafts alone don't fix this unless the review page loads decisions from the draft. This is a blocking issue for success criteria #4.

2. **HIGH — Draft directory path is inconsistent.** The plan says `server/data/drafts/` but `DATA_DIR` resolves to project root. All three reviewers flagged this as misleading.

3. **HIGH — Browser refresh breaks preview flow.** `draftId` is only in React Router location state (lost on refresh). Need URL param (`?draft=<id>` or `/preview/:draftId`) for refresh resilience.

4. **MEDIUM — `modify` patches only search last entry.** All three reviewers agree that `experience`/`projects` modify should search all entries, not just the last one. The existing `findInResume` in `validate.js:182-190` already does this correctly.

5. **MEDIUM — validateResume extraction is mislabeled "optional."** It's effectively required since `applyPatches` needs it. All reviewers recommend making it mandatory.

6. **MEDIUM — No draft cleanup mechanism.** Orphaned drafts accumulate indefinitely. Simple startup cleanup (delete drafts older than 24h) would suffice.

7. **MEDIUM — No input validation on POST /api/drafts.** Should validate suggestions/decisions structure before writing.

### Divergent Views

- **Suggestion patch format complexity.** Codex rates the suggestion format as "not structured enough" (HIGH risk), while OpenCode and Cursor note the format matches what the heuristic provider currently emits and is workable. The pragmatic view: the current format is sufficient for Phase 12's scope (heuristic + AI providers both emit compatible shapes), but `modify` patches need clearer targeting (search all entries, not just last).

- **ResumeViewer component.** Codex and Cursor suggest extracting a shared read-only resume renderer. OpenCode notes this is acceptable for a single-use page. Consensus: not blocking for Phase 12, but worth considering if preview rendering exceeds ~50 lines.

- **Draft update vs. create.** Cursor suggests `PUT /api/drafts/:id` for re-generation. OpenCode and Codex don't flag this. For a single-user local tool, orphaned drafts are low-risk if cleanup is added.
