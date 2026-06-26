# Plan 03-01 Summary: Cover Letter Engine + API

**Phase:** 03-cover-letter-generation
**Plan:** 01
**Status:** Complete
**Completed:** 2026-06-26

## What Was Built

### server/lib/cover-letter.js (new file)
- `extractKeywords(postingText)` — Extracts meaningful keywords from job posting text, filtering stop words
- `matchResumeToJob(resume, postingText)` — Matches resume skills, experience bullets, and project bullets to job posting keywords
- `generateCoverLetter(resume, jobPosting)` — Assembles a 4-6 sentence cover letter paragraph

### server/index.js (modified)
- Added `POST /api/generate-cover-letter` route
- Accepts `{ job_posting_id }`, returns `{ ok: true, cover_letter_paragraph }`
- Error handling: 400 for missing ID, 404 for posting not found

## Verification Results

| Test | Result |
|------|--------|
| extractKeywords extracts react, node.js, postgresql | PASS |
| matchResumeToJob finds 7 skills and 9 experience bullets | PASS |
| generateCoverLetter returns 830-char paragraph | PASS |
| Paragraph mentions company (pitchIN) and role (Fullstack Developer) | PASS |
| Paragraph includes measurable achievements (30%, 68%, 12) | PASS |
| Achievement sentence uses different bullet than experience sentences | PASS |
| POST /api/generate-cover-letter returns OK | PASS |
| 400 for missing job_posting_id | PASS |
| 404 for non-existent posting ID | PASS |
| Module exports 3 functions, no Express dependency | PASS |

## Sample Output

> My background in software development with hands-on experience in React, Node.js, Express aligns well with your need for a Fullstack Developer at pitchIN. For instance, built and shipped a customer-facing booking dashboard in React and TypeScript, cutting average support-ticket resolution time by 30% by surfacing order history directly in the UI. Additionally, wrote unit tests with Jest for a previously untested billing module, raising coverage from 12% to 68% over four months. These kinds of results — designed and implemented 12 REST API endpoints in Node.js/Express backing the dashboard, with input validation and consistent error responses across all routes. — reflect the impact I aim to deliver. I would welcome the chance to bring this experience to the Fullstack Developer position and contribute to pitchIN's goals.

## Design Decisions

- **Separate module:** cover-letter.js has no Express imports — pure functions only, designed to be replaceable with LLM later
- **Keyword matching:** Case-insensitive, filters stop words, prefers measurable achievements
- **Bullet deduplication:** Experience and achievement sentences use different resume bullets
- **Tone:** Professional, first person, avoids hype phrases (per legacy skill guidelines)
