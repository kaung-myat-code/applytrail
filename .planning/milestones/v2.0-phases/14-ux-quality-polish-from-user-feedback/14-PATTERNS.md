# Phase 14: UX & Quality Polish - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 13 (modify) + 1 possible new test file
**Analogs found:** 13 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `client/src/pages/NewApplication.jsx` (D-01 redirect) | component/page | request-response | itself (existing save handler) + `client/src/pages/CoverLetter.jsx` (destination) | exact (self) |
| `client/src/pages/CoverLetter.jsx` (D-02 inline confirm) | component/page | request-response | `client/src/components/CreateApplicationModal.jsx` (confirm/submit/error pattern) | role-match |
| `client/src/pages/Applications.jsx` (D-04 date labels) | component/page | CRUD (display only) | itself — `daysSinceLastChange`/`isStale` helpers already present | exact (self) |
| `client/src/components/Navbar/Navbar.jsx` (D-05/D-06/D-07 nav groups) | component | request-response (client nav state) | `client/src/components/CreateApplicationModal.jsx` (outside-click/Escape close pattern) for the new dropdown; itself for `navLinks` data structure | role-match |
| `client/src/pages/Analysis.jsx` (D-06 continue CTA) | component/page | request-response | itself — existing `.reviewButton`/`reviewLink` block (lines 350-360) | exact (self) |
| `client/src/pages/Resume.jsx` (D-11 delete confirm, saved/unsaved indicator, preview trigger) | component/page | CRUD | `client/src/pages/ResumeLibrary.jsx` (`window.confirm` delete pattern, line 84-85); itself for save/dirty-state wiring | role-match |
| new: Resume preview modal (rendered inline in `Resume.jsx` or split component) (D-11) | component | request-response (no network — sync render) | `client/src/components/CreateApplicationModal.jsx` (backdrop/dialog/Escape/focus/scroll-lock) + `client/src/pages/PreviewTailored.jsx` (read-only resume markup) | exact |
| `client/eslint.config.js` (D-12 ignore dist) | config | n/a | itself | exact (self) |
| various components (D-12 prop-types, unused vars) | component | n/a | `client/src/components/CreateApplicationModal.jsx` (well-typed prop destructure as a model, though repo has no PropTypes yet — will be first) | no analog (new convention) |
| `server/index.js` `POST /api/resume-library` (D-08 bug fix) | route/controller | CRUD | itself — sibling `PUT /api/resume` route (lines 380-394) which already validates before write | exact (self) |
| new: server contract test for resume-library create (D-09) | test | request-response | `server/lib/pdf.test.js` (plain Node `assert` + custom `test()` runner, no framework) | exact |
| `server/lib/analysis/keywords.js` (D-13 whitelist expansion, D-15 acronym map) | utility | transform | itself — existing `TECH_KEYWORDS` Set structure (lines 14+) | exact (self) |
| `server/lib/cover-letter.js` (D-14 grammar/possessive/genericness) | service | transform | itself — `buildClosing`/`generateCoverLetter` (lines 152-189) | exact (self) |
| `client/src/pages/Analysis.jsx` (D-15 keyword badge casing) | component/page | transform (display) | `server/lib/analysis/keywords.js` (shared casing source) | role-match |

## Pattern Assignments

### `client/src/pages/NewApplication.jsx` (D-01 — redirect after save)

**Analog:** itself (`handleSubmit`, lines 12-39) — reuse the existing 3000ms `setTimeout` message-clear pattern, but redirect via `useNavigate` instead of just clearing local state.

