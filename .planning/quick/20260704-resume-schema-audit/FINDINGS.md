---
title: Resume Schema Audit Findings
date: 2026-07-04
phases_audited: [9, 10, 11.5]
total_findings: 9
severity_breakdown: { critical: 1, high: 3, medium: 3, low: 2 }
---

# Resume Schema Audit Findings

## Finding 1 — `edu.bullets` accessed in keyword extraction (CRITICAL)

**Phase:** 10 (Match Scoring)
**File:** `server/lib/analysis/keywords.js:86-103`
**Severity:** CRITICAL

The `extractResumeKeywords()` function iterates over `edu.bullets` for education entries:

```javascript
// Line 98-102
for (const bullet of (edu.bullets || [])) {
  for (const kw of extractKeywords(bullet)) {
    keywords.add(kw)
  }
}
```

Per the canonical schema, `education[]` entries have only `degree`, `school`, `year` — **no `bullets` field**. This code silently reads `undefined` and iterates an empty array, which is harmless today but would break if a malformed resume had `bullets` on education. The comment on line 86 (`// Education: degree, institution, and bullets`) is also wrong.

**Impact:** Silent no-op for valid data. Incorrect behavior if a resume has `education[].bullets` (would extract keywords from it, which shouldn't exist).

**Fix:** Remove the `edu.bullets` loop. Fix the comment to say `// Education: degree, school`.

---

## Finding 2 — `e.institution` referenced in heuristic provider (HIGH)

**Phase:** 10 (Match Scoring)
**File:** `server/lib/analysis/providers/heuristic.js:140-143`
**Severity:** HIGH

The education keyword extraction uses `e.institution` instead of `e.school`:

```javascript
const educationText = (resume.education || [])
  .map(e => [e.degree, e.institution, ...(e.bullets || [])].filter(Boolean).join(' '))
  .join(' ')
```

Two issues:
1. `e.institution` is not in the schema — should be `e.school`
2. `e.bullets` should not be accessed on education entries

**Impact:** Education keywords from `school` field are never extracted for analysis. The school name is silently dropped from keyword matching, reducing the accuracy of education section scoring.

**Fix:** Replace `e.institution` with `e.school` and remove `...(e.bullets || [])`.

---

## Finding 3 — No resume validation on write endpoints (HIGH)

**Phase:** 9 (Resume Library)
**File:** `server/index.js:283-294, 303-321, 335-356`
**Severity:** HIGH

Three endpoints write resume data without any schema validation:

1. `PUT /api/resume` (line 283) — writes `req.body` directly to disk
2. `POST /api/resume-library` (line 303) — writes `req.body.resume_data` to disk
3. `PUT /api/resume-library/:id` (line 335) — writes `req.body.resume_data` to disk

Any malformed JSON (missing `name`, `contact` with extra fields, `education` with `bullets`) will be persisted silently.

**Impact:** Corrupt data can enter the system through any write path. Downstream consumers (analysis engine, cover letter generator) assume valid schema and may produce incorrect results or crash.

**Fix:** Add a `validateResume(data)` function that checks all 7 top-level fields, contact sub-fields, and entry structures. Call it before every `writeResumeVersion()` / `writeJSON()` for resume data.

---

## Finding 4 — New resume created without `name` field (HIGH)

**Phase:** 9 (Resume Library)
**File:** `server/index.js:307-309`
**Severity:** HIGH

The `POST /api/resume-library` default `resume_data` is:

```javascript
const resumeData = req.body.resume_data || {
  contact: {}, summary: '', experience: [], projects: [], education: [], skills: []
}
```

Missing: `name: ""`. Per the schema, `name` is a required top-level field. The `Resume.jsx` frontend renders `resumeData.name || ''`, so it won't crash, but the data on disk is non-conformant.

**Impact:** New resumes created without providing `resume_data` lack the `name` field. The cover letter generator and analysis engine don't use `name`, so this is cosmetic — but it violates the schema contract.

**Fix:** Add `name: ''` to the default resume_data object.

---

## Finding 5 — `POST /api/resume-library` doesn't validate `resume_data` structure (MEDIUM)

**Phase:** 9 (Resume Library)
**File:** `server/index.js:303-321`
**Severity:** MEDIUM

When `req.body.resume_data` is provided, it's written directly to disk without validation. A user could POST `{ resume_data: { skills: "not an array" } }` and it would be persisted.

**Impact:** Malformed resume data enters the library. Analysis engine uses `(resume.skills || []).map(...)` which would crash on a string.

**Fix:** Validate `resume_data` against schema before writing.

---

## Finding 6 — No resume validation before analysis (MEDIUM)

**Phase:** 10/11.5 (Analysis)
**File:** `server/index.js:461-463`
**Severity:** MEDIUM

The `/api/analyze` endpoint only checks if the resume is empty:

```javascript
if (!resume || (typeof resume === 'object' && Object.keys(resume).length === 0)) {
  return res.status(400).json({ error: 'No resume content found...' })
}
```

It doesn't validate that the resume has the required fields (`skills`, `experience`, etc.) before passing it to the analysis engine.

**Impact:** A resume with `skills` as a string instead of an array would cause `extractResumeKeywords` to silently skip all skills (the `typeof skill === 'string'` check on a non-array).

**Fix:** Add schema validation before analysis. At minimum, ensure `skills` is an array and `experience`/`projects`/`education` are arrays.

---

## Finding 7 — AI provider sends unvalidated resume to external API (MEDIUM)

**Phase:** 11.5 (AI Analysis Provider)
**File:** `server/lib/analysis/providers/ai.js:134-147`
**Severity:** MEDIUM

The AI provider sends `JSON.stringify(resume, null, 2)` directly in the prompt without validating the resume first:

```javascript
const prompt = [
  'You are a resume reviewer...',
  '## Resume',
  JSON.stringify(resume, null, 2),
  // ...
].join('\n')
```

**Impact:** If the resume is malformed, the AI receives garbage input and may produce low-quality analysis. The Zod schema validates the AI output, but not the input.

**Fix:** Validate resume before sending to AI. If invalid, attempt repair (per resume-schema skill) or reject with a clear error.

---

## Finding 8 — `Supabase.` trailing period in skills (LOW)

**Phase:** 9 (Resume Library — data quality)
**File:** `resume_library/mr3ldtxymun8qiljd.json:55`
**Severity:** LOW

The current resume has `"Supabase."` (with trailing period) in the skills array. The resume-schema skill says to trim trailing periods, commas, and whitespace from each skill string.

**Impact:** Minor. Keyword matching may be slightly affected if the period causes a mismatch. `extractKeywords` splits on `[^a-z0-9.+#]+` so `"Supabase."` becomes `"supabase."` which may not match `"supabase"` exactly.

**Fix:** The repair operation in the resume-schema skill already handles this (`Trim trailing periods, commas, and whitespace from each skill string`). Apply it to the current resume data.

---

## Finding 9 — No schema validation for `PUT /api/resume` on the client side (LOW)

**Phase:** 9 (Resume Library)
**File:** `client/src/pages/Resume.jsx:188-224`
**Severity:** LOW

The `handleSave()` function splits skills text into an array and sends the data, but doesn't validate the overall structure. If `resumeData` has unexpected shapes (e.g., `experience` is a string instead of an array), the PUT request would persist it.

**Impact:** Low for single-user local tool. The frontend creates the data through controlled forms, so it's unlikely to produce invalid shapes. But edge cases exist (e.g., if `resumeData` is loaded from a corrupted file).

**Fix:** Add client-side validation or a schema check before saving.

---

## Summary by Phase

### Phase 9 — Resume Library
| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 3 | No resume validation on write endpoints | HIGH | Open |
| 4 | New resume created without `name` field | HIGH | Open |
| 5 | `POST /api/resume-library` doesn't validate `resume_data` | MEDIUM | Open |
| 9 | No client-side validation before save | LOW | Open |

### Phase 10 — Match Scoring
| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | `edu.bullets` accessed in keyword extraction | CRITICAL | Open |
| 2 | `e.institution` referenced instead of `e.school` | HIGH | Open |
| 6 | No resume validation before analysis | MEDIUM | Open |

### Phase 11.5 — AI Analysis Provider
| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 7 | AI provider sends unvalidated resume to external API | MEDIUM | Open |

### Data Quality
| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 8 | `Supabase.` trailing period in skills | LOW | Open |

---

## Recommendations

### Before Phase 12 (Tailored Resume Generation)

Phase 12 will generate tailored resumes by applying structured patches. If the source resume is invalid, the generated output will also be invalid. **Findings 1-4 and 6 should be fixed before Phase 12.**

Priority order:
1. **Finding 1 + 2** — Fix `edu.bullets` and `e.institution` in analysis engine (direct bugs affecting analysis accuracy)
2. **Finding 3 + 4** — Add resume validation on write endpoints (prevents data corruption)
3. **Finding 6** — Add pre-analysis validation (prevents crashes on malformed data)
4. **Finding 8** — Repair current resume data (quick win)

### Can Wait Until After Phase 12

- Finding 5 (library POST validation) — lower risk since most data comes from the Resume editor
- Finding 7 (AI input validation) — the Zod output validation is a reasonable safety net
- Finding 9 (client-side validation) — low risk for single-user local tool
