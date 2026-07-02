# Research: Phase 10 - Match Scoring and Gap Analysis

**Researched:** 2026-07-02
**Domain:** Resume-job posting compatibility analysis with keyword matching and provider-agnostic engine
**Confidence:** HIGH

## Summary

Phase 10 adds a match scoring and gap analysis feature to ApplyTrail. Users select a resume from the library and a job posting, then receive a compatibility report showing an overall score, matched/missing/bonus keywords, and section-level findings. The core architectural challenge is designing a provider-agnostic analysis engine that supports heuristics now and AI/third-party providers later without UI changes.

The existing `server/lib/cover-letter.js` already contains keyword extraction and resume-matching logic (`extractKeywords`, `matchResumeToJob`) that can be extended and refactored into the analysis engine. The resume library (Phase 9) provides the data layer. No new npm packages are required -- the heuristic provider is pure JavaScript string matching and scoring logic.

**Primary recommendation:** Build the analysis engine as a plain JavaScript module with a single `analyzeResume(resume, jobPosting)` function that returns a structured `MatchReport` object. Start with a `heuristic` provider that extends the existing keyword extraction in `cover-letter.js`. The provider-agnostic interface is a simple function signature convention -- no frameworks, no dependency injection, no plugin system.

## Codebase Patterns to Follow

### Existing Keyword Extraction (server/lib/cover-letter.js)

The project already has a working keyword extraction system:

- `extractKeywords(postingText)` -- tokenizes job posting, filters stop words, returns deduplicated lowercase keywords
- `matchResumeToJob(resume, postingText)` -- matches keywords against skills (substring match), experience bullets, and project bullets
- `STOP_WORDS` set -- comprehensive stop word list (150+ words)

This logic should be **refactored and extended**, not duplicated. The analysis engine imports from the cover-letter module or the shared logic moves into a new shared module.

### Server-Side Module Pattern

All server logic lives in `server/lib/` as CommonJS modules:

```javascript
// server/lib/cover-letter.js
const STOP_WORDS = new Set([...])
function extractKeywords(postingText) { ... }
function matchResumeToJob(resume, postingText) { ... }
function generateCoverLetter(resume, jobPosting) { ... }
module.exports = { extractKeywords, matchResumeToJob, generateCoverLetter }
```

### API Endpoint Pattern

All API endpoints follow this structure in `server/index.js`:

```javascript
app.post('/api/generate-cover-letter', (req, res) => {
  const { job_posting_id } = req.body
  // 1. Validate input
  // 2. Read data from JSON files
  // 3. Call library function
  // 4. Return result
  res.json({ ok: true, cover_letter_paragraph: paragraph })
})
```

### Frontend Page Pattern

All pages follow this structure:

```javascript
function PageName() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/endpoint')
      .then(res => res.json())
      .then(data => { setData(data); setLoading(false) })
      .catch(() => { setError('Failed'); setLoading(false) })
  }, [])

  if (loading) return <Loading />
  if (error) return <Error />
  return <Content />
}
```

### Data Access Pattern

Resume data is accessed through the library:

```javascript
const libraryIndex = readLibraryIndex()
let resume
if (libraryIndex.selected_id) {
  resume = readResumeVersion(libraryIndex.selected_id)
}
if (!resume) {
  resume = readJSON('resume.json')  // fallback
}
```

Job postings are read from `job_postings.json`:

```javascript
const postings = readJSON('job_postings.json')
const posting = postings.find(p => p.id === job_posting_id)
```

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Keyword extraction | API / Backend | -- | Text processing belongs server-side; same module as cover letter |
| Score computation | API / Backend | -- | Numeric scoring from keyword matches |
| Match report generation | API / Backend | -- | Structured data assembly from analysis results |
| Provider dispatch | API / Backend | -- | Engine selects provider, returns uniform report |
| Report display UI | Browser / Client | -- | React renders structured report data |
| Provider selection | Browser / Client | API / Backend | UI may let user choose provider; API validates |

## Technical Approach

### Requirement ANALYSIS-01: Overall Compatibility Score

