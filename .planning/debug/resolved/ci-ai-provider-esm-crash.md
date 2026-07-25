---
status: resolved
trigger: |
  DATA_START
  pull requests issues after push
  DATA_END
created: 2026-07-26T00:00:00Z
updated: 2026-07-26T00:52:00Z
---

## Current Focus

hypothesis: CONFIRMED. server/index.js:8 does a top-level `require('./lib/analysis/providers/ai')` (only to grab `sanitizeError`), which eagerly runs providers/ai.js's top-level `require('ai')`. The `ai` npm package (v7.0.13) ships ESM-only (package.json `exports` has no `require` condition, only `import`/`default` -> dist/index.js). Node 22.12+/23 can `require()` an ESM module synchronously (stable `require(esm)`), which is why it works on the local dev machine (Node v23.6.0) — but Node 18.x and 20.x (the CI matrix, and the documented "Node.js 18+" platform requirement) cannot, and throw ERR_REQUIRE_ESM. This crashes the entire server at boot on Node 18/20, not just the analyze-route test.

reasoning_checkpoint:
  hypothesis: "server/index.js:8's top-level `require('./lib/analysis/providers/ai')` (needed only for `sanitizeError`) eagerly triggers providers/ai.js:9's top-level `require('ai')`, which throws ERR_REQUIRE_ESM on any Node version without stable require(esm) support (pre-22.12/23.0) because the `ai` package's package.json exports map has no `require` condition — this bypasses the lazy-load safeguard engine.js's getProvider() already implements for exactly this scenario."
  confirming_evidence:
    - "Direct reproduction: `n exec 16.13.0 node -e \"require('./index.js')\"` and `n exec 21.0.0 node -e \"require('./index.js')\"` from server/ both throw the byte-for-byte identical error CI reports: `Error [ERR_REQUIRE_ESM]: require() of ES Module .../server/node_modules/ai/dist/index.js from .../server/lib/analysis/providers/ai.js not supported`, with stack trace `providers/ai.js:9` <- `index.js:8` — matching CI's `analyze-route.test.js:47` <- `index.js:8` <- `providers/ai.js:9` chain exactly (only the top frame differs: direct eval vs. test file, because the test also does `require('../../index.js')`)."
    - "node_modules/ai/package.json exports map confirmed: `import`/`default` only, no `require` condition -> any require() of it on non-require(esm) Node versions is unconditionally fatal, regardless of ai package patch version."
    - "engine.js:19 comment explicitly states lazy-loading providers/ai is 'to avoid crashing server if AI SDK has issues' — proving the codebase's own design intent already assumes eager-loading this module is unsafe. index.js:8 violates that intent by requiring the same module eagerly, for a single pure-utility function."
    - "grep confirms sanitizeError is used in exactly two places: providers/ai.js:128 (internal, inside handleAIError) and index.js:832 (external caller) — and sanitizeError's own implementation (lines 77-84) has zero dependency on `ai`/`@ai-sdk/*`/`zod`, only `err.message` + regex. Nothing else imports sanitizeError from providers/ai."
  falsification_test: "If requiring providers/ai.js on Node 16/21 did NOT throw ERR_REQUIRE_ESM, or threw a different error unrelated to the `ai` package's ESM-only exports, the hypothesis would be false. Actual result: exact match, both versions, same line numbers."
  fix_rationale: "Extracting sanitizeError into its own dependency-free module (server/lib/analysis/sanitizeError.js) removes the only reason index.js needs to touch providers/ai.js at module-load time. providers/ai.js keeps its top-level AI-SDK requires (used throughout the file for schemas/instanceof checks — too invasive to convert to dynamic import without deeper restructuring), but is now ONLY reached through engine.js's getProvider(), which already lazy-loads it inside a try/catch. This restores the single lazy-load boundary the codebase already intended, addressing the root cause (eager unwanted require path) rather than a symptom (e.g. just bumping CI's Node matrix, which CLAUDE.md and production Render risk explicitly rule out)."
  blind_spots: "Have not confirmed Render's actual production Node runtime version (still unconfirmed per timeline note) — but the fix removes the failure mode entirely regardless of Node version, so this doesn't block the fix. Have not tested under exact Node 18.x/20.x (only 16.13.0 and 21.0.0 were available locally via `n`); both bracket the CI matrix and predate require(esm) support (added 22.12/23.0), so the mechanism is confirmed equivalent, but not byte-identical Node versions to CI."

next_action: n/a — human confirmed CI green on real Node 18.x/20.x matrix. Session archived.

## Symptoms

