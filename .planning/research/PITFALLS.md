# Pitfalls Research

**Domain:** Resume optimization workflow added to existing job application tracking app
**Researched:** 2026-07-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Overwriting the Base Resume During Tailoring

**What goes wrong:**
The user generates a tailored resume for a specific job posting, and the system overwrites the original "master" resume. The user loses their canonical resume and has to reconstruct it manually. Alternatively, the tailored version gets saved back to the same `resume.json` file, silently replacing the source data.

**Why it happens:**
The current system uses a single `resume.json` file with a flat object structure. There is no concept of "resume versions." When adding tailoring, developers naturally think "save the resume" and write it back to the same file. The existing `PUT /api/resume` route overwrites the entire file on every call.

**How to avoid:**
Introduce a resume library concept early. The master resume lives at a known location (e.g., `resume_library/master.json`). Tailored resumes are new files (e.g., `resume_library/tailored-<id>.json`) that reference their source. The `PUT /api/resume` route must only update the master; tailoring always creates a new entry.

**Warning signs:**
- Any code path that calls `writeJSON('resume.json', ...)` from a tailoring endpoint
- The review interface has a "Save" button that writes to the same endpoint as the resume editor
- No `resume_id` or `source_resume_id` field in the resume data model

**Phase to address:**
First phase of v2.0 (resume library foundation). Must be solved before any tailoring logic exists.

---

### Pitfall 2: JSON File Corruption from Concurrent Writes

**What goes wrong:**
Two browser tabs or rapid user actions trigger simultaneous writes to the same JSON file. The second write reads a stale version, and one set of changes is silently lost. With the new tailoring workflow, this becomes more likely: the user might be editing the master resume in one tab while generating a tailored version in another.

**Why it happens:**
The current `readJSON`/`writeJSON` pattern uses synchronous `fs.readFileSync`/`fs.writeFileSync` with no locking or optimistic concurrency control. Each read-then-write is a race window. In v1 this was tolerable (single user, low frequency). In v2 with more write paths (resume library CRUD, tailoring save, application pre-fill), the risk increases.

**How to avoid:**
Add an `updatedAt` timestamp or version number to each JSON file. On write, read the current version, compare to what the client last saw, and reject if stale. Alternatively, use file-level locking (e.g., `proper-lockfile` npm package) around write operations. For a single-user local tool, optimistic concurrency with version checking is sufficient and simpler.

**Warning signs:**
- Two API routes that write to the same file with no coordination
- The frontend does not send any version/timestamp with PUT requests
- Users report "my changes disappeared" after using multiple tabs

**Phase to address:**
First phase of v2.0 (data model foundation). Must be in place before adding more write paths.

---

### Pitfall 3: Match Score as a Hard Gate Instead of a Soft Signal

**What goes wrong:**
The match report shows a percentage score (e.g., "42% match"), and users interpret it as a pass/fail gate. They abandon good opportunities because the score is "too low," or they over-optimize their resume to chase a high score, producing a dishonest or keyword-stuffed document. The score becomes a target rather than a signal.

**Why it happens:**
Percentage scores are psychologically powerful. Users anchor on them. If the UI presents the score prominently without context, it becomes the only thing that matters. Keyword-matching heuristics are crude -- they count word overlap but miss semantic equivalence (e.g., "built" vs "developed," "React" vs "React.js").

**How to avoid:**
Present the match report as a "gap analysis" rather than a score. Frame findings as "strengths you have" and "gaps to address" rather than a percentage. If a numeric score is included, show it alongside the qualitative breakdown and label it clearly as approximate. Never use the score to block actions (e.g., "you must reach 60% to generate a tailored resume").

**Warning signs:**
- The match score is the largest element on the report page
- The UI uses color coding tied to the score (red/yellow/green)
- There is no qualitative breakdown alongside the number
- The score uses exact keyword matching without synonym handling

**Phase to address:**
Match report / analysis phase. Design the report UI with qualitative-first framing from the start.

---

### Pitfall 4: Analysis Engine Tightly Coupled to Heuristics

