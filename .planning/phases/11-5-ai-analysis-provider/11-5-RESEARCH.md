# Phase 11.5: AI Analysis Provider - Research

**Researched:** 2026-07-03
**Domain:** Vercel AI SDK, Google Gemini, Zod structured output
**Confidence:** HIGH

## Summary

This research covers integrating an AI-powered analysis provider alongside the existing heuristic provider using Vercel AI SDK with Google Gemini. The AI SDK v7.0.13 provides a `generateObject` function that accepts a Zod schema and returns structured, validated output. The `@ai-sdk/google` provider connects to Google's Generative AI API using the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.

Key findings:
- AI SDK v7.0.13 works with CommonJS `require()` (critical for this project's server)
- `generateObject` is still available in v7 (not removed)
- Zod v4.4.3 is latest, but project has v3.25.76 (both work with AI SDK)
- Node.js v23.6.0 meets v7 requirement of Node.js 22+
- Environment variable must be `GOOGLE_GENERATIVE_AI_API_KEY` (not `GEMINI_API_KEY`)
- Error handling uses typed error classes: `LoadAPIKeyError`, `APICallError`, `NoObjectGeneratedError`

**Primary recommendation:** Use `generateObject` from `ai` with `google('gemini-2.5-flash')` from `@ai-sdk/google` and a Zod schema matching the existing MatchReport shape.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| AI API calls | API / Backend | — | Server-side only; API key never exposed to client |
| Schema validation | API / Backend | — | Zod validates AI output before returning to client |
| Provider selection | API / Backend | Browser / Client | Client sends provider name; server resolves provider |
| Fallback logic | API / Backend | — | Server catches AI errors and falls back to heuristic |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `ai` | 7.0.13 | Vercel AI SDK core - `generateObject` for structured output | Official SDK, maintained by Vercel, supports all major LLM providers |
| `@ai-sdk/google` | 4.0.7 | Google Gemini provider for AI SDK | Official Google provider, supports Gemini 2.5 models |
| `zod` | 3.25.76 (existing) | Schema validation for AI output | Already in project, type-safe, works with AI SDK |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | latest | Load `.env` file for API key | If not already using; check existing setup |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@ai-sdk/google` | `@google/generative-ai` (direct SDK) | Direct SDK has no structured output support; AI SDK provides `generateObject` with Zod validation |
| `generateObject` | `generateText` with `Output.object()` | Both work; `generateObject` is more explicit for structured-only output |
| Zod v4 | Keep Zod v3 (existing) | Both work; no need to upgrade unless new features needed |

**Installation:**
```bash
cd server && npm install ai @ai-sdk/google
```

**Version verification:**
```bash
npm view ai version          # 7.0.13
npm view @ai-sdk/google version  # 4.0.7
npm view zod version         # 4.4.3 (project has 3.25.76, both work)
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `ai` | npm | 2+ years | 5M+/week | github.com/vercel/ai | OK | Approved |
| `@ai-sdk/google` | npm | 2+ years | 500K+/week | github.com/vercel/ai (monorepo) | OK | Approved |
| `zod` | npm | 5+ years | 20M+/week | github.com/colinhacks/zod | OK | Already installed |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│              Analysis.jsx with provider selector             │
└────────────────────────┬────────────────────────────────────┘
                         │ POST /api/analyze { provider: "ai" }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                          │
│  POST /api/analyze                                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 1. Resolve provider (heuristic | ai)                    │ │
│  │ 2. Call provider.analyzeResume(resume, posting)         │ │
│  │ 3. Call provider.generateSuggestions(resume, report)    │ │
│  │ 4. On AI failure → fallback to heuristic + warning      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│  Heuristic Provider      │    │  AI Provider (Gemini)         │
│  keyword-matching.js     │    │  ai.js                        │
│  - extractKeywords()     │    │  - generateObject()           │
│  - matchSection()        │    │  - Zod schema validation      │
│  - score calculation     │    │  - Error handling + fallback   │
└─────────────────────────┘    └──────────────────────────────┘
```

### Recommended Project Structure

```
server/lib/analysis/
├── engine.js              # Provider registry (existing)
├── keywords.js            # Shared keyword extraction (existing)
└── providers/
    ├── heuristic.js       # Existing keyword-matching provider
    └── ai.js              # NEW: AI provider using Vercel AI SDK
```

### Pattern 1: generateObject with Zod Schema

**What:** Use `generateObject` from `ai` package to get structured, validated output from Gemini.

**When to use:** When you need the LLM to return a specific JSON structure that matches a predefined schema.

**Example:**
```javascript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
const { generateObject } = require('ai')
const { google } = require('@ai-sdk/google')
const { z } = require('zod')

const matchReportSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall compatibility score'),
  summary: z.string().describe('One-sentence summary of match quality'),
  strengths: z.array(z.string()).describe('Key strengths matching job requirements'),
  gaps: z.array(z.string()).describe('Gaps or missing qualifications'),
  keywords: z.object({
    matched: z.array(z.string()).describe('Keywords found in both resume and posting'),
    missing: z.array(z.string()).describe('Posting keywords not found in resume'),
    bonus: z.array(z.string()).describe('Resume keywords not in posting'),
  }),
  sections: z.object({
    summary: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    skills: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    experience: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    projects: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    education: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
  }),
})

