# Phase 13: Application Pre-fill and Export - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 7 (new/modified)
**Analogs found:** 6 / 7 (1 has no full precedent — the modal component — but has strong partial analogs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `server/index.js` — `POST /api/applications` (add `resume_version_id`) | route | CRUD | itself, `server/index.js:267-298` | exact (additive modification) |
| `server/index.js` — `POST /api/applications/:id/export-pdf` (new) | route | file-I/O (generate + stream) | `server/index.js:402-412` (`GET /api/resume-library/:id`) + `server/lib/cover-letter.js` (generation-then-return shape) | role-match |
| `server/index.js` — `GET /api/resume-library/:id/export/json` (new) | route | file-I/O | `server/index.js:402-412` (`GET /api/resume-library/:id`) | exact |
| `server/index.js` — `GET /api/resume-library/:id/export/pdf` (new) | route | file-I/O (streaming binary response) | `server/index.js:402-412` (`GET /api/resume-library/:id`), no existing binary-response route — new territory | partial |
| `server/lib/pdf.js` (new — pdfmake document-definition mapper) | service/utility | transform | `server/lib/cover-letter.js` (pure transform module, no I/O, single exported function) | role-match |
| `client/src/pages/PreviewTailored.jsx` (modify `handleSave`) | page (event handler) | request-response | itself, lines 51-69 | exact (modification) |
| `client/src/pages/ResumeLibrary.jsx` (add Create Application / Export actions) | page (component + handlers) | request-response, event-driven | itself, lines 32-94 (`handleCreate`/`handleSelect`/`handleDelete`) | exact (modification) |
| `client/src/components/CreateApplicationModal.jsx` (new) | component | request-response (multi-step: open → fetch cover letter → confirm → POST) | No modal precedent exists. Closest structural analog: `PreviewTailored.jsx` (fetch-on-mount + form state + save handler pattern) combined with `ResumeLibrary.jsx`'s inline-edit pattern (`renamingId`/`renameValue` state pair, lines 10-11, 63-78) | no analog (first modal) — UI-SPEC.md is authoritative for structure |
| `client/src/components/CreateApplicationModal.module.css` (new) | config/style | n/a | `client/src/pages/ResumeLibrary.module.css` (button classes, `.error`, `fadeInUp` keyframe, spacing tokens) | role-match |

## Pattern Assignments

### `server/index.js` — `POST /api/applications` (add `resume_version_id`)

**Analog:** itself, `server/index.js:267-298` (current implementation)

**Current pattern to extend** (lines 267-298):
```javascript
app.post('/api/applications', (req, res) => {
  const { job_posting_id, cover_letter_paragraph, status } = req.body

  if (!job_posting_id) {
    return res.status(400).json({ error: 'job_posting_id is required' })
  }

  const postings = readJSON('job_postings.json')
  const posting = postings.find(p => p.id === job_posting_id)

  if (!posting) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  const applications = readJSON('applications.json')
  const now = new Date().toISOString().split('T')[0]

  const newApplication = {
    id: generateId(),
    job_posting_id,
    company: posting.company,
    role: posting.role,
    cover_letter_paragraph: cover_letter_paragraph || '',
    status: status || 'drafted',
    date_applied: now,
    last_status_change: now
  }

  applications.push(newApplication)
  writeJSON('applications.json', applications)
  res.json({ ok: true, application: newApplication })
})
```

**Additive change needed:** destructure `resume_version_id` from `req.body`, validate with existing `VALID_ID` regex (`server/index.js:42`) if present (same pattern as `readResumeVersion`, line 65-66: `if (!VALID_ID.test(id)) return null`), and include it on `newApplication`. Do not make it required — existing manual `NewApplication.jsx` flow (out of scope, D-07) has no resume version and must keep working unchanged. Also allow `company`/`role`/`status` to be passed directly from the modal (D-04 makes them editable) rather than solely derived from `posting.company`/`posting.role` — fall back to posting fields when not provided, mirroring the `status || 'drafted'` fallback already present.

**Status validation to reuse** (lines 300, 306-307):
```javascript
const VALID_STATUSES = ['drafted', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn']
...
if (!status || !VALID_STATUSES.includes(status)) {
  return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
}
```
Apply the same `VALID_STATUSES.includes` check if `status` is provided in the pre-fill create-application call (defaults to `drafted` per D-06 if omitted, consistent with existing fallback).

---

### `server/index.js` — Export routes (new: JSON and PDF)

**Analog:** `GET /api/resume-library/:id` (lines 402-412) for validation/lookup shape; `POST /api/generate-cover-letter` (lines 630-655) for the "load resume + transform + respond" shape.

**ID validation + 404 pattern to copy** (lines 402-412):
```javascript
app.get('/api/resume-library/:id', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }
  const data = readResumeVersion(id)
  if (!data) {
    return res.status(404).json({ error: 'Resume version not found' })
  }
  res.json(data)
})
```

**JSON export route** — nearly identical to the above; D-09 says return the raw stored JSON with no reformatting, so this route can literally reuse `readResumeVersion(id)` and `res.json(data)` (optionally with `Content-Disposition` header for a filename, e.g. `res.setHeader('Content-Disposition', 'attachment; filename="resume.json"')` before `res.json(data)` — check `res.json` doesn't strip headers set beforehand in this Express version; alternatively use `res.attachment('resume.json').json(data)` which is the idiomatic Express 4 combination).

**PDF export route** — new pattern (no streaming/binary response precedent exists in this codebase). Structure should follow the same guard clauses (`VALID_ID.test`, `readResumeVersion` 404 check) then hand off to the new `server/lib/pdf.js` transform, e.g.:
```javascript
app.get('/api/resume-library/:id/export/pdf', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }
  const data = readResumeVersion(id)
  if (!data) {
    return res.status(404).json({ error: 'Resume version not found' })
  }
  try {
    const pdfDoc = buildResumePdfDefinition(data) // from server/lib/pdf.js
    const printer = new PdfPrinter(fonts)
    const pdfDocGen = printer.createPdfKitDocument(pdfDoc)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${data.name || 'resume'}.pdf"`)
    pdfDocGen.pipe(res)
    pdfDocGen.end()
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message })
  }
})
```
Error-handling style (try/catch → 500 with `error` + optional `details`) mirrors `app.post('/api/resume-library', ...)`'s validation-error shape (`server/index.js:385-388`: `res.status(400).json({ error: 'Invalid resume data', details: validation.errors })`) — same `{ error, details }` envelope convention used throughout the file.

---

### `server/lib/pdf.js` (new)

**Analog:** `server/lib/cover-letter.js` (pure transform module pattern)

**Module shape to copy** (`server/lib/cover-letter.js` lines 1-14):
```javascript
/**
 * [Module purpose docstring — matches existing style]
 */

