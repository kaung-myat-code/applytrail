---
phase: 17-honest-analysis-output
verified: 2026-10-09T21:19:43Z
status: human_needed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "On a machine with an AI provider key set (GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY / GROQ_API_KEY), run `node evals/run-evals.js` once and open evals/reports/report.md"
    expected: "The AI analysis section appears per pair (no 'skipped — no key'), AI suggestions are dumped verbatim with fabrication verdicts, and the run exits 0"
    why_human: "The keyed AI branch (lazy-requires ai.js, calls the live provider) is source-verified and correctly structured, but no key is available in this environment so the branch could not be executed end-to-end (external service integration — SUMMARY 17-05 coverage D3 flagged this as human_judgment)"
  - test: "In the browser, open the Analysis page for a resume/posting pair with missing keywords and inspect the 'Gaps to Address' block"
    expected: "One neutral gap note per missing keyword renders (e.g. 'Docker: not on your resume; add a bullet only if you have real experience.') alongside per-section match-rate strings; the block is absent when report.gaps is empty"
    why_human: "Provider-level emission and the Analysis.jsx conditional render are source-verified and the copy contract is test-asserted at the provider, but no client test exercises Analysis.jsx and visual rendering is a human check"
---

# Phase 17: Honest Analysis Output Verification Report

