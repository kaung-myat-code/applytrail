---
status: resolved
trigger: |
  DATA_START
  Gemini AI analysis provider always falls back to the heuristic provider, showing
  the banner "AI analysis unavailable -- falling back to heuristic analysis" with
  reason text "Provider gemini returned an invalid report/suggestions shape".
  GOOGLE_GENERATIVE_AI_API_KEY is confirmed set and Gemini is responding successfully
  (not a missing-key or rate-limit issue -- post-response validation failure).
  DATA_END
created: 2026-07-21T00:00:00Z
updated: 2026-07-21T00:00:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "validateSuggestions' findInResume exact-substring check hard-fails on benign LLM formatting variance (trailing ellipsis truncation, whitespace collapse, smart quotes) because ai.js's generateSuggestions prompt never instructs Gemini to quote `current` verbatim from the resume -- root cause is BOTH (a) missing prompt instruction and (b) zero-tolerance validator, combining to make hard-error rejection of valid Gemini responses highly likely on any response containing a 'modify' suggestion."
  confirming_evidence:
    - "Repro script (scratchpad/repro-findinresume.js) run against real validate.js + demo resume: 'truncated with ellipsis' case -> valid:false; 'paraphrased/reworded' case -> valid:false; 'smart quotes/whitespace collapse' case -> valid:false. Only exact-text and trailing-period-on-skill (already bidirectional) cases passed."
    - "Mixed batch of 1 exact + 2 realistic-variance suggestions -> valid:false for the WHOLE array (errors on suggestion[1] and suggestion[2]), confirming validateSuggestions is all-or-nothing: a single non-matching 'modify' suggestion invalidates every suggestion in the response, triggering full fallback via server/index.js:796."
    - "ai.js generateSuggestions prompt (lines 220-229) read in full: only says 'with clear reasoning referencing actual resume content' -- no instruction to copy `current` character-for-character / verbatim from the resume JSON. suggestionSchema.current is z.string().nullable() with no exactness constraint enforced at generation time."
    - "server/index.js:797 error text 'Provider gemini returned an invalid report/suggestions shape' matches user's reported fallback_reason exactly, confirming this is the validation branch (not the catch-block API-error branch at line 818), ruling out API key/rate-limit/network causes as the trigger."
  falsification_test: "If a real Gemini response's suggestions all passed findInResume unmodified (i.e., validateSuggestions returned valid:true) while the user still observed fallback, that would refute this hypothesis and point to validateMatchReport or an actual API exception instead. Not observed -- the reproduction with realistic variance text, using the actual validate.js code (not a mock), independently reproduces valid:false without needing a live Gemini call, which is strong direct evidence given the mechanism is identical regardless of whether the input text comes from a real API call or a hand-constructed realistic stand-in."
  fix_rationale: "Root cause has two independent contributing parts, so the fix addresses both at the source rather than papering over the symptom: (1) instruct Gemini explicitly to copy `current` verbatim from the resume (reduces paraphrasing/truncation at generation time -- the actual root cause of mismatch), and (2) normalize benign formatting variance (trim, collapse whitespace, case-insensitive, smart-quote normalization, strip trailing ellipsis) in findInResume so residual superficial differences don't cause false-positive hard errors, while preserving byte-level substring matching for the words themselves so genuinely fabricated/fictional content (not present anywhere in the resume) is still correctly rejected. This is not a workaround -- normalization targets exactly the formatting-variance failure modes reproduced above, and does not weaken the check against fabricated content (paraphrased text with materially different wording still correctly fails after normalization, per the repro)."
  blind_spots: "Have not made a live call to the real Gemini API to see its actual raw suggestion output verbatim-ness in production; relying on realistic hand-constructed stand-ins for the class of variance LLMs are known to introduce (truncation/ellipsis, paraphrasing, quote/whitespace normalization). Have not verified whether the AI SDK or JSON serialization itself introduces any additional transformation (e.g. unicode normalization) between Gemini's raw output and the object validate.js receives. These are considered low-risk since normalization is intentionally targeted at superficial text differences and the prompt fix reduces reliance on validator leniency."

hypothesis: CONFIRMED -- findInResume's exact-substring requirement combined with a Gemini prompt that never instructs verbatim quoting causes valid AI responses with any moderately-paraphrased or truncated 'modify' suggestion to be hard-rejected, triggering full fallback to heuristic.
test: Fix applied and self-verified (repro script re-run, new regression suite, full server test suite) -- see Resolution.verification.
expecting: n/a
next_action: n/a -- human confirmed live verification passed (POST /api/analyze with provider=gemini and a real API key no longer falls back to heuristic). Session archived.

