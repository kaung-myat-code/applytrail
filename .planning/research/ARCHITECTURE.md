# Architecture Research

**Project:** ApplyTrail v2.0 Resume Tailoring Flow
**Researched:** 2026-07-02
**Confidence:** HIGH

## Executive Summary

The v2.0 milestone requires significant architectural changes to support resume versioning, a provider-agnostic analysis pipeline, a side-by-side review interface, and multi-format export. The current architecture (single `resume.json`, sync I/O, no schema validation) must evolve into a resume library with separate files, an abstracted analysis engine, and a normalized export pipeline. All changes extend existing patterns rather than replacing them.

## Current Architecture

### Data Layer
- **Single resume file:** `resume.json` — flat object with contact, summary, experience, projects, education, skills
- **Flat arrays:** `applications.json`, `job_postings.json` — no relational links
- **Sync I/O:** `readJSON()`/`writeJSON()` using `fs.readFileSync`/`fs.writeFileSync`
- **No validation:** Any JSON accepted, no schema enforcement
- **No concurrency control:** Race windows on concurrent writes

### API Layer
- **Express 4:** Single `server/index.js` with all routes
- **REST endpoints:** `GET/PUT /api/resume`, `GET/POST /api/job-postings`, `GET/POST /api/applications`
- **Cover letter engine:** `server/lib/cover-letter.js` — `extractKeywords()`, `matchResumeToJob()`, `generateCoverLetter()`

### Frontend Layer
- **React 18 + React Router 6:** SPA with page-based routing
- **Pages:** Dashboard, Resume, NewApplication, Applications, CoverLetter
- **Components:** SectionEditor (reusable list editor), Navbar
- **CSS Modules:** Component-scoped styling

## Architecture Changes for v2.0

### 1. Resume Library (Data Model)

**Current:** Single `resume.json` file, flat object.
**Target:** Directory of resume files with metadata index.

```
server/data/
├── resume_library/
│   ├── index.json          # Array of {id, name, created_at, source_id, application_id}
│   ├── master-<id>.json    # Original resume (source of truth)
│   └── tailored-<id>.json  # Tailored versions (linked to source)
├── applications.json
└── job_postings.json
```

**Key decisions:**
- Each resume version is a separate JSON file (human-readable, atomic operations)
- `index.json` provides fast list queries without reading all files
- `source_id` links tailored versions to their parent
- `application_id` links tailored versions to the application they were created for
- Auto-naming: "Company - Role" format for tailored resumes
- Master resume has `source_id: null`

**Migration path:**
- Existing `resume.json` becomes `resume_library/master-<id>.json`
- `GET /api/resume` redirects to `GET /api/resumes/:id` (master)
- `PUT /api/resume` redirects to `PUT /api/resumes/:id` (master)
- Old routes preserved for backward compatibility during transition

### 2. Analysis Engine (Provider-Agnostic Pipeline)

**Current:** `cover-letter.js` with hardcoded heuristics.
**Target:** Pluggable analysis engine with standard interface.

```javascript
// server/lib/analysis-engine.js
const ANALYSIS_PROVIDERS = {
  heuristics: require('./providers/heuristics'),
  // future: llm: require('./providers/llm'),
}

function getAnalysisProvider(name = 'heuristics') {
  return ANALYSIS_PROVIDERS[name]
}
```

**Standard interface (AnalysisResult schema):**
```javascript
{
  provider: 'heuristics',
  matchScore: {
    overall: 72,           // 0-100 percentage
    skills: 80,            // Per-category scores
    experience: 65,
    projects: 70,
  },
  gapAnalysis: {
    matched: ['react', 'node.js', 'typescript'],
    missing: ['kubernetes', 'aws', 'ci/cd'],
    bonus: ['graphql', 'docker'],  // In resume but not in posting
  },
  sectionSuggestions: [
    {
      section: 'summary',
      type: 'modify',       // add, modify, remove
      current: '...',
      suggested: '...',
      reason: '...',
    },
    // ... per section
  ],
}
```

**Integration points:**
- `server/lib/analysis-engine.js` — Factory + provider interface
- `server/lib/providers/heuristics.js` — Current logic, refactored
- `POST /api/resumes/:id/analyze` — Returns AnalysisResult
- Future: `server/lib/providers/llm.js` — LLM-based analysis

### 3. Review Interface (Frontend)

**Current:** No review workflow.
**Target:** Side-by-side diff view with accept/reject/edit.

**New components:**
```
client/src/
├── pages/
│   ├── ResumeLibrary.jsx      # List all resume versions
│   ├── MatchReport.jsx        # Display AnalysisResult
│   └── ReviewSuggestions.jsx  # Side-by-side review
├── components/
│   ├── ResumeDiffViewer.jsx   # react-diff-viewer-continued wrapper
│   ├── SuggestionCard.jsx     # Individual suggestion with accept/reject/edit
│   └── MatchScoreGauge.jsx    # Visual match score display
```

**State management:**
- `useState` for suggestion accept/reject/edit state
- `useReducer` for complex review workflow (if needed)
- No external state library required

