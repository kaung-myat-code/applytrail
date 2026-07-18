# Requirements: ApplyTrail v2.0 Resume Tailoring Flow

**Milestone:** v2.0
**Name:** Resume Tailoring Flow
**Goal:** Build an end-to-end resume optimization workflow that analyzes a selected resume against a job posting, generates actionable improvement suggestions, lets users review every change, creates a new tailored resume version, and seamlessly starts a job application.

## v2.0 Requirements

### Resume Library

- [ ] **LIBRARY-01**: Resume versions are stored as separate JSON files with a metadata index (`index.json`) in `server/data/resume_library/`
- [ ] **LIBRARY-02**: User can list, view, create, rename, and delete resume versions from a Resume Library page
- [x] **LIBRARY-03**: Tailored resumes are auto-named using "Company - Role" format (e.g., "Meridian Software - Fullstack Developer")
- [ ] **LIBRARY-04**: Existing `resume.json` is migrated to the library structure on first launch, preserving all data
- [ ] **LIBRARY-05**: User can select which resume version to use as the base for analysis and tailoring

### Job Posting Analysis & Match Report

- [x] **ANALYSIS-01**: Display overall compatibility score with strengths, gaps, and summary explanation
- [x] **ANALYSIS-02**: Match report displays matched, missing, and bonus keywords as categorized groups
- [x] **ANALYSIS-03**: Match report includes section-level findings for Summary, Skills, Experience, Projects, and Education
- [x] **ANALYSIS-04**: Analysis engine uses a provider-agnostic interface so heuristics, AI models, or third-party services can be swapped without changing the UI

### Section-by-Section Suggestions

- [x] **SUGGEST-01**: Generate section-level suggestions (add, modify, remove) with explanation for each recommendation
- [x] **SUGGEST-02**: User can accept, reject, or manually edit each suggestion individually
- [x] **SUGGEST-03**: User can accept all or reject all suggestions with bulk controls
- [x] **SUGGEST-04**: User can compare current and suggested content side-by-side in a diff view

### Tailored Resume Generation

- [x] **TAILOR-01**: Apply user-approved structured patches to a deep copy of the source resume
- [x] **TAILOR-02**: Tailored resume is saved as a new version with auto-naming, without overwriting the source resume
- [x] **TAILOR-03**: User can preview the tailored resume before final save
- [x] **TAILOR-04**: Tailored resume is linked to its source resume via `source_id`
- [x] **TAILOR-05**: User can return to suggestion review from preview without losing accepted/rejected edits
- [x] **TAILOR-06**: Generated resume must conform to the resume JSON schema before it can be saved or exported

### Application Pre-fill & Export

- [x] **PREFILL-01**: User can create a new application pre-filled with company, role, and job posting from the analyzed job posting
- [x] **PREFILL-02**: A confirmation dialog is shown before creating the application, with pre-filled data visible
- [x] **PREFILL-03**: Created application is linked to the tailored resume via `resume_version_id`
- [x] **EXPORT-01**: User can export any resume version as a PDF file
- [x] **EXPORT-02**: User can export any resume version as a JSON file

### UX & Quality Polish (Phase 14)