**What:** Display a 0-100 compatibility score with strengths, gaps, and a human-readable summary.

**Approach:**

The score is computed from three weighted components:
1. **Keyword coverage** (50% weight) -- percentage of job posting keywords found in the resume
2. **Section breadth** (30% weight) -- how many resume sections have relevant matches (Summary, Skills, Experience, Projects, Education)
3. **Depth of matches** (25% weight) -- how many unique resume items (skills, bullets) match, not just keyword count

```javascript
function computeScore(keywordMatches, sectionMatches, resumeItems) {
  const keywordScore = (keywordMatches.matched / keywordMatches.total) * 100
  const sectionScore = (sectionMatches.matched / sectionMatches.total) * 100
  const depthScore = Math.min(100, (resumeItems.matched / 5) * 100) // cap at 5 items

  return Math.round(
    keywordScore * 0.50 +
    sectionScore * 0.30 +
    depthScore * 0.25
  )
}
```

Strengths are sections/items with high match rates. Gaps are missing keywords or sections with no matches. The summary is a template sentence combining the score with top strengths and top gaps.

**Score display:** A visual bar or circular progress indicator with the numeric score. Color coding: green (70+), yellow (40-69), red (<40).

### Requirement ANALYSIS-02: Keyword Categorization

**What:** Matched, missing, and bonus keywords as categorized groups.

**Definitions:**
- **Matched keywords** -- keywords from the job posting that appear in the resume
- **Missing keywords** -- keywords from the job posting NOT found in the resume (gaps to fill)
- **Bonus keywords** -- keywords from the resume that are NOT in the job posting but are relevant skills (shows extra qualifications)

**Approach:**

```javascript
function categorizeKeywords(postingKeywords, resumeKeywords) {
  const matched = []
  const missing = []
  const bonus = []

  for (const kw of postingKeywords) {
    if (resumeKeywords.some(rk => rk.includes(kw) || kw.includes(rk))) {
      matched.push(kw)
    } else {
      missing.push(kw)
    }
  }

  for (const rk of resumeKeywords) {
    if (!postingKeywords.some(pk => pk.includes(rk) || rk.includes(pk))) {
      bonus.push(rk)
    }
  }

  return { matched, missing, bonus }
}
```

**Resume keyword sources:**
- `resume.skills` array (explicit skill list)
- `resume.summary` text (extracted via same tokenizer)
- Experience and project bullets (extracted via same tokenizer)

**Display:** Three collapsible groups with keyword chips/badges. Matched = green, missing = orange/red, bonus = blue.

### Requirement ANALYSIS-03: Section-Level Findings

**What:** Findings for Summary, Skills, Experience, Projects, and Education sections.

**Approach:**

Each section gets its own finding object:

```javascript
{
  section: "skills",
  matchRate: 0.75,           // 3 of 4 posting keywords found in skills
  matchedItems: ["React", "Node.js", "PostgreSQL"],
  missingItems: ["Docker"],
  summary: "Strong skills coverage -- 3 of 4 key skills present"
}
```

**Section analysis logic:**

| Section | How to Match | What Counts as a Match |
|---------|-------------|----------------------|
| Summary | Extract keywords from summary text, compare to posting keywords | Substring match |
| Skills | Direct comparison of `resume.skills` array to posting keywords | Substring match (case-insensitive) |
| Experience | Check each bullet in `resume.experience` for posting keyword presence | Any keyword found in bullet |
| Projects | Check each bullet in `resume.projects` for posting keyword presence | Any keyword found in bullet |
| Education | Check degree names, institutions, and bullets for posting keywords | Substring match |

**Display:** A table or card list showing each section with a match rate bar, matched items, and missing items.

### Requirement ANALYSIS-04: Provider-Agnostic Interface

**What:** Analysis engine uses a provider-agnostic interface so heuristics, AI models, or third-party services can be swapped.

**Approach:**

Define a simple function signature contract. No framework, no plugin system -- just a convention:

```javascript
// Provider interface (convention, not enforced by code)
// function analyzeResume(resume, jobPosting, options) => MatchReport

// server/lib/analysis/engine.js
const providers = {
  heuristic: require('./providers/heuristic'),
  // Future: ai: require('./providers/ai'),
  // Future: thirdparty: require('./providers/thirdparty'),
}

function getProvider(name = 'heuristic') {
  if (!providers[name]) {
    throw new Error(`Unknown analysis provider: ${name}`)
  }
  return providers[name]
}

module.exports = { getProvider }
```

Each provider module exports a single function:

```javascript
// server/lib/analysis/providers/heuristic.js
function analyzeResume(resume, jobPosting, options = {}) {
  // 1. Extract keywords from job posting
  // 2. Match against resume
  // 3. Compute score
  // 4. Categorize keywords
  // 5. Generate section findings
  // 6. Return MatchReport
  return { score, keywords, sections, summary, strengths, gaps }
}

module.exports = { analyzeResume }
```

**Why no framework:** The project constraint is "Simple heuristics -- Cover letter logic must be replaceable." A function-signature convention is the simplest possible abstraction. Adding dependency injection or a plugin registry would be over-engineering for a single-user local tool.

**Future provider example:**

```javascript
// server/lib/analysis/providers/ai.js
async function analyzeResume(resume, jobPosting, options = {}) {
  const prompt = buildPrompt(resume, jobPosting)
  const response = await callLLM(prompt)
  return parseResponse(response) // returns same MatchReport shape
}
```

The API endpoint stays the same regardless of provider:

```javascript
app.post('/api/analyze', (req, res) => {
  const { job_posting_id, provider } = req.body
  const { analyzeResume } = getProvider(provider)
  const report = analyzeResume(resume, posting)
  res.json({ ok: true, report })
})
```

### Match Report Data Structure

```javascript
{
  // ANALYSIS-01
  score: 72,
  summary: "Your resume covers 72% of the job posting's key requirements. Strong match in Skills and Experience sections. Consider adding Docker and CI/CD keywords to close gaps.",
  strengths: [
    "Strong skills alignment (75% match)",
    "Experience bullets cover 4 of 6 key responsibilities"
  ],
  gaps: [
    "Missing Docker experience",
    "No mention of CI/CD pipelines",
    "Education section doesn't reference relevant coursework"
  ],

  // ANALYSIS-02
  keywords: {
    matched: ["react", "node.js", "postgresql", "rest api", "typescript"],
    missing: ["docker", "ci/cd", "aws"],
    bonus: ["express", "jest", "github actions"]
  },

  // ANALYSIS-03
  sections: {
    summary: {
      matchRate: 0.5,
      matchedItems: ["web applications", "react", "node.js"],
      missingItems: ["postgresql", "rest api"],
      summary: "Partial coverage -- mentions React and Node.js but misses database skills"
    },
    skills: {
      matchRate: 0.75,
      matchedItems: ["React", "Node.js", "PostgreSQL", "REST API"],
      missingItems: ["Docker"],
      summary: "Strong skills list -- 4 of 5 key skills present"
    },
    experience: {
      matchRate: 0.67,
      matchedItems: ["Built dashboard with React", "Designed REST API endpoints"],
      missingItems: ["No Docker containerization experience mentioned"],
      summary: "Good experience coverage with measurable achievements"
    },
    projects: {
      matchRate: 0.5,
      matchedItems: ["Express project management app"],
      missingItems: ["No Docker-related projects"],
      summary: "Some relevant projects but could add infrastructure work"
    },
    education: {
      matchRate: 0,
      matchedItems: [],
      missingItems: [],
      summary: "Education section doesn't reference job-specific keywords (this is normal)"
    }
  }
}
```

## Implementation Considerations

### Edge Cases

1. **Empty resume:** If resume has no skills, experience, or projects, the score should be 0 with a message explaining the resume needs content before analysis is useful.

2. **Empty job posting:** If `posting_text` is empty or missing, return a score of 0 with a message asking the user to add posting text.

3. **Very short posting:** A 2-sentence posting may only yield 3-5 keywords. The score calculation should still work but the report should note that analysis quality depends on posting detail.