**Phase Goal:** Make analysis output honest — eliminate fabricated suggestions/claims from both heuristic and AI providers, surface gaps explicitly, honor target_entry in patches, and prove honesty with a committed eval harness.
**Verified:** 2026-10-09T21:19:43Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | Analysis page shows an honest gap note for a missing skill instead of a generated suggestion claiming that skill (OUT-02 + OUT-01) | ✓ VERIFIED | heuristic.js:183-187 emits one `displayCase(kw) + ": not on your resume; add a bullet only if you have real experience."` per missing keyword; aggregate line gone; Analysis.jsx:33-42 renders "Gaps to Address" conditionally from report.gaps; heuristic.test.js 7/7 PASS including zero-skills-add and per-keyword gap tests; eval report shows 14 honest gap notes across 5 pairs |
| 2 | Heuristic experience/project suggestions only rephrase present bullets — no fabrication templates remain (OUT-01) | ✓ VERIFIED | EXPERIENCE_TEMPLATES/PROJECT_TEMPLATES/pickVariant deleted (grep: only an explanatory comment mentions "Experienced in"); zero experience/projects add suggestions asserted by heuristic.test.js and by the eval harness on all 5 pairs (0 fabricated adds). Note: per locked audit answer 4 the implementation emits NO experience/project suggestions rather than rephrase suggestions — a documented planner decision ("prefer honest low-suggestion output", flagged for review in 17-01-PLAN assumptions); the fabrication-removal intent is fully met |
| 3 | AI prompt guardrails forbid inventing skills/employers/metrics/dates/experience; AI scores render 0–100 with raw score 1 displaying as 1 (OUT-03 + OUT-06) | ✓ VERIFIED | ai.js:179-181 and 232-234 both carry the full three-line guardrail ("Never invent, assume, or embellish... / Every claim must trace to resume content. / If a required skill is absent... reflect it as a gap") in both the analyzeResume and generateSuggestions prompts; normalizeReport.js:42-44 has only round+clamp with NO [0,1]→*100 branch, ai.js:201 delegates to normalizeReportScores; normalizeReport.test.js 4/4 PASS including "score 1 stays 1"; matchRate >1→/100 handling preserved (Pitfall 1 guard) |
| 4 | Add-type patch with target_entry attaches to the named entry; mismatch falls back to last entry with a visible skip reason (OUT-05) | ✓ VERIFIED | applyPatches.js:141-176 applyAddToList matches via normalizeText (imported from validate.js:23 — sanctioned matcher) and returns fellBack; call sites (267, 299) record SKIP_REASON.TARGET_ENTRY_NOT_FOUND carrying target_entry (273, 303); skipReasons.js:13 mirrors the exact string; PreviewTailored.jsx:171-173 branches per-reason copy with target_entry/section interpolated; applyPatches.test.js 5 target_entry cases + validate.test.js warning cases + PreviewTailored.test.jsx 2/2 all PASS in the full runs |
| 5 | Committed eval script over 5+ resume×posting pairs produces a markdown report showing zero fabricated claims, with AI runs included when a provider key is present (OUT-04) | ✓ VERIFIED | `node evals/run-evals.js` executed: 20/20 PASS, exit 0, evals/reports/report.md written with ## pair-01..05 sections, 0 FAIL lines, per-pair fabrication verdicts, gap notes; AI key detection + lazy-require + verbatim-dump path source-verified (run-evals.js:53-64, 101-104, 211-251); keyless path behaviorally exercised ("skipped — no key", exit 0); keyed path routed to human verification below |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `server/lib/analysis/providers/heuristic.js` | Per-keyword gap notes; fabrication removed | ✓ VERIFIED | Lines 183-187 (gap notes), 249-294 (fabrication-free generateSuggestions, summary-add-when-empty preserved) |
| `server/lib/analysis/providers/heuristic.test.js` | Gap-note + inverted fabrication tests | ✓ VERIFIED | 7 tests, all pass; requires both analyzeResume and generateSuggestions |
| `server/lib/analysis/providers/normalizeReport.js` | Pure normalizeReportScores, no [0,1]→*100 | ✓ VERIFIED | Lines 26-47; contract documented in header |
| `server/lib/analysis/providers/normalizeReport.test.js` | Score-1 regression + matchRate preservation | ✓ VERIFIED | 4 tests, all pass |
| `server/lib/analysis/providers/ai.js` | Guardrails both prompts; delegates normalization; target_entry | ✓ VERIFIED | Lines 16, 67, 179-181, 201, 232-237; no inline score rescale remains |
| `server/lib/analysis/providers/suggestionSchema.js` | target_entry optional nullable | ✓ VERIFIED | Line 25 |
| `server/lib/tailor/applyPatches.js` | SKIP_REASON.TARGET_ENTRY_NOT_FOUND; targetEntry-aware applyAddToList | ✓ VERIFIED | Lines 61-66, 141-176, 267-276, 299-306; WR-06 comment updated to RESOLVED |
| `server/lib/tailor/applyPatches.test.js` | Five target_entry cases | ✓ VERIFIED | All 5 named cases observed passing in the full server chain |
| `server/lib/analysis/validate.js` | Exports findInResume/normalizeText; target_entry warning | ✓ VERIFIED | Line 254 exports all four; lines 149-164 warn (not error) |
| `server/lib/analysis/validate.test.js` | Target_entry warning cases | ✓ VERIFIED | Export assertion + matched/unmatched/case/projects cases present and passing |
| `client/src/lib/skipReasons.js` | Mirror TARGET_ENTRY_NOT_FOUND | ✓ VERIFIED | Line 13, exact string match to server enum; isDefectSkip unchanged (line 26) |
| `client/src/pages/PreviewTailored.jsx` | Per-reason copy branch in staleSkips | ✓ VERIFIED | Lines 117, 163-173; pluralization header preserved (line 166) |
| `client/src/pages/PreviewTailored.test.jsx` | Mixed-reason + empty-skips tests | ✓ VERIFIED | 2/2 PASS under vitest |
| `evals/run-evals.js` | Plain-Node CLI, heuristic-always + AI-when-key | ✓ VERIFIED | Ran: exit 0, 20 assertions; reuses findInResume (line 37); validateResume gate (line 124); <5-pairs hard fail (line 96) |
| `evals/fixtures/pair-01..05/{resume,posting}.json` | 5 schema-conformant pairs, committed | ✓ VERIFIED | All 10 files git-tracked; all pass validateResume at eval load (observed) |
| `.gitignore` | evals/reports/ ignored; fixtures negated | ✓ VERIFIED | Lines 32-38: bare resume.json rule, `!evals/fixtures/*/resume.json` negation, `evals/reports/` |
| `server/package.json` | normalizeReport.test.js chained | ✓ VERIFIED | Line 10 test script ends with `&& node lib/analysis/providers/normalizeReport.test.js` |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| heuristic.analyzeResume missingKeywords | Analysis.jsx "Gaps to Address" | displayCase → report.gaps → route → gaps prop → conditional render | ✓ WIRED | heuristic.js:183-187 → server/index.js:832/857 → Analysis.jsx:10,33-42,374 |
| heuristic.generateSuggestions (post-removal) | ReviewSuggestions | summary-add-when-empty only | ✓ WIRED | heuristic.js:269-284 preserved and test-asserted |
| ai.js prompts (both) | normalizeReportScores | require + call | ✓ WIRED | ai.js:16, 201 |
| ai.js rawSuggestionSchema / suggestionSchema | target_entry | per-item safeParse preserves field | ✓ WIRED | ai.js:67, 259; suggestionSchema.js:25 |
| suggestion.target_entry | applyAddToList targetEntry → skip record | call sites pass suggestion.target_entry, branch on fellBack | ✓ WIRED | applyPatches.js:267-276, 299-306 |
| validate.js normalizeText export | applyPatches.js import | require('../analysis/validate') | ✓ WIRED | validate.js:254 → applyPatches.js:23 |
| server SKIP_REASON value | client mirror → staleSkips bucket → per-reason copy | exact string mirror; KNOWN_REASONS derives from Object.values | ✓ WIRED | applyPatches.js:65 ↔ skipReasons.js:13; PreviewTailored.jsx:117,171-173 |
| skip.target_entry | PreviewTailored interpolation | s.target_entry in TARGET_ENTRY_NOT_FOUND copy | ✓ WIRED | PreviewTailored.jsx:172 |
| evals/run-evals.js | heuristic + validate + validateResume + (conditional) ai | require chain | ✓ WIRED | run-evals.js:35-37, 104 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Analysis.jsx ScoreDisplay gaps list | report.gaps | heuristic.analyzeResume builds from report.keywords.missing (real extraction via extractKeywords) | Yes — eval report shows real per-pair gap notes from fixture data | ✓ FLOWING |
| PreviewTailored staleSkips copy | s.target_entry, s.section | applyPatches markSkipped extra spread carries suggestion.target_entry | Yes — applyPatches.test.js asserts the skip record fields | ✓ FLOWING |
| evals/reports/report.md | reportH.score/keywords/gaps | heuristic.analyzeResume over committed fixtures | Yes — observed real scores (73, 85, 63...), matched/missing keyword sets | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Heuristic gap notes + fabrication removal | `node server/lib/analysis/providers/heuristic.test.js` | 7/7 PASS, exit 0 | ✓ PASS |
| Score-1 regression (OUT-06) | `node server/lib/analysis/providers/normalizeReport.test.js` | 4/4 PASS, exit 0 | ✓ PASS |
| Eval harness: zero fabricated claims over 5 pairs | `node evals/run-evals.js` | 20/20 PASS, exit 0, report.md written, 0 FAIL lines | ✓ PASS |
| Full server test chain (incl. applyPatches target_entry, validate warnings, normalizeReport chained) | `cd server && npm test` | All tests passed, exit 0 | ✓ PASS |
| Client mixed-reason skip copy | `cd client && npx vitest run src/pages/PreviewTailored.test.jsx` | 2/2 PASS, exit 0 | ✓ PASS |
| AI-key eval path | (no key in environment) | Keyless skip path exercised; keyed branch not executable here | ? SKIP — routed to human verification |

