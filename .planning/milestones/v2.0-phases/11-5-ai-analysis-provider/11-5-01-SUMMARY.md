---
phase: 11-5-ai-analysis-provider
plan: 01
subsystem: api
tags: [ai-sdk, google-gemini, zod, structured-output, provider-pattern]

requires:
  - phase: 11-1-section-by-section-suggestions
    provides: Analysis engine with heuristic provider and MatchReport interface
provides:
  - AI analysis provider module with Zod-validated structured output
  - Engine registry with ai provider alongside heuristic
  - API endpoint with provider selection and automatic fallback
affects: [11-5-02-frontend-provider-toggle]

tech-stack:
  added: [ai, @ai-sdk/google, zod]
  patterns: [provider-registry, structured-output-validation, async-fallback]

key-files:
  created:
    - server/lib/analysis/providers/ai.js
    - server/.env.example
  modified:
    - server/lib/analysis/engine.js
    - server/index.js
    - server/package.json

key-decisions:
  - "Use generateObject exclusively (not generateText) for all AI calls to guarantee structured output"
  - "Zod schemas defined at module level for reuse across both analyzeResume and generateSuggestions"
  - "Error messages sanitized with regex to strip any alphanumeric strings >= 20 chars (API key fragments)"
  - "Fallback response includes provider: 'heuristic' and fallback: true so frontend can display provider info"

patterns-established:
  - "AI provider pattern: async functions matching sync heuristic interface, resolved via await"
  - "Fallback pattern: AI failure automatically falls back to heuristic with clear fallback_reason"

requirements-completed: [AI-ANALYSIS-01, AI-ANALYSIS-02, AI-ANALYSIS-03, AI-ANALYSIS-04]

coverage:
  - id: D1
    description: "AI SDK packages installed and importable via require()"
    requirement: AI-ANALYSIS-01
    verification:
      - kind: other
        ref: "node -e \"require('ai'); require('@ai-sdk/google'); console.log('OK')\""
        status: pass
    human_judgment: false
  - id: D2
    description: "AI provider module exports analyzeResume and generateSuggestions matching heuristic interface"
    requirement: AI-ANALYSIS-02
    verification:
      - kind: other
        ref: "node -e \"const ai = require('./server/lib/analysis/providers/ai'); console.log(typeof ai.analyzeResume, typeof ai.generateSuggestions)\""
        status: pass
    human_judgment: false
  - id: D3
    description: "Engine registers ai provider and resolves via getProvider('ai')"
    requirement: AI-ANALYSIS-03
    verification:
      - kind: other
        ref: "node -e \"const { getProvider } = require('./server/lib/analysis/engine'); const a = getProvider('ai'); console.log(typeof a.analyzeResume)\""
        status: pass
    human_judgment: false
  - id: D4
    description: "API endpoint accepts provider field and falls back to heuristic on AI error"
    requirement: AI-ANALYSIS-04
    verification:
      - kind: other
        ref: "Code review of server/index.js POST /api/analyze handler"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-07-02
status: complete
---

# Phase 11.5 Plan 01: AI Analysis Provider Summary

**AI-powered resume analysis with Google Gemini via Vercel AI SDK, Zod-validated structured output, and automatic heuristic fallback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-07-02T20:21:25Z
- **Completed:** 2026-07-02T20:24:19Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Installed Vercel AI SDK (`ai`) and Google Gemini provider (`@ai-sdk/google`) in the server package
- Created AI analysis provider module with two Zod schemas (matchReportSchema, suggestionSchema) that validate all AI output before returning to callers
- Registered AI provider in the analysis engine alongside heuristic, updated API endpoint to accept `provider` field with automatic fallback on AI failure

## Task Commits

Each task was committed atomically:

1. **Task 1: Install AI SDK packages** - `918c90a` (chore)
2. **Task 2: Create AI provider module with Zod-validated structured output** - `c7b30d3` (feat)
3. **Task 3: Register AI provider and update API endpoint with fallback** - `3b666bc` (feat)

## Files Created/Modified
- `server/lib/analysis/providers/ai.js` - AI provider module with generateObject, Zod schemas, and error handling
- `server/.env.example` - Documents GOOGLE_GENERATIVE_AI_API_KEY, ANALYSIS_PROVIDER, ANALYSIS_MODEL env vars
- `server/lib/analysis/engine.js` - Added `ai: require('./providers/ai')` to providers registry
- `server/index.js` - Made POST /api/analyze async, added provider field, added AI fallback logic
- `server/package.json` - Added ai and @ai-sdk/google dependencies

## Decisions Made
- Used `generateObject` exclusively (not `generateText`) for all AI calls to guarantee structured output matches Zod schema
- Defined Zod schemas at module level for reuse across both provider functions
- Sanitized error messages with regex to strip any alphanumeric strings >= 20 chars (API key fragments per T-11.5-04)
- Fallback response includes `provider: 'heuristic'` and `fallback: true` so frontend can display which provider was used

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

To enable AI analysis, set `GOOGLE_GENERATIVE_AI_API_KEY` in a `.env` file in the `server/` directory. The heuristic provider works without any configuration.

## Next Phase Readiness
- AI provider backend complete, ready for frontend provider toggle (11-5-02)
- Zod schemas define the contract between AI output and UI rendering
- Fallback pattern ensures UI always receives valid data

---
*Phase: 11-5-ai-analysis-provider*
*Completed: 2026-07-02*
