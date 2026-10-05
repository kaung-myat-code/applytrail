---
phase: 16
slug: hosted-demo-safety-documentation
status: verified
threats_open: 0
asvs_level: 1
block_on: high
created: 2026-10-02
audited: 2026-10-02
---

# Phase 16 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Visitor → hosted client shell | An unauthenticated visitor can enter arbitrary content into a shared writable demo. | Resume, contact, credential, secret, and job-search content |
| Client → existing API/storage | Existing browser actions continue writing through the unchanged API to JSON files; this phase creates no isolation or access control. | Resume, job-posting, application, and generated-file data |
| Server → optional AI provider | Selected optional providers receive submitted content for analysis; heuristic mode remains local. | Resume and job-posting content |
| Developer → runtime configuration | Local provider keys and server settings load from `server/.env`; production uses Render environment variables. | Provider keys and runtime settings |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-16-01 | Information disclosure | Hosted App-shell warning and README | high | mitigate | Route-wide no-private-data warning and matching README guidance | closed |
| T-16-02 | Information disclosure | AI provider configuration | high | mitigate | Explicit local heuristic versus third-party content-transfer documentation | closed |
| T-16-03 | Tampering | Shared hosted JSON behavior | medium | mitigate | Shared, writable, disposable, resettable behavior disclosed without isolation/durability promises | closed |
| T-16-04 | Misconfiguration | README runtime/environment instructions | medium | mitigate | Manifest-backed versions and `server/.env` instructions derived from the root dev command | closed |
| T-16-SC | Tampering | Dependency installation | high | mitigate | No package or lockfile changes; existing lint, test, build, and diff gates pass | closed |

*Status: open · closed · open — below high threshold (non-blocking)*  
*Severity: critical > high > medium > low — only open threats at or above `block_on: high` count toward `threats_open`.*  
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party).*

## Threat Verification

All five plan-authored threats were verified at ASVS level 1 using the implementation and documentation named by each mitigation plan. No accepted-risk or transfer disposition was used.

| Threat ID | Verification evidence | Result |
|-----------|-----------------------|--------|
| T-16-01 | `client/src/App.jsx:9-18` renders a semantic alert in the shared shell before `<Outlet />`; required warning and private-data terms are asserted in `client/src/App.test.jsx:24-54`. Matching hosted warning is present in `README.md:18`. | CLOSED |
| T-16-02 | `AI_PROVIDERS.md:5-7` states heuristic analysis is local/offline and that Gemini, OpenRouter, and Groq receive submitted resume and job-posting content. | CLOSED |
| T-16-03 | `README.md:18` discloses shared/writable behavior, possible reset/loss, and no durable storage/privacy promise; `README.md:87-89` separately describes shared, disposable, resettable, non-isolated hosted JSON data. | CLOSED |
| T-16-04 | `README.md:95-107` documents Node.js and the actual `cd server && node --env-file=.env index.js` command with variables in `server/.env`; `README.md:137-138` records manifest-backed React, Vite, React Router, Express, and Node versions; `README.md:222` records Render Node 22. | CLOSED |
| T-16-SC | Phase commit diff `7e575c6^..adc0ce7` contains only `AI_PROVIDERS.md`, `README.md`, and the three App warning/test files; no package manifests, lockfiles, or `render.yaml` changed. Phase verification reports focused/full tests, lint, build, and `git diff --check` passed. | CLOSED |

## Threat Flags

No `## Threat Flags` entries were present in `16-01-SUMMARY.md`; there are no unregistered implementation flags.

## Accepted Risks Log

No accepted risks.

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-02 | 5 | 5 | 0 | gsd-security-auditor |

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-02