## Symptoms

expected: When GOOGLE_GENERATIVE_AI_API_KEY is set and Gemini responds successfully, /api/analyze should return provider: "gemini" with report+suggestions, not silently fall back to heuristic.
actual: Response always has provider: "heuristic", fallback: true, fallback_reason containing "Provider gemini returned an invalid report/suggestions shape".
errors: "Provider gemini returned an invalid report/suggestions shape" (from server/index.js:797, sanitized and surfaced as fallback_reason)
reproduction: Call POST /api/analyze with provider=gemini and a valid API key configured; Gemini API call succeeds (confirmed via user report / would show in server logs as no LoadAPIKeyError/APICallError/rate-limit), but response still falls back to heuristic with the "invalid report/suggestions shape" reason.
started: Reported now; introduced whenever validateSuggestions' findInResume exact-match logic was added (pre-existing design, first triggered by real AI provider usage)

## Eliminated

## Evidence

- timestamp: investigation-start
  checked: server/index.js lines 779-826 (already provided/read)
  found: For AI providers, code calls provider.analyzeResume -> provider.generateSuggestions -> validateMatchReport(report) -> validateSuggestions(suggestions, resume). If EITHER is invalid, it logs `shapeError` with `reportValidation.errors` and `suggestionsValidation.errors`, sets lastError, and `continue`s to the next provider in fallbackOrder (gemini -> openrouter -> groq -> heuristic). Since fallback_reason literally says "Provider gemini returned an invalid report/suggestions shape", this confirms it's the shape-validation branch (line 797), not the catch block (line 818-825, which is for actual API errors/exceptions).
  implication: Confirms this is NOT an API key / rate-limit / network issue (those throw and get caught separately with different error messages, e.g. "AI analysis failed: ..."). This is specifically validateMatchReport or validateSuggestions returning valid:false after a successful Gemini call.

- timestamp: investigation-start
  checked: server/lib/analysis/validate.js in full (lines 1-197)
  found: findInResume (170-195) does raw JS String.prototype.includes() for summary/experience/projects (case-sensitive, whitespace-sensitive, exact substring only), and for skills does `s.includes(value) || value.includes(s)` (bidirectional substring, still case-sensitive). No trim(), no whitespace normalization, no case-insensitivity, no quote normalization (curly vs straight quotes), no ellipsis/truncation handling. In validateSuggestions (137-147), if type==='modify' and resume is provided and s.current is a string, findInResume() is called; if it returns false, an ERROR (not warning) is pushed: "current value not found in resume — patch will fail". A single false match among potentially many suggestions makes the whole array invalid (valid: errors.length === 0).
  implication: Directly confirms the exact-substring matching is maximally strict -- any Gemini paraphrasing, re-punctuation, smart-quote conversion, leading/trailing whitespace difference, or truncation in `current` will cause a hard error, invalidating the entire suggestions array even if only one of many suggestions has this issue.

- timestamp: investigation-start
  checked: server/lib/analysis/providers/ai.js in full (lines 1-245), specifically generateSuggestions prompt (lines 218-229) and suggestionSchema (43-50)
  found: The prompt sent to Gemini for generateSuggestions is only: "Based on this MatchReport, generate actionable suggestions to improve the resume. Each suggestion must be a structured patch (add, modify, or remove) with clear reasoning referencing actual resume content." followed by JSON-dumped resume and report. There is NO instruction anywhere telling the model to quote the `current` field VERBATIM / exactly as it appears character-for-character in the resume. The Zod schema for `current` is just `z.string().nullable()` -- no `.refine()` or cross-check against resume content at the schema level. Score/matchRate get explicit post-generation normalization (186-204) precisely because the model doesn't reliably follow the 0-1 vs 0-100 instruction -- but no equivalent post-generation normalization/repair exists for `current` text despite it being subject to the same kind of model unreliability (here: paraphrasing instead of format drift).
  implication: This is a clear contributing root cause: the model is never told that `current` must be an exact verbatim substring of resume content, so by default an LLM will naturally paraphrase, summarize, add ellipsis for long bullets, or normalize quotes/whitespace when echoing back "current" text -- especially since its focus is generating good `suggested` text, not reproducing `current` byte-for-byte. Combined with validate.js's zero-tolerance exact matching, this makes it highly likely that at least one 'modify' suggestion's current text will fail findInResume on essentially every real Gemini response that includes any 'modify' suggestions.

