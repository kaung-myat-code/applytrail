---
phase: 17-honest-analysis-output
reviewed: 2026-10-10T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - client/src/lib/skipReasons.js
  - client/src/pages/PreviewTailored.jsx
  - client/src/pages/PreviewTailored.test.jsx
  - evals/run-evals.js
  - server/lib/analysis/providers/ai.js
  - server/lib/analysis/providers/heuristic.js
  - server/lib/analysis/providers/heuristic.test.js
  - server/lib/analysis/providers/normalizeReport.js
  - server/lib/analysis/providers/normalizeReport.test.js
  - server/lib/analysis/providers/suggestionSchema.js
  - server/lib/analysis/validate.js
  - server/lib/analysis/validate.test.js
  - server/lib/tailor/applyPatches.js
  - server/lib/tailor/applyPatches.test.js
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-10-10T00:00:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed the Phase 17 honest-analysis-output changes: skip-reason enum mirror (client), PreviewTailored skip-reason UI buckets, eval harness, AI/heuristic analysis providers, score normalization split, suggestion schema, validation matcher, and the patch application engine with OUT-05 target_entry support. The overall design is solid — schema-layer rejection of education suggestions with a defense-in-depth defect path in applyPatches, per-item AI suggestion validation, and the exported sanctioned matcher are all good patterns. No critical/security issues found (local single-user tool, no auth by design). Four warnings found: one misleading honesty-copy bug in the stale-skips footer (TARGET_ENTRY_NOT_FOUND skips ARE reflected in the resume), unconditional `markApplied` on skills remove, a systematic leniency divergence between `validate.js`'s matcher and `applyPatches.js`'s exact matching, and heuristic score weights summing to 1.05.

## Critical Issues

None.

## Warnings

### WR-01: Stale-skips footer falsely claims TARGET_ENTRY_NOT_FOUND bullets are "not reflected in the resume below"

**File:** `client/src/pages/PreviewTailored.jsx:163-178`
**Issue:** The stale-skips block header says suggestions were "not applied" and the footer (line 177) states "These are not reflected in the resume below." But per `applyPatches.js` OUT-05 behavior, a `TARGET_ENTRY_NOT_FOUND` skip means the bullet WAS applied — it fell back to the last entry. The per-item copy (line 171-173) correctly says "this was attached to your most recent {section} entry instead," directly contradicting the block-level footer. In a phase whose entire purpose is honest output, this misleads the user into thinking the bullet is absent when it is present (just possibly on the wrong entry). This copy was not covered by the existing tests, which only assert the per-item lines.
**Fix:** Split the footer (or the whole block) so `TARGET_ENTRY_NOT_FOUND` skips render their own footer: e.g. "The bullet was still added — to your most recent {section} entry instead of the named one. Review the section below and move it manually if needed." Keep the "not reflected" footer only for `NOT_FOUND`/`CURRENT_MISMATCH`/unknown reasons.

### WR-02: skills remove is marked applied even when the skill was never present

**File:** `server/lib/tailor/applyPatches.js:248-250`
**Issue:** The skills remove branch filters `cloned.skills` by exact equality with `suggestion.current` and then unconditionally calls `markApplied(suggestion)`. If the skill string does not exist (stale suggestion, casing drift like current `'JavaScript'` vs stored `'javascript'`), nothing is removed yet the result reports the suggestion as applied — no skip record, no user-visible signal. This contradicts the module's stated contract that decisions failing to apply are tracked in `skipped` with a machine-readable reason, and it is the only remove path with this behavior (summary/experience/projects removes all check for a match first).
**Fix:**
```javascript
} else if (type === 'remove') {
  const before = cloned.skills.length
  cloned.skills = cloned.skills.filter(sk => sk !== suggestion.current)
  if (cloned.skills.length < before) {
    markApplied(suggestion)
  } else {
    markSkipped(suggestion, SKIP_REASON.NOT_FOUND, `remove suggestion "${suggestion.id}" (skills) — current value not found, skipped`)
  }
}
```

### WR-03: validate.js lenient matching passes suggestions that applyPatches.js strict matching then fails to apply

