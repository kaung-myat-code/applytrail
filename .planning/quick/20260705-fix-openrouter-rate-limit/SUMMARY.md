---
task: Fix OpenRouter rate limit error handling
status: complete
created: 2026-07-05
completed: 2026-07-05
duration: 10 minutes
---

# Summary: Fix OpenRouter Rate Limit Error Handling

## Root Cause Identified

The error is a **429 Rate Limit** from OpenRouter:
```
"meta-llama/llama-3.3-70b-instruct:free is temporarily rate-limited upstream"
```

All free models on OpenRouter share rate limits across the platform. The Vercel AI SDK's default retry logic doesn't properly respect the `retry-after` headers (23-29 seconds), causing all retries to fail.

## What Was Done

### 1. Improved Error Detection

Added `isRateLimitError()` function to detect rate limit errors from:
- HTTP 429 status codes
- Error response body with code 429
- Error messages containing "429" or "rate limit"

### 2. Enhanced Error Messages

Updated `handleAIError()` to provide user-friendly rate limit messages with:
- Specific retry-after timing when available
- Clear actionable options (wait, switch provider, use paid model)
- Better guidance for users

### 3. Added Retry Configuration

Added `maxRetries: 3` to both `generateObject()` calls for:
- `analyzeResume()` function
- `generateSuggestions()` function

### 4. Updated Documentation

Enhanced `AI_PROVIDERS.md` with:
- Rate limiting warning section
- Best practices for avoiding rate limits
- Clear recommendations (start with heuristic, use Gemini for production)

## Files Modified

- `server/lib/analysis/providers/ai.js` - Added rate limit detection and improved error handling
- `AI_PROVIDERS.md` - Added rate limiting documentation and best practices

## Verification

- Error messages now clearly explain the rate limit issue
- Users get actionable guidance (wait, switch provider, use paid model)
- Documentation warns about free tier limitations
- System still falls back to heuristic when AI fails

## Key Findings

1. **All free OpenRouter models are rate-limited** - Not just the default model
2. **Rate limits are platform-wide** - Shared across all free tier users
3. **Gemini has better free tier** - 1M tokens/day vs OpenRouter's aggressive limits
4. **Heuristic is always available** - No rate limits, works offline

## Recommendations for Users

1. **Start with heuristic** - Use `ANALYSIS_PROVIDER=heuristic` (default)
2. **Use Gemini for AI** - Better free tier limits
3. **OpenRouter for testing** - Accept rate limits as temporary
4. **Add paid models** - Use `ANALYSIS_MODEL` env var for production
