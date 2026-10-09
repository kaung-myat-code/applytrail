# Phase 17: Honest Analysis Output - Pattern Map

**Mapped:** 2026-10-09
**Files analyzed:** 11 (7 modified, 4 new)
**Analogs found:** 11 / 11 (all modified files are self-analogs — this phase edits existing internals; the one wholly-new area, `evals/`, maps to the plain-Node test-script convention)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `server/lib/analysis/providers/heuristic.js` (modify) | provider | transform | itself + `heuristic.test.js` | exact (self) |
| `server/lib/analysis/providers/ai.js` (modify) | provider | transform (AI) | itself | exact (self) |
| `server/lib/analysis/providers/suggestionSchema.js` (modify) | config/schema | transform | itself | exact (self) |
| `server/lib/analysis/validate.js` (modify) | utility | transform | itself + `validate.test.js` | exact (self) |
| `server/lib/tailor/applyPatches.js` (modify) | service/engine | transform | itself | exact (self) |
| `server/lib/tailor/applyPatches.test.js` (modify) | test | transform | itself | exact (self) |
| `client/src/lib/skipReasons.js` (modify) | utility | — | itself + server `SKIP_REASON` | exact (self + mirror) |
| `client/src/pages/Analysis.jsx` (possible small modify) | component | request-response render | itself (`ScoreDisplay`) | exact (self) |
| `server/package.json` (optional: add eval script) | config | — | existing `test` script chain | exact |
| `evals/run-evals.js` (new) | tooling script | batch transform | `server/lib/tailor/applyPatches.test.js` + `heuristic.test.js` (plain-Node convention) | role-match |
| `evals/fixtures/pair-*/resume.json` + `posting.json` (new, 5+ pairs) | data fixture | — | `baseResume()` in `applyPatches.test.js` + `server/lib/validateResume.js` | role-match |
| `evals/reports/` (generated output) | output artifact | file-I/O | none (new) | no analog — decide gitignore vs commit |
| Optional: client gap-note rendering test | test | request-response render | `client/src/components/CreateApplicationModal.test.jsx` (vitest) | role-match |

**Note:** This phase touches no routes, no new API surface, and no new packages. `server/index.js` `/api/analyze` fallback chain is NOT modified (eval calls providers directly; the dedicated fallback test is Phase 20 REL-02).

## Pattern Assignments

### `server/lib/analysis/providers/heuristic.js` (provider, transform) — OUT-01, OUT-02

**Analog:** itself (surgical edit; the fabrication sites are the change targets)

**Imports to preserve** (lines 1-8):
```javascript
const { extractKeywords, extractResumeKeywords, ACRONYM_CASING, keywordsMatch } = require('../keywords')
```

**Gap-note building blocks already present — reuse, do not rebuild** (lines 183-185, 237-239):
```javascript
// missing-keyword detection already exists:
if (missingKeywords.length > 0) {
  gaps.push(`${missingKeywords.length} posting keywords missing from resume`)
}
// display-case helper for keyword text (acronym-aware):
function displayCase(kw) {
  return ACRONYM_CASING[kw] || capitalize(kw)
}
// OUT-02 gap note derived directly, per research recommendation (option 1, reuse `gaps` string[]):
//   missing.map(kw => `${displayCase(kw)}: not on your resume; add a bullet only if you have real experience.`)
```

**Fabrication sites to REMOVE in `generateSuggestions()` (lines 257-388):**
```javascript
// Line ~288 — summary modify appends "Experienced in <MISSING kw>" (fabrication):
const suggested = summary + (summary.endsWith('.') ? ' ' : '. ') + 'Experienced in ' + kwPhrase + '.'
// Lines ~333-337 — EXPERIENCE_TEMPLATES (remove entire array + usage loop, lines 339-356)
// Lines ~359-363 — PROJECT_TEMPLATES (remove entire array + usage loop, lines 365-382)
// Lines ~321-330 — skills "add missing keyword" suggestions (convert to gap note per A5/Open Q4)
```

**Core pattern to keep:** summary `add` when no summary exists (lines 297-311) uses `matched.slice(0, 3)` — this is honest (matched keywords only) and stays. `pickVariant` (lines 246-249) exists only to vary fabrication templates — delete with the templates if no longer used.

**Regression-test update:** `server/lib/analysis/providers/heuristic.test.js` currently ASSERTS the fabricated bullets (tests at lines 43-81 expect "experience add suggestion" containing "Docker and Kubernetes" and template variance). Those tests must be inverted/replaced with assertions that NO experience/project add suggestions are generated and that gap notes appear instead.