### Probe Execution

Step 7c: SKIPPED — no phase-declared probes (`scripts/*/tests/probe-*.sh`); verification used the committed test suites and eval harness directly.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| OUT-01 | 17-01 | Heuristic experience/project suggestions only rephrase present bullets; fabrication templates removed | ✓ SATISFIED | Templates/pickVariant deleted; 0 exp/proj adds asserted by tests + eval on all 5 pairs. Deviation note: no rephrase suggestions built (locked audit answer 4, honest-low-suggestion) — fabrication-removal intent fully met |
| OUT-02 | 17-01 | Honest gap note instead of a generated claim for absent skills | ✓ SATISFIED | Per-keyword gap notes emitted and rendered; zero skills-add suggestions |
| OUT-03 | 17-02 | AI prompts forbid inventing skills/employers/metrics/dates/experience | ✓ SATISFIED | Full guardrail wording in BOTH prompts (ai.js:179-181, 232-234) |
| OUT-04 | 17-05 | 5+ committed eval pairs + runner + markdown report | ✓ SATISFIED | Committed, ran, report clean; keyed-AI branch human-verified item attached |
| OUT-05 | 17-02/03/04 | target_entry attach + visible fallback skip, server and client | ✓ SATISFIED | Engine + validator + client mirror + copy + tests, all passing |
| OUT-06 | 17-02 | score 1 not silently scaled to 100 | ✓ SATISFIED | Rescale branch deleted; regression test chained into npm test |