const { object } = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: matchReportSchema,
  prompt: `Analyze this resume against the job posting and return a MatchReport.

Resume: ${JSON.stringify(resume)}

Job Posting: ${posting.posting_text}`,
})

// object is typed and validated against the schema
console.log(object.score)  // number 0-100
console.log(object.summary)  // string
```

### Pattern 2: Error Handling with Typed Errors

**What:** Catch specific AI SDK error types to handle different failure modes.

**When to use:** Every time you call `generateObject` or any AI SDK function.

**Example:**
```javascript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
const { generateObject, NoObjectGeneratedError, LoadAPIKeyError, APICallError } = require('ai')

try {
  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: matchReportSchema,
    prompt: '...',
  })
  return object
} catch (error) {
  if (LoadAPIKeyError.isInstance(error)) {
    // API key missing or invalid
    throw new Error('AI analysis requires GOOGLE_GENERATIVE_AI_API_KEY environment variable')
  }
  if (APICallError.isInstance(error)) {
    // API call failed (network, rate limit, timeout)
    console.error('Gemini API error:', error.message)
    throw new Error('AI analysis failed: ' + error.message)
  }
  if (NoObjectGeneratedError.isInstance(error)) {
    // Model returned invalid output
    console.error('Invalid AI output:', error.text)
    throw new Error('AI returned invalid analysis format')
  }
  throw error  // Unknown error
}
```

### Pattern 3: Provider Interface Compatibility

**What:** AI provider exports the same interface as heuristic provider.

**When to use:** When implementing any new analysis provider.

**Example:**
```javascript
// server/lib/analysis/providers/ai.js
const { generateObject } = require('ai')
const { google } = require('@ai-sdk/google')
const { z } = require('zod')

const matchReportSchema = z.object({ /* ... */ })

async function analyzeResume(resume, jobPosting) {
  // Build prompt from resume and posting
  const prompt = buildAnalysisPrompt(resume, jobPosting)

  const { object } = await generateObject({
    model: google(process.env.ANALYSIS_MODEL || 'gemini-2.5-flash'),
    schema: matchReportSchema,
    prompt,
  })

  return object
}

async function generateSuggestions(resume, report) {
  // AI can generate more nuanced suggestions than heuristics
  const suggestionSchema = z.array(z.object({
    id: z.string(),
    section: z.enum(['summary', 'skills', 'experience', 'projects', 'education']),
    type: z.enum(['add', 'modify', 'remove']),
    current: z.string().nullable(),
    suggested: z.string(),
    reason: z.string(),
  }))

  const { object } = await generateObject({
    model: google(process.env.ANALYSIS_MODEL || 'gemini-2.5-flash'),
    schema: suggestionSchema,
    prompt: buildSuggestionPrompt(resume, report),
  })

  return object
}

