# Phase 6 Context: Demo Data & Seeding

## Phase Goal
App launches with representative demo data so portfolio visitors see a populated interface.

## Requirements
- **DEMO-01**: Demo resume data file exists with realistic content (name, experience, skills, education)
- **DEMO-02**: Demo job postings data file exists with 2-3 realistic entries
- **DEMO-03**: Demo applications data file exists with entries in various statuses (drafted, applied, interviewing, rejected)
- **DEMO-04**: Server seeds data from demo files when production data directory is empty on startup

## Success Criteria
1. App displays representative demo resume, job postings, and applications on first launch
2. Demo applications cover multiple statuses (drafted, applied, interviewing, rejected) to showcase tracking features
3. Demo data contains fictional or intentionally shared sample information suitable for a public repository

## Current Architecture

### Data Storage
- Data files live at project root: `resume.json`, `job_postings.json`, `applications.json`
- `server/index.js` uses `DATA_DIR = path.join(__dirname, '..')` to resolve to project root
- `readJSON(filename)` returns `[]` if file doesn't exist
- `writeJSON(filename, data)` writes JSON with 2-space indent

### Data Schemas

**resume.json** — single object:
```json
{
  "name": "string",
  "contact": { "email", "github", "location" },
  "summary": "string",
  "experience": [{ "company", "role", "period", "bullets": ["string"] }],
  "projects": [{ "name", "description", "bullets": ["string"] }],
  "skills": ["string"],
  "education": [{ "degree", "school", "year" }]
}
```

**job_postings.json** — array:
```json
[{ "id", "company", "role", "posting_text", "created_at" }]
```

**applications.json** — array:
```json
[{ "id", "job_posting_id", "company", "role", "cover_letter_paragraph", "status", "date_applied", "last_status_change" }]
```

Valid statuses: `drafted`, `applied`, `interviewing`, `offered`, `rejected`, `withdrawn`

### Current Data
The repo already has real user data in these files (Alex Tan's resume, pitchIN job posting, 6 applications). Demo data must replace or coexist with this — the seeding mechanism should only trigger when files are empty/missing (DEMO-04).

## Constraints
- No auth (single-user local tool)
- No external APIs
- JSON file storage only
- Demo data must be fictional/suitable for public repo
- Seeding must not overwrite existing user data

## Key Decision Points
1. **Demo data location**: Where to store the seed files? Options: `server/demo-data/`, `demo/`, or embedded in code
2. **Seeding trigger**: Check on server startup if data files are missing or empty
3. **Demo content**: Fictional persona with realistic job search data that showcases all app features

## Files to Read
- `server/index.js` — API server with all routes and data access patterns
- `server/lib/cover-letter.js` — Cover letter generation logic (for realistic demo cover letters)
- `client/src/pages/` — Frontend pages to understand what data fields are displayed
