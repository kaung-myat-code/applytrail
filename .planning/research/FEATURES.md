# Feature Research

**Domain:** Resume Optimization Workflow
**Researched:** 2026-07-02
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Resume Match Score | Every major tool (Jobscan, Resume Worded, Enhancv, SkillSyncer) provides a percentage or numerical score. Users expect to see how well their resume matches a job posting before investing time tailoring. | LOW | Extend existing `matchResumeToJob()` in `cover-letter.js`. Count matched vs total keywords. Return percentage. Display as colored progress indicator (red < 50%, yellow 50-75%, green > 75%). |
| Gap Analysis | Users expect to see what's missing -- hard skills, soft skills, keywords -- before they start editing. Jobscan and SkillSyncer both surface missing keywords prominently. | LOW | Extract keywords from job posting, compare to resume skills/experience. Return lists: `matched`, `missing`, `bonus` (present in resume but not in posting). Display as categorized keyword chips. |
| Section-by-Section Suggestions | Resume Worded provides per-bullet feedback. Enhancv analyzes 27 checks across content, layout, and keywords. Users expect granular, actionable advice, not a single score. | MEDIUM | Generate improvement suggestions per resume section (Summary, Skills, Experience, Projects, Education). Each suggestion should have a `type` (add, modify, remove), `section`, `current` (if modifying), and `suggested` content. |
| Tailored Resume Version Creation | Teal and Enhancv both create tailored resumes per application. Users expect the output to be a new file, not a modification of their original. | MEDIUM | Copy base resume, apply accepted suggestions, save as new version with auto-generated name (e.g., "Software Developer at Acme Corp"). Link to application record. |
| Accept/Reject Workflow | Users expect control over suggestions. Kickresume offers before/after toggle. Rezi offers inline accept/reject. Users want to review each change individually. | MEDIUM | Each suggestion has accept/reject state. User can accept all, reject all, or toggle individually. Accepted changes apply to the new resume version. Rejected changes are discarded. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Side-by-Side Review | Most competitors show suggestions inline or in a list. A true side-by-side diff view (original vs. suggested) is rare -- Jobscan shows score changes, not content diffs. This would be a significant UX advantage. | HIGH | Split-pane layout: left = original resume section, right = suggested version. Highlight additions (green), removals (red), modifications (yellow). User can edit the right pane directly before accepting. |
| Provider-Agnostic Analysis Engine | PROJECT.md specifies this as a key decision. Users can switch between heuristics, AI models, or third-party services without changing the UI. Most competitors are locked to their own engine. | MEDIUM | Analysis engine as a pluggable interface. Default: keyword-matching heuristics (extend existing `cover-letter.js` logic). Future: swap in OpenAI, Anthropic, or Jobscan API without UI changes. Define a standard `AnalysisResult` schema. |
| Resume Version Library | Teal organizes tailored resumes per application. Enhancv tracks them in a job tracker. A dedicated version library with search, rename, delete, and compare is uncommon in competitors. | MEDIUM | Store resume versions in `resume_versions/` directory. Each version has metadata: `id`, `name`, `created_at`, `base_resume_id`, `job_posting_id`, `application_id`. Library page with grid/list view, search, rename, delete. |
| Keyword Density Visualization | Jobscan shows keyword match rate but not density. Showing where keywords appear in the resume (and where they're missing) would help users optimize placement. | LOW | For each matched keyword, highlight which section it appears in. For missing keywords, suggest which section to add them to. Visual: keyword chips with section badges. |
| Export to PDF/DOCX | PROJECT.md lists this as a target feature. Most competitors offer export. This is table-stakes for a complete tool but differentiating here because structured JSON as source of truth is unusual. | MEDIUM | Generate PDF from structured JSON resume. Use a library like `pdfkit` or `puppeteer`. DOCX via `docx` npm package. Preserve formatting and section structure. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-Optimize (Auto-Insert Keywords) | SkillSyncer offers this. Users want one-click tailoring. | Removes user control. May insert keywords in unnatural positions. Creates resume content the user didn't write or approve. Violates the "review every change" principle. | Provide suggestions with accept/reject. Let user control what goes in. Show preview before generating. |
| ATS Format Checking | Jobscan checks for ATS-compatible formatting. Users worry about parsing. | ApplyTrail uses structured JSON as source of truth, not a document format. Format checking is irrelevant when the data model is already structured. Would add complexity without value. | Skip. The JSON schema guarantees parseability. Export formats (PDF/DOCX) will use standard templates. |
| Real-Time Score Updates | Jobscan shows score changes as you edit. Users want instant feedback. | Requires re-analyzing on every keystroke. Expensive if using an AI engine. Creates pressure to optimize for score rather than quality. | Show score after generation, not during editing. Let user re-analyze manually when ready. |
| LinkedIn Profile Optimization | Resume Worded offers this. Users want to optimize their LinkedIn too. | Different data format, different platform, different audience. Massive scope expansion. Not related to the core resume tailoring workflow. | Defer entirely. Focus on resume optimization first. |
| AI Resume Writing from Scratch | Kickresume and Enhancv offer full AI resume generation. Users want to start from zero. | Violates the "user owns the content" principle. Creates resumes the user may not accurately represent their experience. High risk of hallucination. | Provide suggestions to improve existing content. Never generate content the user hasn't reviewed. |

## Feature Dependencies

```
Resume Match Score
    └──requires──> Keyword Extraction (exists in cover-letter.js)

Gap Analysis
    └──requires──> Keyword Extraction
    └──requires──> Resume Skills/Experience Data (exists in resume.json)

Section-by-Section Suggestions
    └──requires──> Gap Analysis
    └──requires──> Provider-Agnostic Analysis Engine Interface

Accept/Reject Workflow
    └──requires──> Section-by-Section Suggestions

Tailored Resume Version Creation
    └──requires──> Accept/Reject Workflow
    └──requires──> Resume Version Storage

Side-by-Side Review
    └──enhances──> Accept/Reject Workflow

Resume Version Library
    └──requires──> Tailored Resume Version Creation

Application Pre-fill
    └──requires──> Tailored Resume Version Creation
    └──enhances──> Existing Application Tracking

Export (PDF/DOCX)
    └──requires──> Tailored Resume Version Creation (or any resume version)
```

### Dependency Notes

- **Keyword Extraction already exists:** `extractKeywords()` in `cover-letter.js` does exactly what's needed for match scoring and gap analysis. Extend, don't rebuild.
- **Resume Version Storage is new infrastructure:** Currently `resume.json` is a single file. Need a `resume_versions/` directory or a `resume_versions.json` index file. This is the biggest structural change.
- **Provider-Agnostic Engine is an interface, not a feature:** Define the `AnalysisResult` schema first, then implement heuristics against it. Future providers (AI, third-party) implement the same interface.
- **Side-by-Side Review enhances Accept/Reject:** Can ship without it (list-based review), then add the diff view later as a UX upgrade.
- **Application Pre-fill reuses existing infrastructure:** The `applications.json` schema already supports `company`, `role`, `job_posting`. Add `resume_version_id` field to link to the tailored version.

## MVP Definition

### Launch With (v2.0)

Minimum viable product -- what's needed to validate the resume tailoring workflow.

- [ ] Resume Match Score -- Users need to see alignment before investing time. Extends existing keyword extraction. LOW complexity.
- [ ] Gap Analysis -- Users need to see what's missing. Same keyword extraction, different output. LOW complexity.
- [ ] Section-by-Section Suggestions -- Core value of the feature. Generates actionable improvements per section. MEDIUM complexity.
- [ ] Accept/Reject Workflow -- Users must control what goes into their resume. MEDIUM complexity.
- [ ] Tailored Resume Version Creation -- The output of the workflow. Creates a new version without overwriting the original. MEDIUM complexity.
- [ ] Application Pre-fill -- Seamless handoff from tailoring to application tracking. LOW complexity.

### Add After Validation (v2.1)

Features to add once core tailoring workflow is working.

- [ ] Side-by-Side Review -- UX upgrade to the accept/reject workflow. HIGH complexity but high value.
- [ ] Resume Version Library -- Manage, search, rename, delete versions. MEDIUM complexity.
- [ ] Provider-Agnostic Engine Interface -- Define the schema for swappable analysis engines. MEDIUM complexity. Important for future AI integration.
- [ ] Keyword Density Visualization -- Show where keywords appear and where they're missing. LOW complexity.

### Future Consideration (v2.2+)

Features to defer until core workflow is validated.

- [ ] Export to PDF/DOCX -- Valuable but not core to the tailoring workflow. MEDIUM complexity.
- [ ] Batch Tailoring -- Tailor resume for multiple jobs at once. HIGH complexity. Low priority until single-job workflow is solid.
- [ ] Resume Templates -- Different visual layouts for exported resumes. HIGH complexity. Scope expansion.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Resume Match Score | HIGH | LOW | P1 |
| Gap Analysis | HIGH | LOW | P1 |
| Section-by-Section Suggestions | HIGH | MEDIUM | P1 |
| Accept/Reject Workflow | HIGH | MEDIUM | P1 |
| Tailored Resume Version Creation | HIGH | MEDIUM | P1 |
| Application Pre-fill | MEDIUM | LOW | P1 |
| Side-by-Side Review | HIGH | HIGH | P2 |
| Resume Version Library | MEDIUM | MEDIUM | P2 |
| Provider-Agnostic Engine | MEDIUM | MEDIUM | P2 |
| Keyword Density Visualization | MEDIUM | LOW | P2 |
| Export to PDF/DOCX | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for v2.0 launch
- P2: Should have, add in v2.1
- P3: Nice to have, future consideration

## Existing Assets to Leverage

The project already has infrastructure that reduces implementation effort:

| Asset | Current State | Reuse Potential |
|-------|---------------|-----------------|
| `extractKeywords()` in `cover-letter.js` | Extracts keywords from job posting text, filters stop words | Direct reuse for match scoring and gap analysis |
| `matchResumeToJob()` in `cover-letter.js` | Matches resume skills/experience to job posting keywords | Extend to return match percentage and missing keywords |
| `resume.json` schema | Structured JSON with summary, experience, projects, skills, education | Base for resume versioning -- copy and modify |
| `applications.json` schema | Stores company, role, job_posting, cover_letter_paragraph, status | Add `resume_version_id` field for pre-fill |
| React SPA with React Router | Working frontend with page-based routing | Add new routes for match report, review, version library |
| Express API with JSON file I/O | `readJSON()`/`writeJSON()` helpers | Reuse for resume version CRUD |
| CSS Modules | Component-scoped styling | Consistent styling for new components |

## Competitor Feature Analysis

| Feature | Jobscan | Resume Worded | Teal | SkillSyncer | Enhancv | ApplyTrail (Planned) |
|---------|---------|---------------|------|-------------|---------|---------------------|
| Match Score | Yes (75% target) | Yes (out of 100) | Yes | Yes | Yes (27 checks) | Yes (percentage + color coding) |
| Gap Analysis | Missing keywords | Missing keywords | Missing keywords | Missing keywords | Keyword gaps | Missing + bonus keywords |
| Section Feedback | Formatting checks | Per-bullet feedback | AI suggestions | Auto-optimize | 27 checks | Per-section suggestions with accept/reject |
| Side-by-Side | Score delta only | No | No | No | No | Yes (split-pane diff) |
| Versioning | No | No | Per-application | No | Per-application | Full version library |
| Export | No | No | No | No | Yes | PDF/DOCX/JSON |
| Provider Lock | Yes (their engine) | Yes (their engine) | Yes (their engine) | Yes (their engine) | Yes (their engine) | No (pluggable) |

## Sources

- Jobscan (https://www.jobscan.co/) -- Match score calculation, gap analysis, ATS-specific detection, keyword matching. Confidence: MEDIUM.
- Resume Worded (https://www.resumeworded.com/) -- Scoring system, per-bullet feedback, section analysis, resume targeting. Confidence: MEDIUM.
- SkillSyncer (https://skillsyncer.com/) -- Match score, gap analysis, auto-optimize, bullet point generator. Confidence: MEDIUM.
- Enhancv (https://enhancv.com/) -- Tailoring score, 27 checks, keyword gaps, job tracker integration. Confidence: MEDIUM.
- Teal -- Unable to fetch (certificate error). Known features from training data: match score, keyword analysis, version control. Confidence: LOW.
- Training data on UX patterns for side-by-side comparison and accept/reject workflows. Confidence: MEDIUM.

---
*Feature research for: Resume Optimization Workflow*
*Researched: 2026-07-02*