4. **Resume with no skills array:** Some resumes may have experience but no explicit `skills` array. The engine should handle missing fields gracefully (same as cover-letter.js does with `(resume.skills || [])`).

5. **Duplicate keywords:** The existing `extractKeywords` deduplicates via `Set`. The match report should also deduplicate -- if "react" appears in both skills and experience, it should only appear once in matched keywords.

6. **Case sensitivity:** All matching should be case-insensitive. The existing cover-letter logic already uses `.toLowerCase()` throughout.

### Performance

- Analysis is synchronous for the heuristic provider -- no async needed
- Keyword extraction and matching for a typical resume + posting takes <10ms
- The report is computed on-demand (no caching) -- this is fine for a single-user local tool
- Future AI providers will be async and may take seconds -- the UI should show a loading state

### UI Considerations

- The analysis page needs a resume selector (dropdown of library versions) and a job posting selector (dropdown of saved postings)
- The report should be scrollable with collapsible sections
- Score should be prominently displayed at the top
- Keyword groups should use visual chips/badges for easy scanning
- Section findings should use progress bars for match rate visualization

### Refactoring Opportunity

The existing `server/lib/cover-letter.js` contains `extractKeywords` and `matchResumeToJob` that overlap with the analysis engine needs. Two options:

1. **Extract shared logic into a new module** (`server/lib/analysis/keywords.js`) and have both cover-letter and analysis engine import from it
2. **Keep cover-letter.js as-is** and duplicate the keyword logic in the analysis module

**Recommendation:** Option 1. Extract `STOP_WORDS`, `extractKeywords`, and the matching logic into `server/lib/analysis/keywords.js`. Update `cover-letter.js` to import from it. This avoids duplication and keeps the keyword logic in one place.

### No New Packages

All functionality can be built with:
- Node.js built-in modules (`fs`, `path`)
- Existing project dependencies (`express`, `cors`)
- Pure JavaScript string matching and scoring logic

## Open Questions

1. **Should the analysis page be accessible from the Cover Letter page or as a standalone route?**
   - Recommendation: Standalone route at `/analysis` with selectors for resume and job posting. The Cover Letter page can link to it.

2. **Should analysis results be persisted (saved to disk) or computed on-demand?**
   - Recommendation: On-demand only (no persistence). Analysis is fast for heuristics, and saving results adds complexity. Future AI providers may warrant caching, but that can be added later.

3. **Should the provider be selectable by the user in the UI, or hardcoded to heuristic?**
   - Recommendation: Hardcode to heuristic for now. The provider-agnostic interface exists in the code (so it's easy to add UI selection later), but no UI selector is needed until a second provider exists.

4. **Should the score algorithm be configurable (e.g., different weightings)?**
   - Recommendation: No. Keep the weights hardcoded in the heuristic provider. Different providers can use different algorithms -- that's the point of the provider abstraction.

5. **How should the analysis page handle the case where no resume versions exist?**
   - Recommendation: Show a message directing the user to create a resume in the Resume Library, with a link. Same pattern as CoverLetter.jsx when no postings exist.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of `server/lib/cover-letter.js` -- verified keyword extraction, stop words, and matching logic
- Codebase analysis of `server/index.js` -- verified API patterns, data access, and resume library integration
- Codebase analysis of `client/src/pages/CoverLetter.jsx` -- verified UI pattern for selector + generate + result display
- Codebase analysis of `client/src/pages/ResumeLibrary.jsx` -- verified resume version data structure
- Codebase analysis of `client/src/pages/Applications.jsx` -- verified list page pattern with status badges
- Codebase analysis of `client/src/main.jsx` -- verified router configuration

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- verified requirement definitions and traceability
- `.planning/ROADMAP.md` -- verified phase dependencies and success criteria

### Tertiary (LOW confidence)
- None -- all findings derived from codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages, all logic is pure JavaScript
- Architecture: HIGH -- follows existing patterns exactly (module in server/lib/, API endpoint, React page)
- Pitfalls: HIGH -- edge cases derived from actual data shapes in demo-data/