Each requirement below maps 1:1 to a tracked GitHub issue (#2-#8) filed against the 2026-07-05 exploratory UAT (`feedback/feedback.md`). See `.planning/phases/14-ux-quality-polish-from-user-feedback/14-CONTEXT.md` for the full locked-decision breakdown (D-01 through D-15) behind each item.

- [ ] **UX-ISSUE-02**: Saving a job posting on New Application redirects to Cover Letter with a transitional confirmation, and "Save Application" on Cover Letter is a distinct confirmed action (separate from "Generate") that redirects to the Applications list on success — closes GitHub #2
- [ ] **UX-ISSUE-03**: `POST /api/resume-library` creates a valid resume version when given no/empty body (contact defaults to empty strings, not `{}`), covered by a regression test — closes GitHub #3
- [ ] **UX-ISSUE-04**: Match-analysis keyword whitelist (`server/lib/analysis/keywords.js`) covers product/data-analytics/business-soft-skill terms in addition to the existing technical whitelist — closes GitHub #4
- [ ] **UX-ISSUE-05**: Generated cover-letter paragraphs and suggestion bullets have correct possessive-apostrophe and acronym-casing handling and vary their templates/keyword usage to read less generic — closes GitHub #5
- [ ] **UX-ISSUE-06**: Resume editor requires confirmation before deleting an experience/project/education entry or bullet, shows a "Saved" / "Unsaved changes" indicator near the save action, and offers a read-only resume preview — closes GitHub #6
- [ ] **UX-ISSUE-07**: Top-level navigation is collapsed into grouped sections reflecting the linear job-search workflow, with contextual "Continue to [next step]" CTAs on workflow pages — closes GitHub #7
- [ ] **UX-ISSUE-08**: `npx eslint .` passes cleanly (`client/dist` excluded, `prop-types` added, unused vars removed) — closes GitHub #8

## Future Requirements

- [ ] **FUTURE-01**: Keyword density visualization showing where keywords appear in the resume
- [ ] **FUTURE-02**: Batch tailoring for multiple job postings at once
- [ ] **FUTURE-03**: Resume templates with different visual layouts for export
- [ ] **FUTURE-04**: Resume comparison between any two versions (not just current vs suggested)
- [ ] **FUTURE-05**: Export resume as DOCX file

## Architectural Constraint

**Structured Patch Workflow:** The analysis engine must never modify a resume directly. Instead, it returns structured patches describing additions, modifications, and removals. The application applies only the user-approved patches to a deep copy of the source resume, validates the result against the resume JSON schema, and saves it as a new resume version. This keeps the analysis engine stateless, simplifies the review and diff interface, preserves the original resume, and allows different analysis providers to be swapped without affecting the application workflow.

## Out of Scope

- **Auto-optimize** -- Removes user control, may produce dishonest content. Users must review every change.
- **ATS format checking** -- Irrelevant; JSON schema already guarantees parseability. Export templates use standard formats.
- **Real-time score updates** -- Expensive, creates score-chasing behavior. Analysis runs on demand.
- **LinkedIn profile optimization** -- Scope explosion. Focus on resume optimization first.
- **AI resume writing from scratch** -- Violates user-owns-content principle. System suggests improvements, never generates content the user hasn't reviewed.
- **Authentication** -- Single-user local tool, no login needed.
- **Job scraping** -- User pastes postings manually.
- **Email sending** -- Out of scope.
- **Payment/billing** -- No monetization.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LIBRARY-01 | Phase 9 | Pending |
| LIBRARY-02 | Phase 9 | Pending |
| LIBRARY-03 | Phase 12 | Complete |
| LIBRARY-04 | Phase 9 | Pending |
| LIBRARY-05 | Phase 9 | Pending |
| ANALYSIS-01 | Phase 10 | Complete |
| ANALYSIS-02 | Phase 10 | Complete |
| ANALYSIS-03 | Phase 10 | Complete |
| ANALYSIS-04 | Phase 10 | Complete |
| SUGGEST-01 | Phase 11 | Complete |
| SUGGEST-02 | Phase 11 | Complete |
| SUGGEST-03 | Phase 11 | Complete |
| SUGGEST-04 | Phase 11 | Complete |
| TAILOR-01 | Phase 12 | Complete |
| TAILOR-02 | Phase 12 | Complete |
| TAILOR-03 | Phase 12 | Complete |
| TAILOR-04 | Phase 12 | Complete |
| TAILOR-05 | Phase 12 | Complete |
| TAILOR-06 | Phase 12 | Complete |
| PREFILL-01 | Phase 13 | Complete |
| PREFILL-02 | Phase 13 | Complete |
| PREFILL-03 | Phase 13 | Complete |
| EXPORT-01 | Phase 13 | Complete |
| EXPORT-02 | Phase 13 | Complete |
| UX-ISSUE-02 | Phase 14 | Pending |
| UX-ISSUE-03 | Phase 14 | Pending |
| UX-ISSUE-04 | Phase 14 | Pending |
| UX-ISSUE-05 | Phase 14 | Pending |
| UX-ISSUE-06 | Phase 14 | Pending |
| UX-ISSUE-07 | Phase 14 | Pending |
| UX-ISSUE-08 | Phase 14 | Pending |

---
*Requirements defined: 2026-07-02*
*Milestone: v2.0 Resume Tailoring Flow*