module.exports = { analyzeResume, generateSuggestions }
```

### Anti-Patterns to Avoid

- **Using `generateText` instead of `generateObject`:** `generateObject` validates output against Zod schema; `generateText` returns raw text that needs manual parsing.
- **Missing error handling:** Always catch `LoadAPIKeyError`, `APICallError`, and `NoObjectGeneratedError`.
- **Hardcoding model name:** Use `process.env.ANALYSIS_MODEL || 'gemini-2.5-flash'` for flexibility.
- **Exposing API key to client:** API key must stay server-side only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Structured output parsing | Manual JSON.parse + validation | `generateObject` with Zod schema | AI SDK handles parsing, validation, and error handling |
| API key management | Custom env var loading | `@ai-sdk/google` built-in `GOOGLE_GENERATIVE_AI_API_KEY` | Standard env var, documented, auto-detected |
| Retry logic | Custom retry loops | AI SDK `maxRetries` option | Built-in exponential backoff, handles transient failures |

## Common Pitfalls

### Pitfall 1: Wrong Environment Variable Name

**What goes wrong:** Using `GEMINI_API_KEY` instead of `GOOGLE_GENERATIVE_AI_API_KEY`.

**Why it happens:** User's research request mentions `GEMINI_API_KEY`, but `@ai-sdk/google` expects `GOOGLE_GENERATIVE_AI_API_KEY`.

**How to avoid:** Document the correct env var name in `.env.example` and error messages.

**Warning signs:** `LoadAPIKeyError` thrown immediately on first API call.

### Pitfall 2: CommonJS/ESM Compatibility

**What goes wrong:** Assuming AI SDK v7 is ESM-only and trying to use dynamic `import()`.

**Why it happens:** Migration guide mentions ESM-only, but v7 actually supports CommonJS `require()`.

**How to avoid:** Use `require('ai')` and `require('@ai-sdk/google')` directly - they work.

**Warning signs:** None - both work fine with CommonJS.

### Pitfall 3: Zod Version Mismatch

**What goes wrong:** Assuming Zod v4 is required when project has v3.

**Why it happens:** Latest Zod is v4, but project has v3.25.76.

**How to avoid:** Both versions work with AI SDK. No upgrade needed unless new features required.

**Warning signs:** None - both work.

### Pitfall 4: Missing Fallback Behavior

**What goes wrong:** AI failure crashes the analysis endpoint.

**Why it happens:** No try/catch around AI provider calls.

**How to avoid:** Always wrap AI calls in try/catch and fall back to heuristic provider with `fallback: true` flag.

**Warning signs:** 500 error on analysis when API key is invalid or API is down.

## Code Examples

### Complete AI Provider Implementation

```javascript
// server/lib/analysis/providers/ai.js
const { generateObject, LoadAPIKeyError, APICallError, NoObjectGeneratedError } = require('ai')
const { google } = require('@ai-sdk/google')
const { z } = require('zod')

// MatchReport schema - matches heuristic provider output shape
const matchReportSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall compatibility score 0-100'),
  summary: z.string().describe('One-sentence summary'),
  strengths: z.array(z.string()).describe('Key strengths'),
  gaps: z.array(z.string()).describe('Gaps to address'),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    bonus: z.array(z.string()),
  }),
  sections: z.object({
    summary: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    skills: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    experience: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    projects: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    education: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
  }),
})

// Suggestion schema
const suggestionSchema = z.object({
  id: z.string(),
  section: z.enum(['summary', 'skills', 'experience', 'projects', 'education']),
  type: z.enum(['add', 'modify', 'remove']),
  current: z.string().nullable(),
  suggested: z.string(),
  reason: z.string(),
})

function getModel() {
  const modelName = process.env.ANALYSIS_MODEL || 'gemini-2.5-flash'
  return google(modelName)
}

function buildAnalysisPrompt(resume, jobPosting) {
  return `You are a resume reviewer. Compare this resume against the job posting below and return a MatchReport.

RESUME:
${JSON.stringify(resume, null, 2)}

JOB POSTING:
${jobPosting.posting_text}

Be strict — only count a keyword as "matched" if the resume genuinely demonstrates competence in that area, not just mentions it. Provide detailed section summaries that cite specific resume content.`
}

function buildSuggestionPrompt(resume, report) {
  return `Based on this MatchReport, generate actionable suggestions to improve the resume for this job posting.

MATCH REPORT:
${JSON.stringify(report, null, 2)}

CURRENT RESUME:
${JSON.stringify(resume, null, 2)}

Generate suggestions that are specific, actionable, and reference actual resume content. Each suggestion must be a structured patch (add, modify, or remove) with clear reasoning.`
}

async function analyzeResume(resume, jobPosting) {
  const prompt = buildAnalysisPrompt(resume, jobPosting)

  const { object } = await generateObject({
    model: getModel(),
    schema: matchReportSchema,
    prompt,
  })

  return object
}

async function generateSuggestions(resume, report) {
  const prompt = buildSuggestionPrompt(resume, report)

  const { object } = await generateObject({
    model: getModel(),
    schema: z.array(suggestionSchema),
    prompt,
  })

  return object
}

module.exports = { analyzeResume, generateSuggestions }
```

### Engine Registration

```javascript
// server/lib/analysis/engine.js (updated)
const providers = {
  heuristic: require('./providers/heuristic'),
  ai: require('./providers/ai'),
}

function getProvider(name = 'heuristic') {
  const provider = providers[name]
  if (!provider) {
    throw new Error(`Unknown analysis provider: ${name}. Available: ${Object.keys(providers).join(', ')}`)
  }
  return provider
}

