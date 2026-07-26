---
phase: 12
slug: tailored-resume
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: 2026-07-16
---

# Phase 12 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client -> POST /api/drafts | Untrusted suggestions/decisions payload crosses here | JSON: resume_id, posting_id, suggestions[], decisions{}, provider |
| client -> POST /api/drafts/:id/save | Untrusted name field; tailored_resume comes from server-side computation | JSON: name |
| client -> GET /api/drafts/:id | draftId in URL; server validates ID format | URL param: draft id |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-12-01 | Tampering | POST /api/drafts suggestions payload | medium | mitigate | `resume_id` validated against `VALID_ID` + must exist in library (server/index.js:491-496); `posting_id` required and must resolve to an existing posting, returns 404 if not (server/index.js:500-507); `suggestions` must be `Array.isArray` (server/index.js:508-510); `decisions` must be a plain object if present (server/index.js:511-513) | closed |
| T-12-02 | Information Disclosure | Draft files on filesystem | low | accept | Single-user local tool; draft files are ephemeral and in project directory; no multi-tenant risk | closed |
| T-12-03 | Denial of Service | Unbounded draft accumulation | low | mitigate | `cleanOldDrafts()` runs at server startup (server/index.js:123, invoked at line 255) and removes draft files older than 24 hours; `ensureDraftsDir()` creates the directory lazily | closed |
| T-12-04 | Tampering | IDOR via invalid draft IDs | low | mitigate | All draft routes (`POST /api/drafts/:id/save`, `GET /api/drafts/:id`, `DELETE /api/drafts/:id`) validate the id against `VALID_ID = /^[a-z0-9]+$/` before any file operation (server/index.js:404,416,443,471,534,564,601) | closed |
| T-12-SC | Tampering | npm/pip/cargo installs | high | mitigate | No new package installs introduced in Phase 12 (confirmed: no `server/package.json` or `client/package.json` changes since Phase 11.5) | closed |
| T-12-F1 | Information Disclosure | Draft data in URL search params | low | accept | draftId is an opaque alphanumeric id with no embedded sensitive data; single-user local tool with no shared browser history exposure concern | closed |
| T-12-F2 | Tampering | Name field in save request | low | mitigate | Server uses `name` only as flat-JSON library metadata (no template rendering, no shell/SQL execution) — no injection surface for this data path | closed |
| T-12-F3 | Denial of Service | Preview page fetches draft on every mount | low | accept | Single-user local tool; JSON file reads are fast and unauthenticated by design; no performance or resource-exhaustion concern at this scale | closed |
| T-12-F-SC | Tampering | npm/pip/cargo installs | high | mitigate | No new package installs introduced in Plan 12-02 (confirmed alongside T-12-SC) | closed |

*Status: open · closed · open — below {block_on} threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-12-01 | T-12-02 | Draft files (ephemeral, project-local JSON) are readable by anyone with filesystem access to this single-user local tool; no auth boundary exists anywhere in the app, so this does not introduce new exposure | Phase 12 plan (12-01) | 2026-07-16 |
| AR-12-02 | T-12-F1 | draftId in the URL is opaque and non-sensitive; single-user local tool has no shared-device browser-history threat model | Phase 12 plan (12-02) | 2026-07-16 |
| AR-12-03 | T-12-F3 | Fetching the draft on every PreviewTailored mount is a normal read against local JSON files; no DoS surface at single-user scale | Phase 12 plan (12-02) | 2026-07-16 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-07-16 | 9 | 9 | 0 | /gsd-secure-phase (L1 grep-depth verification, asvs_level 1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-16
