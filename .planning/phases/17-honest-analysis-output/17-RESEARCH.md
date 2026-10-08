# Phase 17: Honest Analysis Output - Research

**Researched:** 2026-10-09
**Domain:** Analysis/suggestion honesty (fabrication removal, gap notes, AI guardrails, score normalization, patch targeting, eval harness)
**Confidence:** HIGH

## Summary

Phase 17 hardens the v2.0 analysis-and-tailoring pipeline so its output never fabricates experience. The core defects live in two server modules: the heuristic provider (`server/lib/analysis/providers/heuristic.js`) generates experience/project "bullets" from keyword-filling templates (`EXPERIENCE_TEMPLATES`, `PROJECT_TEMPLATES`) and appends missing-keyword experience claims to the summary — all fabrication. The AI provider (`server/lib/analysis/providers/ai.js`) has no prompt guardrails against inventing skills/employers/metrics/dates, and contains a score-normalization block that silently multiplies any raw score in `[0,1]` by 100 (so a model returning `score: 1` renders as 100 — the OUT-06 bug). The patch engine (`server/lib/tailor/applyPatches.js`) always appends add-type bullets to the *last* experience/project entry (a documented WR-06 limitation) with no `target_entry` targeting. There is no `evals/` directory — OUT-04's eval set and script are entirely new.