### 4. Export Pipeline

**Current:** No export.
**Target:** PDF, DOCX, JSON export from structured data.

**Architecture:**
```
server/lib/
├── export-normalizer.js    # Resume JSON → normalized intermediate
├── export-pdf.js           # pdfmake: normalized → PDF
├── export-docx.js          # docx: normalized → DOCX
└── export-json.js          # Direct JSON download
```

**Normalized intermediate representation:**
```javascript
{
  sections: [
    {
      type: 'summary',
      title: 'Summary',
      content: { text: '...' },
    },
    {
      type: 'experience',
      title: 'Experience',
      items: [
        {
          title: 'Software Engineer',
          organization: 'Acme Corp',
          date: '2023-Present',
          bullets: ['...'],
        },
      ],
    },
    // ... skills, education, projects
  ],
}
```

**Key benefit:** Schema changes only affect `export-normalizer.js`, not the export templates.

### 5. New API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/resumes` | List all resume versions (metadata only) |
| GET | `/api/resumes/:id` | Get full resume version |
| POST | `/api/resumes` | Create new resume version |
| PUT | `/api/resumes/:id` | Update resume version |
| DELETE | `/api/resumes/:id` | Delete resume version |
| POST | `/api/resumes/:id/analyze` | Run analysis against job posting |
| POST | `/api/resumes/:id/tailor` | Generate tailored resume from suggestions |
| GET | `/api/resumes/:id/export/pdf` | Export as PDF |
| GET | `/api/resumes/:id/export/docx` | Export as DOCX |
| GET | `/api/resumes/:id/export/json` | Export as JSON |

**Backward compatibility:**
- `GET /api/resume` → redirects to `GET /api/resumes/master`
- `PUT /api/resume` → redirects to `PUT /api/resumes/master`

### 6. New React Routes

| Path | Page | Purpose |
|------|------|---------|
| `/resumes` | ResumeLibrary | List all resume versions |
| `/resumes/:id` | ResumeEditor | Edit a specific resume version |
| `/resumes/:id/analyze` | MatchReport | View analysis results |
| `/resumes/:id/review` | ReviewSuggestions | Side-by-side review |
| `/resumes/:id/export` | ExportDialog | Choose export format |

## Build Order (Dependencies)

```
Phase 1: Resume Library Foundation
├── Resume data model (separate files, index.json)
├── Resume CRUD API (GET/POST/PUT/DELETE /api/resumes)
├── Resume Library page (list, create, rename, delete)
├── Migration from single resume.json
└── Concurrency control (updatedAt timestamp)

Phase 2: Match Scoring & Gap Analysis
├── Analysis engine interface (server/lib/analysis-engine.js)
├── Heuristics provider (refactor cover-letter.js)
├── Match scoring API (POST /api/resumes/:id/analyze)
├── Match Report page (score gauge, gap analysis)
└── keyword-extractor integration

Phase 3: Section-by-Section Suggestions
├── Suggestion generation in heuristics provider
├── SuggestionCard component
├── Review Suggestions page
└── Accept/reject/edit state management

Phase 4: Tailored Resume Generation
├── Resume merge utility (apply suggestions to copy)
├── Tailor API (POST /api/resumes/:id/tailor)
├── Side-by-side review (react-diff-viewer-continued)
└── Auto-naming (Company - Role format)

Phase 5: Application Pre-fill & Export
├── Application pre-fill from job posting
├── Resume-application linking (resume_version_id)
├── Export normalizer (resume → intermediate)
├── PDF export (pdfmake)
├── DOCX export (docx)
└── Export dialog page
```

## Integration Points

| Component | Integrates With | Change Type |
|-----------|-----------------|-------------|
| Resume Library | Existing `resume.json` | **New** — separate files + index |
| Analysis Engine | Existing `cover-letter.js` | **Refactor** — extract to provider |
| Match Report | Existing job postings API | **Extend** — new analysis endpoint |
| Review Interface | New diff viewer component | **New** — React component |
| Export Pipeline | New pdfmake/docx libraries | **New** — server modules |
| Application Pre-fill | Existing applications API | **Extend** — add resume_version_id |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Base resume overwrite | Separate files + source_id linking |
| Concurrent writes | updatedAt timestamp + optimistic concurrency |
| Analysis engine coupling | Provider interface defined before implementation |
| Export breaks on schema change | Normalized intermediate representation |
| Library becomes unmanageable | Auto-naming + filtering + application linkage |

## Sources

- Existing codebase: `server/index.js`, `server/lib/cover-letter.js`, `client/src/`
- STACK.md: Library recommendations (pdfmake, docx, react-diff-viewer-continued, keyword-extractor)
- PITFALLS.md: Critical pitfalls and integration gotchas
- FEATURES.md: Feature dependencies and competitor analysis
- PROJECT.md: Architectural constraints (provider-agnostic, structured JSON schema)

---
*Architecture research for: ApplyTrail v2.0 Resume Tailoring Flow*
*Researched: 2026-07-02*