expected: `npm test` (server) passes under Node 18.x and 20.x, matching the documented "Node.js 18+" platform requirement in CLAUDE.md; the CI workflow (.github/workflows/ci.yml, just added) passes on push to main and on PRs.
actual: Every CI run — the push to main itself, and every Dependabot PR opened right after (10 PR runs `gh pr list`, 6 already completed as "failure", others in progress) — fails in the "Test" step on both the 18.x and 20.x matrix legs. Server test run crashes with:
  `Error [ERR_REQUIRE_ESM]: require() of ES Module /home/runner/work/applytrail/applytrail/server/node_modules/ai/dist/index.js from /home/runner/work/applytrail/applytrail/server/lib/analysis/providers/ai.js not supported.`
errors: |
  FAIL: analyze-route.test.js crashed
  Error [ERR_REQUIRE_ESM]: require() of ES Module .../server/node_modules/ai/dist/index.js from .../server/lib/analysis/providers/ai.js not supported.
  Instead change the require of index.js in .../server/lib/analysis/providers/ai.js to a dynamic import() which is available in all CommonJS modules.
      at Object.<anonymous> (server/lib/analysis/providers/ai.js:9:83)
      at Object.<anonymous> (server/index.js:8:27)
      at main (server/lib/analysis/analyze-route.test.js:47:3)
    code: 'ERR_REQUIRE_ESM'