---

### `server/lib/analysis/providers/ai.js` (provider, transform) — OUT-03, OUT-06

**Analog:** itself (prompt + normalization edits)

**OUT-06 fix — delete the score `<=1 → *100` branch, keep the clamp** (lines 202-208):
```javascript
// CURRENT (buggy):
if (object.score != null) {
  if (object.score <= 1 && object.score >= 0) {
    object.score = Math.round(object.score * 100)  // ← delete this branch
  }
  object.score = Math.max(0, Math.min(100, Math.round(object.score)))  // ← keep this clamp
}
// DO NOT TOUCH the adjacent matchRate loop (lines 190-200) — matchRate is genuinely 0-1.
```

**OUT-03 guardrails — append to BOTH prompts.** `analyzeResume` prompt (lines 168-181) and `generateSuggestions` prompt (lines 224-244):
```javascript
// Insert wording (per planner) into the prompt array join, e.g. after the verbatim-current rule:
'Never invent, assume, or embellish skills, employers, job titles, metrics, dates, or experience',
'not explicitly present in the resume JSON. Every claim must trace to resume content.',
'If a required skill is absent from the resume, reflect it as a gap — do not generate a claim.',
```

**OUT-05 provider population:** `rawSuggestionSchema` (lines 58-65) must gain `target_entry: z.string().nullable().optional()` so the model can emit it, and the `generateSuggestions` prompt should instruct the model to set `target_entry` (experience `company` / projects `name`) on add-type suggestions. Per-item `suggestionSchema.safeParse` (lines 257-268) already drops invalid items — extending the strict schema handles the rest.

**Error handling pattern (unchanged, context):** `handleAIError` (lines 108-138) + `sanitizeError` — no edits needed; eval harness must tolerate its thrown Errors when no key is set.

---

### `server/lib/analysis/providers/suggestionSchema.js` (config/schema, transform) — OUT-05

**Analog:** itself

```javascript
// Current schema (lines 17-24) — add one optional field:
const suggestionSchema = z.object({
  id: z.string(),
  section: z.enum(['summary', 'skills', 'experience', 'projects']),
  type: z.enum(['add', 'modify', 'remove']),
  current: z.string().nullable(),
  suggested: z.string(),
  reason: z.string(),
  // OUT-05: company (experience) or name (projects) the add should attach to
  target_entry: z.string().nullable().optional(),
})
```
Keep the module-split rationale comment (lines 3-9) intact — `applyPatches.test.js` imports this without loading the ESM `ai` package.

---

### `server/lib/analysis/validate.js` (utility, transform) — OUT-05

**Analog:** itself + `validate.test.js` (same `test(name, fn)` plain-Node convention)

**Where to add `target_entry` checks** — inside `validateSuggestions` per-suggestion loop (lines 97-158), beside the existing modify/`current` checks:
```javascript
// Existing patch-correctness check the eval also reuses (lines 137-147):
if (s.type === 'modify') {
  if (s.current === null || s.current === undefined) {
    warnings.push(`${prefix}: modify suggestion has no current value — patch may not apply correctly`)
  } else if (resume && typeof s.current === 'string') {
    const found = findInResume(resume, s.section, s.current)
    if (!found) {
      errors.push(`${prefix}: current value not found in resume — patch will fail`)
    }
  }
}
// OUT-05 addition: accept optional target_entry; optionally warn when it matches no
// experience[].company / projects[].name entry (predicts a last-entry fallback).
```

**Fabrication-check reuse for the eval (A6):** `findInResume` + `normalizeText` (lines 177-229) are the sanctioned matcher — the eval script imports these rather than writing a new one. Note they are NOT currently exported (line 231 exports only the two validators) — exporting them (or the eval requiring them via a small export addition) is a planner decision; do not hand-roll fuzzy matching.

---

### `server/lib/tailor/applyPatches.js` (service/engine, transform) — OUT-05

**Analog:** itself

**New SKIP_REASON value** (lines 43-47) — add to the frozen enum + its doc comment (lines 19-42):
```javascript
const SKIP_REASON = Object.freeze({
  NOT_FOUND: 'not-found',
  CURRENT_MISMATCH: 'current-mismatch',
  UNSUPPORTED_COMBINATION: 'unsupported-combination',
  TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found',  // OUT-05
})
```