## Resolution

root_cause: |
  Two independent, compounding causes in the AI-provider "modify" suggestion validation path:
  (a) server/lib/analysis/providers/ai.js's generateSuggestions prompt never instructed Gemini
      to quote the `current` field verbatim from the resume -- it only said suggestions should
      have "reasoning referencing actual resume content", so Gemini naturally paraphrases,
      truncates long bullets with an ellipsis, and lets whitespace/quote characters drift when
      echoing resume text back.
  (b) server/lib/analysis/validate.js's findInResume() (used by validateSuggestions for every
      'modify' suggestion) did raw, case-sensitive, whitespace-sensitive JS String.includes()
      with zero normalization, and validateSuggestions treats any non-match as a hard ERROR
      (not a warning), which invalidates the ENTIRE suggestions array (valid: errors.length===0).
  Together: any Gemini response containing at least one 'modify' suggestion with benign
  formatting drift in `current` (very common, since it wasn't instructed to avoid it) caused
  validateSuggestions to return valid:false, which server/index.js:796 treats as an invalid
  shape and falls through the AI provider chain, eventually landing on heuristic -- exactly
  matching the reported fallback_reason "Provider gemini returned an invalid report/suggestions
  shape". This is a post-response validation failure, not an API key/rate-limit/network issue,
  consistent with the user's report.
fix: |
  1. server/lib/analysis/providers/ai.js: added an explicit instruction to the generateSuggestions
     prompt requiring `current` to be copied VERBATIM/character-for-character from the resume JSON
     for 'modify' suggestions (no paraphrasing, truncation/ellipsis, or punctuation changes), with
     guidance to use type 'add' instead if no exact match exists. This addresses the root cause at
     generation time.
  2. server/lib/analysis/validate.js: added a normalizeText() helper (trim, collapse whitespace,
     lowercase, normalize smart quotes to straight quotes, strip a trailing ellipsis) and applied
     it to both sides of every findInResume() comparison (summary, skills, experience, projects).
     This tolerates benign LLM formatting variance (whitespace/quote drift, ellipsis-truncated
     prefixes) as defense-in-depth, while deliberately NOT adding fuzzy/token-overlap matching --
     genuinely paraphrased or fabricated text (not a real substring of any resume content even
     after normalization) still correctly fails validation, since such text cannot be applied as a
     string-replacement patch to the resume regardless of intent.
  3. Added server/lib/analysis/validate.test.js (6 regression tests) covering: exact match, ellipsis
     truncation, whitespace collapse, smart-quote normalization, genuine paraphrase (must still
     fail), and one-bad-suggestion-among-many (must still fail as a batch when genuinely mismatched,
     but must not fail when only benignly-formatted). Wired into server/package.json's `test` script.
verification: |
  Self-verified (no live Gemini API call made -- not available/appropriate in this environment):
  1. Reproduction script (run against the REAL, unmodified server/lib/analysis/validate.js code,
     not a mock) constructing realistic Gemini-shaped 'modify' suggestions confirmed the bug
     before the fix: ellipsis-truncated, and whitespace/smart-quote-drifted `current` text all
     produced valid:false (hard error), and a single such suggestion invalidated an entire mixed
     batch -- reproducing the exact failure mode reported.
  2. After applying the validate.js fix, re-running the identical reproduction script: ellipsis
     truncation and whitespace/quote drift cases now pass (valid:true); the genuine-paraphrase
     case still correctly fails (valid:false), confirming the fix does not weaken fabricated-
     content detection.
  3. New regression suite server/lib/analysis/validate.test.js: 6/6 tests pass.
  4. Full existing server test suite (`npm test` in server/, 6 test files including the live
     end-to-end analyze-route.test.js which boots the real Express app and hits POST /api/analyze
     for the heuristic provider): all pass, no regressions introduced.
  Remaining gap (requires human/live-environment verification): actually calling POST /api/analyze
  with provider=gemini and a live GOOGLE_GENERATIVE_AI_API_KEY to confirm the real Gemini response
  no longer triggers fallback in practice. This cannot be self-verified here since it requires a
  live external API call with real credentials.
files_changed:
  - server/lib/analysis/providers/ai.js
  - server/lib/analysis/validate.js
  - server/lib/analysis/validate.test.js
  - server/package.json
