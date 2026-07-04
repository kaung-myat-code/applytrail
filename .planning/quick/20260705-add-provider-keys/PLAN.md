---
task: Add Groq/OpenRouter provider keys for fallback options
status: pending
created: 2026-07-05
---

# Task: Add Groq/OpenRouter Provider Keys for Fallback Options

## Objective

Update the .env.example file and add documentation to explain how to configure Groq and OpenRouter API keys as fallback options for the AI analysis provider.

## Current State

- AI provider system already implemented in `server/lib/analysis/providers/ai.js`
- Supports Gemini, OpenRouter, and Groq via Vercel AI SDK
- Fallback chain: gemini → openrouter → groq → heuristic
- .env.example currently only shows `ANALYSIS_PROVIDER=heuristic`

## Changes Required

### 1. Update .env.example

Add the following environment variables to `server/.env.example`:

```bash
# AI Analysis Provider Configuration
# Options: heuristic, gemini, openrouter, groq
ANALYSIS_PROVIDER=heuristic

# Optional: Override the default model for the selected provider
# ANALYSIS_MODEL=

# Gemini API Key (for provider=gemini)
# Get key at: https://aistudio.google.com/apikey
# GOOGLE_GENERATIVE_AI_API_KEY=

# OpenRouter API Key (for provider=openrouter)
# Get key at: https://openrouter.ai/keys
# OPENROUTER_API_KEY=

# Groq API Key (for provider=groq)
# Get key at: https://console.groq.com/keys
# GROQ_API_KEY=
```

### 2. Add Documentation Section

Add a new section to `README.md` or create a dedicated `AI_PROVIDERS.md` file explaining:

- How to configure each provider
- API key acquisition links
- Default models for each provider
- Fallback chain behavior
- Cost considerations

### 3. Update Server Error Handling (Optional)

Ensure the server provides clear error messages when API keys are missing, guiding users to either set the key or switch to heuristic provider.

## Verification

1. Check that .env.example contains all required API key variables
2. Verify documentation explains provider configuration clearly
3. Test that server starts without errors when using heuristic provider
4. Confirm error messages guide users when API keys are missing

## Files to Modify

- `server/.env.example` - Add API key variables
- `README.md` or `AI_PROVIDERS.md` - Add provider documentation
