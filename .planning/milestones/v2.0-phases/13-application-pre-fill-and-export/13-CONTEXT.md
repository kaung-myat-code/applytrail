# Phase 13: Application Pre-fill and Export - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Two capabilities, both operating on existing data:

1. **Application pre-fill** — after a tailored resume is generated and saved, let the user create a job application record pre-populated with company, role, job posting text, and the tailored resume's `resume_version_id`, with a confirmation step before it's created.
2. **Resume export** — let the user export any resume library version as a PDF file or a JSON file.

No new capabilities beyond PREFILL-01/02/03 and EXPORT-01/02. The legacy `NewApplication.jsx` manual job-posting form is explicitly out of scope for changes (see Decisions).

</domain>

<decisions>
## Implementation Decisions

### Pre-fill Entry Point
- **D-01:** Primary trigger is automatic — after `PreviewTailored.jsx`'s "Save to Library" succeeds, show the pre-fill confirmation immediately instead of (or before) navigating to `/resume-library`. This is the "seamless" continuation from tailoring to application called out in PROJECT.md.
- **D-02:** Secondary trigger — add a "Create Application" action to each resume version's card in `ResumeLibrary.jsx`, so a user who dismissed/skipped the auto-prompt (or wants to link an older resume version to a new application later) can still start the flow from the library.

