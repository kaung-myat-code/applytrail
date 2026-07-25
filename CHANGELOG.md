# Changelog

All notable user-facing changes to ApplyTrail are documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Entries are grouped by milestone rather than by version number, since this project ships as a continuous local tool rather than a versioned package.

## [Unreleased] - v2.0 Resume Tailoring Flow

Adds AI-assisted resume tailoring: analyze a resume against a job posting, review section-by-section suggestions, generate a tailored version, and export or apply it to a new application.

### Added
- **Resume Library** — manage multiple named resume versions instead of a single resume; create, rename, delete, and select which version is active
- **Match Analysis** — analyze a resume against a job posting and get a 0-100 score with matched/missing/bonus keyword badges and a per-section breakdown (Summary, Skills, Experience, Projects, Education)
- **AI-powered analysis (optional)** — choose Gemini, OpenRouter, or Groq instead of the built-in keyword-matching heuristic, with automatic fallback to the heuristic if no API key is configured or the AI call fails
- **Section-by-section suggestions** — accept, reject, or edit individual suggested changes to your resume, with bulk Accept All / Reject All and a side-by-side diff view
- **Generate Tailored Resume** — apply your accepted suggestions to produce a new resume version, preview it read-only, and save it to the Resume Library
- **Resume export** — download any resume library version as JSON or as a formatted PDF
- **Application pre-fill** — after saving a tailored resume (or from any Resume Library card), a confirmation dialog pre-fills company, role, job posting excerpt, and an auto-generated cover letter before creating the application
- **Grouped navigation** — the navbar now groups Resume/Resume Library and Analysis/Cover Letter under dropdowns to reduce top-level clutter
- **Resume editor safety** — delete confirmations on every destructive edit, a persistent "Unsaved changes" / "Saved" indicator, and a read-only Preview modal
- **Clearer application flow** — saving a job posting now redirects straight to Cover Letter with a confirmation banner; Save Application uses an inline confirm step and lands on the Applications list; application dates are labeled "Applied on" vs. "Last status change" to remove ambiguity

### Fixed
- Creating a resume library entry with no data no longer fails with a 400 error and now produces a valid blank resume
- Keyword matching now recognizes multi-word and product/data/business terms (e.g. "stakeholder communication", "product metrics"), not just single technical terms
- Keyword badges display known acronyms correctly (e.g. "SQL" instead of "Sql")
- Generated cover letters no longer produce a doubled "s's" possessive for company names ending in "s", and vary their phrasing across different job postings instead of reading identically templated
- Fixed a crash where `POST /api/analyze` returned HTTP 500 on every request due to a field-name mismatch in validation

## [v1.1] - Release Polish - 2026-06-27

Prepared ApplyTrail for public release and portfolio presentation without changing core functionality.

### Added
- Production-ready Express server: security headers (helmet), response compression, health check endpoint, and static serving of the built React app
- Demo data seeding — the app launches with a realistic demo persona, sample job postings, and applications in varied statuses so a first-time visitor sees a populated interface
- Live deployment to Render with auto-deploy from the main branch
- MIT license, polished README with badges and screenshots, and a presentation deck

### Fixed
- Production build failure on Render caused by development dependencies being skipped during install

## [v1.0] - MVP - 2026-06-26

Initial release: an end-to-end job application workflow, from resume to cover letter to application tracking, in a local web UI.

### Added
- React + Express web app replacing the CLI-only workflow, with a single-command dev server (`npm run dev`)
- Resume editor covering contact info, summary, experience, projects, skills, and education, backed by a JSON file
- Job posting input — save a company, role, and job posting for later cover letter generation
- Cover letter generation — matches resume skills and experience to a job posting's keywords and produces a tailored paragraph, with copy-to-clipboard
- Application tracking — save generated cover letters as applications, update their status (drafted, applied, interviewing, offered, rejected, withdrawn), and see a "needs follow-up" flag on applications with no status change in 10+ days