**`applyAddToList` targeting** (lines 116-130) — accept `targetEntry`, match by name, fall back with a visible skip (bullet still lands on last entry; the skip reason is informational, NOT a hard failure — the suggestion is still marked applied):
```javascript
function applyAddToList(entries, suggestedBullet, kind, targetEntry) {
  if (entries.length === 0) { /* current create-new-entry branch, lines 117-124 */ return }
  // OUT-05: case-insensitive normalized match on entry.company (experience) or entry.name (projects);
  // on match → push to that entry's bullets;
  // on targetEntry present but no match → fall back to last entry AND surface
  //   SKIP_REASON.TARGET_ENTRY_NOT_FOUND (caller records it — see markSkipped pattern, lines 161-164);
  // on absent targetEntry → current last-entry behavior (lines 125-129).
}
```
Call sites at lines 221 (experience) and 245 (projects) pass `suggestion.target_entry`. The WR-06 KNOWN LIMITATION comment (lines 103-111) should be updated/removed once fixed.

**Skip-recording pattern** (lines 161-164) — reuse `markSkipped` for the new reason; it is a *known non-defect* per A3, so the suggestion is still `markApplied` with an accompanying skip note (planner decides exact applied+skipped vs skipped-only semantics — research says bullet still lands, so applied + informational reason).

---

### `server/lib/tailor/applyPatches.test.js` (test, transform) — OUT-05 tests

**Analog:** itself — plain-Node convention, header comment (lines 1-20), `test(name, fn)` helper (lines 26-35), `baseResume()` fixture factory (lines 37-53), `accept()`/`findApplied`/`findSkipped` helpers (lines 55-65). Add new cases for: target_entry match → attaches to named entry; target_entry no-match → last-entry fallback + `TARGET_ENTRY_NOT_FOUND`; no target_entry → unchanged last-entry behavior; projects `name` matching; case-insensitive match.

---

### `client/src/lib/skipReasons.js` (utility) — OUT-05 mirror

**Analog:** itself + server enum (must change in the SAME commit — Pitfall 3)

```javascript
// Lines 9-13 — add the identical value:
export const SKIP_REASON = {
  NOT_FOUND: 'not-found',
  CURRENT_MISMATCH: 'current-mismatch',
  UNSUPPORTED_COMBINATION: 'unsupported-combination',
  TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found',  // OUT-05 — keep in sync with server
}
// Do NOT touch isDefectSkip (lines 24-26): target-entry-not-found is a known
// non-defect (stale/positional) per A3 — it flows through isKnownReason (line 35)
// into PreviewTailored's staleSkips bucket automatically once added to the enum.
```

**Consumer bucketing (no change expected):** `client/src/pages/PreviewTailored.jsx` lines 116-118 already bucket via `isDefectSkip` / `isKnownReason` — the new reason lands in `staleSkips` (visible, explained) the moment the enum value is added.

---

### `client/src/pages/Analysis.jsx` (component, request-response render) — OUT-02 surface

**Analog:** itself — `ScoreDisplay` already renders `report.gaps` verbatim (lines 33-42), so if the planner picks research option 1 (reuse `gaps` string[]), **no client change is required** — the server-emitted honest gap-note strings render automatically under "Gaps to Address":
```jsx
{safeGaps.length > 0 && (
  <div className={styles.gaps}>
    <h3 className={styles.subheading}>Gaps to Address</h3>
    <ul>
      {safeGaps.map((g, i) => (<li key={i}>{g}</li>))}
    </ul>
  </div>
)}
```
Only if the planner picks option 2 (structured `gap_notes: [{keyword, note}]`) is a new render block + `validateMatchReport` change needed. Keyword display casing for badge text comes from `client/src/lib/keywordCasing` (`displayCase`, imported at line 5).

---

### `evals/run-evals.js` (tooling script, batch transform) — OUT-04 (new)

**Analog:** `server/lib/tailor/applyPatches.test.js` + `server/lib/analysis/providers/heuristic.test.js` — the repo's deliberate plain-Node, no-test-runner convention (confirmed in both headers: "no test runner is installed in this repo... Run directly with `node ...`"). Do NOT add vitest/jest to the server (research "Don't Hand-Roll" table).

