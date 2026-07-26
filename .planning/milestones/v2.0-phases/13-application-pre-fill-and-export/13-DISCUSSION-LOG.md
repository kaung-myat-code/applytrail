# Phase 13: Application Pre-fill and Export - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 13-Application Pre-fill and Export
**Areas discussed:** Pre-fill entry point & flow, Confirmation dialog contents, Legacy New Application page, PDF export approach

---

## Pre-fill Entry Point & Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-trigger after saving tailored resume | Show pre-fill confirmation immediately after PreviewTailored.jsx save succeeds | |
| Button on Resume Library card | Add a "Create Application" action to the library card, user triggers manually | |
| Both — auto-trigger, plus library action | Auto-trigger is primary path; library card action available for later/skipped cases | ✓ |

**User's choice:** Both — auto-trigger, but also allow later from library
**Notes:** None

---

## Confirmation Dialog Contents

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog, editable fields | Overlay modal, company/role/status editable, posting text and resume link read-only | ✓ |
| Dedicated confirm page | New route showing the same fields full-page | |
| Modal, read-only preview only | Modal shows data but nothing editable at this step | |

**User's choice:** Modal dialog, editable fields

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generate cover letter, default status 'drafted' | Reuse existing cover-letter generation logic, pre-fill editable paragraph in modal, default status 'drafted' | ✓ |
| No cover letter here, add it later | Modal only handles company/role/status/resume link | |

**User's choice:** Auto-generate cover letter, default status 'drafted'
**Notes:** None

---

## Legacy New Application Page

| Option | Description | Selected |
|--------|-------------|----------|
| Leave it as-is | Separate manual-entry path; fixing it is backlog issue #2, deferred | ✓ |
| Fix it now: also create the application | Make it create an application using the currently-selected resume | |
| Remove/replace it with a link into the new flow | Redirect users to start from Resume Library → Analysis instead | |

**User's choice:** Leave it as-is (Recommended for scope)
**Notes:** Confirmed as backlog issue #2 territory, not Phase 13 scope.

---

## PDF Export Approach

| Option | Description | Selected |
|--------|-------------|----------|
| pdfmake (server-side, no headless browser) | Pure-JS layout-based PDF generation, low memory footprint, safe for Render free tier | ✓ |
| Puppeteer/headless Chrome (HTML→PDF) | Pixel-perfect fidelity with on-screen preview, high OOM risk on 512MB instance | |
| Client-side generation (jsPDF/browser print) | Zero server memory cost, weaker layout control | |

**User's choice:** pdfmake (server-side, no headless browser)

| Option | Description | Selected |
|--------|-------------|----------|
| Resume Library card actions | Add Export PDF / Export JSON buttons to each resume version card | ✓ |
| Resume editor page only | Export buttons on Resume.jsx edit page for the open version | |
| Both library and editor | Export actions available in both places | |

**User's choice:** Resume Library card actions
**Notes:** Directly addresses the Render free-tier RAM concern already flagged in STATE.md.

---

## Claude's Discretion

- Exact pdfmake layout/typography (fonts, margins, section ordering) — no specific visual reference given.
- Whether the pre-fill modal is a single form or a two-step interaction inside the modal.

## Deferred Ideas

- NewApplication.jsx confusion (job posting vs. application workflow) — tracked as backlog issue #2 under Phase 999.1, not touched in Phase 13.