**What goes wrong:**
The match scoring and suggestion generation logic is written directly inside Express route handlers or a single monolithic module. When the user later wants to swap in an LLM or third-party service, the entire analysis pipeline must be rewritten. The provider-agnostic requirement becomes impossible to honor retroactively.

**Why it happens:**
It is fastest to write the heuristics inline in the route handler. The existing `cover-letter.js` module is a good pattern, but the new analysis features (match scoring, section-by-section suggestions, gap detection) are more complex. Developers tend to build them as one cohesive block because the logic is interconnected.

**How to avoid:**
Define a clear interface/contract for the analysis engine before writing any heuristics. The interface should specify: input (resume JSON + job posting text), output (match report + per-section suggestions), and a `provider` field. The heuristic implementation is one provider. An LLM-based implementation would be another. Use a factory pattern or simple strategy object to select the provider at runtime. The existing `generateCoverLetter` in `server/lib/cover-letter.js` is the right shape -- extend this pattern, do not abandon it.

**Warning signs:**
- Analysis logic lives in `server/index.js` route handlers rather than a separate module
- No `provider` parameter or configuration option in the analysis endpoints
- The suggestion format is hardcoded to what heuristics produce (e.g., simple string replacements) rather than a structured format that richer providers could also produce
- Import statements from route files reach into heuristic-specific internals

**Phase to address:**
Analysis engine phase. Define the interface in the first task of the phase; implement heuristics as the first provider.

---

### Pitfall 5: Tailored Resume Loses Structure During Generation

**What goes wrong:**
The suggestion review interface lets users accept/reject changes, but the "generate tailored resume" step produces a flat text blob or a malformed JSON object. Sections get merged, bullet points lose their nesting, or the output does not match the structured JSON schema that the export pipeline expects.

**Why it happens:**
Suggestions are typically generated section-by-section (summary, skills, experience bullets). When reassembling them into a complete resume, developers must carefully merge accepted changes with untouched sections. Off-by-one errors in array indexing, missed nested fields, or incorrect deep-merge logic corrupt the output. The current `resume.json` has nested arrays (`experience[].bullets`, `projects[].bullets`) which are easy to mangle.

**How to avoid:**
Treat the tailored resume generation as a structured merge, not a text concatenation. Start from a deep copy of the source resume. Apply each accepted suggestion as a targeted patch to the specific path (e.g., `experience[0].bullets[2]`). Validate the output against the resume schema before saving. Write a dedicated merge utility with tests covering edge cases (empty sections, all suggestions rejected, nested bullet changes).

**Warning signs:**
- The merge logic uses string manipulation on JSON
- No deep copy of the source resume before applying changes
- No validation of the generated resume's structure before saving
- Missing test cases for "reject all suggestions" and "accept only some bullets in a section"

**Phase to address:**
Tailored resume generation phase. Write the merge utility first, test it with edge cases, then wire it into the UI.

---

### Pitfall 6: Export Pipeline Assumes a Fixed Resume Format

**What goes wrong:**
PDF/DOCX export is built against the current `resume.json` shape. When the resume schema evolves (e.g., adding a `certifications` section, changing `bullets` to `highlights`), the export templates break silently -- sections go missing, formatting is wrong, or the export crashes. Users discover the problem after downloading a broken document.

**Why it happens:**
Export templates (HTML-to-PDF, DOCX generation) are inherently coupled to the data structure. Developers hardcode section names, field paths, and array iteration logic. When the schema changes, the templates must be updated in lockstep, but there is no mechanism to enforce this.

**How to avoid:**
Build the export pipeline against a normalized intermediate representation, not the raw JSON. A `normalizeForExport(resume)` function transforms any resume version into a flat, ordered list of sections with typed content. The export templates render from this normalized form. When the schema changes, only `normalizeForExport` needs updating. Add a smoke test that exports a sample resume and checks that all expected sections appear in the output.

**Warning signs:**
- Export templates reference raw JSON paths like `resume.experience[0].bullets[0]`
- No intermediate transformation between resume data and export format
- Adding a new resume section requires changes in 3+ files (data model, API, export template)
- No automated test that round-trips a resume through export and checks section coverage

**Phase to address:**
Export phase. Build the normalizer before building the export templates.

---

### Pitfall 7: Resume Library Becomes a Junk Drawer

