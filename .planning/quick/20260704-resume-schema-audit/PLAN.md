---
type: audit
status: in-progress
created: 2026-07-04
---

# Resume Schema Audit — Phases 9, 10, 11.5

Audit Phase 9 (Resume Library), Phase 10 (Match Scoring), and Phase 11.5 (AI Analysis Provider) for missing resume-schema validation, repair, or conformance checks.

## Scope

- Server-side code: `server/index.js`, `server/lib/analysis/`, `server/lib/cover-letter.js`
- Client-side code: `client/src/pages/Resume.jsx`, `client/src/pages/ResumeLibrary.jsx`, `client/src/pages/Analysis.jsx`, `client/src/pages/ReviewSuggestions.jsx`
- Data files: `server/data/resume.json`, `resume_library/*.json`, `server/demo-data/resume.json`

## Schema Reference

Canonical schema per `.claude/skills/resume-schema/SKILL.md`:

```json
{
  "name": "",
  "contact": { "email": "", "github": "", "location": "" },
  "summary": "",
  "experience": [{ "company": "", "role": "", "period": "", "bullets": [""] }],
  "projects": [{ "name": "", "description": "", "bullets": [""] }],
  "education": [{ "degree": "", "school": "", "year": "" }],
  "skills": [""]
}
```

Key rules:
- `education[]` must NOT have `bullets` — only `degree`, `school`, `year`
- `contact` must have exactly `email`, `github`, `location` — no extra, no missing
- `skills` must be a flat array of strings (not comma-separated)
- No `institution` field — use `school`
- Top-level `name` field is required
