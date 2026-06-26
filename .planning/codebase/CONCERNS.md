# Codebase Concerns

**Analysis Date:** 2026-06-26

## Data Integrity Risks

**JSON File as Sole Data Store:**
- Issue: JSON files in `server/data/` are the only data store with no schema validation, backup mechanism, or corruption detection
- Files: `server/data/resume.json`, `server/data/job_postings.json`, `server/data/applications.json`
- Impact: A single malformed write (bad JSON, missing fields, wrong types) silently corrupts all data with no recovery path
- Fix approach: Add a JSON schema validation step before writes; implement a simple backup (copy to `.bak` on each write); consider a git-based backup strategy since this is already a repo

**No Atomic Writes:**
- Issue: Express API writes directly to JSON files with no locking or transaction semantics
- Files: `server/data/*.json`
- Impact: Concurrent requests could produce partial writes or data loss
- Fix approach: Use a write-through pattern (write to temp file, then rename) or serialize writes through a queue

**Schema Drift Between Legacy Agent and Data:**
- Issue: The `application-tracker` agent expects date fields (`last_status_change`, `status_updated_at`, `updated_at`, `applied_at`) that do not exist in the actual data schema. The real data only has `date_applied` and `status`
- Files: `.claude/agents/application-tracker.md`, `server/data/applications.json`
- Impact: The agent cannot perform its core follow-up detection logic because the date fields it checks are never present. It will always flag entries as "missing date information"
- Fix approach: Either add `last_status_change` and `updated_at` fields to the data schema, or update the agent to use `date_applied` as the fallback date field

## Missing Error Handling

**No Input Validation:**
- Issue: No validation on API routes — any JSON can be sent to `PUT /api/resume` or `POST /api/job-postings`
- Files: `server/index.js`
- Impact: Malformed data can be written to JSON files, breaking the frontend
- Fix approach: Add JSON schema validation middleware to API routes

**No Write Confirmation:**
- Issue: No mechanism to verify that a write to JSON files succeeded or that the resulting JSON is valid
- Files: `server/index.js`
- Impact: Silent failures leave the user unaware of data loss
- Fix approach: Add a post-write read-back check in API routes

## Security Considerations

**PII Committed to Repository:**
- Issue: `resume.json` contains full name, email address, location, and employment history committed to the repo. `applications.json` contains company names and cover letter text
- Files: `resume.json`, `applications.json`
- Impact: If the repo is public (README suggests it is intended for portfolio use), personal contact information and job application history are exposed
- Fix approach: Add `resume.json` and `applications.json` to `.gitignore` if the repo is public; or redact PII from the committed versions and use local-only copies

**No CORS Configuration:**
- Issue: Express API uses `cors()` middleware with default settings (allows all origins)
- Files: `server/index.js`
- Impact: Low risk in a local-only tool, but if exposed to network, any origin can access the API
- Fix approach: Restrict CORS to `http://localhost:5173` only

## Fragile Areas

**No Automated Tests:**
- Issue: Zero test files exist in the project. No validation that API routes work correctly, that JSON schema is maintained, or that frontend components render properly
- Files: Project-wide
- Impact: Any change to API routes, data format, or frontend can silently break the workflow with no early warning
- Fix approach: Add API route tests (supertest), JSON schema validation tests, and basic React component tests (Vitest + React Testing Library)

**Legacy Skill-to-Resume Coupling:**
- Issue: The `custom-cover-letter` skill in `.claude/skills/custom-cover-letter/SKILL.md` contains hardcoded resume mappings that duplicate and must stay in sync with `resume.md`
- Files: `.claude/skills/custom-cover-letter/SKILL.md`, `resume.md`
- Impact: If `resume.md` is updated (new job, new skills), the skill's keyword mappings become stale and generate inaccurate cover letters
- Fix approach: Remove hardcoded mappings from the skill; instruct the skill to read `resume.json` dynamically and extract mappings at runtime

**Duplicated CSS:**
- Issue: `NewApplication.module.css` and `Resume.module.css` share nearly identical `.page`, `.form`, `.field`, `.label`, `.input`, `.textarea` styles
- Files: `client/src/pages/NewApplication.module.css`, `client/src/pages/Resume.module.css`
- Impact: Style changes must be made in multiple places; inconsistencies can creep in
- Fix approach: Extract shared form styles into a common `Form.module.css` and import in both pages

## Scaling Limits

**JSON File Performance:**
- Current capacity: 5 entries in `applications.json` (~2.8 KB)
- Limit: Performance degrades around 200-500 entries as every read loads the full file and every write rewrites it
- Scaling path: Acceptable for personal use; if scaling is needed, migrate to SQLite with a simple schema

---

*Concerns audit: 2026-06-26*
