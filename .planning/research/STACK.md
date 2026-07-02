# Technology Stack

**Project:** ApplyTrail v2.0 Resume Tailoring Flow
**Researched:** 2026-07-02
**Mode:** Ecosystem — Stack additions for resume optimization workflow

## Executive Summary

The v2.0 milestone adds five major capabilities: resume optimization, match scoring, section-by-section suggestions, side-by-side review, and multi-format export. The existing stack (React 19, Express 4, JSON file storage) remains unchanged. Three new server-side libraries are needed for export and analysis, one client-side library for the review interface, and the existing keyword-matching logic should be enhanced rather than replaced.

**Total new dependencies:** 4 (3 server, 1 client)
**Client bundle impact:** ~45 KB (diff viewer only, loaded on review page)
**Server bundle impact:** ~2.7 MB (export and analysis libraries)

## Recommended Stack

### Export: PDF Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pdfmake | 0.3.11 | Generate PDF resumes from JSON data | Declarative JSON document definition matches project's JSON-first architecture. No HTML templating required. Works server-side in Node.js. MIT license. 12.3k GitHub stars, actively maintained (last release June 2026). |

**Why pdfmake over alternatives:**

- **vs pdfkit (v0.19.1):** pdfkit is lower-level (canvas-like API). Requires manual positioning of every text element. pdfmake's declarative style maps naturally to resume sections — define content as JSON objects, get a formatted PDF. Less code for structured documents.
- **vs @react-pdf/renderer (v4.5.1):** Requires React rendering pipeline on the server. Adds complexity for a server-side generation task. pdfmake is pure Node.js, no React dependency on the server.
- **vs puppeteer/playwright:** Heavy dependency (headless browser). Overkill for structured document generation. pdfmake generates PDFs directly without browser overhead.

**Integration point:** New server module `server/lib/export-pdf.js` called from `GET /api/resumes/:id/export/pdf`.

### Export: DOCX Generation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| docx | 9.7.1 | Generate Word documents from resume JSON | Declarative API with paragraphs, tables, bullets, headers/footers. TypeScript support. Works in Node.js and browser. MIT license. 5.8k GitHub stars, 95 releases, actively maintained (last release May 2026). |

**Why docx over alternatives:**

- **vs docxtemplater:** docxtemplater requires a pre-existing .docx template file. docx generates documents from scratch with a programmatic API — better for dynamic resume structures.
- **vs officegen:** Less mature, smaller community. docx has better documentation and more contributors (135).

**Integration point:** New server module `server/lib/export-docx.js` called from `GET /api/resumes/:id/export/docx`.

### Export: JSON

No library needed. The resume data is already JSON. Export is a direct file download of the existing resume structure with a `.json` extension and `Content-Disposition: attachment` header.

**Integration point:** New route `GET /api/resumes/:id/export/json` that streams the file.

### Review Interface: Side-by-Side Diff

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-diff-viewer-continued | 4.2.2 | Show original vs suggested resume content side-by-side | Maintained fork of react-diff-viewer. Supports React 19 (peer dependency includes ^19.0.0). Split view, word-level diffing, syntax highlighting, dark/light themes. MIT license. |

**Why react-diff-viewer-continued over alternatives:**

- **vs react-diff-viewer (original):** Abandoned since May 2020. No React 19 support. react-diff-viewer-continued is the community-maintained fork with active development.
- **vs building custom diff with `diff` library (v9.0.0):** The diff library provides the algorithm but not the UI. react-diff-viewer-continued wraps diff with a polished React component — saves significant UI development time.
- **vs CodeMonaco diff editor:** Heavy dependency (Monaco editor). Overkill for displaying text diffs in a review interface.

**Note:** This library pulls in `@emotion/css` and `@emotion/react` as dependencies. Since the project uses CSS Modules, there may be minor styling considerations, but emotion is scoped to the diff component and won't conflict with existing styles.

**Integration point:** New component `client/src/components/ResumeDiffViewer.jsx` used in the review page.

### Match Scoring: Enhanced Keyword Extraction

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| keyword-extractor | 0.0.28 | Extract meaningful keywords from job postings | Lightweight (zero heavy dependencies). Simple API. Complements existing keyword matching by providing better extraction with configurable stop-word lists. |

**Why keyword-extractor over alternatives:**

- **vs natural (v8.1.1):** natural pulls in mongoose, pg, redis, and other heavy dependencies. Massive overkill for keyword extraction. keyword-extractor does one thing well.
- **vs compromise (v14.15.1):** compromise is a full NLP toolkit (tokenization, POS tagging, sentiment). We only need keyword extraction. keyword-extractor is purpose-built and lighter.

**Integration point:** Enhance existing `server/lib/cover-letter.js` with better keyword extraction. The `extractKeywords` function currently uses simple tokenization — keyword-extractor provides better stop-word filtering.

