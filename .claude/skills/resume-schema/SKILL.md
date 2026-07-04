---
name: resume-schema
description: Validate, repair, generate, and work with ApplyTrail resume JSON data. Use this skill whenever the user mentions resume validation, resume schema, resume repair, resume JSON, resume conformance, creating tailored resumes, fixing resume data, or checking resume structure. Also use when working with resume_library files, generating new resume versions, or diagnosing resume-related bugs.
---

# Resume Schema Operations

A full toolkit for working with ApplyTrail resume data — define, validate, repair, generate, and transform resume JSON.

## Quick Reference

Read `references/schema.md` for the canonical schema definition. That file is the single source of truth for all field names, types, and structure. Every operation below depends on knowing the correct schema.

## Operations

### 1. Validate a Resume

Check any resume JSON file against the canonical schema. Report all issues found.

**What to check:**

- All seven top-level fields exist (`name`, `contact`, `summary`, `experience`, `projects`, `education`, `skills`)
- `contact` has exactly `email`, `github`, `location` (no extra fields, no missing fields)
- Each `experience[]` entry has `company`, `role`, `period`, `bullets` (array of strings)
- Each `projects[]` entry has `name`, `description`, `bullets` (array of strings)
- Each `education[]` entry has `degree`, `school`, `year` — and does NOT have `bullets`
- `skills` is a flat array of strings
- No unexpected fields exist (e.g., `institution` instead of `school`)
- No empty required fields (warn, don't error — the app tolerates empties)
- Strings are actually strings, arrays are actually arrays

**Output format:**

```
Resume Validation: [filename]

✓ name: "Jordan Rivera"
✓ contact: {email, github, location}
✓ summary: 187 chars
✓ experience: 2 entries
✓ projects: 2 entries
✓ education: 1 entry
✓ skills: 14 items

Issues found:
  ⚠ education[0]: has unexpected field "bullets" (education entries should not have bullets)
  ⚠ experience[1].bullets[2]: empty string
  ✗ contact.missing_field: "phone" is not in the schema — remove it

Result: [N] issues, [M] warnings
```

### 2. Repair a Resume

Fix common issues in resume JSON to make it conform to the schema.

**Automatic repairs (apply without asking):**

- Add missing top-level fields with defaults: `name: ""`, `contact: {}`, `summary: ""`, `experience: []`, `projects: []`, `education: []`, `skills: []`
- Remove known bug fields: `education[].institution` (replace value with `education[].school` if `school` is missing), `education[].bullets` (drop silently)
- Ensure `contact` only has `email`, `github`, `location` — drop extra fields
- Ensure `skills` is an array of strings (if it's a comma-separated string, split it)
- Trim trailing periods, commas, and whitespace from each skill string (e.g., `"Supabase."` → `"Supabase"`)
- Ensure each `experience[].bullets` and `projects[].bullets` is a non-empty array (if empty, initialize with `[""]`)
- Ensure each `education[]` entry has exactly `degree`, `school`, `year`

**Repairs requiring confirmation:**

- Renaming fields (e.g., `institution` → `school`) — show the diff and ask
- Removing entries with no useful content (all fields empty) — list them and ask
- Restructuring data (e.g., converting a string skills field to an array) — show the change

### 3. Generate a Tailored Resume

This skill does not generate AI suggestions. It only applies already accepted structured patches to a deep copy of the source resume.

Create a new resume version by applying accepted suggestions to a source resume. This is the core operation for Phase 12 (Tailored Resume Generation).

**Input:**

- `source_resume` — the original resume JSON (from resume library)
- `suggestions` — array of accepted suggestion objects from the analysis pipeline
- `job_context` — optional object with `{ company, role }` for auto-naming

**Process:**

1. Deep-clone the source resume (never modify the original)
2. Only user-approved structured patches may be applied. Rejected or unreviewed suggestions must never be included in the generated resume.
3. Apply each suggestion in order:
   - `add` suggestions: append new content to the appropriate section
   - `modify` suggestions: replace existing content with the suggested version
   - `remove` suggestions: delete the specified content
4. Validate the result against the schema
5. If validation fails, attempt automatic repair
6. Return the tailored resume (do NOT save — let the caller handle persistence)

**Output:**

- The tailored resume JSON, conforming to schema
- A diff summary showing what changed (for the preview step)

**Naming convention:** If `job_context` is provided, name the version `"{company} - {role}"`. Otherwise, use `"Tailored - {date}"`.

### 4. Extract Resume Keywords

Extract keywords from a resume for analysis or cover letter generation.

**Fields to extract from:**

- `skills[]` — each skill is a keyword
- `summary` — split on word boundaries, filter stop words
- `experience[].bullets[]` — split each bullet on word boundaries, filter stop words
- `projects[].bullets[]` — same as experience
- `education[].degree` — extract degree and field of study
- `education[].school` — extract school name

**Do NOT extract from:**

- `education[].bullets` — this field does not exist on education entries
- `contact` fields — not relevant for keyword matching

### 5. Create a Blank Resume

Generate a new empty resume that conforms to the schema.

**Template:**

```json
{
  "name": "",
  "contact": {
    "email": "",
    "github": "",
    "location": ""
  },
  "summary": "",
  "experience": [],
  "projects": [],
  "education": [],
  "skills": []
}
```

Use this when creating new resume versions via `POST /api/resume-library` or when the user asks for a fresh start.

## File Locations

| File                           | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `server/data/resume.json`      | Legacy single resume (project root) |
| `resume_library/index.json`    | Library metadata + selected version |
| `resume_library/<id>.json`     | Individual resume version           |
| `server/demo-data/resume.json` | Demo seed data                      |
| `references/schema.md`         | Canonical schema definition         |

## Known Bugs to Watch For

When validating or repairing resumes, check for these known issues in the codebase:

1. **`institution` vs `school`:** Some code reads `e.institution` but the schema uses `school`. If you see `institution` in a resume file, rename it to `school`.
2. **`education[].bullets`:** This field does not exist. If present, remove it. Education entries only have `degree`, `school`, `year`.
3. **Missing `name`:** The server POST handler creates resumes without `name`. Always include it.
4. **Skills as string:** Sometimes skills arrive as a single comma-separated string instead of an array. Split on commas and trim.
