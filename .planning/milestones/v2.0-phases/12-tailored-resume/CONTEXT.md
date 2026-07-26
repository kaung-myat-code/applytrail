# Context: Phase 12 - Tailored Resume Generation

**Date:** 2026-07-05
**Discussed by:** User + Claude

## Goal

Generate a new tailored resume from accepted suggestions, review it before saving, and return to edit if needed.

## Requirements

- LIBRARY-03, TAILOR-01 through TAILOR-06

## Decisions

### 1. Patch Format: Custom Section-Level Patches

Use a custom patch format tailored to resume structure. Patches are granular (individual bullets or section-level) and easy to validate against the schema. No RFC 6902 or other industry standard — overkill for a single-user local tool.

### 2. Preview Flow: Separate Preview Page

Navigate to a dedicated preview page showing the full tailored resume. "Back to suggestions" returns to the review step without losing accept/reject decisions. The return flow is explicit and preserves all state.

### 3. Auto-naming: Pre-fill "Company - Role", Editable

Per LIBRARY-03, auto-generate name as "Company - Role" (e.g., "Meridian Software - Fullstack Developer"). User can edit before save. No prompt dialog — the name is pre-filled in the preview/save flow.

### 4. Save Flow: Save After Preview

User reviews the full tailored resume on the preview page, then explicitly clicks "Save" to commit. No immediate save on "Generate" — the review step is mandatory.

### 5. State Management: Persisted Draft State

Replace React-only state with lightweight persisted draft state so accepted/rejected decisions survive refreshes and navigation. Use temporary server-side storage (e.g., `server/data/drafts/` or in-memory with file backup). Draft is ephemeral — deleted after the user confirms save or abandons the flow.

**Why:** The "return to suggestions" requirement (TAILOR-05) means state must survive navigation between preview and review pages. React state alone would be lost on unmount. Persistence adds ~5 lines of API code and a small JSON file.

## Architecture

### New Components

- `client/src/pages/PreviewTailored.jsx` — Preview page showing full tailored resume with save/back controls
- `client/src/components/DraftIndicator.jsx` — Optional: shows draft save status (saved/dirty)

### New API Endpoints

- `POST /api/drafts` — Create or update a draft (accept/reject decisions + tailored resume)
- `GET /api/drafts/:id` — Retrieve a draft
- `DELETE /api/drafts/:id` — Delete a draft (after save or abandon)
- `POST /api/tailor` — Apply accepted suggestions to a resume, return tailored version

### New Data Files

- `server/data/drafts/` — Directory for temporary draft JSON files (auto-cleaned)

### Modified Components

- `ReviewSuggestions.jsx` — Add "Generate Tailored Resume" button (currently disabled), wire to draft creation + navigation to preview
- `server/lib/analysis/` — Add `applyPatches(resume, suggestions, decisions)` function

## Open Questions

1. Should the draft be stored in-memory (simplest) or as files (survives server restart)? **Recommendation:** Files, since the user may restart the server mid-workflow.
2. How long should drafts persist? **Recommendation:** Until explicitly saved or abandoned. No auto-expiry for a local tool.
3. Should the preview page show a diff view alongside the tailored resume? **Recommendation:** No — the preview is the final result, not a comparison. The diff was already shown during suggestion review.