timeline: First observed 2026-07-26 right after the CI workflow (added in quick task 260725-t92) was pushed to origin for the first time. Confirmed NOT a Dependabot-introduced regression — the same failure occurs on the CI run triggered by the direct push to main (run 30165551900, `gh run list --workflow=ci.yml --branch main`), before any Dependabot PR existed. This is a pre-existing bug that simply had no CI to catch it until now; it also means production is at risk if Render runs Node 18/20 (CLAUDE.md documents "Node.js 18+" as the platform requirement, and Render's default Node version is unconfirmed — needs a check of render.yaml / Render dashboard settings for the actual runtime version).
reproduction: |
  On CI (Node 18.x or 20.x): `cd server && npm test` (or `node lib/analysis/analyze-route.test.js` directly), which does `require('../../index.js')`, which does `require('./lib/analysis/providers/ai')` at server/index.js:8, which does `require('ai')` at providers/ai.js:9 -> ERR_REQUIRE_ESM.
  Locally (Node 23.6.0): does NOT reproduce — `node -e "require('./index.js')"` from server/ boots cleanly, confirming Node's stable `require(esm)` support (added Node 22.12/23.0) is masking this on the dev machine.

## Eliminated

- hypothesis: Caused by a Dependabot dependency bump (e.g. `ai` or `express` version change) rather than pre-existing code.
  reasoning: The identical failure occurs on the CI run for the direct push to main (30165551900), which ran before any Dependabot PR existed and used the exact dependency versions already pinned in package-lock.json at the time of the CI-workflow commit. Ruled out.

## Evidence

- timestamp: investigation-start
  checked: `gh run view <run-id> --log-failed` for the main-branch CI run (30165551900) and several Dependabot PR runs (server/express, server/zod, client/vitest, client/eslint, github-actions/checkout, github-actions/setup-node)
  found: All failing runs show the identical stack trace and ERR_REQUIRE_ESM error at server/lib/analysis/providers/ai.js:9, server/index.js:8, analyze-route.test.js:47 — same root failure regardless of which dependency PR triggered the run, and it fails on main itself too.
  implication: Single shared root cause, not a per-PR dependency regression. Points at the pre-existing top-level require chain, not any specific bumped package.

- timestamp: investigation-start
  checked: server/index.js line 8, server/lib/analysis/providers/ai.js lines 1-13, server/lib/analysis/engine.js lines 1-32
  found: engine.js's getProvider() already lazy-loads providers/ai.js inside a try/catch specifically "to avoid crashing server if AI SDK has issues" (comment at engine.js:19) — the lazy-load design intent already exists. But server/index.js:8 bypasses that entirely with `const { sanitizeError } = require('./lib/analysis/providers/ai')` at module top level, just to import one helper function, which eagerly triggers providers/ai.js's own top-level `require('ai')` / `require('@ai-sdk/google')` / etc. before any try/catch can intervene.
  implication: The lazy-load safeguard engine.js was designed to provide is defeated by a second, eager, top-level import path in server/index.js that exists purely for a single utility function (sanitizeError). This is the actual point of failure.

- timestamp: investigation-start
  checked: `node_modules/ai/package.json` exports map (both local and per package-lock.json pinned version 7.0.13)
  found: exports["."] = { types, import: "./dist/index.js", default: "./dist/index.js" } — no "require" condition at all. `dist/index.js` is genuine ESM (uses `export` syntax internally per Node's ERR_REQUIRE_ESM detection).
  implication: Any CommonJS `require('ai')` on a Node version without stable `require(esm)` support will always throw ERR_REQUIRE_ESM, regardless of which exact 7.x patch version is installed — this is not fixable by pinning/bumping the `ai` package version; it's a CJS/ESM interop issue that needs a code-side fix (dynamic import, or removing the eager top-level require).

- timestamp: investigation-start
  checked: Local repro — `node --version` (v23.6.0) then `node -e "require('./index.js')"` from server/, and `node -e "const ai = require('ai'); console.log(typeof ai.generateObject)"`
  found: Both succeed locally with no error (`function` printed for generateObject) — Node v23.6.0 has stable synchronous `require(esm)` (unflagged since Node 22.12.0/23.0.0), transparently handling the ESM `ai` package.
  implication: Confirms the bug is Node-version-dependent and was invisible in local development. CI's Node 18.x/20.x matrix (chosen to match CLAUDE.md's documented "Node.js 18+" platform requirement) is what first exposed it — this is exactly the kind of pre-merge regression the CI workflow (quick task 260725-t92) was added to catch, and it's working as intended.

- timestamp: fix-verification-1
  checked: Direct Node <22.12 repro via `n exec` (local `n` tool had 16.13.0 and 21.0.0 pre-downloaded, not exactly 18.x/20.x but both predate stable require(esm), same mechanism as CI). Ran `n exec 16.13.0 node -e "require('./index.js')"` and `n exec 21.0.0 node -e "require('./index.js')"` BEFORE the fix.
  found: Both threw the byte-for-byte identical error CI reports — `Error [ERR_REQUIRE_ESM]: require() of ES Module .../server/node_modules/ai/dist/index.js from .../server/lib/analysis/providers/ai.js not supported`, stack `providers/ai.js:9` <- `index.js:8`. Node 16.13.0's trace additionally showed `at [eval]:1:1` matching the pattern of `analyze-route.test.js:47` <- `index.js:8` seen in the real CI log.
  implication: Root cause confirmed via direct reproduction (not just static analysis) — moved hypothesis from "strong but unconfirmed" to CONFIRMED. See reasoning_checkpoint in Current Focus.

- timestamp: fix-verification-2
  checked: After applying the fix (extracted sanitizeError to server/lib/analysis/sanitizeError.js; providers/ai.js now imports it instead of defining it; index.js now requires the new module instead of providers/ai.js) — reran `n exec 16.13.0 node -e "require('./index.js'); setTimeout(()=>{console.log('BOOT OK');process.exit(0)},1500)"` and same for `n exec 21.0.0`.
  found: Both print "Migrated 12 legacy application records", "Server listening on port 3000", "BOOT OK", exit 0. No ERR_REQUIRE_ESM.
  implication: Boot-time crash is fixed on both bracketing Node versions.

- timestamp: fix-verification-3
  checked: Full `npm test` (7-file suite) under `n exec 16.13.0` and `n exec 21.0.0`, and under local Node v23.6.0.
  found: Node 21.0.0 — all tests pass, including analyze-route.test.js (heuristic provider path exercised end-to-end over HTTP). Node 16.13.0 — all tests pass except analyze-route.test.js, which fails with `fetch is not defined` (Node 16 predates global fetch, added in Node 18/stabilized later; this is unrelated to the ESM bug and outside the documented "Node.js 18+" platform requirement — Node 16 was only used locally as a bracketing/nearest-available version, not a supported target). Local Node 23 — all tests pass (no regression).
  implication: Fix verified on real Node versions predating require(esm) support, not just the local Node 23 environment that was masking the bug. The one Node-16-specific failure (fetch) is a distinct, out-of-scope pre-existing incompatibility with an unsupported Node version, not a regression from this fix.

- timestamp: fix-verification-4
  checked: `getProvider('gemini')` via engine.js under Node 21.0.0 after the fix, plus `getProvider('heuristic')`, plus direct + re-exported `sanitizeError()` calls under local Node 23.
  found: On Node 21.0.0, requesting the AI provider no longer crashes the server — engine.js's existing try/catch now correctly catches the (still-present, pre-existing) ERR_REQUIRE_ESM from providers/ai.js's own eager `require('ai')` and returns "AI provider unavailable: ... Use the heuristic provider instead." The heuristic provider continues to work normally. On Node 23, sanitizeError redacts API-key-shaped substrings correctly both via `require('./lib/analysis/sanitizeError')` and via the re-export at `providers/ai.js` module.exports.
  implication: Fix restores the codebase's originally-intended lazy-load safety boundary (engine.js:19's comment) exactly as designed — the whole server no longer crashes at boot on Node <22.12, and instead degrades gracefully to heuristic-only, per the pre-existing (already documented) design intent. Known residual limitation (pre-existing, not introduced by this fix, out of scope for this bug): the AI providers (gemini/openrouter/groq) themselves remain unusable on Node <22.12 because providers/ai.js still eagerly requires the ESM-only `ai` package at its own top level. Making AI providers themselves Node-18/20-compatible would require converting providers/ai.js's `ai`/`@ai-sdk/*` requires to dynamic `import()` throughout (getModel, handleAIError's instanceof checks, analyzeResume, generateSuggestions) — a materially larger, separate refactor recommended as a follow-up task if Render's production runtime is confirmed to be Node <22.12.