### Match Scoring: Similarity Calculation

No external library needed. The match scoring algorithm can be implemented with:
- Term frequency counting (how often keywords appear)
- Coverage ratio (what percentage of job keywords appear in resume)
- Section-level scoring (per-section match percentages)

This keeps the analysis engine provider-agnostic as specified in PROJECT.md. A simple scoring module in `server/lib/match-scorer.js` can be swapped for an LLM-based scorer later.

### State Management: Accept/Reject/Edit Workflow

No external library needed. React's built-in `useState` and `useReducer` are sufficient for:
- Tracking which suggestions are accepted, rejected, or edited
- Storing edited text for modified suggestions
- Generating the final tailored resume from accepted/edited suggestions

**Why not use-undo or immer:**
- The review workflow is linear (review suggestions, make decisions, generate resume). Full undo/redo history is unnecessary complexity.
- State is per-section, not deeply nested. Standard React state handles this fine.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| PDF generation | pdfmake 0.3.11 | pdfkit 0.19.1 | Lower-level API requires more code for structured documents |
| PDF generation | pdfmake 0.3.11 | @react-pdf/renderer 4.5.1 | Requires React on server, adds complexity |
| DOCX generation | docx 9.7.1 | docxtemplater | Requires template file, less flexible for dynamic structures |
| Diff viewer | react-diff-viewer-continued 4.2.2 | Custom diff UI | More development time for same result |
| Diff viewer | react-diff-viewer-continued 4.2.2 | Monaco diff editor | Heavy dependency, overkill |
| Keyword extraction | keyword-extractor 0.0.28 | natural 8.1.1 | Too many heavy dependencies (mongoose, pg, redis) |
| Keyword extraction | keyword-extractor 0.0.28 | compromise 14.15.1 | Full NLP toolkit when we only need extraction |
| State management | React useState/useReducer | use-undo 1.2.0 | Unnecessary complexity for linear workflow |
| State management | React useState/useReducer | immer 11.1.9 | State isn't deeply nested enough to warrant it |

## Installation

```bash
# Server dependencies (PDF export)
cd server && npm install pdfmake@^0.3.11

# Server dependencies (DOCX export)
cd server && npm install docx@^9.7.1

# Server dependencies (keyword extraction)
cd server && npm install keyword-extractor@^0.0.28

# Client dependencies (diff viewer)
cd client && npm install react-diff-viewer-continued@^4.2.2
```

## What NOT to Add

| Technology | Why Not |
|------------|---------|
| Database (PostgreSQL, MongoDB) | PROJECT.md specifies JSON file storage. No auth, single-user tool. |
| AI/LLM API (OpenAI, Anthropic) | PROJECT.md specifies no external APIs. Analysis engine is heuristics-based, swappable later. |
| State management library (Redux, Zustand) | React built-in state is sufficient. Adding a library increases bundle size for no benefit. |
| Template engine (Handlebars, EJS) | Resume structure is JSON-driven. pdfmake and docx use declarative APIs, not templates. |
| CSS framework (Tailwind, Bootstrap) | Project uses CSS Modules. Adding a framework would require restyling everything. |
| Testing library additions | Vitest and Testing Library already configured. No new test dependencies needed. |

## Bundle Size Impact

| Package | Size | Impact |
|---------|------|--------|
| pdfmake | ~2.5 MB (server only) | Zero client bundle impact |
| docx | ~150 KB (server only) | Zero client bundle impact |
| keyword-extractor | ~15 KB (server only) | Zero client bundle impact |
| react-diff-viewer-continued | ~45 KB (client) | Moderate, loaded only on review page |

**Total client bundle increase:** ~45 KB (diff viewer only). All export and analysis libraries run server-side.

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| pdfmake@0.3.x | node@18+ | Pure JavaScript, no native dependencies |
| docx@9.x | node@18+ | Pure JavaScript, no native dependencies |
| keyword-extractor@0.0.x | node@18+ | Pure JavaScript, no native dependencies |
| react-diff-viewer-continued@4.x | react@19.x | Peer dependency includes ^19.0.0 |
| react-diff-viewer-continued@4.x | react-dom@19.x | Peer dependency includes ^19.0.0 |

## Sources

- PDFKit GitHub: https://github.com/foliojs/pdfkit (verified 2026-07-02)
- docx GitHub: https://github.com/dolanmiu/docx (verified 2026-07-02)
- pdfmake GitHub: https://github.com/bpampuch/pdfmake (verified 2026-07-02)
- react-diff-viewer GitHub: https://github.com/praneshr/react-diff-viewer (verified 2026-07-02)
- npm registry: All versions verified via `npm info` on 2026-07-02
- PROJECT.md: Project constraints and architectural decisions

---
*Stack research for: ApplyTrail v2.0 Resume Tailoring Flow*
*Researched: 2026-07-02*
