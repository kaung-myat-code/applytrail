# ApplyTrail Resume Schema — Canonical Reference

This is the single source of truth for the resume JSON structure used across the entire ApplyTrail codebase. All consumers (frontend editor, analysis engine, cover letter generator, suggestions pipeline) depend on this shape.

## Top-Level Structure

```
resume = {
  name:         string,       // Full name of the resume owner
  contact:      Contact,      // Contact information
  summary:      string,       // Professional summary paragraph (4-6 sentences)
  experience:   Experience[], // Work experience entries (newest first)
  projects:     Project[],    // Project entries
  education:    Education[],  // Education entries
  skills:       string[]      // Flat array of skill strings
}
```

All seven fields are expected. The app uses `|| []`, `|| ''`, or `|| {}` fallbacks so missing fields don't crash, but semantically every field should be present.

## Contact

```
contact = {
  email:    string,  // Email address
  github:   string,  // GitHub profile URL (e.g. "github.com/username")
  location: string   // Location string (e.g. "Austin, TX (open to remote)")
}
```

Only these three sub-fields exist. There is no `phone`, `linkedin`, `website`, `title`, or `portfolio` field in the current schema.

## Experience Entry

```
experience[] = {
  company:  string,   // Company name
  role:     string,   // Job title
  period:   string,   // Freeform period (e.g. "Jan 2024 - Present", "Jun 2023 – Dec 2024")
  bullets:  string[]  // Array of bullet-point strings describing achievements
}
```

Bullets should start with action verbs and include measurable achievements when possible.

## Project Entry

```
projects[] = {
  name:        string,   // Project name
  description: string,   // Short description (1-2 sentences)
  bullets:     string[]  // Array of bullet-point strings describing features/tech
}
```

## Education Entry

```
education[] = {
  degree:  string,  // Degree name (e.g. "B.S. Computer Science")
  school:  string,  // School/university name
  year:    string   // Freeform year string (e.g. "2023", "Graduated 2022")
}
```

**Important:** Education entries do NOT have a `bullets` array. Unlike experience and projects, education only has degree/school/year.

**Known bug:** Some code references `e.institution` instead of `e.school`, and `edu.bullets` which does not exist. See Known Issues below.

## Skills

```
skills: string[]  // Flat array of skill strings
```

Skills are stored as individual strings in an array. In the UI, they are displayed as comma-separated text. No structured skill objects, no proficiency levels, no categories.

Example: `["JavaScript", "React", "Node.js", "PostgreSQL"]`

## Resume Library Storage

Resumes are stored in the `resume_library/` directory:

```
resume_library/
  index.json               // Library metadata
  <alphanumeric-id>.json   // Individual resume version (full resume JSON)
```

### Library Index Schema

```
index.json = {
  selected_id: string,        // ID of the currently selected resume version
  versions: VersionMeta[]     // Array of version metadata
}

VersionMeta = {
  id:          string,  // Alphanumeric ID (generated server-side)
  name:        string,  // User-given name for this version
  created_at:  string,  // ISO date (YYYY-MM-DD)
  updated_at:  string,  // ISO date (YYYY-MM-DD)
  source_id:   string?  // Always null (placeholder, never wired)
}
```

## Known Issues

1. **`e.institution` bug:** `heuristic.js` line 141 uses `e.institution` but the schema field is `school`. Education keyword analysis only extracts from `degree`.
2. **`edu.bullets` bug:** `keywords.js` lines 97-100 and `heuristic.js` try to read `edu.bullets` which does not exist on education entries.
3. **Missing `name` in default template:** The server POST handler creates new resumes without a `name` field.
4. **No schema validation:** Neither client nor server validates resume structure. Any JSON is accepted.