## Resolution

root_cause: |
  server/index.js:8 performed a top-level, eager `require('./lib/analysis/providers/ai')` solely to obtain the `sanitizeError` utility function. This eagerly triggered providers/ai.js's own top-level `require('ai')` (line 9) before any try/catch could intervene. The `ai` npm package (v7.0.13) ships ESM-only — its package.json `exports` map has no `require` condition, only `import`/`default` pointing at `dist/index.js` (genuine ESM). Node versions without stable synchronous `require(esm)` support (all versions prior to 22.12.0/23.0.0, which includes the documented "Node.js 18+" platform requirement and the CI matrix's 18.x/20.x legs) throw `ERR_REQUIRE_ESM` on any `require('ai')`, crashing the entire server at module-load time — not just the code path that actually uses AI analysis. This defeated a lazy-load safeguard that engine.js's `getProvider()` already implements for exactly this reason (comment at engine.js:19: "Lazy-load AI providers to avoid crashing server if AI SDK has issues"), because index.js's separate eager import bypassed that safeguard entirely.
fix: |
  Extracted `sanitizeError` (a pure string-utility function with zero dependency on `ai`/`@ai-sdk/*`/`zod` — only uses `err.message` + regex) out of providers/ai.js into a new dependency-free module, server/lib/analysis/sanitizeError.js. Updated providers/ai.js to import `sanitizeError` from that new module instead of defining it inline (its `handleAIError` still uses it internally, and it's still re-exported from providers/ai.js's module.exports for any external consumer that expects it there). Updated server/index.js to require `sanitizeError` directly from the new dependency-free module instead of from providers/ai.js. This removes the only reason index.js needed to touch providers/ai.js at module-load time, so providers/ai.js (and its eager `require('ai')`) is now reached exclusively through engine.js's `getProvider()`, which already lazy-loads it inside a try/catch — restoring the single intended lazy-load boundary.
verification: |
  Self-verified (see Evidence fix-verification-1 through -4): reproduced the original crash on Node 16.13.0 and 21.0.0 (both predate require(esm) support, bracketing CI's 18.x/20.x matrix) via `n exec`; confirmed the fix resolves the boot-time crash on both; ran the full 7-file `npm test` suite on both versions (passes fully on 21.0.0; passes on 16.13.0 except one unrelated pre-existing `fetch`-not-defined failure specific to Node 16, which is below the "Node 18+" platform requirement and out of scope); confirmed no regression under local Node 23 (`npm test` full pass); confirmed `getProvider('heuristic')` and `sanitizeError` (direct + re-exported) work correctly post-fix; confirmed `getProvider('gemini')` on Node 21.0.0 now degrades gracefully (catches the still-present, pre-existing, out-of-scope ERR_REQUIRE_ESM from providers/ai.js's own eager AI-SDK require) instead of crashing the whole server.
  Pushed to branch fix/ci-ai-provider-esm-crash (PR #20). GitHub Actions CI run 30166382955 confirmed both matrix legs green:
  `verify (18.x)` passed in 32s, `verify (20.x)` passed in 27s. Human-confirmed resolved.
files_changed:
  - server/lib/analysis/sanitizeError.js (new — dependency-free sanitizeError utility)
  - server/lib/analysis/providers/ai.js (removed inline sanitizeError definition; now imports it from ../sanitizeError)
  - server/index.js (now requires sanitizeError from ./lib/analysis/sanitizeError instead of ./lib/analysis/providers/ai)
