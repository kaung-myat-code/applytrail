# Phase 9: Resume Library Foundation - Research

**Researched:** 2026-07-02
**Domain:** Multi-version document management with JSON file storage
**Confidence:** HIGH

## Summary

Phase 9 introduces multi-version resume management to ApplyTrail. The current system stores a single `resume.json` at the project root (not in `server/data/` as the requirements document suggests). The Express server's `DATA_DIR` is `path.join(__dirname, '..')` -- one level up from `server/` -- placing all data files at the project root.

The migration strategy is straightforward: on first server startup, detect if `resume_library/` exists; if not, create it, copy the existing `resume.json` into it as the first library entry, create an `index.json` metadata file, and leave the original `resume.json` in place for backward compatibility. New API endpoints handle CRUD on resume versions, and a new Resume Library page provides the UI. No new npm packages are required -- this is pure Node.js `fs` operations and React state management.

**Important discrepancy:** The requirements specify `server/data/resume_library/` as the storage location, but the actual data directory is the project root (where `resume.json`, `job_postings.json`, and `applications.json` currently live). The implementation should use `resume_library/` at the project root for consistency with the existing pattern. The planner should confirm this with the user.

**Primary recommendation:** Use a flat directory structure with `index.json` for metadata and individual `<id>.json` files for each resume version. Keep the migration as a copy (not move) to avoid data loss.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LIBRARY-01 | Resume versions stored as separate JSON files with metadata index in `resume_library/` | File-based storage pattern: `index.json` + `<id>.json` files. No new packages needed. |
| LIBRARY-02 | User can list, view, create, rename, and delete resume versions from a Resume Library page | New React page + Express CRUD endpoints. Follows existing patterns from Applications page. |
| LIBRARY-04 | Existing `resume.json` migrated to library on first launch, preserving all data | Startup migration function in `server/index.js`. Copy-not-move strategy. |
| LIBRARY-05 | User can select which resume version to use as base for analysis and tailoring | `selected_id` field in `index.json`. Downstream pages read selected version. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Resume version CRUD API | API / Backend | -- | Express routes read/write JSON files on disk |
| Resume version list UI | Browser / Client | -- | React component fetches and renders version list |
| Migration on startup | API / Backend | -- | Server-side `fs` operations run once at boot |
| Version selection state | Database / Storage | API / Backend | `selected_id` in `index.json` is the source of truth |
| Resume editing | Browser / Client | API / Backend | Existing Resume.jsx edits; API saves to selected version |

## Project Constraints (from CLAUDE.md)

- **No auth**: Single-user local tool -- no permission checks needed on resume versions
- **No external APIs**: No cloud sync, no AI versioning, no collaboration features
- **JSON file storage**: Resume versions must be human-readable JSON files on disk
- **Commit after each working milestone**: Incremental progress through the phase
- **Simple heuristics**: Cover letter logic reads from selected resume version

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` | built-in | Read/write JSON files for resume versions | Already used throughout server/index.js |
| Node.js `path` | built-in | Construct file paths for resume library | Already used throughout server/index.js |
| Node.js `crypto` | built-in | Generate unique IDs for resume versions | Already available; `generateId()` exists in server |
| React 18 | ^19.0.0 | Frontend UI components | Already in use |
| React Router 7 | ^7.0.0 | Client-side routing for new page | Already in use |
| CSS Modules | built-in | Component-scoped styling | Already in use |
| Express 4 | ^4.21.0 | API endpoints | Already in use |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | -- | No new packages needed for this phase |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Flat file structure | Nested directories per version | More complex path handling, no benefit for small file counts |
| UUID for IDs | Short hash (existing `generateId()`) | UUIDs are longer; short IDs are sufficient for single-user tool |
| SQLite | JSON files | Violates project constraint: "JSON file storage" |

**Installation:**
```bash
# No new packages needed
```

## Package Legitimacy Audit

No new packages are required for this phase. All functionality uses built-in Node.js modules (`fs`, `path`, `crypto`) and existing project dependencies.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | -- | -- | -- | -- | -- | N/A |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                          │
│              React SPA on localhost:5173                      │
│  /resume-library  ──→  Resume Library page                   │
│  /resume          ──→  Resume Editor (loads selected ver.)   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (Vite proxy)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                          │
│                  localhost:3000                               │
│  GET    /api/resume-library          — list all versions     │
│  POST   /api/resume-library          — create new version    │
│  GET    /api/resume-library/:id      — get version by ID     │
│  PUT    /api/resume-library/:id      — update version        │
│  DELETE /api/resume-library/:id      — delete version        │
│  PUT    /api/resume-library/:id/select — set active version  │
│  GET    /api/resume                  — get selected version  │
│  PUT    /api/resume                  — update selected ver.  │
└──────────┬───────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  File System (project root)                   │
│  resume.json              — original (kept for compat)       │
│  resume_library/                                             │
│    index.json             — metadata + selected_id           │
│    abc123.json            — version 1                        │
│    def456.json            — version 2                        │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```text
server/
├── index.js                    # Add migration function + new routes
├── lib/
│   └── cover-letter.js         # Update to accept resume as parameter (already does)
└── demo-data/
    └── resume.json             # Existing demo data