**File:** `server/lib/analysis/validate.js:196-248` vs `server/lib/tailor/applyPatches.js:105,219,243,249,253`
**Issue:** `validate.js` validates modify/remove patches using `normalizeText` (lowercase, smart-quote folding, whitespace collapse, trailing-ellipsis strip) and, for skills, bidirectional `includes`. `applyPatches.js` applies with different, stricter comparators: summary uses raw `===` (line 219), skills uses raw `===` / filter equality (lines 243, 249, 253), and experience/projects bullets use case-sensitive raw `b.includes(currentValue)` (line 105). Consequences: (a) a Gemini suggestion with benign drift — e.g. current `'built internal tools'` vs bullet `'Built internal tools.'`, or smart quotes — passes `validateSuggestions` ("patch will apply correctly") but then fails in applyPatches with NOT_FOUND/CURRENT_MISMATCH; (b) a skills current like `'Java'` passes the bidirectional-includes check against stored `'JavaScript'` but cannot match via exact equality. The user accepts a suggestion the validator certified, and it silently lands in the skip list. Either reuse `normalizeText`/`findInResume` inside applyPatches for the comparison (keeping the actual replacement exact), or tighten `validate.js` to use the same comparators applyPatches uses so validation predicts reality.
**Fix:** In `applyPatches.js`, gate summary/skills/experience/projects modify+remove on `findInResume(cloned, section, suggestion.current)` (the already-exported sanctioned matcher) before performing the exact-string replacement/removal, and record NOT_FOUND/CURRENT_MISMATCH when it fails. This makes the validator and the patcher share one truth.

### WR-04: Heuristic score weights sum to 1.05, systematically inflating scores

**File:** `server/lib/analysis/providers/heuristic.js:162-164`
**Issue:** `keywordScore * 0.50 + sectionScore * 0.30 + depthScore * 0.25` — the weights total 1.05, so a resume that maxes all three components scores `min(100, 105)` and every partial score is biased ~5% high relative to the apparent intent. The `Math.max(100, ...)` clamp hides the overflow but does not correct the bias. Likely a typo (0.25 should be 0.20, or 0.30 should be 0.25), but it shifts every heuristic score users see.
**Fix:** Normalize to weights summing to 1.0, e.g. `keywordScore * 0.50 + sectionScore * 0.30 + depthScore * 0.20`, and add a test asserting the weight sum or a known full-match score.

## Info

### IN-01: Eval harness fabricationVerdict mislabels remove suggestions as having "no existing-content target"

**File:** `evals/run-evals.js:75-86`
**Issue:** `fabricationVerdict` returns pass for every non-modify suggestion with the note "no existing-content target to fabricate." That is true for add, but remove patches DO target existing content via `current` — a fabricated remove `current` would silently remove nothing (or the wrong bullet, for partial substring matches). The eval therefore never checks remove-targets against `findInResume`, leaving a gap in the fabrication guarantee the harness claims to prove.
**Fix:** Extend the verdict to also check `findInResume` for `type === 'remove'` (same `current` semantics as modify), and update the note text accordingly.

### IN-02: applyAddToList throws on a list whose last entry is null/undefined

**File:** `server/lib/tailor/applyPatches.js:170-174`
**Issue:** `applyToAllEntries` guards with `if (!entry || ...)`, but `applyAddToList`'s fallback does `const last = entries[entries.length - 1]; if (!Array.isArray(last.bullets))` — if `last` is `null` (corrupted JSON data file), this throws a TypeError and 500s the whole patch request instead of recording a skip. Low likelihood given `validateResume` gating, but the asymmetry with `applyToAllEntries` is notable.
**Fix:** Guard the fallback: `if (!last || typeof last !== 'object') { /* treat as empty-list case or skip */ }`.

### IN-03: applyToAllEntries replaces only the first match; header comment implies all matches

**File:** `server/lib/tailor/applyPatches.js:1-9` (module comment "search ALL matching entries") vs `applyToAllEntries:100-116`
**Issue:** The function scans entries until it finds the first bullet containing `currentValue`, replaces/removes that one, and returns. If duplicate bullet text exists in multiple entries, only the first is patched and the suggestion is reported applied. The module header's "search ALL matching entries (not just the last one)" reads as replacing every occurrence. Behavior is reasonable; the comment overpromises.
**Fix:** Rephrase the module comment to "search every entry (in order) for the first bullet containing the target" or make the loop replace all matches — whichever is intended.

### IN-04: validate.js target_entry fallback warning fires for modify/remove types too

**File:** `server/lib/analysis/validate.js:154-166`
**Issue:** The OUT-05 target_entry check runs for any suggestion with a non-empty `target_entry` on experience/projects, regardless of `type`. Only add-type patches consume `target_entry` in `applyPatches`; a modify carrying a stray `target_entry` would produce a "will fall back to the last entry" warning that describes behavior that does not apply to it. Minor noise.
**Fix:** Add `&& s.type === 'add'` to the condition (the existing summary/skills exclusion shows the pattern).

---

_Reviewed: 2026-10-10T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