**Orphaned requirements:** None — all six phase requirement IDs are claimed by plans and implemented.

**Tracking note (informational):** `.planning/REQUIREMENTS.md` still shows OUT-03/04/06 as unchecked/"Pending" while OUT-01/02/05 are checked. STATE.md shows phase 17 still in `executing` status, so this is expected pre-verification sequencing (orchestrator owns the post-verify REQUIREMENTS.md flip) — not an implementation gap. The orchestrator should flip OUT-03/04/06 after accepting this verification.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| client/src/pages/PreviewTailored.jsx | 128 | "placeholder" | ℹ️ Info | False positive — legitimate HTML input placeholder attribute, not a stub |

Debt-marker scan (TBD/FIXME/XXX/TODO/HACK) across all nine phase-modified source files: clean. No empty implementations, no hardcoded-empty rendering paths, no console.log-only handlers.

### Human Verification Required

#### 1. AI-provider eval path with a real key

**Test:** Set one of GOOGLE_GENERATIVE_AI_API_KEY / OPENROUTER_API_KEY / GROQ_API_KEY, run `node evals/run-evals.js`, open `evals/reports/report.md`
**Expected:** AI analysis sections appear per pair (no "skipped — no key"), suggestions dumped verbatim with fabrication verdicts, exit 0
**Why human:** External service integration — the branch is source-correct (lazy-require, try/catch, verbatim dump) but could not be executed without a key. This matches SUMMARY 17-05 coverage D3's own human_judgment flag.

#### 2. Analysis page visual rendering of gap notes

**Test:** In the browser, run analysis on a resume/posting pair with missing keywords; inspect the "Gaps to Address" block
**Expected:** One neutral gap note per missing keyword (exact copy contract), per-section match-rate strings preserved alongside, block absent when no gaps
**Why human:** Visual appearance; provider emission and conditional render are code-verified but no client test exercises Analysis.jsx rendering

### Gaps Summary

No gaps. Every roadmap success criterion, every plan-frontmatter must-have truth, artifact, key link, and prohibition across the five plans was verified against the actual codebase with source evidence and passing test runs. The full server test chain (including the chained normalizeReport regression), the client PreviewTailored test, and the eval harness all execute green from this checkout. Two human-verification items remain — both external-surface checks (live AI provider run, browser visual) that programmatic verification cannot substitute for; neither indicates missing implementation. The OUT-01 "rephrase" wording deviation (zero experience/project suggestions rather than honest rephrases) is a documented planner decision consistent with the phase's no-fabrication goal and requires no override since the fabrication-removal intent is fully satisfied.

---

_Verified: 2026-10-09T21:19:43Z_
_Verifier: Claude (gsd-verifier)_
