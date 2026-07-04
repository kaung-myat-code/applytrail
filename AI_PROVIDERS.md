# AI Provider Configuration

ApplyTrail supports multiple AI providers for resume analysis with automatic fallback. This document explains how to configure each provider.

## Provider Options

| Provider | Environment Variable | API Key Link | Default Model |
|----------|---------------------|--------------|---------------|
| Heuristic | `ANALYSIS_PROVIDER=heuristic` | None required | N/A (keyword matching) |
| Gemini | `ANALYSIS_PROVIDER=gemini` | [Google AI Studio](https://aistudio.google.com/apikey) | `gemini-2.5-flash` |
| OpenRouter | `ANALYSIS_PROVIDER=openrouter` | [OpenRouter Keys](https://openrouter.ai/keys) | `meta-llama/llama-3.3-70b-instruct:free` |
| Groq | `ANALYSIS_PROVIDER=groq` | [Groq Console](https://console.groq.com/keys) | `llama-3.3-70b-versatile` |

## Fallback Chain

When using an AI provider, the system automatically falls back in this order:

1. **Configured Provider** (e.g., `gemini`)
2. **OpenRouter** (if configured)
3. **Groq** (if configured)
4. **Heuristic** (always available)

This ensures analysis works even if your primary provider is unavailable.

## Configuration

### 1. Set the Provider

In your `server/.env` file:

```bash
# Options: heuristic, gemini, openrouter, groq
ANALYSIS_PROVIDER=gemini
```

### 2. Add API Keys

Depending on your chosen provider, add the corresponding API key:

```bash
# For Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# For OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key_here

# For Groq
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Optional: Override Default Model

To use a different model than the default:

```bash
ANALYSIS_MODEL=your_preferred_model_id
```

## API Key Acquisition

### Google Gemini (Free Tier Available)

1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIza...`)

**Free tier:** 15 RPM, 1M tokens/day

### OpenRouter (Pay-per-use)

1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Create an account or sign in
3. Click "Create Key"
4. Copy the key (starts with `sk-or-...`)

**Benefit:** Access to multiple models including free options like `llama-3.3-70b-instruct:free`

### Groq (Free Tier Available)

1. Visit [Groq Console](https://console.groq.com/keys)
2. Create an account or sign in
3. Click "Create API Key"
4. Copy the key (starts with `gsk_...`)

**Free tier:** 30 RPM, generous token limits

## Cost Considerations

| Provider | Free Tier | Paid Options |
|----------|-----------|--------------|
| Heuristic | ∞ (local) | N/A |
| Gemini | 1M tokens/day | Pay-per-use |
| OpenRouter | Free models available | Pay-per-use |
| Groq | 30 RPM | Pay-per-use |

**Recommendation:** Start with the heuristic provider. Add AI providers only if you need more sophisticated analysis.

### Rate Limiting Important Notes

**OpenRouter Free Models:** All free models on OpenRouter share rate limits across the platform. You may encounter 429 "rate-limited upstream" errors, especially during peak usage. The system will automatically fall back to the heuristic provider if AI fails.

**Best Practices:**
1. **Start with heuristic** - No rate limits, works offline
2. **Use Gemini for production** - Better free tier limits (1M tokens/day)
3. **Add retry logic** - The system retries 3 times with exponential backoff
4. **Monitor usage** - Check OpenRouter dashboard for your rate limit status

## Troubleshooting

### "AI analysis requires API_KEY"

The selected provider is missing its API key. Either:

1. Add the API key to `server/.env`
2. Switch to heuristic provider: `ANALYSIS_PROVIDER=heuristic`

### "AI provider unavailable"

The AI SDK failed to load. Check:

1. Node.js version (18+ required)
2. Network connectivity
3. API key validity

### "AI returned invalid format"

The AI model returned unexpected data. The system will automatically fall back to the heuristic provider.

## Examples

### Use Gemini for Analysis

```bash
ANALYSIS_PROVIDER=gemini
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyExample...
```

### Use Groq as Fallback

```bash
ANALYSIS_PROVIDER=groq
GROQ_API_KEY=gsk_Example...
```

### Use Heuristic Only (Default)

```bash
ANALYSIS_PROVIDER=heuristic
# No API keys needed
```