client/src/
├── pages/
│   ├── Resume.jsx              # Update to load from selected version
│   ├── ResumeLibrary.jsx       # NEW — version list + CRUD
│   └── ...
├── components/
│   └── Navbar/
│       └── Navbar.jsx          # Add "Resume Library" link
└── ...

resume_library/                 # NEW — created at project root
├── index.json                  # Metadata index
└── <id>.json                   # Individual resume versions
```

### Pattern 1: Metadata Index (index.json)

**What:** A single JSON file tracking all resume versions and the currently selected one
**When to use:** Any multi-version document system where you need fast listing without reading all files
**Example:**
```json
{
  "selected_id": "abc123",
  "versions": [
    {
      "id": "abc123",
      "name": "Default Resume",
      "created_at": "2026-07-02",
      "updated_at": "2026-07-02",
      "source_id": null
    }
  ]
}
```

### Pattern 2: Migration on First Launch

**What:** One-time server startup function that creates the library from existing data
**When to use:** When migrating from a single file to a multi-file structure
**Example:**
```javascript
// In server/index.js — runs once at startup
function migrateResumeLibrary() {
  const libraryDir = path.join(DATA_DIR, 'resume_library')
  if (fs.existsSync(libraryDir)) return  // Already migrated

  fs.mkdirSync(libraryDir, { recursive: true })

  const id = generateId()
  const resume = readJSON('resume.json')
  const now = new Date().toISOString().split('T')[0]

  const index = {
    selected_id: id,
    versions: [{
      id,
      name: 'Default Resume',
      created_at: now,
      updated_at: now,
      source_id: null
    }]
  }

  fs.writeFileSync(
    path.join(libraryDir, 'index.json'),
    JSON.stringify(index, null, 2) + '\n'
  )
  fs.writeFileSync(
    path.join(libraryDir, `${id}.json`),
    JSON.stringify(resume, null, 2) + '\n'
  )

  console.log('Migrated resume to library structure')
}
```

### Pattern 3: API CRUD for Resume Versions

**What:** RESTful endpoints for managing resume versions
**When to use:** Any multi-version document CRUD
**Example:**
```javascript
// GET /api/resume-library — list all versions (reads index.json only)
app.get('/api/resume-library', (req, res) => {
  const index = readLibraryIndex()
  res.json(index)
})

// POST /api/resume-library — create new version
app.post('/api/resume-library', (req, res) => {
  const { name, resume_data } = req.body
  const id = generateId()
  const now = new Date().toISOString().split('T')[0]
  // Write version file + update index
})

