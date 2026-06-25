# Codebase Concerns

**Analysis Date:** 2026-06-26

## Data Integrity Risks

**JSON File as Sole Data Store:**
- Issue: `applications.json` is the only data store with no schema validation, backup mechanism, or corruption detection
- Files: `applications.json`
- Impact: A single malformed write (bad JSON, missing fields, wrong types) silently corrupts all application data with no recovery path
- Fix approach: Add a JSON schema validation step before writes; implement a simple backup (copy to `.bak` on each write); consider a git-based backup strategy since this is already a repo

**No Atomic Writes:**
- Issue: The Filesystem MCP writes directly to `applications.json` with no locking or transaction semantics
- Files: `applications.json`, `.mcp.json`
- Impact: Concurrent Claude sessions or manual edits could produce partial writes or data loss
- Fix approach: Use a write-through pattern (write to temp file, then rename) or serialize writes through a single agent

**Schema Drift Between Agent and Data:**
- Issue: The `application-tracker` agent expects date fields (`last_status_change`, `status_updated_at`, `updated_at`, `applied_at`) that do not exist in the actual data schema. The real data only has `date_applied` and `status`
- Files: `.claude/agents/application-tracker.md`, `applications.json`
- Impact: The agent cannot perform its core follow-up detection logic because the date fields it checks are never present. It will always flag entries as "missing date information"
- Fix approach: Either add `last_status_change` and `updated_at` fields to the data schema, or update the agent to use `date_applied` as the fallback date field

## Missing Error Handling

**No Input Validation:**
- Issue: No validation on `company`, `role`, `status`, or `date_applied` fields when entries are added
- Files: `applications.json`
- Impact: Freeform strings for status (e.g., "drafted", "applied") have no enum constraint. Typos or inconsistent values break the tracker agent's status filtering
- Fix approach: Define a status enum (drafted, applied, screening, interview, offer, rejected, withdrawn) and validate before write

**No Write Confirmation:**
- Issue: No mechanism to verify that a write to `applications.json` succeeded or that the resulting JSON is valid
- Files: `applications.json`, `.mcp.json`
- Impact: Silent failures leave the user unaware of data loss
- Fix approach: Add a post-write read-back check in the cover letter skill workflow

## Security Considerations

**PII Committed to Repository:**
- Issue: `resume.md` contains full name, email address, location, and employment history committed to the repo. `applications.json` contains company names and cover letter text
- Files: `resume.md`, `applications.json`
- Impact: If the repo is public (README suggests it is intended for portfolio use), personal contact information and job application history are exposed
- Fix approach: Add `resume.md` and `applications.json` to `.gitignore` if the repo is public; or redact PII from the committed versions and use local-only copies

**MCP Filesystem Scope:**
- Issue: The Filesystem MCP server in `.mcp.json` is configured with `"."` as the root, granting access to the entire project directory
- Files: `.mcp.json`
- Impact: Low risk in a personal project, but any MCP-connected Claude session can read/write any file in the project including `.env` if it exists
- Fix approach: Restrict the MCP filesystem scope to only the files it needs (`resume.md`, `applications.json`)

## Fragile Areas

**Skill-to-Resume Coupling:**
- Issue: The `custom-cover-letter` skill in `.claude/skills/custom-cover-letter/SKILL.md` contains hardcoded resume mappings that duplicate and must stay in sync with `resume.md`
- Files: `.claude/skills/custom-cover-letter/SKILL.md`, `resume.md`
- Impact: If `resume.md` is updated (new job, new skills), the skill's keyword mappings become stale and generate inaccurate cover letters
- Fix approach: Remove hardcoded mappings from the skill; instruct the skill to read `resume.md` dynamically and extract mappings at runtime

**No Automated Tests:**
- Issue: Zero test files exist in the project. No validation that the skill generates correct output, that the agent parses dates correctly, or that the JSON schema is maintained
- Files: Project-wide
- Impact: Any change to skills, agents, or data format can silently break the workflow with no early warning
- Fix approach: Add at least a JSON schema validation script and a smoke test for the cover letter skill output format

**Unpinned MCP Dependency:**
- Issue: `.mcp.json` uses `npx -y @modelcontextprotocol/server-filesystem` with no version pin
- Files: `.mcp.json`
- Impact: A breaking change in the MCP server package could silently break file read/write operations
- Fix approach: Pin to a specific version (e.g., `@modelcontextprotocol/server-filesystem@0.6.0`)

## Scaling Limits

**JSON File Performance:**
- Current capacity: 5 entries in `applications.json` (~2.8 KB)
- Limit: Performance degrades around 200-500 entries as every read loads the full file and every write rewrites it
- Scaling path: Acceptable for personal use; if scaling is needed, migrate to SQLite with a simple schema

---

*Concerns audit: 2026-06-26*
