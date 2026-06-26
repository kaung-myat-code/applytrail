# Coding Conventions

**Analysis Date:** 2026-06-26

## Project Type

This is a **React + Express web application** with a monorepo structure. The frontend is a React SPA built with Vite, and the backend is an Express API that reads/writes JSON files.

## File Formats

**Data files:**
- `server/data/resume.json` — Resume data object with contact fields, summary, and arrays for experience, projects, skills, education
- `server/data/job_postings.json` — JSON array of job posting objects with `id`, `company`, `role`, `job_posting`, `created_at`
- `server/data/applications.json` — JSON array of application objects with `company`, `role`, `date_applied`, `status`, `cover_letter_paragraph`

**Configuration files:**
- `package.json` — Root config with `concurrently` for running client + server
- `client/package.json` — React frontend dependencies
- `server/package.json` — Express backend dependencies
- `client/vite.config.js` — Vite config with API proxy
- `.gitignore` — Excludes `node_modules`, `.env`, `client/dist`, `.DS_Store`

**Documentation:**
- `README.md` — Project overview with tech stack, setup instructions, and project structure
- `slides/pitch.md` — Marp-format presentation. Uses YAML frontmatter (`marp: true`, `paginate: true`, `transition: fade`, `auto-advance`).

## React Conventions

**Component structure:**
- Functional components with hooks
- File naming: `ComponentName.jsx` for components, `ComponentName.module.css` for styles
- Directory structure: `components/` for reusable, `pages/` for route components

**State management:**
- `useState` for form state
- `useEffect` for data fetching on mount
- Controlled inputs for all form fields

**Styling:**
- CSS Modules for component-scoped styling
- Global styles in `client/src/index.css`
- CSS custom properties for design tokens (colors, spacing)

## Express Conventions

**Route structure:**
- RESTful API routes under `/api/`
- GET for reading, POST for creating, PUT for updating
- JSON request/response bodies

**File naming:**
- Single `server/index.js` file for all routes (small app)
- JSON files in `server/data/` directory

**Error handling:**
- Try/catch around file operations
- Return 500 with error message on failure
- Console.log for debugging

## JSON Data Conventions

**`resume.json` schema:**
```json
{
  "name": "string",
  "email": "string",
  "github": "string",
  "location": "string",
  "summary": "string",
  "experience": [{ "title": "string", "organization": "string", "bullets": ["string"] }],
  "projects": [{ "title": "string", "organization": "string", "bullets": ["string"] }],
  "skills": ["string"],
  "education": [{ "title": "string", "organization": "string", "bullets": ["string"] }]
}
```

**`job_postings.json` schema:**
```json
{
  "id": "string (Date.now().toString())",
  "company": "string",
  "role": "string",
  "job_posting": "string",
  "created_at": "ISO 8601 date string"
}
```

**`applications.json` schema:**
```json
{
  "company": "string",
  "role": "string",
  "date_applied": "YYYY-MM-DD",
  "status": "drafted|applied|...",
  "cover_letter_paragraph": "string"
}
```

- Dates use ISO 8601 format (`YYYY-MM-DD` or full ISO string)
- Status values are lowercase single words
- `cover_letter_paragraph` is a single paragraph, 4-6 sentences

## CSS Module Conventions

**Naming:**
- Class names: camelCase (e.g., `formGroup`, `submitButton`)
- File names: `ComponentName.module.css`
- Import as: `import styles from './ComponentName.module.css'`

**Structure:**
- Component-specific styles in module files
- Shared styles in `index.css` (CSS custom properties)
- No external CSS frameworks (Tailwind, Bootstrap)

## Markdown Style

**Headers:**
- Use `# Title` for document title (one per file)
- Use `## Section` for major sections
- Use `### Subsection` for output categories (in agent files)
- No trailing punctuation on headers

**Lists:**
- Use `*` for unordered lists (not `-`)
- Indent nested items with 4 spaces
- No blank lines between list items

**Code blocks:**
- Use ` ```text ``` ` for non-language-specific content (file trees, flow diagrams)
- Use ` ```language ``` ` for syntax-highlighted code

## Legacy Conventions

**Agent files in `.claude/agents/`:**
- Lowercase kebab-case naming
- YAML frontmatter with `name`, `description`, `tools`, `model`, `color`
- Read-only by default

**Skill files in `.claude/skills/`:**
- Lowercase kebab-case directory, `SKILL.md` file inside
- YAML frontmatter with `name`, `description`

**GSD Framework:**
- Agent files: `gsd-<role>.md`
- Hook files: `gsd-<purpose>.js` or `.sh`
- Command files: `gsd-<command>.md`

## Where to Add New Content

**New page component:** Create `client/src/pages/PageName.jsx` and `PageName.module.css`
**New reusable component:** Create `client/src/components/ComponentName.jsx` and `ComponentName.module.css`
**New API route:** Add to `server/index.js`
**New data file:** Create in `server/data/`
**New agent:** Create `.claude/agents/<name>.md` with frontmatter
**New skill:** Create `.claude/skills/<name>/SKILL.md`

---

*Convention analysis: 2026-06-26*