// PUT /api/resume-library/:id/select — set active version
app.put('/api/resume-library/:id/select', (req, res) => {
  const index = readLibraryIndex()
  index.selected_id = req.params.id
  writeLibraryIndex(index)
  res.json({ ok: true })
})
```

### Anti-Patterns to Avoid

- **Reading all version files on list:** The index.json should contain enough metadata to render the list. Only read individual version files when the user opens one for editing.
- **Storing selected_id in a separate file:** Keep it in index.json alongside version metadata. A separate file adds an extra read and a potential consistency issue.
- **Deleting the original resume.json:** Keep it as a safety net. The migration copies, not moves.
- **Using the full resume data in the index:** The index should only contain metadata (id, name, dates). The full resume data lives in individual version files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File system operations | Custom fs wrappers | Node.js `fs` module directly | Already used in codebase; no abstraction needed |
| ID generation | Custom UUID library | Existing `generateId()` in server/index.js | Already works, uses Date.now + random |
| JSON parsing | Custom parser | `JSON.parse` / `JSON.stringify` | Built-in, sufficient for this use case |
| React state management | Redux, Zustand | `useState` + `useEffect` | All other pages use this pattern; consistency |

## Common Pitfalls

### Pitfall 1: Data Directory Location Mismatch

**What goes wrong:** Implementing `resume_library/` inside `server/data/` when the actual data directory is the project root
**Why it happens:** Requirements say `server/data/resume_library/` but `DATA_DIR = path.join(__dirname, '..')` points to project root
**How to avoid:** Use `path.join(DATA_DIR, 'resume_library')` which resolves to `<project_root>/resume_library/`
**Warning signs:** Data files don't appear where expected; migration creates files in wrong location

### Pitfall 2: Race Condition on Index File

**What goes wrong:** Two concurrent requests modify index.json simultaneously, losing one update
**Why it happens:** No file locking in the current codebase
**How to avoid:** This is acceptable risk for a single-user local tool. The user is one person making sequential requests. No mitigation needed.
**Warning signs:** N/A -- not a real concern for this use case

### Pitfall 3: Orphaned Version Files

**What goes wrong:** Deleting a version removes it from index.json but leaves the JSON file on disk
**Why it happens:** Forgetting to delete the file when removing from index
**How to avoid:** Always delete both the index entry AND the file in the same handler
**Warning signs:** Disk usage grows unexpectedly; `resume_library/` has files not listed in index

### Pitfall 4: Breaking Existing Resume Page

**What goes wrong:** Updating `/api/resume` to read from the library breaks the Resume page if migration hasn't run
**Why it happens:** Frontend expects `/api/resume` to return resume data; if library is empty, it returns nothing
**How to avoid:** Run migration BEFORE serving requests. Use `app.listen()` callback or ensure migration runs synchronously at startup.
**Warning signs:** Blank resume page after fresh install; "Loading resume..." never resolves

### Pitfall 5: Cover Letter Generation Uses Wrong Resume

**What goes wrong:** `/api/generate-cover-letter` still reads from `resume.json` instead of the selected library version
**Why it happens:** Forgetting to update the cover letter endpoint to use the library
**How to avoid:** Update `generateCoverLetter` call to read from selected version
**Warning signs:** Cover letters don't reflect edits made to library versions

## Code Examples

### Reading the Library Index

```javascript
// Source: Pattern from existing readJSON function
function readLibraryIndex() {
  const indexPath = path.join(DATA_DIR, 'resume_library', 'index.json')
  if (!fs.existsSync(indexPath)) {
    return { selected_id: null, versions: [] }
  }
  const raw = fs.readFileSync(indexPath, 'utf-8')
  return JSON.parse(raw)
}
```

### Writing a Resume Version

```javascript
// Source: Pattern from existing writeJSON function
function writeResumeVersion(id, data) {
  const filePath = path.join(DATA_DIR, 'resume_library', `${id}.json`)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}