**Structure to copy:**
```javascript
// Header comment convention (both test files, lines 1-20):
//  - purpose, history, how to run: `node evals/run-evals.js`
const assert = require('assert')
const { analyzeResume, generateSuggestions } = require('../server/lib/analysis/providers/heuristic')
const { validateResume } = require('../server/lib/validateResume')   // fixture conformance gate (Pitfall 4)
const { validateMatchReport, validateSuggestions } = require('../server/lib/analysis/validate')

// AI path: detect keys via process.env — never hard-fail when absent (Pitfall 5 / A4):
//   GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY / GROQ_API_KEY
//   absent → skip AI pairs with a clear "skipped — no key" note in the report

// Fabrication check for modify suggestions: reuse validateSuggestions'
// findInResume-based "current value not found in resume" error (validate.js lines 137-147)
// rather than a new matcher.
```
Report output: markdown per pair — score, matched/missing keywords, gap notes, suggestions with a fabrication-check verdict, provider used. Follow the `test(name, fn)` PASS/FAIL + `process.exitCode = 1` convention if any hard assertions are included; AI `add`-type output is dumped verbatim for human review (not asserted).

---

### `evals/fixtures/pair-*/resume.json` + `posting.json` (data fixture, 5+ pairs) — OUT-04 (new)

**Analog:** `baseResume()` in `applyPatches.test.js` (lines 37-53) — the canonical schema-conformant shape:
```javascript
{
  name: 'Jamie Doe',
  contact: { email: 'jamie@example.com', github: '', location: '' },
  summary: 'Experienced engineer with a background in backend systems.',
  experience: [{ company: 'Acme Corp', role: 'Engineer', period: '2020-2023', bullets: ['Built internal tools.'] }],
  projects: [{ name: 'Side Project', description: 'A thing.', bullets: ['Shipped a feature.'] }],
  education: [{ degree: 'B.S. Computer Science', school: 'State University', period: '2016-2020' }], // NO bullets field
  skills: ['javascript'],  // flat string[], never comma-joined strings
}
```
**Gate every fixture through `server/lib/validateResume.js`** before committing (Pitfall 4) — it enforces the exact rules above (education must NOT have `bullets`, `school` not `institution`, skills are strings). Posting fixtures need the `posting_text` field the provider reads (`jobPosting.posting_text`, heuristic.js line 56).

---

### `server/package.json` (config, optional) — OUT-04 wiring

**Analog:** existing chained plain-Node `test` script (line 10) — if the planner wants evals in CI, append `&& node ../evals/run-evals.js`-style chaining or a separate `"eval": "node ../evals/run-evals.js"` script; match the existing `&&`-chained style, do not introduce a runner.

---

## Shared Patterns

### Plain-Node test/eval convention (server)
**Source:** `server/lib/tailor/applyPatches.test.js` lines 26-35, `heuristic.test.js` lines 14-23
**Apply to:** `evals/run-evals.js`, all new OUT-05/OUT-06 server tests
```javascript
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
```

### Server/client enum mirroring
**Source:** `server/lib/tailor/applyPatches.js` `SKIP_REASON` (lines 43-47) ↔ `client/src/lib/skipReasons.js` (lines 9-13)
**Apply to:** any new skip reason — both files change together or the client mis-buckets the skip (Pitfall 3)

### Resume content matching (fabrication checks)
**Source:** `server/lib/analysis/validate.js` `findInResume`/`normalizeText` (lines 177-229)
**Apply to:** `evals/run-evals.js` fabrication assertions, `validateSuggestions` target_entry warnings — never a new fuzzy matcher

### Zod schema extension
**Source:** `suggestionSchema.js` (lines 17-24), `ai.js` `matchReportSchema` (lines 26-43)
**Apply to:** `target_entry` addition; keep the per-item `safeParse` drop-invalid pattern in `ai.js` `generateSuggestions` (lines 257-268)

### Keyword display casing
**Source:** server `heuristic.js` `displayCase`/`ACRONYM_CASING` (lines 237-239) ↔ client `client/src/lib/keywordCasing.js`
**Apply to:** gap-note strings emitted by the heuristic (`Docker:` not `Docker` via naive capitalize) — use the server `displayCase` helper already in scope

### Fixture schema conformance
**Source:** `server/lib/validateResume.js` (whole file, 141 lines)
**Apply to:** every `evals/fixtures/pair-*/resume.json` — run through `validateResume` in the eval loader or before commit

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `evals/reports/` (generated markdown output dir) | output artifact | file-I/O | Nothing in the repo writes generated reports to disk yet; planner decides gitignore vs commit per research structure note |

## Metadata

**Analog search scope:** `server/lib/analysis/` (providers, validate, engine), `server/lib/tailor/`, `server/lib/` (validateResume, test files), `client/src/pages/`, `client/src/lib/`, `client/src/components/`, `server/package.json`, `client/package.json`
**Files scanned:** 13 source/test files read in full or targeted sections
**Pattern extraction date:** 2026-10-09
