---
task: Fix OpenRouter rate limit error handling
status: pending
created: 2026-07-05
---

# Task: Fix OpenRouter Rate Limit Error Handling

## Objective

Fix the OpenRouter API error caused by rate limiting on the free model. The current implementation doesn't properly handle 429 rate limit responses with retry-after headers.

## Root Cause

The error is a **429 Rate Limit** from OpenRouter:
```
"meta-llama/llama-3.3-70b-instruct:free is temporarily rate-limited upstream. Please retry shortly, or add your own key to accumulate your rate limits"
```

The Vercel AI SDK's default retry logic doesn't respect the `retry-after` headers (23-29 seconds), causing all 3 retries to fail.

## Solution

### 1. Add Retry Configuration with Exponential Backoff

Update `server/lib/analysis/providers/ai.js` to:
- Add `maxRetries: 3` configuration
- Implement exponential backoff starting at 30 seconds
- Add better error messaging for rate limits

### 2. Improve Error Handling

Update the `handleAIError` function to:
- Detect rate limit errors (429 status)
- Show user-friendly message about rate limiting
- Suggest waiting or switching providers

### 3. Add Model Fallback Option

Consider adding a fallback to a non-free model if available, or improve the heuristic fallback messaging.

## Files to Modify

- `server/lib/analysis/providers/ai.js` - Add retry config and improve error handling

## Verification

1. Test OpenRouter with retry configuration
2. Verify error messages are user-friendly
3. Confirm fallback to heuristic works when rate limited