```

### React: Loading Selected Version on Resume Page

```jsx
// Source: Pattern from existing Resume.jsx useEffect
useEffect(() => {
  fetch('/api/resume')  // Now returns selected version from library
    .then((res) => res.json())
    .then((data) => {
      setResumeData(data)
      setSkillsText((data.skills || []).join(', '))
      setLoading(false)
    })
}, [])
```

### React: Resume Library Page Structure

```jsx
// Source: Pattern from existing Applications.jsx
function ResumeLibrary() {
  const [library, setLibrary] = useState({ selected_id: null, versions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/resume-library')
      .then(res => res.json())
      .then(data => { setLibrary(data); setLoading(false) })
  }, [])

  // Render: version list, create button, rename/delete actions, select action
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single resume.json | Library with index.json + version files | Phase 9 | Enables multi-version management |
| /api/resume reads file directly | /api/resume reads selected library version | Phase 9 | Backward-compatible; existing code works |

**Deprecated/outdated:**
- Direct `resume.json` reads in API routes: Should read from selected library version instead

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Data directory is at project root, not `server/data/` | Architecture | Files created in wrong location; migration fails |
| A2 | No new npm packages needed | Standard Stack | Unnecessary dependency installation |
| A3 | Single-user means no concurrent write concerns | Common Pitfalls | Data corruption (unlikely for single-user tool) |
| A4 | `generateId()` is sufficient for resume version IDs | Code Examples | ID collisions (extremely unlikely) |

## Open Questions

1. **Data directory location**
   - What we know: Requirements say `server/data/resume_library/` but actual `DATA_DIR` is project root
   - What's unclear: Should we follow the requirements literally or match the existing pattern?
   - Recommendation: Match existing pattern (`<project_root>/resume_library/`). Update requirements to reflect reality.

2. **Original resume.json handling**
   - What we know: Migration copies resume.json into library
   - What's unclear: Should the original resume.json be deleted after migration, kept as-is, or kept in sync?
   - Recommendation: Keep it as-is (read-only safety net). Do not sync it. Document that it's a legacy artifact.

3. **Resume page behavior after migration**
   - What we know: `/api/resume` currently reads `resume.json` directly
   - What's unclear: Should `/api/resume` be updated to read from the library, or should the Resume page use a new endpoint?
   - Recommendation: Update `/api/resume` to read from the selected library version. This keeps the Resume page unchanged and maintains backward compatibility for any other code using this endpoint.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Express server | ✓ | v23.6.0 | -- |
| npm | Package management | ✓ | 10.9.2 | -- |
| React | Frontend UI | ✓ | ^19.0.0 | -- |
| Express | API server | ✓ | ^4.21.0 | -- |
| Vite | Dev server | ✓ | ^6.0.0 | -- |

**Missing dependencies with no fallback:**
- None -- all dependencies are already installed

**Missing dependencies with fallback:**
- None

## Validation Architecture

> `workflow.nyquist_validation` is `false` in config.json. Skipping validation section.

**Note:** Testing is configured (Vitest in client, `npm run test`) but nyquist_validation is disabled. The planner should still consider manual testing of the migration path and CRUD operations.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local tool, no auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Single-user, no permissions |
| V5 Input Validation | yes | Validate resume version IDs (prevent path traversal) |
| V6 Cryptography | no | No sensitive data |

### Known Threat Patterns for JSON File Storage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via version ID | Tampering | Validate IDs match `[a-z0-9]+` pattern |
| Arbitrary file write via resume name | Tampering | Sanitize names; use ID for filenames, name for display only |
| JSON injection | Tampering | `JSON.parse` handles this; no raw string concatenation in file paths |

**Key security consideration:** Version IDs are generated server-side by `generateId()` and used as filenames. The API should never accept arbitrary filenames from the client -- always use the ID for file operations and the name field only for display.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of `server/index.js` -- verified DATA_DIR, readJSON, writeJSON patterns
- Codebase analysis of `client/src/pages/Resume.jsx` -- verified data fetching and state management patterns
- Codebase analysis of `client/src/pages/Applications.jsx` -- verified list page pattern
- Codebase analysis of `server/lib/cover-letter.js` -- verified resume data consumption
- Codebase analysis of `client/src/main.jsx` -- verified router configuration

### Secondary (MEDIUM confidence)
- Project root data file listing -- confirmed actual data directory location
- `package.json` dependency listing -- confirmed no new packages needed

### Tertiary (LOW confidence)
- None -- all findings verified against codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components already in use, no new dependencies
- Architecture: HIGH -- follows existing patterns exactly
- Pitfalls: HIGH -- derived from actual codebase analysis

**Research date:** 2026-07-02
**Valid until:** 2026-08-02 (stable -- JSON file patterns don't change frequently)