**Existing save handler** (lines 12-39):
```javascript
async function handleSubmit(e) {
  e.preventDefault()
  setSaving(true)
  setMessage('')
  try {
    const res = await fetch('/api/job-postings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, role, posting_text: postingText })
    })
    if (!res.ok) throw new Error('Request failed')
    setCompany(''); setRole(''); setPostingText('')
    setMessage('Job posting saved!')
    setMessageType('success')
    setTimeout(() => setMessage(''), 3000)
  } catch {
    setMessage('Failed to save. Please try again.')
    setMessageType('error')
  } finally {
    setSaving(false)
  }
}
```
**Apply D-01 by:** on success, `navigate('/cover-letter', { state: { justSavedPostingId: newPosting.id } })` (response includes `data.posting` per the `POST /api/job-postings` route in `server/index.js`) instead of resetting the form in place. `CoverLetter.jsx` reads `location.state` (see `useLocation` usage pattern in `PreviewTailored.jsx` line 2/41-42) to pre-select the posting and show the transitional banner copy from the UI-SPEC, auto-dismissing with the same `setTimeout(..., 3000)` idiom already used here.

---

### `client/src/pages/CoverLetter.jsx` (D-02 — inline Save Application confirm)

**Analog:** `client/src/components/CreateApplicationModal.jsx`

**Imports pattern** (modal, lines 1-2):
```javascript
import { useState, useEffect, useRef } from 'react'
import styles from './CreateApplicationModal.module.css'
```

**Confirm/submit/error pattern to adapt into an inline row** (modal, lines 72-97):
```javascript
async function handleConfirm() {
  if (submitting) return
  setSubmitting(true)
  setSubmitError('')
  try {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* ... */ }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Couldn't create the application. Try again.")
    onSuccess(data.application)
  } catch (err) {
    setSubmitError(`Couldn't create the application. ${err.message}. Try again.`)
  } finally {
    setSubmitting(false)
  }
}
```

**Existing `CoverLetter.jsx` save handler to replace** (lines 63-86): currently calls `handleSave` directly from the button and renders a dead-end "Application saved — View in Applications" link (lines 157-169). Per UI-SPEC D-02, wrap this in a `confirming` boolean state: clicking "Save Application" sets `confirming = true` and renders the inline row (prompt + "Confirm & Save" + "Cancel") in place of the button; "Confirm & Save" calls the existing `handleSave` body but replaces `setSavedApplication(data.application)` with `navigate('/applications')` (needs `useNavigate` import, following `PreviewTailored.jsx` line 2 usage). On error, keep the row expanded (`confirming` stays true) and show `error` inline, matching the modal's `submitError` pattern above.

---

### `client/src/pages/Applications.jsx` (D-04 — date clarity labels)

**Analog:** itself — `isStale`/`daysSinceLastChange` helpers (lines 16-27) and the meta/stale render block (lines 126-135) already compute everything needed; this is a copy-only change.

**Current render to update**:
```javascript
<div className={styles.meta}>
  <span>Applied: {app.date_applied}</span>
  <span>{daysSinceLastChange(app)} days since last change</span>
</div>