**What goes wrong:**
Users create many tailored resumes for different jobs but never clean them up. The resume library grows to dozens of entries with cryptic names like "tailored-2026-07-02-abc123." Users cannot find the resume they want, cannot tell which version was used for which application, and the library UI becomes overwhelming.

**Why it happens:**
Developers focus on the create path (generating tailored resumes) and underinvest in the management path (naming, organizing, linking to applications). Auto-generated names are technically unique but humanly meaningless. Without filters, search, or application linkage, the library is just a flat list.

**How to avoid:**
Auto-name tailored resumes using the target company and role (e.g., "Meridian Software - Fullstack Developer"). Store a `source_id` linking each tailored resume back to its parent and an `application_id` linking it to the application it was created for. Provide filters (by company, date, source resume) and a clear "this resume was used for application X" indicator. Allow deletion with a confirmation prompt.

**Warning signs:**
- Tailored resume names are timestamps or random IDs
- No `source_id` or `application_id` field in the resume library schema
- The library page is a flat list with no filtering or sorting
- No delete functionality for old tailored resumes

**Phase to address:**
Resume library phase. Design the naming, linking, and filtering from the start -- do not defer to "polish."

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing resume library as `resume.json` array instead of separate files | No new file I/O logic needed | File grows with every tailored resume; single write corrupts all versions; no atomic operations on individual versions | Never -- use separate files or a directory per resume |
| Hardcoding section names in match report logic | Faster to implement | Adding a new resume section requires changes in match, suggestion, and export modules | Only if you also commit to extracting the section registry before the next feature |
| Using `JSON.parse(JSON.stringify(obj))` for deep copy | Works for simple objects | Fails on Date objects, undefined values, and functions; fragile if resume schema adds complex types | MVP only -- replace with structured clone or lodash `cloneDeep` before v2.0 ships |
| Inline suggestion generation in route handlers | No module boundary to maintain | Cannot swap provider; testing requires full HTTP request; logic tangled with request parsing | Never -- the provider-agnostic requirement forbids this |
| Skipping validation on generated resumes | Faster iteration | Broken resumes get saved; export produces garbage; user loses trust | Never -- validate before save, even if the schema check is minimal |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PDF export library (e.g., `puppeteer`, `jsPDF`, `pdfkit`) | Choosing a library that requires a full browser binary (Puppeteer) on Render free tier, causing deployment failures | Use a server-side PDF library like `pdfkit` or `jsPDF` that does not require Chromium. Test on Render early. |
| DOCX export library (e.g., `docx` npm package) | Generating DOCX with hardcoded styles that look broken in Word vs Google Docs | Use the `docx` library's built-in style system; test output in both Word and Google Docs; avoid custom XML manipulation |
| File system (resume library) | Using `fs.mkdirSync` without `recursive: true` when creating resume library directory | Always use `{ recursive: true }` on directory creation; handle the case where the directory already exists |
| Existing `PUT /api/resume` route | Accidentally reusing this route for tailored resume creation, overwriting the master | Create separate endpoints for library CRUD (`POST /api/resumes`, `PUT /api/resumes/:id`); deprecate or redirect the old route |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading all resume files on every library request | Slow page load as library grows beyond 20 entries | Read only metadata (id, name, created_at, source_id) for list views; load full content on demand | ~50+ resume files on Render free tier (512MB RAM) |
| Synchronous file I/O in analysis endpoints | Server blocks during match scoring; other requests queue up | Already present in codebase (`readFileSync`/`writeFileSync`). For analysis, which may involve parsing large job postings, consider async I/O or at minimum isolate the blocking call | Large job postings (5000+ words) combined with large resumes; concurrent requests |
| Generating export on every request | PDF/DOCX generation takes 1-3 seconds; user waits on every download | Cache generated exports; regenerate only when the resume version changes (check `updatedAt` timestamp) | User exports the same resume multiple times in a session |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Path traversal in resume file names | A crafted resume ID like `../../server/index.js` could overwrite server code | Sanitize resume IDs: allow only alphanumeric characters, hyphens, and underscores. Validate before constructing file paths. |
| No size limit on job posting text | A maliciously large job posting could exhaust memory during analysis | Add a `maxBodySize` limit on the job posting endpoint (e.g., 100KB). Reject with 413 if exceeded. |
| Export path injection | If the export endpoint accepts a filename parameter, a crafted value could write to arbitrary locations | Use only the resume ID to derive the export filename; never accept user-supplied file paths |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing analysis results before the user selects a resume | User gets a match report against the wrong resume version; wastes time | Require resume selection as the first step; disable analysis until a resume is selected |
| No undo on accept/reject suggestions | User accidentally accepts a bad suggestion and cannot revert | Track accept/reject state in memory; allow toggling before final generation; show a clear "Generate" confirmation step |
| Tailored resume generation is a one-shot action with no preview | User generates a resume, realizes it is wrong, has to start over | Show a preview of the tailored resume before saving; allow going back to the review step |
| Export button available on the master resume before any tailoring | User exports the un-tailored resume thinking it is the tailored version | Label exports clearly with the resume name; consider disabling export of non-tailored versions from the tailoring flow |
| Application pre-fill happens automatically with no confirmation | User did not intend to create an application yet; now they have a draft they did not ask for | Show a confirmation step: "Create application for [Company] - [Role]?" with pre-filled data visible |

