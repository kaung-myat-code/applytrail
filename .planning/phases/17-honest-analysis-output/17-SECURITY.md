---
phase: 17
slug: honest-analysis-output
status: verified
threats_open: 0
asvs_level: 1
created: 2026-10-12
---

# Phase 17 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Posting text → analysis providers | User-pasted job posting text enters heuristic and AI prompts | Untrusted prose text; no secrets in prompts (T-17-01 accepted variant in 17-02) |
| AI provider responses → suggestions | External LLM output is parsed and rendered as resume suggestions | Semi-trusted JSON; safeParse drops out-of-enum items; fabrication guardrails in prompts |
| Suggestion JSON → applyPatches | Structured suggestions (incl. target_entry) mutate in-memory resume | Strings matched only via normalizeText; never reach path.join/fs (T-17-04) |
| npm registry → dependencies | No new packages introduced this phase | package.json test-script line only; lockfiles untouched (T-17-SC) |
| AI provider keys → eval runner | Keys read from process.env (server/.env) for live eval runs | Secrets never written to reports; keyless runs skip AI path cleanly |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-17-01 | Information integrity | heuristic.js generateSuggestions | high | mitigate | OUT-01 removed EXPERIENCE_TEMPLATES/PROJECT_TEMPLATES/pickVariant/"Experienced in" append; heuristic.test.js asserts zero experience/projects adds; eval harness asserts 0 fabricated adds on all 5 pairs | closed |
| T-17-02 | Information integrity | heuristic gaps, applyPatches fallback, PreviewTailored copy, eval fabrication check | high | mitigate | Per-keyword honest gap notes (heuristic.js:185, contract-tested); TARGET_ENTRY_NOT_FOUND skip recorded on every unmatched fallback (applyPatches.js:65,167); client mirror exact (skipReasons.js:13); eval reuses findInResume for modify fabrication verdicts | closed |
| T-17-03 | Information integrity | ai.js score normalization | medium | mitigate | [0,1]→*100 branch deleted; normalizeReportScores pure round+clamp; normalizeReport.test.js "score 1 stays 1" regression chained into server test script | closed |
| T-17-04 | Tampering | applyPatches.js target_entry | low | accept | Matched only against in-memory entry names via normalizeText; never reaches path.join or fs. Documented accepted risk (17-03 plan) — no new validation surface beyond existing string handling | closed (accepted) |
| T-17-05 | Denial of service / false failure | evals/run-evals.js key detection | low | mitigate | Absent key records "skipped — no key" per pair and heuristic run still exits 0; AI errors recorded verbatim without aborting the run | closed |
| T-17-SC | Tampering | npm/pip/cargo installs | high | mitigate | Phase adds no packages (RESEARCH.md Package Legitimacy Audit: none). Verified: server/package.json diff is the test-script line only; client/package.json unmodified; no lockfile changes across the phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-17-01 | T-17-04 | target_entry never reaches filesystem APIs; matching is in-memory string comparison only. Adding path-style validation would be speculative surface for a local single-user tool. | plan 17-03 (locked disposition) | 2026-10-09 |
| AR-17-02 | T-17-01 (17-02 variant) | Prompt injection via posting text: local single-user tool, no secrets in prompts, sanitizeError keeps provider errors from leaking; OUT-03 guardrails constrain output to resume-grounded content. | plan 17-02 (locked disposition) | 2026-10-09 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-12 | 6 | 6 | 0 | orchestrator (L1 short-circuit: register authored at plan time, threats_open: 0, asvs_level 1) |

*L1 verification performed: fabrication templates absent; gap-note format present; TARGET_ENTRY_NOT_FOUND mirrored client/server; score-1 regression test chained; package.json diffs scoped to test-script line; keyless eval skip path exits 0.*

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-12
