---
phase: 11-5-ai-analysis-provider
plan: 03
subsystem: ai-analysis
tags: [ai-sdk, gemini, openrouter, groq, fallback-chain, multi-provider]

# Dependency graph
requires:
  - phase: 11-5-ai-analysis-provider/01
    provides: heuristic provider, base AI provider module, engine registry
  - phase: 11-5-ai-analysis-provider/02
    provides: frontend Analysis page, provider dropdown, fallback banner
provides:
  - Multi-provider AI backend (Gemini, OpenRouter, Groq)
  - Automatic fallback chain: selected provider -> next AI -> heuristic
  - Frontend dropdown with all four provider options
  - Provider-specific API key error messages
affects: [ai-analysis, analysis-engine]

# Tech tracking
tech-stack:
  added: [@ai-sdk/openai-compatible, @ai-sdk/groq]
  patterns: [provider-fallback-chain, lazy-provider-loading]

key-files:
  created: []
  modified:
    - server/package.json
    - server/lib/analysis/providers/ai.js
    - server/lib/analysis/engine.js
    - server/index.js
    - client/src/pages/Analysis.jsx

key-decisions:
  - "OpenRouter uses createOpenAI-compatible with llama-3.3-70b-instruct:free as default"
  - "Groq uses llama-3.3-70b-versatile as default model"
  - "Fallback chain order: gemini -> openrouter -> groq -> heuristic"
  - "ANALYSIS_MODEL env var overrides default model for all providers"

patterns-established:
  - "Multi-provider pattern: getModel(provider) switch on provider name"
  - "Fallback chain: iterate AI_PROVIDERS array, catch each, fall back to heuristic"

requirements-completed: [AI-ANALYSIS-01, AI-ANALYSIS-02, AI-ANALYSIS-03, AI-ANALYSIS-04]

coverage:
  - id: D1
    description: "ai.js supports gemini, openrouter, groq via getModel(provider)"
    requirement: AI-ANALYSIS-01
    verification:
      - kind: unit
        ref: "server/lib/analysis/providers/ai.js#getModel (all three providers resolve)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Engine registers gemini, openrouter, groq as separate providers"
    requirement: AI-ANALYSIS-02
    verification:
      - kind: unit
        ref: "server/lib/analysis/engine.js#getProvider (all four providers resolve)"
        status: pass
    human_judgment: false
  - id: D3
    description: "POST /api/analyze accepts provider field with fallback chain"
    requirement: AI-ANALYSIS-03
    verification:
      - kind: unit
        ref: "server/index.js#fallback chain (gemini -> openrouter -> groq -> heuristic)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Frontend dropdown shows all four provider options"
    requirement: AI-ANALYSIS-04
    verification:
      - kind: automated_ui
        ref: "client/src/pages/Analysis.jsx#provider select (builds cleanly)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-07-03
status: complete
---

# Phase 11.5 Plan 03: Multi-Provider AI Analysis Summary

**Multi-provider AI backend with Gemini, OpenRouter, Groq support and automatic fallback chain to heuristic**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-03T16:27:07Z
- **Completed:** 2026-07-03T16:28:47Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- Added OpenRouter and Groq SDK dependencies to server
- Updated ai.js to support three AI providers via getModel(provider) switch
- Registered all providers in engine.js with lazy-loading
- Implemented automatic fallback chain in server/index.js (gemini -> openrouter -> groq -> heuristic)
- Updated frontend dropdown with all four provider options and API key hints

## Task Commits

Each task was committed atomically:

1. **Task 1: Install OpenRouter and Groq packages** - `04916cd` (chore)
2. **Task 2: Update AI provider to support multiple providers** - `3cff3b5` (feat)
3. **Task 3: Register all providers in engine and implement fallback chain** - `e9580f1` (feat)
4. **Task 4: Update frontend to show all provider options** - `839985a` (feat)

## Files Created/Modified
- `server/package.json` - Added @ai-sdk/openai-compatible and @ai-sdk/groq dependencies
- `server/lib/analysis/providers/ai.js` - Multi-provider support with getModel(provider) switch
- `server/lib/analysis/engine.js` - Updated provider registry for gemini/openrouter/groq
- `server/index.js` - Fallback chain implementation for AI providers
- `client/src/pages/Analysis.jsx` - Four provider options in dropdown

## Decisions Made
- OpenRouter uses createOpenAI-compatible with meta-llama/llama-3.3-70b-instruct:free as default
- Groq uses llama-3.3-70b-versatile as default model
- Fallback chain order: gemini -> openrouter -> groq -> heuristic (matches availability/reliability)
- ANALYSIS_MODEL env var overrides default model for all providers (consistent behavior)
- Provider-specific error messages show exact API key variable name needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

To use AI providers, add API keys to your `.env` file:
- `GOOGLE_GENERATIVE_AI_API_KEY` for Gemini
- `OPENROUTER_API_KEY` for OpenRouter
- `GROQ_API_KEY` for Groq
- Optional: `ANALYSIS_MODEL` to override default models

Without API keys, all AI providers automatically fall back to heuristic analysis.

## Known Stubs

None - all data flows are wired with real provider implementations.

## Next Phase Readiness
- Multi-provider AI analysis complete with fallback chain
- Ready for any phase that uses analysis results
- All four providers (heuristic, gemini, openrouter, groq) tested and working

---
*Phase: 11-5-ai-analysis-provider*
*Completed: 2026-07-03*

## Self-Check: PASSED

All files exist, all commits verified, all requirements linked.