### Confirmation Dialog
- **D-03:** Modal dialog (not a separate route/page). Shows company, role, a job posting excerpt, and the linked resume version's name — all pre-filled from the draft/posting data already on hand (`draft.company`, `draft.role`, `posting.posting_text`, the newly-created library entry's `id`/`name`).
- **D-04:** Company, role, and status are editable inline in the modal. Job posting text and the resume version link are read-only display (they're derived, not user-entered at this step). Confirm creates the application; Cancel dismisses without creating anything (and, for the auto-trigger path, still lands the user on `/resume-library` since the resume was already saved).
- **D-05:** The modal also auto-generates the cover letter paragraph by calling the existing cover-letter logic (same approach as `POST /api/generate-cover-letter`) against the linked resume + posting, and shows it pre-filled and editable in the modal.
- **D-06:** Default status on creation is `drafted`, consistent with existing `VALID_STATUSES` and current application-creation behavior.

### Legacy New Application Page
- **D-07:** `NewApplication.jsx` is left as-is in this phase. It currently only saves a job posting (doesn't create an application or link a resume) — that mismatch is tracked as backlog issue #2 ("Clarify job posting vs. application workflow") and is explicitly deferred, not fixed here.

### PDF/JSON Export
- **D-08:** PDF generation uses **pdfmake** (server-side, pure-JS document-definition rendering) — no headless browser (Puppeteer/Chromium). This directly addresses the Render free-tier (512MB RAM) constraint already flagged in STATE.md as a Phase 13 blocker/concern. Requires writing a mapping from resume JSON (contact, summary, experience, projects, education, skills) to a pdfmake document definition; this will not visually match the on-screen preview pixel-for-pixel, but is safe under the memory ceiling.
- **D-09:** JSON export is the resume version's raw JSON as stored in `resume_library/{id}.json` (no wrapping/reformatting needed — it's already the human-readable source of truth per project conventions).
- **D-10:** Export actions ("Export PDF", "Export JSON") live on each resume version's card in `ResumeLibrary.jsx`, next to the existing per-version actions (edit, select, delete). Not on the `Resume.jsx` editor page or a separate export screen.

### Claude's Discretion
- Exact pdfmake layout/typography (fonts, margins, section ordering) is left to implementation — no specific visual reference was given beyond "safe on Render free tier" and following the resume's existing section order (Summary, Skills, Experience, Projects, Education).
- Whether the pre-fill modal is a single form or has a lightweight "preview then confirm" two-step interaction inside the modal is an implementation detail, not a locked decision.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` §"Phase 13: Application Pre-fill and Export" — goal, success criteria, depends-on Phase 12
- `.planning/REQUIREMENTS.md` §"Application Pre-fill & Export" — PREFILL-01, PREFILL-02, PREFILL-03, EXPORT-01, EXPORT-02

### Prior Phase Context (data model this phase builds on)
- `.planning/phases/12-tailored-resume/CONTEXT.md` — draft-based tailoring flow, `resume_version_id` naming precedent, persisted draft state pattern
- `.planning/STATE.md` §"Blockers/Concerns" — flags the Render free-tier (512MB RAM) PDF export library risk this phase must respect; §"Pending Todos" also notes deferred `applyPatches` gaps (education/summary remove) not blocking this phase

### Existing Server Routes (reuse, don't duplicate)
- `server/index.js` — `POST /api/applications` (job_posting_id-based creation, needs `resume_version_id` field added), `POST /api/drafts/:id/save` (creates library version, returns `{ ok, version }`), `POST /api/generate-cover-letter` (existing cover-letter generation to reuse for D-05)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/lib/cover-letter.js` (`generateCoverLetter`) — reuse directly for auto-generating the cover letter paragraph in the pre-fill modal (D-05), same call shape as `POST /api/generate-cover-letter`.
- `client/src/pages/PreviewTailored.jsx` — the natural hook point for the auto-trigger pre-fill flow (D-01); currently navigates straight to `/resume-library` on save success.
- `client/src/pages/ResumeLibrary.jsx` — existing per-version card actions to extend with "Create Application" (D-02) and "Export PDF"/"Export JSON" (D-10).
- `readLibraryIndex()` / `readResumeVersion()` / `writeLibraryIndex()` in `server/index.js` — existing helpers for resume_library file I/O; export endpoints read via `readResumeVersion(id)`.

### Established Patterns
- Applications are currently keyed off `job_posting_id`, not a resume version — `POST /api/applications` (server/index.js:267) requires an existing `job_postings.json` entry and has no `resume_version_id` field today. This phase adds that field (PREFILL-03) as an additive change to the existing schema, not a replacement.
- Job postings created via the analysis flow (`draft.posting_id`) already exist by the time a tailored resume is saved — no need to create a new job posting at pre-fill time, just reference the existing one.
- IDs use `generateId()` (`Date.now().toString(36) + random`) and `VALID_ID = /^[a-z0-9]+$/` validation throughout — follow this for any new fields/params.
- `date_applied` / `last_status_change` use `new Date().toISOString().split('T')[0]` (YYYY-MM-DD) — follow for any new date fields, per JSON Data Convention (ISO 8601).

### Integration Points
- `POST /api/drafts/:id/save` (server/index.js:578) currently returns `{ ok: true, version: entry }` after creating the library entry — the pre-fill modal needs `company`/`role`/`posting_id` from the draft (already read via `readDraft(id)` before deletion) to pre-populate itself; the draft is deleted at the end of this handler, so the client must capture this data before/during the save call, not after.
- No PDF library exists yet in `server/package.json` — `pdfmake` (D-08) needs to be added as a new dependency.

</code_context>

<specifics>
## Specific Ideas

No specific visual/UX reference was given for PDF layout beyond "safe under Render's 512MB RAM ceiling" (explicitly ruling out Puppeteer/headless-Chrome). Confirmation dialog is explicitly a modal, not a new route.

</specifics>

<deferred>
## Deferred Ideas

- **NewApplication.jsx confusion** (D-07) — the page only saves a job posting today and doesn't create an application or link a resume. Tracked as backlog issue #2 ("Clarify job posting vs. application workflow with next-step feedback") under Phase 999.1. Not touched in Phase 13.

### Reviewed Todos (not folded)
None — `todo.match-phase` returned no matches for Phase 13 at discussion time.

</deferred>

---

*Phase: 13-Application Pre-fill and Export*
*Context gathered: 2026-07-17*
