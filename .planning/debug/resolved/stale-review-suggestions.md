---
slug: stale-review-suggestions
status: verifying
trigger: Review suggestion show the stale values no matter ai provider responses
created: 2026-07-04
updated: 2026-07-04
---

## Symptoms

- **Expected:** Show real-time responses from AI provider on Review Suggestions page
- **Actual:** Same results always displayed regardless of which provider responds
- **Errors:** No error messages in console or UI
- **Timeline:** Current issue
- **Reproduction:** Generate suggestions, then visit review page

## Current Focus

- **Hypothesis:** CONFIRMED — ReviewSuggestions page omits the `provider` parameter when calling `/api/analyze`, so the server always defaults to `'heuristic'`
- **Status:** Fix applied, build verified, ready for human verification

## Evidence

- timestamp: 2026-07-04T01:00:00Z, source: code review, detail: "Analysis.jsx line 197 passes `provider` to POST /api/analyze"
- timestamp: 2026-07-04T01:00:01Z, source: code review, detail: "ReviewSuggestions.jsx lines 37-39 only sends `job_posting_id` and `resume_version_id` — NO `provider`"
- timestamp: 2026-07-04T01:00:02Z, source: code review, detail: "server/index.js line 431 destructures `provider` with default `'heuristic'` — so missing provider means always heuristic"
- timestamp: 2026-07-04T01:00:03Z, source: code review, detail: "Analysis.jsx line 352 navigates to review with only resume and posting query params — no provider param"

## Eliminated

- hypothesis: "Stale state or cached data between generation and review"
  evidence: "ReviewSuggestions.jsx makes a fresh POST to /api/analyze on every mount — it's not reading cached state, but the API call itself omits the provider parameter"
  timestamp: 2026-07-04T01:00:04Z

## Resolution

- **root_cause:** ReviewSuggestions.jsx did not pass the `provider` parameter when calling POST /api/analyze. The server defaults to `'heuristic'` when provider is missing, so the review page always ran heuristic analysis regardless of which AI provider the user selected on the Analysis page.
- **fix:** (1) Analysis.jsx now includes `provider` in the review link URL query params. (2) ReviewSuggestions.jsx reads `provider` from URL search params and includes it in the POST body. (3) Added `provider` to useEffect dependency array for correctness.
- **verification:** Build compiles cleanly with no errors. Fix is minimal and targeted — only the missing parameter propagation was added.
- **files_changed:** [client/src/pages/Analysis.jsx, client/src/pages/ReviewSuggestions.jsx]
