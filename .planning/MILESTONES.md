# Milestones

## v2.0 Resume Tailoring Flow (Shipped: 2026-07-26)

**Phases completed:** 8 phases, 22 plans, 46 tasks

**Key accomplishments:**

- 09-01-PLAN.md
- Provider-agnostic analysis engine with heuristic keyword matching, REST API endpoint, and full match report UI with score, keyword groups, and section findings
- AI-powered resume analysis with Google Gemini via Vercel AI SDK, Zod-validated structured output, and automatic heuristic fallback
- 11.5 AI Analysis Provider
- Multi-provider AI backend with Gemini, OpenRouter, Groq support and automatic fallback chain to heuristic
- Heuristic-based per-section suggestion generation with accept/reject/edit workflow, bulk controls, and side-by-side diff comparison using react-diff-viewer-continued
- Deterministic patch application engine (searches all experience/project entries, deep-clones before mutating) plus ephemeral draft CRUD storage at project-root drafts/, wired through applyPatches for tailored resume generation
- Generate button creates a server-side draft and navigates via `?draft=<id>` URL param; new PreviewTailored page renders the full tailored resume read-only with an editable auto-filled name and Save to Library; ReviewSuggestions now hydrates decisions from the draft on return, closing the TAILOR-05 refresh gap
- Added `/resume/:id` route, version-aware Edit links on Resume Library cards, and made Resume.jsx branch between `/api/resume-library/:id` and the legacy `/api/resume` based on the URL param, closing the frontend gap that made every "Edit" click land on the default resume regardless of which card was clicked.
- Backend contract for resume export (JSON/PDF via pdfmake) and application pre-fill (resume_version_id linkage), built and verified before the frontend plans consume it
- First modal/dialog component in the codebase — pre-fills company/role/job-posting-excerpt/resume-version from props, auto-generates a cover letter on mount, and only creates an application on explicit Confirm — built and verified with real vitest + Testing Library tests (RED/GREEN TDD)
- Wires the CreateApplicationModal (built in 13-02) into its two trigger points -- automatic after saving a tailored resume, and manual from any Resume Library card -- and adds Export PDF / Export JSON actions to every resume version card, calling the backend routes built in 13-01
- Fixed `POST /api/resume-library`'s schema-invalid `contact: {}` fallback by extracting a `defaultResumeData()` module and adding a regression test that proves the original bug and its fix.
- Broadened `TECH_KEYWORDS` with a Product/Data/Business skills category plus multi-word phrase matching in `extractKeywords()`, and added an `ACRONYM_CASING` map (server) mirrored by a `displayCase()` helper (client) so Analysis page keyword badges show "SQL" instead of "sql".
- Fixed the doubled-s possessive grammar bug and naive acronym capitalization in generated cover letters and resume suggestions, and added deterministic template variance so generated text no longer reads identically templated across different job postings.
- NewApplication redirects to Cover Letter with a transitional banner; Cover Letter's Save Application now expands an inline Confirm & Save/Cancel row that navigates to /applications; Applications list clarifies "Applied on" vs "Last status change" date labels.
- Collapsed the 7-item flat navbar into Dashboard / Resume-group / New Application / Tailor-group / Applications with click-to-open, single-open-at-a-time dropdowns, and relabeled the Analysis page's suggestions link as an explicit "Continue to Review Suggestions →" step.
- Resume editor gains window.confirm guards on all five destructive actions, a persistent Unsaved/Saved indicator, and a read-only Preview modal reusing the CreateApplicationModal shell — closing GitHub #6.
- client/dist excluded from ESLint via flat-config global ignore; prop-types promoted from phantom transitive to declared direct devDependency, unblocking Plan 14-08's PropTypes cleanup
- Fixed all 88 real ESLint errors (missing PropTypes on 8 components, 1 dead-code unused-var pair, 1 unescaped entity) so `npx eslint .` exits 0 with zero errors and zero warnings across the entire client/ tree.
- Corrected a one-field-name mismatch (`.ok` vs `.valid`) at three `/api/analyze` validation guards in `server/index.js`, restoring the Analysis feature end-to-end, backed by a new route-level regression test wired into `npm test`
- Closed three silent no-op gaps in the tailored-resume patch engine (summary+remove, skills+modify, education-all-types) by implementing the two real gaps, excluding education by design, and making every skip visible to both the return-value contract and the end user

---