**Primary recommendation:** Treat this as a surgical honesty pass on existing internals, not a rebuild. Remove the fabrication templates and missing-keyword experience claims from the heuristic; add an explicit honest-gap-note mechanism that replaces those removed claims; add anti-fabrication guardrails to both AI prompts; delete the `score <= 1 → *100` scaling (keep the section `matchRate` 0–1 normalization, which is separate and correct); add an optional `target_entry` field to the suggestion schema and make `applyAddToList` match-by-name with a fallback skip reason; and build a plain-Node eval script (matching the repo's existing no-test-runner server convention) that runs the heuristic path plus the AI path when a key is present and emits a markdown report.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Remove fabrication templates (OUT-01) | API/Backend | — | Heuristic suggestion logic lives entirely in `server/lib/analysis/providers/heuristic.js` |
| Honest gap notes for missing skills (OUT-02) | API/Backend (generate) | Frontend (render) | Server computes which keywords are missing; Analysis page surfaces the note |
| AI prompt guardrails (OUT-03) | API/Backend | — | Prompt construction in `server/lib/analysis/providers/ai.js` `analyzeResume`/`generateSuggestions` |
| AI score normalization fix (OUT-06) | API/Backend | — | Normalization block in `ai.js` after `generateObject` |
| `target_entry` patch targeting (OUT-05) | API/Backend | Frontend (skip-reason mirror) | `applyPatches.js` + `suggestionSchema.js`; client `skipReasons.js` mirrors the enum |
| Eval set + script (OUT-04) | Tooling (server-side) | — | New `evals/` dir; plain-Node script exercising the analysis pipeline |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OUT-01 | Heuristic experience/project suggestions only rephrase resume bullets; fabrication templates removed | Locate `EXPERIENCE_TEMPLATES`/`PROJECT_TEMPLATES` + summary "Experienced in X" fabrication in `heuristic.js` |
| OUT-02 | Honest gap note ("not on your resume; add a bullet only if you have real experience") replaces generated claims | Gap notes are new; missing-keyword detection already exists via `report.keywords.missing` |
| OUT-03 | AI prompts forbid inventing skills/employers/metrics/dates not in resume JSON | Both AI prompts in `ai.js` lack explicit anti-fabrication rules |
| OUT-04 | Eval set of 5+ resume×posting pairs under `evals/` + script → markdown report (AI when key present) | No `evals/` exists; server test convention is plain Node scripts |
| OUT-05 | Add-type patches carry `target_entry`; `applyPatches` attaches to named entry, falls back to last-entry with skip reason | `applyAddToList` always uses last entry (WR-06); new `SKIP_REASON` value needed |
| OUT-06 | AI scores on 0–100 scale; `score: 1` not silently scaled to 100 | `ai.js` lines 203–208 multiply any `[0,1]` score by 100 |

## Standard Stack

### Core (all already installed — no new packages required)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` (Vercel AI SDK) | 7.0.37 | `generateObject` for AI analysis | Already the AI provider backbone (Phase 11.5) |
| `zod` | 4.4.3 | Schema validation for reports/suggestions | Already validates AI output shape |
| `express` | 5.2.1 | API routes (`/api/analyze`, `/api/drafts`) | Existing server (note: CLAUDE.md says "Express 4" but installed is Express 5) |
| Node built-in `assert` | (runtime) | Server test scripts + eval assertions | Repo convention: no server test runner, plain `node *.test.js` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.10 | Client-side tests (Analysis/ReviewSuggestions UI) | Only if a client test covers gap-note rendering |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain-Node eval script | Add a test runner (vitest/jest on server) | Repo deliberately avoids server test runners; adding one is out of scope for a surgical phase |
| `report.gaps` strings for gap notes | New `report.gap_notes` array of `{keyword, note}` | `gaps` is already a validated string array; a structured field is clearer but requires a `validate.js` update |

**Installation:** None — this phase adds no external packages.

**Version verification:** All versions read from installed `package.json`/`node_modules` [VERIFIED: codebase]. `ai@7.0.37` confirmed via `node -e require('ai/package.json').version`. Node runtime available: v23.6.0 (project min is 20.19+, satisfied).

## Package Legitimacy Audit

No external packages are installed or introduced by this phase. Core work is edits to existing server/client modules plus a new plain-Node eval script that uses only Node built-ins and already-installed dependencies (`ai`, `zod`, the heuristic provider). Therefore no legitimacy gate is required.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### Where fabrication currently happens (the exact seams)

```text
POST /api/analyze (server/index.js:744)
  └─ getProvider(name) ──► heuristic | gemini/openrouter/groq
       │
       ├─ HEURISTIC (server/lib/analysis/providers/heuristic.js)
       │    analyzeResume()  ──► report { score, keywords.missing, sections, gaps }
       │    generateSuggestions()  ──► suggestions[]
       │         • summary modify: appends "Experienced in <MISSING kw>"   ← FABRICATION
       │         • skills add:     adds missing kw to skills list          ← claim (borderline)
       │         • EXPERIENCE_TEMPLATES: "Led <kw> initiatives..."          ← FABRICATION (OUT-01)
       │         • PROJECT_TEMPLATES:    "Implemented <kw> solutions..."    ← FABRICATION (OUT-01)
       │
       └─ AI (server/lib/analysis/providers/ai.js)
            analyzeResume()  ──► prompt (no anti-fabrication rules)         ← OUT-03
                                 normalize: score<=1 → *100                 ← OUT-06 BUG (lines 203-208)
            generateSuggestions() ──► prompt (verbatim-current rule only)    ← OUT-03 (add guardrails)

Accepted suggestions ──► POST /api/drafts ──► GET /api/drafts/:id
  └─ applyPatches (server/lib/tailor/applyPatches.js)
       applyAddToList() ──► always appends to LAST entry                    ← OUT-05 (WR-06 limitation)
```

### Fabrication inventory — OUT-01 / OUT-02

In `heuristic.js` `generateSuggestions()`:

| Location | What it fabricates | Disposition |
|----------|-------------------|-------------|
| `EXPERIENCE_TEMPLATES` (lines ~333–337) | "Led `<kw>` initiatives that improved project delivery…" — invents experience/impact for missing keywords | Remove entirely |
| `PROJECT_TEMPLATES` (lines ~359–363) | "Implemented `<kw>` solutions…" — invents projects for missing keywords | Remove entirely |
| Summary modify (lines ~285–288) | Appends "Experienced in `<kw>`" where `<kw>` = *missing* keywords — claims experience the resume lacks | Rework: rephrase existing summary / surface *matched* keywords only, never missing ones |
| Skills add (lines ~321–330) | Adds a missing keyword to the skills list — if the user lacks the skill this is a false claim | Convert to honest gap note (or reframe reason) — see Open Questions |

**Rephrase semantics (OUT-01):** "Rephrase a bullet already present" must mean a `modify`-type patch that rearranges/emphasizes words *already in that bullet* — no new skills, employers, metrics, or dates may be introduced. A rephrase that adds a metric ("improving load times by 40%") or a skill the bullet never mentioned is still fabrication. The heuristic currently has **zero** rephrase suggestions for experience/projects (only fabricated adds), so this is net-new logic or a deliberate "produce nothing rather than something false" stance. [ASSUMED: exact rephrase algorithm is a design decision for the planner]

### Honest gap notes — OUT-02

Gap notes replace the removed fabrication. Required text (from success criteria): *"not on your resume; add a bullet only if you have real experience."*

- **Detection already exists:** `report.keywords.missing` (posting keywords not found in the resume) plus per-section `missingItems`. No new detection logic is needed.
- **Surfacing:** The requirement says "the Analysis page shows an honest gap note." Two viable carriers:
  1. Reuse the existing `report.gaps` string array (rendered by `ScoreDisplay` → "Gaps to Address"), emitting one honest line per missing keyword: `"Docker: not on your resume; add a bullet only if you have real experience."` — no schema change.
  2. Add a structured `report.gap_notes: [{ keyword, note }]` and render a dedicated block — clearer, but requires a `validateMatchReport` update in `validate.js`.
- **Recommendation:** Option 1 (reuse `gaps`) is the lower-risk path since `gaps` is already validated as `string[]` and already rendered; option 2 is cleaner if the planner wants machine-readable notes for the eval. [ASSUMED]

Whether gap notes also flow into the ReviewSuggestions list (as non-actionable informational cards) is a design choice — the requirement only names the Analysis page. [ASSUMED]

### AI prompt guardrails — OUT-03

Both prompts in `ai.js` need explicit negative instructions. Current state:

- `analyzeResume` prompt (lines ~168–181): instructs strictness but says nothing about not inventing content.
- `generateSuggestions` prompt (lines ~224–244): requires verbatim `current` copying (good) but does **not** forbid inventing skills, employers, metrics, dates, or experience.

Add to both (wording per planner): *"Never invent, assume, or embellish skills, employers, job titles, metrics, dates, or experience that are not explicitly present in the resume JSON. Every claim must trace to resume content. If a required skill is absent from the resume, do not generate a suggestion claiming it — reflect it as a gap instead."* The verbatim-`current` rule for `modify` already helps; the guardrails close the `add`-type fabrication hole. [CITED: requirement OUT-03 text]

### AI score normalization bug — OUT-06

`ai.js` lines 203–208:
```js
if (object.score != null) {
  if (object.score <= 1 && object.score >= 0) {
    object.score = Math.round(object.score * 100)   // ← score 1 becomes 100
  }
  object.score = Math.max(0, Math.min(100, Math.round(object.score)))
}
```
The Zod `matchReportSchema` already declares `score: z.number().min(0).max(100)`, so `generateObject` guarantees a 0–100 value. Any value in `[0,1]` is a legitimate low score (e.g. `1` = 1%), yet the block rescales it to 100. **Fix:** delete the `<= 1 → *100` branch and keep only the clamp `Math.max(0, Math.min(100, Math.round(object.score)))`. The section `matchRate` normalization (lines ~192–200, `> 1 → /100`) is **separate and correct** — `matchRate` is genuinely 0–1, so leave it. [VERIFIED: codebase]

### Patch targeting — OUT-05

`applyPatches.js` `applyAddToList()` (lines 116–130) currently: empty list → create new entry; otherwise push onto `entries[last].bullets`. The KNOWN LIMITATION comment (lines 103–111, "WR-06") documents this. Required changes:

1. **Suggestion schema** (`suggestionSchema.js`): add optional `target_entry: z.string().nullable().optional()` — the experience `company` or projects `name` the add should attach to.
2. **`applyAddToList`**: accept `targetEntry`; match entries by name (`entry.company` for experience, `entry.name` for projects, case-insensitive normalized compare). On match → attach there. On no-match → fall back to last entry **and** record a skip reason. On absent `target_entry` → current last-entry behavior (optionally also record a reason).
3. **New `SKIP_REASON` value** (e.g. `TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found'`) in `applyPatches.js`. Per OUT-05 this is a *visible* skip, not a hard failure — the bullet still lands (on the last entry) but the user is told it couldn't attach to the named entry.
4. **Client mirror** (`client/src/lib/skipReasons.js`): add the same value — the file's header comment mandates keeping server and client enums in sync. `PreviewTailored.jsx` already buckets skips via `isDefectSkip`/`isKnownReason`; the new reason is a *known non-defect* (stale/positional), so classify it with the `NOT_FOUND`/`CURRENT_MISMATCH` group, not as a defect.
5. **`validate.js` `validateSuggestions`**: accept optional `target_entry`; optionally warn when a supplied `target_entry` matches no entry in the resume (predicts a fallback).
6. **Providers populate it:** the AI prompt should instruct the model to emit `target_entry` for experience/project `add` suggestions. The heuristic, post-OUT-01, produces no add-type experience/project suggestions, so it need not emit `target_entry` for those (summary/skills adds are not entry-targeted). [VERIFIED: codebase + ASSUMED for provider-population detail]

### Eval harness — OUT-04

Nothing exists — `evals/` is a new directory. Design constraints from the repo:

- **Server test convention is plain Node** (`node lib/....test.js`, chained in `server/package.json` `test` script, no runner). The eval script should follow suit: `evals/run-evals.js` runnable via `node evals/run-evals.js`, using `assert` and writing a markdown report.
- **Fixtures:** 5+ resume×posting pairs under `evals/fixtures/`. Each resume **must conform to the canonical schema** (`references/schema.md`): seven top-level fields (`name`, `contact{email,github,location}`, `summary`, `experience`, `projects`, `education`, `skills`); experience entries `{company, role, period, bullets[]}`; projects `{name, description, bullets[]}`; education `{degree, school, year}` with **no** `bullets`; skills a flat `string[]`. Avoid the documented bugs (`institution` vs `school`, `education[].bullets`, comma-string skills).
- **Two run modes:** always run the heuristic provider; when an AI provider key is present in env (`GOOGLE_GENERATIVE_AI_API_KEY` / `OPENROUTER_API_KEY` / `GROQ_API_KEY`) also run the AI provider. The script should detect keys without failing when absent.
- **"Zero fabricated claims" check:** for `modify` suggestions, assert `s.current` exists in the source resume (reuse `validate.js` `findInResume`/`normalizeText`, or the existing `validateSuggestions` error for "current value not found in resume — patch will fail"). For heuristic output specifically, assert no `suggested` text matches the removed template phrasings. Gap notes are non-fabricating by construction. AI `add`-type fabrication is inherently fuzzy — the report is "for review," so dump AI suggestions verbatim for human inspection alongside the automated checks.
- **Markdown report:** per-pair score, matched/missing keywords, gap notes, suggestions (with a fabrication-check verdict), and provider used (heuristic / AI / fallback).

The eval script exercises the AI→heuristic fallback only indirectly (it calls providers directly). The dedicated fallback-chain test is Phase 20's REL-02, not this phase. [ASSUMED]

### Recommended Project Structure (new files)

```text
evals/
├── run-evals.js          # plain-Node runner: heuristic always, AI when key present
├── fixtures/
│   ├── pair-01/          # resume.json + posting.json (schema-conformant)
│   ├── pair-02/
│   └── ... (5+ pairs)
└── reports/              # generated markdown (gitignore or commit per planner)
```

### Anti-Patterns to Avoid
- **Fabrication via template:** never synthesize a bullet/skill/claim from a keyword the resume does not contain. Rephrase existing content or emit an honest gap note.
- **Silent score rescaling:** never infer a 0–100 score from a 0–1 value when the schema already constrains the range — a genuine `1` must stay `1`.
- **Always-last-entry patching:** never assume the last experience/project entry is the right target when the suggestion names a specific entry.
- **Divergent skip-reason enums:** the server `SKIP_REASON` and client `skipReasons.js` must change together or the UI mislabels/mis-buckets skips.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI output shape validation | Manual field-by-field checks | `zod` schemas already in `ai.js`/`suggestionSchema.js` | Zod already gates AI output; extend, don't replace |
| Resume content matching for fabrication checks | Custom fuzzy matcher | `validate.js` `findInResume` + `normalizeText` | Normalization (smart quotes, ellipsis, whitespace) is already solved; fuzzy matching would let fabrications pass |
| Keyword extraction / missing detection | New keyword parser | `keywords.js` `extractKeywords`/`extractResumeKeywords`/`keywordsMatch` | Whitelist + exact-normalized match already prevents false positives ("go" in "django") |
| Test/eval runner | Add vitest/jest to server | Plain Node scripts (repo convention) | Server has no runner by design; matching it keeps the phase surgical |

**Key insight:** the honesty fixes are mostly *removals and guardrails* on logic that already exists — the missing-keyword detection, resume matching, and schema validation are all in place. The eval harness reuses the same pipeline modules rather than reimplementing them.

## Runtime State Inventory

Not a rename/refactor/migration phase — this phase adds honesty behavior and new eval files. No stored-data, service-config, OS-registration, secret, or build-artifact renames are involved. Skipped.

## Common Pitfalls

### Pitfall 1: Fixing the score bug but leaving matchRate normalization intact (or vice versa)
**What goes wrong:** Removing the score `<=1 → *100` block is correct, but the section `matchRate > 1 → /100` normalization (lines ~192–200) must stay — `matchRate` is genuinely 0–1. Deleting both breaks section bars; keeping the score block leaves OUT-06 unfixed.
**Why it happens:** The two normalization blocks sit adjacent and look similar.
**How to avoid:** Edit only the `score` block (lines 203–208); leave the `matchRate` loop untouched. Add a regression test asserting a mocked AI `score: 1` renders as `1`, not `100`.
**Warning signs:** Analysis page section percentages collapse to 0–1, or a low AI score still shows 100.

### Pitfall 2: Rephrase suggestions that quietly re-fabricate
**What goes wrong:** A "rephrase" modify patch introduces a metric, skill, or employer the original bullet never contained — still fabrication, just subtler than a template.
**Why it happens:** "Make this bullet stronger" invites embellishment.
**How to avoid:** Constrain rephrases to reorganize/emphasize words already present. The eval's fabrication check (modify `current` must exist in resume) catches stale targets but not added claims in `suggested` — review AI/heuristic `suggested` text in the eval report.
**Warning signs:** New numbers, percentages, or tech names appear in `suggested` that are absent from `current`.

### Pitfall 3: Adding `target_entry` to the schema but forgetting the client enum mirror
**What goes wrong:** Server emits the new skip reason; `client/src/lib/skipReasons.js` doesn't know it, so `PreviewTailored` buckets it as an "unknown reason" skip instead of a visible, explained fallback.
**Why it happens:** The two enums are intentionally duplicated (separate packages) with only a comment linking them.
**How to avoid:** Update `skipReasons.js` in the same change as `applyPatches.js`. Classify the new reason with the known non-defect group.
**Warning signs:** A target-entry fallback shows as "not applied for an unrecognized reason."

### Pitfall 4: Eval fixtures that violate the resume schema
**What goes wrong:** Fixtures with `institution` instead of `school`, `education[].bullets`, a missing `name`, or comma-string skills cause the eval to crash or silently test the wrong shape.
**Why it happens:** Resume JSON has no runtime schema enforcement on disk.
**How to avoid:** Run every fixture through the resume-schema skill's validate operation (or `validateResume.js`) before committing. Follow `references/schema.md`.
**Warning signs:** `validateResume` errors when the eval loads a pair.

### Pitfall 5: Hard-failing the eval when no AI key is present
**What goes wrong:** The eval crashes on machines without an AI key, defeating OUT-04's "AI runs when a key is present" requirement.
**Why it happens:** Assuming an AI provider is always available.
**How to avoid:** Detect keys via `process.env`; skip AI pairs (with a clear "skipped — no key" note in the report) rather than throwing. Heuristic always runs.

## Code Examples

### The OUT-06 bug and its fix (ai.js)
```js
// Source: server/lib/analysis/providers/ai.js lines 203-208 [VERIFIED: codebase]
// BUG: any score in [0,1] is rescaled to [0,100]; a genuine score of 1 becomes 100.
if (object.score != null) {
  if (object.score <= 1 && object.score >= 0) {
    object.score = Math.round(object.score * 100)  // ← remove this branch
  }
  object.score = Math.max(0, Math.min(100, Math.round(object.score)))
}

// FIX: schema already guarantees 0-100; just clamp.
if (object.score != null) {
  object.score = Math.max(0, Math.min(100, Math.round(object.score)))
}
```

### Fabrication templates to remove (heuristic.js)
```js
// Source: server/lib/analysis/providers/heuristic.js [VERIFIED: codebase]
// REMOVE both template arrays and their usage loops.
const EXPERIENCE_TEMPLATES = [
  kwText => 'Led ' + kwText + ' initiatives that improved project delivery and team productivity.',
  kwText => 'Drove ' + kwText + ' efforts, partnering across teams to ship measurable improvements.',
  kwText => 'Applied ' + kwText + ' to streamline workflows and boost team output.',
]
const PROJECT_TEMPLATES = [
  kwText => 'Implemented ' + kwText + ' solutions to address real-world technical challenges.',
  kwText => 'Built a project centered on ' + kwText + ', solving a concrete real-world problem.',
  kwText => 'Delivered a ' + kwText + '-driven project from concept through completion.',
]
```

### Always-last-entry add (applyPatches.js) to gain target_entry
```js
// Source: server/lib/tailor/applyPatches.js lines 116-130 [VERIFIED: codebase]
// Current: no targetEntry param, always pushes to entries[last].
function applyAddToList(entries, suggestedBullet, kind) {
  if (entries.length === 0) { /* create new entry */ return }
  const last = entries[entries.length - 1]
  if (!Array.isArray(last.bullets)) last.bullets = []
  last.bullets.push(suggestedBullet)
}
// OUT-05: accept targetEntry; match by entry.company (experience) or
// entry.name (projects); on match attach there; on no-match fall back to
// last entry and record SKIP_REASON.TARGET_ENTRY_NOT_FOUND.
```

### Skip-reason enum pair that must stay in sync
```js
// Source: server/lib/tailor/applyPatches.js + client/src/lib/skipReasons.js [VERIFIED: codebase]
// Server:
const SKIP_REASON = Object.freeze({
  NOT_FOUND: 'not-found',
  CURRENT_MISMATCH: 'current-mismatch',
  UNSUPPORTED_COMBINATION: 'unsupported-combination',
  // OUT-05 adds: TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found'
})
// Client mirror (skipReasons.js) must add the identical value + bucket it
// with the known non-defect reasons (isKnownReason, not isDefectSkip).
```

### Honest missing-keyword detection already available for gap notes
```js
// Source: server/lib/analysis/providers/heuristic.js analyzeResume [VERIFIED: codebase]
// report.keywords.missing holds posting keywords absent from the resume.
// Gap note (OUT-02) can be derived directly, no new detection needed:
//   missing.map(kw => `${displayCase(kw)}: not on your resume; add a bullet only if you have real experience.`)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fabricate experience/project bullets from keyword templates | Rephrase existing bullets + honest gap notes | Phase 17 (this) | OUT-01/OUT-02 |
| AI prompts with no anti-fabrication rules | Explicit "never invent skills/employers/metrics/dates" guardrails | Phase 17 (this) | OUT-03 |
| Score `[0,1] → *100` rescaling | Trust 0–100 schema, clamp only | Phase 17 (this) | OUT-06 |
| Add-patches always target last entry | `target_entry` name-matching with fallback skip | Phase 17 (this) | OUT-05 |
| No eval harness | Committed eval set + markdown-report script | Phase 17 (this) | OUT-04 |

**Deprecated/outdated:**
- `EXPERIENCE_TEMPLATES` / `PROJECT_TEMPLATES` in `heuristic.js`: fabricate bullets from missing keywords — removed by OUT-01.
- Summary "Experienced in `<missing kw>`" append: claims experience the resume lacks — reworked by OUT-01/OUT-02.
- `ai.js` score `<=1 → *100` scaling: turns a genuine 1 into 100 — deleted by OUT-06.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Gap notes can reuse the existing `report.gaps` string array (option 1) vs. requiring a new structured `gap_notes` field | Gap notes | Low — either renders on the Analysis page; structured field needs a `validate.js` update |
| A2 | Heuristic produces no add-type experience/project suggestions after OUT-01, so `target_entry` is populated mainly by the AI path | Patch targeting | Medium — if the planner keeps heuristic add suggestions, the heuristic must also emit `target_entry` |
| A3 | The new `target_entry` skip reason is a *known non-defect* (stale/positional), bucketed with `NOT_FOUND`/`CURRENT_MISMATCH`, not with `UNSUPPORTED_COMBINATION` | Patch targeting | Low — mis-bucketing only affects the PreviewTailored skip grouping |
| A4 | The eval script detects AI keys via env and skips AI pairs when absent (never hard-fails) | Eval harness | Low — matches OUT-04's "AI when a key is present" wording |
| A5 | Skills "add missing skill" suggestions become gap notes (not kept as suggestions) | Fabrication inventory | Medium — the planner may instead keep skills-add with an honest reason; both satisfy the requirements |
| A6 | The eval's fabrication check reuses `validate.js` `findInResume`/`normalizeText` rather than a new matcher | Eval harness | Low — reuse is the lower-risk path |

## Open Questions

1. **Where exactly do gap notes render — `report.gaps` strings or a new structured field?**
   - What we know: requirement says "the Analysis page shows an honest gap note"; `report.gaps` is already a validated, rendered string array.
   - What's unclear: whether the planner wants machine-readable `{keyword, note}` objects for the eval to assert against.
   - Recommendation: prefer reusing `gaps` (option 1) for the lowest-risk path; add a structured field only if the eval needs it.

2. **Do gap notes also appear in ReviewSuggestions, or only on the Analysis page?**
   - What we know: requirement names only the Analysis page; ReviewSuggestions currently renders only appliable suggestions as actionable cards.
   - What's unclear: whether missing-keyword honesty should persist into the review flow as non-actionable informational cards.
   - Recommendation: keep gap notes on the Analysis page only (per the literal requirement) unless the planner wants them echoed in review.

3. **What is the exact "rephrase" algorithm for experience/project bullets?**
   - What we know: OUT-01 requires rephrase-only, no fabrication; the heuristic currently has no rephrase logic.
   - What's unclear: whether to build rephrase suggestions at all, or simply produce no experience/project suggestions (honest low-suggestion output — which prioritization answer 4 explicitly prefers: "prefer honest low-suggestion output").
   - Recommendation: given answer 4 ("Remove fabricated-bullet heuristic templates — prefer honest low-suggestion output"), the safest read is to remove fabrication and emit gap notes rather than build new rephrase logic. Confirm with the planner.

4. **Should the skills "add missing skill" suggestion be removed (→ gap note) or kept with an honest reason?**
   - What we know: success criteria show a gap note "instead of a generated suggestion claiming that skill" for a missing skill.
   - What's unclear: whether an "add skill you may already know but forgot to list" suggestion survives with reworded, non-claiming reason text.
   - Recommendation: convert to gap notes for consistency with OUT-02; revisit if the planner wants to preserve a skills-add path.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server + eval script | ✓ | v23.6.0 (min 20.19+) | — |
| `ai` (Vercel AI SDK) | AI provider | ✓ | 7.0.37 | heuristic provider |
| `zod` | Schema validation | ✓ | 4.4.3 | — |
| AI API keys (Gemini/OpenRouter/Groq) | Eval AI path | ✗ (not readable; .env is gitignored/forbidden) | — | Eval skips AI pairs; heuristic always runs |
| `evals/` directory | OUT-04 | ✗ (does not exist) | — | Create new |

**Missing dependencies with fallback:**
- AI API keys — the eval must run AI pairs only when a key is present (per OUT-04); heuristic path always runs. No blocker.
- `evals/` directory — new work, created by this phase. No blocker.

**Missing dependencies with no fallback:** None.

## Security Domain

> `security_enforcement` is enabled (default). Applicability is low for this phase — it is an output-honesty pass, not an auth/crypto/input-handling change.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local tool, no auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No auth boundary |
| V5 Input Validation | marginal | Job-posting text is user-supplied and flows into AI prompts (prompt-injection surface is low-risk for a local single-user tool); `validate.js` already gates suggestion/report shape server-side. No new validation surface beyond optional `target_entry` (validate as string). |
| V6 Cryptography | no | No crypto |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via job-posting text into AI prompt | Tampering | Low risk (local, single-user, no secrets in prompt). Existing `sanitizeError` keeps provider errors from leaking. Guardrails (OUT-03) further constrain output to resume-grounded content. |
| Fabricated content presented as factual | Information integrity (non-SOUTHWIND) | This phase's entire purpose — gap notes + guardrails + eval verification. |

No security-blocking work is expected in Phase 17. The optional `target_entry` field is a plain string and needs no special handling beyond existing validation.

## Sources

### Primary (HIGH confidence)
- `server/lib/analysis/providers/heuristic.js` — fabrication templates, summary/skills/experience/project suggestion logic, missing-keyword detection [VERIFIED: codebase]
- `server/lib/analysis/providers/ai.js` — AI prompts, score/matchRate normalization bug, Zod schemas [VERIFIED: codebase]
- `server/lib/tailor/applyPatches.js` — `applyAddToList` last-entry behavior, `SKIP_REASON` enum, WR-06 limitation comment [VERIFIED: codebase]
- `server/lib/analysis/validate.js` — `validateMatchReport`/`validateSuggestions`, `findInResume`/`normalizeText` [VERIFIED: codebase]
- `server/lib/analysis/providers/suggestionSchema.js` — suggestion Zod schema (needs `target_entry`) [VERIFIED: codebase]
- `server/index.js` — `/api/analyze` fallback chain (lines 744–879), `/api/drafts` (lines 573–697) [VERIFIED: codebase]
- `client/src/lib/skipReasons.js` — client enum mirror, `isDefectSkip`/`isKnownReason` [VERIFIED: codebase]
- `client/src/pages/Analysis.jsx`, `ReviewSuggestions.jsx`, `PreviewTailored.jsx` — rendering surfaces for gap notes / skip reasons [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` OUT-01..OUT-06 — requirement text and success criteria [VERIFIED: codebase]
- `.planning/.continue-here.md` — audit honest-output decisions (rephrase-only, gap-note wording, "prefer honest low-suggestion output") [VERIFIED: codebase]
- `server/package.json` / `client/package.json` — test conventions, dependency versions [VERIFIED: codebase]

### Tertiary (LOW confidence)
- Design recommendations tagged `[ASSUMED]` (gap-note carrier, rephrase algorithm, skills-add disposition, eval fabrication-check reuse) — inferences from code analysis, need planner confirmation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions read from installed packages; no new packages required
- Architecture: HIGH — all six requirement seams located in specific files/lines; fabrication sites and the score bug verified directly
- Pitfalls: HIGH — pitfalls derive from adjacent normalization blocks, duplicated enums, and schema conventions all confirmed in code

**Research date:** 2026-10-09
**Valid until:** 2026-11-08 (30 days — server/client internals are stable; no fast-moving dependency churn in scope)