{isStale(app) && app.status !== 'withdrawn' && app.status !== 'rejected' && (
  <div className={styles.stale}>
    <span>&#9888;</span> Needs follow-up ({daysSinceLastChange(app)} days)
  </div>
)}
```
**Apply D-04 by:** swap only the string templates to `Applied on {app.date_applied}`, `Last status change: {N} day{s} ago` (pluralize `daysSinceLastChange(app)`), and `Needs follow-up — no status change in {N} days`. No structural or helper changes needed — `daysSinceLastChange`/`isStale` are reused verbatim.

---

### `client/src/components/Navbar/Navbar.jsx` (D-05/D-06/D-07 — nav grouping + dropdown)

**Analog for dropdown interaction (outside-click/Escape close):** `client/src/components/CreateApplicationModal.jsx`, lines 61-70:
```javascript
useEffect(() => {
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      onCancel()
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```
Adapt this for outside-click via a `mousedown` listener checking a `ref` on the dropdown panel (no existing outside-click precedent in repo — this is new, model it on the modal's backdrop-click-to-close idiom: `<div className={styles.backdrop} onClick={onCancel}>` at line 108-112, using a full-page transparent overlay only while a dropdown is open, or a document click listener that checks `.contains()`).

**Analog for data structure:** itself, `navLinks` array (lines 4-12):
```javascript
const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/resume', label: 'Resume' },
  { to: '/resume-library', label: 'Resume Library' },
  { to: '/new', label: 'New Application' },
  { to: '/cover-letter', label: 'Cover Letter' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/applications', label: 'Applications' },
]
```
**Apply D-05/D-07 by:** restructure into a mixed array of standalone items and groups, e.g.:
```javascript
const navItems = [
  { type: 'link', to: '/', label: 'Dashboard' },
  { type: 'group', label: 'Resume', children: [
      { to: '/resume', label: 'Resume' },
      { to: '/resume-library', label: 'Resume Library' },
  ]},
  { type: 'link', to: '/new', label: 'New Application' },
  { type: 'group', label: 'Tailor', children: [
      { to: '/analysis', label: 'Analysis' },
      { to: '/cover-letter', label: 'Cover Letter' },
  ]},
  { type: 'link', to: '/applications', label: 'Applications' },
]
```
Keep the existing `NavLink` active-class idiom (lines 22-32) for both standalone items and dropdown children; use `useLocation().pathname` to compute group "active" state by checking membership of `children`.

---

### `client/src/pages/Analysis.jsx` (D-06 — Continue to Review Suggestions CTA)

**Analog:** itself, existing review link block (lines 350-360):
```jsx
{report && suggestions.length > 0 && (
  <div className={styles.reviewLink}>
    <Link
      to={`/analysis/review?resume=${selectedResumeId}&posting=${selectedPostingId}&provider=${provider}`}
      state={{ suggestions, resumeId: selectedResumeId, postingId: selectedPostingId, provider }}
      className={styles.reviewButton}
    >
      Review {suggestions.length} Suggestions
    </Link>
  </div>
)}
```
**Apply D-06 by:** relabel text to "Continue to Review Suggestions →" and add the accent CSS treatment (`--color-primary`) called out in the UI-SPEC — same `Link`, same `state` payload, no data-flow change, copy/style-only.

---

### `client/src/pages/Resume.jsx` (D-11 — delete confirm, saved/unsaved indicator, preview modal trigger)

**Analog for delete confirm:** `client/src/pages/ResumeLibrary.jsx`, lines 84-85:
```javascript
async function handleDelete(id) {
  if (!window.confirm('Are you sure you want to delete this resume version?')) return
  // ... existing delete fetch call follows
}
```
**Apply to** `removeExperience`, `removeProject`, `removeEducation` (Resume.jsx lines 102-107, 158-163, 184-189) and `removeExperienceBullet`/`removeProjectBullet` (lines 83-90, 139-146) by wrapping each function body in a `window.confirm(...)` guard using the exact copy specified in the UI-SPEC (entry vs. bullet variants).

**Analog for saved/unsaved indicator:** itself, existing `handleSave` (lines 192-236) already tracks `saving`/`savedMessage`/`saveError`. Add a `dirty` boolean state, set `true` in every `handleFieldChange`/`handleContactChange`/`handleExperienceChange`/etc. setter, and set `false` only inside the `.then()` success branch of `handleSave` (line 224-230, alongside `setResumeData(dataToSave)`). Replace the transient `savedMessage` render (lines 514-516) with the persistent "✓ Saved"/"● Unsaved changes" indicator per UI-SPEC D-11 (indicator absent until first edit).

**Analog for preview trigger + modal:** `client/src/components/CreateApplicationModal.jsx` for the modal shell (backdrop/dialog/Escape/scroll-lock, lines 54-70, 107-113) and `client/src/pages/PreviewTailored.jsx` for the read-only resume rendering markup (lines 138-213, contact line + conditional sections). Add a `showPreview` boolean state and a "Preview Resume" button next to Save in `.saveRow` (line 506-520), rendering the current in-editor `resumeData` (not last-saved) inside a modal reusing `CreateApplicationModal.module.css` classes verbatim per the UI-SPEC's explicit instruction.

**Scroll-lock + Escape reuse** (`CreateApplicationModal.jsx`, lines 54-70):
```javascript
useEffect(() => {
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = '' }
}, [])

useEffect(() => {
  function handleKeyDown(e) {
    if (e.key === 'Escape') onCancel()
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

**Read-only rendering to reuse from `PreviewTailored.jsx`** (lines 152-213 — Skills/Experience/Projects/Education conditional blocks):
```jsx
{skills.length > 0 && (
  <div className={styles.resumeSection}>
    <h2 className={styles.sectionTitle}>Skills</h2>
    <div className={styles.skillList}>
      {skills.map((s, i) => (<span key={i} className={styles.skillBadge}>{s}</span>))}
    </div>
  </div>
)}
```

---

### `server/index.js` — `POST /api/resume-library` (D-08 — bug fix)

**Analog:** itself, sibling `PUT /api/resume` route (lines 380-394) — same "validate before write" pattern already used correctly elsewhere in the file.

**Bug location** (lines 406-412):
```javascript
app.post('/api/resume-library', (req, res) => {
  const name = req.body.name || 'Untitled Resume'
  const id = generateId()
  const now = new Date().toISOString().split('T')[0]
  const resumeData = req.body.resume_data || {
    name: '', contact: {}, summary: '', experience: [], projects: [], education: [], skills: []
  }

  const validation = validateResume(resumeData)
  if (!validation.ok) {
    return res.status(400).json({ error: 'Invalid resume data', details: validation.errors })
  }
  // ...
```
**Fix (D-08):** change `contact: {}` to `contact: { email: '', github: '', location: '' }` on line 411 — `validateResume` (see `server/lib/validateResume.js` lines 33-36) requires `contact` to be a non-null, non-array object but the deeper field-presence checks (not shown in excerpt but confirmed by CONTEXT.md D-08) fail on an empty object. This is a one-line default-value change, no schema change.

---

### New: server contract test for resume-library create (D-09)

**Analog:** `server/lib/pdf.test.js` — plain Node `assert`, no framework, matches "no test runner installed" convention.

**Test harness pattern to copy** (lines 1-21):
```javascript
const assert = require('assert')
const { buildResumePdfDefinition } = require('./pdf')

function test(name, fn) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    console.error(`FAIL: ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

test('is a function', () => {
  assert.strictEqual(typeof buildResumePdfDefinition, 'function')
})
```
**Apply D-09 by:** since `POST /api/resume-library` is an Express route (not a pure function), this test likely needs either (a) an in-process `supertest`-less approach using Node's `http` to boot the app and issue a real request, or (b) extracting the resume-data-defaulting logic into a small testable helper function in `server/index.js` and testing that directly with the same `assert`+`test()` harness as `pdf.test.js`. Prefer (b) for consistency with the existing zero-dependency test convention — no new devDependency needed. Register in `server/package.json`'s existing `"test": "node lib/pdf.test.js"` script (extend to run both files, e.g. `node lib/pdf.test.js && node index.test.js` or similar, consistent with the string-concatenation script pattern already used at the root `package.json`'s `"test": "cd client && npm run test && cd ../server && npm run test"`).

---

### `server/lib/analysis/keywords.js` (D-13 whitelist expansion, D-15 acronym casing)

**Analog:** itself — existing `TECH_KEYWORDS` Set (lines 14+), alphabetically sorted within categories with `// --- Category ---` comment headers.

**Pattern to extend** (lines 14-20 shown as example category structure):
```javascript
const TECH_KEYWORDS = new Set([
  // --- Languages ---
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'go', 'golang',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
  'haskell', 'elixir', 'clojure', 'f#', 'objective-c', 'assembly', 'bash',
  'shell', 'powershell', 'sql', 'nosql', 'html', 'css', 'scss', 'sass',
  // ...
```
**Apply D-13 by:** add a new `// --- Product / Data / Soft skills ---` category following the same lowercase, alphabetically-sorted, comma-separated convention (e.g. `'dashboarding', 'stakeholder communication', 'experimentation', 'product metrics', ...`).

**Apply D-15 by:** add a sibling `const ACRONYM_CASING = { sql: 'SQL', api: 'API', aws: 'AWS', ... }` object near `TECH_KEYWORDS`, exported alongside it via the existing `module.exports` line (currently `module.exports = { TECH_KEYWORDS, extractKeywords, extractResumeKeywords }`, add `ACRONYM_CASING`). Consumed by `Analysis.jsx`'s `KeywordGroups`/`SectionFindings` badge rendering — display-only casing lookup, falling back to naive capitalize when a keyword isn't in the map.

---

### `server/lib/cover-letter.js` (D-14 — grammar/possessive/genericness fixes)

**Analog:** itself — `buildClosing` (lines 152-154) and the no-match fallback in `generateCoverLetter` (lines 166-169) both contain the buggy possessive.

**Bug locations:**
```javascript
function buildClosing(company, role) {
  return `I would welcome the chance to bring this experience to the ${role} position and contribute to ${company}'s goals.`
}
```
```javascript
`I would welcome the opportunity to discuss how I can contribute to ${company}'s goals.`
```
**Fix (D-14):** add a `possessive(name)` helper (`name.endsWith('s') ? name + "'" : name + "'s"`) and use it in both call sites instead of the hardcoded `${company}'s`. Also address genericness/template variance per D-14 by expanding `buildIntro`/`buildClosing` (lines 97-104, 152-154) to incorporate more than one matched keyword and vary sentence phrasing — follow the existing small pure-function-per-sentence decomposition already used throughout this file (`buildIntro`, `buildExperienceSentences`, `buildAchievementSentence`, `buildClosing`).

---

## Shared Patterns

### Modal shell (backdrop / dialog / Escape / scroll-lock / focus)
**Source:** `client/src/components/CreateApplicationModal.jsx`, lines 54-70 (scroll-lock + Escape effects), lines 107-113 (backdrop/dialog markup)
**Apply to:** New Resume Preview modal (D-11). Reuse `CreateApplicationModal.module.css` classes (`.backdrop`, `.dialog`) verbatim per UI-SPEC instruction — do not create a new stylesheet from scratch.

### Native confirm-before-delete
**Source:** `client/src/pages/ResumeLibrary.jsx`, lines 84-85 (`window.confirm(...)` guard before a destructive action)
**Apply to:** All new delete-confirmation call sites in `Resume.jsx` (D-11): `removeExperience`, `removeProject`, `removeEducation`, `removeExperienceBullet`, `removeProjectBullet`.

### Validate-before-write on API routes
**Source:** `server/index.js`, `PUT /api/resume` (lines 380-394) — calls `validateResume(req.body)` and returns 400 with `{ error, details }` before any write.
**Apply to:** `POST /api/resume-library` fix (D-08) already follows this pattern; no structural change needed, only the default-value fix.

### Transient success-message auto-clear
**Source:** `client/src/pages/NewApplication.jsx`, line 32 (`setTimeout(() => setMessage(''), 3000)`); `client/src/pages/Resume.jsx`, line 229 (`setTimeout(() => setSavedMessage(''), 2000)`)
**Apply to:** D-01 transitional banner on Cover Letter page arrival (reuse the 3000ms variant per UI-SPEC).

### Shared keyword whitelist as single source of truth
**Source:** `server/lib/analysis/keywords.js` (`TECH_KEYWORDS`), consumed by both `server/lib/cover-letter.js` (`matchResumeToJob`) and analysis engine (`server/lib/analysis/engine.js`)
**Apply to:** D-13 whitelist expansion and D-15 acronym map — both changes propagate automatically to cover-letter generation and match analysis without touching either consumer.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| Nav dropdown outside-click handler | interaction utility | event-driven | No existing outside-click-to-close pattern in the codebase (only Escape+backdrop-click exist in `CreateApplicationModal.jsx`); model on that pattern but this is genuinely new interaction code. |
| `prop-types` additions across components (D-12) | cross-cutting | n/a | Repo has zero existing PropTypes usage; there is no in-repo precedent to copy, this establishes a new convention from scratch per ESLint rule requirements. |

## Metadata

**Analog search scope:** `client/src/pages/`, `client/src/components/`, `server/`, `server/lib/`, `server/lib/analysis/`
**Files scanned:** 17 (12 page/component files, 5 server/lib files) plus `client/eslint.config.js`, `client/package.json`, `server/package.json`
**Pattern extraction date:** 2026-07-19
</content>
</invoke>