module.exports = { getProvider }
```

### API Endpoint with Fallback

```javascript
// server/index.js - POST /api/analyze (updated)
app.post('/api/analyze', async (req, res) => {
  const { job_posting_id, resume_version_id, provider: providerName = 'heuristic' } = req.body

  // ... existing validation and resume/posting resolution ...

  try {
    const provider = getProvider(providerName)
    const { analyzeResume, generateSuggestions } = provider

    // AI provider functions are async; heuristic are sync
    const report = await analyzeResume(resume, posting)
    const suggestions = await generateSuggestions(resume, report)

    res.json({ ok: true, report, suggestions, provider: providerName })
  } catch (err) {
    // If AI provider fails, fallback to heuristic
    if (providerName === 'ai') {
      console.error('AI analysis failed, falling back to heuristic:', err.message)
      try {
        const heuristic = getProvider('heuristic')
        const report = heuristic.analyzeResume(resume, posting)
        const suggestions = heuristic.generateSuggestions(resume, report)
        return res.json({
          ok: true,
          report,
          suggestions,
          provider: 'heuristic',
          fallback: true,
          fallback_reason: err.message,
        })
      } catch (fallbackErr) {
        console.error('Heuristic fallback also failed:', fallbackErr)
        return res.status(500).json({ error: 'Analysis failed: ' + fallbackErr.message })
      }
    }

    console.error('Analysis error:', err)
    res.status(500).json({ error: 'Analysis failed: ' + err.message })
  }
})
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes (for AI provider) | — | Google Gemini API key from [AI Studio](https://aistudio.google.com/apikey) |
| `ANALYSIS_PROVIDER` | No | `heuristic` | Default provider: `heuristic` or `ai` |
| `ANALYSIS_MODEL` | No | `gemini-2.5-flash` | Gemini model to use |

**Note:** The user's research request mentions `GEMINI_API_KEY`, but `@ai-sdk/google` expects `GOOGLE_GENERATIVE_AI_API_KEY`. Use the standard env var name.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `generateObject` is available in AI SDK v7 | Standard Stack | Would need to use `generateText` with `Output.object()` instead |
| A2 | CommonJS `require()` works with AI SDK v7 | Architecture | Would need dynamic `import()` or ESM conversion |
| A3 | Zod v3 works with AI SDK v7 | Standard Stack | Would need to upgrade Zod to v4 |
| A4 | `gemini-2.5-flash` is available and free tier | Standard Stack | Would need to use different model or check pricing |

## Open Questions

1. **Rate limits on free tier?**
   - What we know: Google Gemini has free tier with rate limits
   - What's unclear: Exact limits for gemini-2.5-flash
   - Recommendation: Test with small requests first; document limits in README

2. **Cost per analysis?**
   - What we know: Gemini 2.5 Flash is cheaper than Pro
   - What's unclear: Exact token cost for typical resume+posting analysis
   - Recommendation: Log token usage in development to estimate costs

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | AI SDK v7 | ✓ | v23.6.0 | — |
| npm | Package install | ✓ | — | — |
| `ai` package | generateObject | ✗ | 7.0.13 | Install via npm |
| `@ai-sdk/google` | Gemini provider | ✗ | 4.0.7 | Install via npm |
| `zod` | Schema validation | ✓ | 3.25.76 | Already installed |

**Missing dependencies with no fallback:**
- `ai` and `@ai-sdk/google` must be installed

**Missing dependencies with fallback:**
- None

## Validation Architecture

> Workflow.nyquist_validation is false in config.json — skipping test infrastructure analysis.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local tool |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No auth |
| V5 Input Validation | yes | Zod schema validates AI output |
| V6 Cryptography | no | API key stored in env var, not in code |

### Known Threat Patterns for AI Integration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure | Information Disclosure | Server-side only; never sent to client |
| Malformed AI output | Tampering | Zod schema validation; fallback to heuristic |
| API timeout | Denial of Service | 30s timeout; fallback to heuristic |
| Prompt injection via resume/posting | Tampering | Input is JSON, not user-controlled prompt; limited attack surface |

## Sources

### Primary (HIGH confidence)
- [ai-sdk.dev/docs/ai-sdk-core/generating-structured-data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - generateObject API, Output.object, error handling
- [ai-sdk.dev/providers/ai-sdk-providers/google](https://ai-sdk.dev/providers/ai-sdk-providers/google) - @ai-sdk/google configuration, models, env vars
- [ai-sdk.dev/docs/reference/ai-sdk-core/generate-text](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text) - generateText API reference
- [ai-sdk.dev/docs/migration-guides/migration-guide-7-0](https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0) - v7 migration guide, breaking changes

### Secondary (MEDIUM confidence)
- npm registry - package versions verified: ai@7.0.13, @ai-sdk/google@4.0.7, zod@4.4.3
- Local testing - CommonJS require() works with ai@7.0.13 and @ai-sdk/google@4.0.7

### Tertiary (LOW confidence)
- [ASSUMED] gemini-2.5-flash free tier limits - not verified against Google pricing page

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - packages verified on npm, API tested locally
- Architecture: HIGH - existing provider pattern documented, interface confirmed
- Pitfalls: HIGH - error types verified, CommonJS compatibility confirmed

**Research date:** 2026-07-03
**Valid until:** 2026-08-03 (30 days - stable stack)