## "Looks Done But Isn't" Checklist

- [ ] **Resume Library:** Verify that deleting a resume does not orphan applications that reference it -- check `application.resume_id` foreign key integrity
- [ ] **Match Report:** Verify that the report handles edge cases -- empty resume sections, job posting with no keywords, resume with no skills listed
- [ ] **Suggestion Review:** Verify that rejecting all suggestions produces a valid (unchanged) resume, not an empty one
- [ ] **Tailored Resume Generation:** Verify the generated resume passes schema validation and renders correctly in the resume editor
- [ ] **Export:** Verify PDF and DOCX exports contain all sections, handle special characters in bullet points, and look acceptable in target applications (Word, Google Docs, browser PDF viewer)
- [ ] **Application Pre-fill:** Verify that the pre-filled application correctly links to the job posting and the tailored resume, and that the link persists across page refreshes
- [ ] **Provider Swap:** Verify that the analysis engine can be swapped by changing a config value, with no code changes in route handlers or UI

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Base resume overwritten | HIGH | Restore from git history if committed; otherwise reconstruct from memory. Prevention is far cheaper. |
| JSON file corruption from concurrent writes | MEDIUM | Restore from git; add concurrency control. Data loss is limited to the session. |
| Tailored resume loses structure | LOW | Discard and regenerate. The source resume is untouched if Pitfall 1 was prevented. |
| Export produces broken document | LOW | Fix the template and re-export. No data loss -- the resume data is fine, only the rendering was wrong. |
| Resume library becomes unmanageable | MEDIUM | Retroactively add metadata (source links, application links, better names). Requires data migration. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Overwriting base resume | Resume library foundation (Phase 1) | Create a tailored resume; verify master resume is unchanged on disk |
| JSON file corruption | Resume library foundation (Phase 1) | Open two tabs; edit the same resume simultaneously; verify no data loss |
| Match score as hard gate | Match report phase | Review the report UI; verify qualitative breakdown is primary, score is secondary |
| Analysis engine coupling | Analysis engine phase | Change the provider config; verify no route handler or UI code changes needed |
| Tailored resume loses structure | Generation phase | Generate a resume with partial accept/reject; verify JSON structure passes validation |
| Export assumes fixed format | Export phase | Add a test resume section; verify export still works without template changes |
| Library becomes junk drawer | Resume library phase | Create 10+ tailored resumes; verify filtering, naming, and application linkage work |

## Sources

- Existing codebase analysis: `server/index.js`, `server/lib/cover-letter.js`, `server/data/`, `server/demo-data/`
- Current data model: `resume.json` (single object), `applications.json` (flat array), `job_postings.json` (flat array)
- Current architecture: Express 4 with sync JSON file I/O, no schema validation, no concurrency control
- Project constraints from `PROJECT.md`: provider-agnostic analysis, structured JSON schema, JSON file storage

---
*Pitfalls research for: Resume optimization workflow added to existing job application tracking app*
*Researched: 2026-07-02*
