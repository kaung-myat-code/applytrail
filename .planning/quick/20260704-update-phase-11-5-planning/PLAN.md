# Quick Task: Update Phase 11.5 Planning for Multi-Provider Support

**Created:** 2026-07-04
**Type:** Planning update (no code changes)
**Status:** in-progress

## Objective

Update Phase 11.5 planning documents to support multiple AI providers (gemini, openrouter, groq) with automatic fallback, replacing the single-provider Gemini-only architecture.

## Context

Gemini free tier can hit rate limits. Phase 11.5 planning should not depend on Gemini only. The planning docs currently describe a single AI provider (Gemini) and need to be expanded to a multi-provider architecture with fallback chain.

## Changes Required

### 1. 11-5-RESEARCH.md
- Update environment variables: add OPENROUTER_API_KEY, GROQ_API_KEY
- Add provider comparison table (gemini, openrouter, groq)
- Update architecture diagram to show provider registry with fallback chain
- Add research on OpenRouter and Groq AI SDK providers

### 2. 11-5-01-PLAN.md (Backend Plan)
- Update must_haves to reflect multi-provider support
- Update Task 1 (install packages): add @ai-sdk/openai-compatible for openrouter/groq
- Update Task 2 (AI provider module): refactor to provider registry pattern
- Update Task 3 (engine registration): add fallback chain logic
- Update threat model for multi-provider
- Update verification and success criteria

### 3. 11-5-02-PLAN.md (Frontend Plan)
- Update provider dropdown to show all providers (heuristic, gemini, openrouter, groq)
- Update fallback banner for multi-provider context

### 4. ROADMAP.md
- Update Phase 11.5 description to mention multi-provider support

### 5. STATE.md
- Update accumulated context with multi-provider decisions

### 6. PROJECT.md
- Update tech stack to mention multi-provider AI support

## Execution Steps

1. Read all current planning docs
2. Update 11-5-RESEARCH.md with multi-provider research
3. Update 11-5-01-PLAN.md with multi-provider backend plan
4. Update 11-5-02-PLAN.md with multi-provider frontend plan
5. Update ROADMAP.md Phase 11.5 description
6. Update STATE.md accumulated context
7. Update PROJECT.md tech stack
8. Verify all docs are consistent

## Constraints

- Keep heuristic as the default provider
- Do not implement Tailored Resume Generation in this phase
- Do not remove the heuristic provider
- AI must never directly edit, save, or overwrite resumes
- All AI providers must return schema-validated structured output