const { extractKeywords } = require('./analysis/keywords')

/**
 * [Function purpose]
 */
function matchResumeToJob(resume, postingText) {
  // ...
}

module.exports = { generateCoverLetter, matchResumeToJob }
```
Follow this exactly: top-of-file docstring explaining purpose and "replaceable" intent (matches CLAUDE.md convention "designed to be replaceable"), a single primary exported function (e.g. `buildResumePdfDefinition(resumeData)`), pure function with no file I/O or Express dependencies — the route handler owns I/O (`readResumeVersion`) and this module only transforms JS objects. Section order in the generated PDF must follow Summary, Skills, Experience, Projects, Education per D-08/CONTEXT.md discretion note.

---

### `client/src/pages/PreviewTailored.jsx` — `handleSave` (modify for auto-trigger)

**Analog:** itself, lines 51-69 (current implementation)

**Current pattern:**
```javascript
async function handleSave() {
  if (saving) return
  setSaving(true)
  setSaveError('')
  try {
    const res = await fetch(`/api/drafts/${draftId}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to save resume')
    navigate('/resume-library')
  } catch (err) {
    setSaveError(err.message || 'Failed to save tailored resume.')
  } finally {
    setSaving(false)
  }
}
```

**Modification needed (D-01):** capture `draft.company`, `draft.role`, and posting/job-posting-text data *before* the save call resolves (the draft object is already in state via `useEffect` at lines 21-49, and `data.posting_id` should be captured from the draft fetch — confirm the `/api/drafts/:id` GET response includes `posting_id`/`posting_text` or fetch the posting separately using `job_posting_id` already available on the draft). On success, instead of `navigate('/resume-library')` immediately, open the new `CreateApplicationModal` with props `{ company, role, postingText, resumeVersionId: data.version.id, resumeVersionName: name, onCancel: () => navigate('/resume-library'), onSuccess: () => navigate('/resume-library') }` per D-01/D-04 (auto-trigger path). Preserve the existing `saving`/`saveError` state variables and `disabled={saving || validationFailed}` guard on the Save button (lines 205-211) unchanged.

---

### `client/src/pages/ResumeLibrary.jsx` — new actions (Create Application, Export PDF, Export JSON)

**Analog:** itself, lines 32-94 (`handleCreate`, `handleSelect`, `handleRename`, `handleDelete`) and the `.actions` button row (lines 170-197)

**Handler pattern to copy** (`handleSelect`, lines 51-61 — simplest fetch+error-state shape):
```javascript
async function handleSelect(id) {
  setError('')
  try {
    const res = await fetch(`/api/resume-library/${id}/select`, { method: 'PUT' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to select resume')
    fetchLibrary()
  } catch (err) {
    setError(err.message)
  }
}
```
Follow this exact shape for `handleExportJson(id)` (fetch `/api/resume-library/${id}/export/json`, but this is a file download — use `window.location.href = ...` or an anchor `<a download>` rather than `fetch`+`res.json()`, since JSON.stringify body needs to trigger a browser download, not be consumed as app state) and for a `handleCreateApplication(version)` that sets a new `creatingApplicationFor` state variable (mirroring `renamingId`/`deletingId` naming convention, lines 10-12) to open `<CreateApplicationModal>` with `resumeVersionId={version.id}` and `resumeVersionName={version.name}`.

**Per-card action button row to extend** (lines 170-197):
```javascript
<div className={styles.actions}>
  <button className={styles.btn} onClick={() => handleSelect(version.id)} disabled={version.id === library.selected_id}>
    {version.id === library.selected_id ? 'Selected' : 'Select'}
  </button>
  <button className={styles.btn} onClick={() => { setRenamingId(version.id); setRenameValue(version.name || '') }}>
    Rename
  </button>
  <button className={styles.btnDanger} onClick={() => handleDelete(version.id)} disabled={deletingId === version.id || library.versions.length === 1}>
    Delete
  </button>
  <Link to={`/resume/${version.id}`} className={styles.btn}>
    Edit
  </Link>
</div>
```
Add three more `<button className={styles.btn} ...>` elements (Export PDF, Export JSON, Create Application) inside this same `.actions` div, using the neutral `.btn` class (not `.btnPrimary`) per UI-SPEC.md D-color rule ("do not use accent color on Export PDF/JSON buttons"). UI-SPEC.md flags `.actions` needs `flex-wrap: wrap` added in the CSS module since this pushes the row to 7 buttons.

**Loading/disabled label-swap pattern to reuse** (`handleCreate`, lines 32-49, and JSX lines 128-135):
```javascript
<button className={styles.btnPrimary} onClick={handleCreate} disabled={creating} ...>
  {creating ? 'Creating...' : 'New Resume'}
</button>
```
Apply identically for Export PDF/JSON buttons: track per-card `exportingId` state, swap label to `'Exporting...'` while in flight, disable the button, per UI-SPEC.md copy contract.

---

### `client/src/components/CreateApplicationModal.jsx` (new — no direct analog)

No modal exists in the codebase (confirmed by UI-SPEC.md). Compose from two existing patterns:

**Fetch-on-mount + form state pattern** to copy from `PreviewTailored.jsx` lines 21-49 (`useEffect` fetch-and-populate-state) — use this shape to auto-generate the cover letter on modal open by calling the existing cover-letter generation logic:

```javascript
// Reuse the same request shape as POST /api/generate-cover-letter (server/index.js:630-655)
// but this modal has resume_version_id + posting data already in hand, not just job_posting_id.
// Recommend adding resume_version_id support to /api/generate-cover-letter, OR calling it as-is
// with job_posting_id (it already falls back through readLibraryIndex/readResumeVersion — server/index.js:644-651)
useEffect(() => {
  async function loadCoverLetter() {
    setCoverLetterLoading(true)
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_posting_id: postingId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCoverLetter(data.cover_letter_paragraph)
    } catch (err) {
      setCoverLetter('')
      setCoverLetterError(true) // shows fallback copy per UI-SPEC.md
    } finally {
      setCoverLetterLoading(false)
    }
  }
  loadCoverLetter()
}, [])
```

**Inline-editable field pair pattern** to copy from `ResumeLibrary.jsx` lines 10-11, 142-153 (`renamingId`/`renameValue` state + controlled input + Enter-to-save) — apply the same controlled-input approach for the modal's editable Company/Role/Status/Cover-letter fields.

**Confirm handler pattern** to copy from `PreviewTailored.jsx`'s `handleSave` (lines 51-69) — same `saving`/`saveError` state pair, same try/catch/finally shape, POSTs to `/api/applications` with `{ job_posting_id, resume_version_id, company, role, status, cover_letter_paragraph }`.

**No existing CSS for backdrop/dialog** — UI-SPEC.md's "Modal Interaction Contract" section is authoritative (backdrop `rgba(26, 22, 37, 0.4)`, dialog `--radius-lg`, `--shadow-lg`, `max-width: 560px`). Reuse `fadeInUp` keyframe already defined in `ResumeLibrary.module.css` (line 217) for the dialog entrance animation:
```css
@keyframes fadeInUp {
  /* see ResumeLibrary.module.css:217+ for exact definition to copy verbatim */
}
```

---

## Shared Patterns

### ID Generation & Validation
**Source:** `server/index.js:24-26` (`generateId`), `server/index.js:42` (`VALID_ID` regex)
**Apply to:** Any new server-side entity creation (none strictly required this phase beyond existing `generateId()` reuse for applications)
```javascript
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
}
const VALID_ID = /^[a-z0-9]+$/
```

### Date Formatting
**Source:** `server/index.js:282`, `:317`, `:336`, `:380`
**Apply to:** Any new date field (none new this phase — `resume_version_id` is a reference, not a date)
```javascript
const now = new Date().toISOString().split('T')[0]
```

### Error Response Envelope
**Source:** consistent across `server/index.js` (e.g. lines 271, 278, 306-307, 385-388)
**Apply to:** All new/modified routes in this phase
```javascript
res.status(400).json({ error: 'message' })
res.status(400).json({ error: 'message', details: validation.errors }) // when structured detail exists
res.status(404).json({ error: 'X not found' })
```

### Frontend fetch + error-state pattern
**Source:** `ResumeLibrary.jsx` lines 51-61, `PreviewTailored.jsx` lines 51-69
**Apply to:** All new client handlers (`handleExportJson`, `handleExportPdf`, `handleCreateApplication`, modal's `handleConfirm`)
```javascript
async function handlerName(...) {
  setError('')
  try {
    const res = await fetch(url, { method, headers, body })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'fallback message')
    // success side effect (refetch, navigate, close modal)
  } catch (err) {
    setError(err.message)
  }
}
```

### Loading/disabled button label-swap
**Source:** `ResumeLibrary.jsx` lines 111-113, 128-135; `PreviewTailored.jsx` lines 205-211
**Apply to:** Export PDF/JSON buttons, modal's Confirm button
```javascript
<button disabled={inFlight} onClick={handler}>
  {inFlight ? 'Verb-ing...' : 'Verb'}
</button>
```

### Button styling classes
**Source:** `client/src/pages/ResumeLibrary.module.css` lines 91-151 (`.btn`, `.btnPrimary`, `.btnDanger`)
**Apply to:** `CreateApplicationModal.module.css` and any new `ResumeLibrary.jsx` action buttons — reuse `.btn` for neutral secondary actions (Export PDF, Export JSON, Cancel), `.btnPrimary`-equivalent styling for the modal's "Confirm & Create Application" CTA, per UI-SPEC.md's accent-color budget rule.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `client/src/components/CreateApplicationModal.jsx` | component | request-response (multi-step) | First modal/dialog component in the codebase (confirmed via grep by gsd-ui-researcher). UI-SPEC.md's "Modal Interaction Contract" section is the authoritative structural reference; compose from `PreviewTailored.jsx` + `ResumeLibrary.jsx` sub-patterns as documented above. |
| `server/index.js` PDF export route (binary/streaming response) | route | file-I/O (binary stream) | No existing route in this codebase returns a non-JSON binary response (`res.setHeader('Content-Type', 'application/pdf')` + `.pipe(res)`); pdfmake's own docs (`PdfPrinter.createPdfKitDocument(...).pipe(res)`) are the reference, not an internal analog. |

## Metadata

**Analog search scope:** `server/index.js`, `server/lib/cover-letter.js`, `client/src/pages/PreviewTailored.jsx`, `client/src/pages/ResumeLibrary.jsx`, `client/src/pages/ResumeLibrary.module.css`, `server/package.json`
**Files scanned:** 6
**Pattern extraction date:** 2026-07-17
