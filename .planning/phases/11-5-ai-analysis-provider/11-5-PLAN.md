---
phase: 11-5-ai-analysis-provider
type: plan
inserted: true
depends_on:
  - phase: 11-suggestions
    provides: Suggestion workflow, heuristic provider interface
  - phase: 10-analysis
    provides: Provider registry pattern, MatchReport schema, POST /api/analyze endpoint
requirements: [AI-ANALYSIS-01, AI-ANALYSIS-02, AI-ANALYSIS-03, AI-ANALYSIS-04]
---

# Phase 11.5 Plan: AI Analysis Provider (INSERTED)

**Inserted between Phase 11 (Section-by-Section Suggestions) and Phase 12 (Tailored Resume Generation).**

## Objective

Add an AI-powered analysis provider alongside the existing heuristic provider, with an API key configuration flow and a provider selector in the Analysis page UI, so users can choose between fast keyword-matching and deeper AI-driven analysis.

## Problem

The current heuristic provider does keyword matching only — it understands which terms co-occur but cannot:
- Evaluate whether experience bullets genuinely demonstrate the required skill
- Detect implied competencies (e.g., "React" implies frontend experience)
- Judge the quality or relevance of resume content
- Provide nuanced section-level recommendations

Users who have an LLM API key should get a richer analysis without changing the UI or data model.

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Use the existing provider registry** | No architectural changes needed — new provider just registers in `engine.js` |
| **API key from env var (ANALYSIS_API_KEY)** | Single-user tool; env vars are the simplest secure mechanism. No UI input for keys |
| **Provider selector dropdown on Analysis page** | Toggle between heuristic and AI providers without page reload |
| **Default to heuristic** | Works out of the box with no configuration; AI provider is opt-in |
| **Claude API via Anthropic SDK** | Default AI backend — aligns with the project's Claude Code ecosystem. Provider interface makes it swappable |
| **AI generates MatchReport-compatible JSON** | No UI changes needed; same ScoreDisplay, KeywordGroups, SectionFindings components render AI output |
| **Fallback to heuristic on AI failure** | If API call fails (key missing, rate limit, timeout), auto-fallback with a banner message |

## Tasks

### Task 1: Create AI analysis provider module

**Files:** `server/lib/analysis/providers/ai.js`

Create a new provider that:
- Exports `analyzeResume(resume, jobPosting)` matching the heuristic interface
- Reads `ANALYSIS_API_KEY` and `ANALYSIS_MODEL` (default: `claude-sonnet-4-6`) from env
- Formats the resume and job posting into a structured prompt asking for a compatibility assessment
- Parses the LLM response into a `MatchReport`-shaped JSON object matching the heuristic output schema
- On API failure, logs the error and throws so the API layer can catch and fallback

Prompt design for the AI:
```
You are a resume reviewer. Compare this resume against the job posting below and return a JSON object with:
- score (0-100): overall compatibility
- summary: one-line summary
- strengths: array of strings
- gaps: array of strings
- keywords: { matched: string[], missing: string[], bonus: string[] }
- sections: { summary: { matchRate, matchedItems, missingItems, summary }, skills: {...}, experience: {...}, projects: {...}, education: {...} }

Be strict — only count a keyword as "matched" if the resume genuinely demonstrates competence in that area, not just mentions it. Provide detailed section summaries that cite specific resume content.
```

Install the Anthropic SDK:
```bash
npm install @anthropic-ai/sdk
```

### Task 2: Register AI provider in the engine

**Files:** `server/lib/analysis/engine.js`

Add `ai` to the providers registry:
```javascript
const providers = {
  heuristic: require('./providers/heuristic'),
  ai: require('./providers/ai'),
}
```

### Task 3: Update API to accept provider selection with fallback

**Files:** `server/index.js`

Update `POST /api/analyze` to:
1. Accept optional `provider` field (default: `'heuristic'`, valid: `'heuristic'`, `'ai'`)
2. If `provider === 'ai'` and `ANALYSIS_API_KEY` is not set, return a 400 error with a clear message: "AI analysis requires ANALYSIS_API_KEY environment variable. Set it in .env or use the heuristic provider."
3. Map provider names to `getProvider(name)` calls
4. Wrap AI provider call in try/catch — if it fails, attempt heuristic fallback and include a `fallback: true` flag in the response

```javascript
const providerName = req.body.provider || 'heuristic'
try {
  const provider = getProvider(providerName)
  const { analyzeResume, generateSuggestions } = provider
  // ... analyze
} catch (err) {
  if (providerName === 'ai') {
    // Fallback to heuristic
    const heuristic = getProvider('heuristic')
    const report = heuristic.analyzeResume(resume, posting)
    const suggestions = heuristic.generateSuggestions(resume, report)
    return res.json({ ok: true, report, suggestions, fallback: true, fallback_reason: err.message })
  }
  throw err
}
```

### Task 4: Add provider selector to Analysis page

**Files:** `client/src/pages/Analysis.jsx`, `client/src/pages/Analysis.module.css`

Add a provider selector dropdown below the job posting selector:

```jsx
const [provider, setProvider] = useState('heuristic')
const [usingFallback, setUsingFallback] = useState(false)
```

Provider field:
```jsx
<div className={styles.field}>
  <label className={styles.label} htmlFor="provider">Analysis Provider</label>
  <select
    className={styles.select}
    id="provider"
    value={provider}
    onChange={e => setProvider(e.target.value)}
  >
    <option value="heuristic">Heuristic (Keyword Match) — no setup needed</option>
    <option value="ai">AI Analysis (LLM) — requires API key</option>
  </select>
</div>
```

Update fetch to pass `provider`:
```javascript
body: JSON.stringify({
  job_posting_id: selectedPostingId,
  resume_version_id: selectedResumeId || undefined,
  provider,
}),
```

On response, check for `data.fallback` and display a fallback banner:
```jsx
{usingFallback && (
  <div className={styles.fallbackBanner}>
    AI analysis unavailable — using heuristic provider instead.
  </div>
)}
```

Add CSS for fallback banner (yellow warning bar) in Analysis.module.css.

## Threat Model

| Threat ID | Category | Component | Severity | Mitigation |
|-----------|----------|-----------|----------|------------|
| T-11.5-01 | Information Disclosure | AI provider sends resume + posting to external API | medium | Single-user tool; user opts in by setting ANALYSIS_API_KEY; document in UI |
| T-11.5-02 | Tampering | Malformed AI response parsed into MatchReport | low | JSON.parse in try/catch; validate required fields; default values on missing fields |
| T-11.5-03 | Denial of Service | AI API timeout blocks analysis | low | 30s fetch timeout; fallback to heuristic provider on failure |
| T-11.5-04 | Credential Leak | API key exposed in error messages | low | Sanitize error messages before sending to client; never log full API key |

## Success Criteria

- [ ] AI provider produces a valid MatchReport for any resume/posting pair
- [ ] Provider selector appears on the Analysis page and defaults to heuristic
- [ ] Switching to AI and running analysis returns AI-powered results
- [ ] Without ANALYSIS_API_KEY, AI provider shows clear error message
- [ ] AI provider failure auto-fallbacks to heuristic with a banner notification
- [ ] Heuristic provider continues to work identically (no regression)
- [ ] All existing features (suggestions, review page) work with AI-generated reports
- [ ] Frontend builds cleanly
