# Phase 999.1: UX & Quality Polish from User Feedback - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 999.1-ux-quality-polish-from-user-feedback
**Areas discussed:** Workflow clarity & feedback, Navigation restructuring, Editor safety & quality infra, Analysis & writing quality

---

## Workflow clarity & feedback (#2, #8-partial)

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to Cover Letter page | Navigate straight to /cover-letter pre-loaded with the new posting | You decide → applied |
| Inline success + explicit next-step link | Stay on page, persistent success banner with link | |

**User's choice:** You decide (Claude applied: redirect to Cover Letter page)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current model, rename labels | Application still created on Cover Letter page, clarify labels | |
| Add explicit "Save Application" confirmation step | Distinct confirm/save action separate from generate, then redirect | You decide → applied |

**User's choice:** You decide (Claude applied: explicit Save Application confirmation step)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Fix New Application only (scoped) | Smallest change, avoids scope creep | ✓ |
| Introduce a shared save-feedback pattern | Toast/banner component applied app-wide | |

**User's choice:** Fix New Application only (scoped)
**Notes:** Shared toast/banner pattern captured as deferred idea.

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add a small clarifying label | Distinguish "Applied on X" from "Last status change: Y days ago" | ✓ |
| No — defer, not in tracked issues #2-#8 | | |

**User's choice:** Yes — add a small clarifying label
**Notes:** Not one of the 7 numbered GitHub issues but directly requested in feedback item #8; included as low-risk.

---

## Navigation restructuring (#7)

| Option | Description | Selected |
|--------|-------------|----------|
| Reorder + rename only | Keep 7 top-level links, reorder/rename | |
| Collapse into fewer top-level groups | Group Resume + Resume Library, Analysis + Cover Letter | ✓ |
| You decide | | |

**User's choice:** Collapse into fewer top-level groups
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — add contextual next-step CTAs | "Continue to [next step]" buttons on workflow pages | ✓ |
| No — nav restructuring alone is enough | | |

**User's choice:** Yes — add contextual next-step CTAs
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Claude proposes exact labels/order | | ✓ |
| I have specific labels in mind | | |

**User's choice:** Claude proposes exact labels/order
**Notes:** None

---

## Editor safety & quality infra (#3, #6-partial, #8)

| Option | Description | Selected |
|--------|-------------|----------|
| Default contact fields to empty strings | Minimal targeted fix | |
| Same fix + add a contract test | Server-side fix plus a test for the regression | ✓ |

**User's choice:** Same fix + add a contract test
**Notes:** Root cause confirmed by reading server/index.js and validateResume.js before asking.

| Option | Description | Selected |
|--------|-------------|----------|
| Targeted regression tests only | Smallest footprint | You decide → recommended |
| Broader API contract test suite | Full route coverage, more work | |
| You decide | | |

**User's choice:** You decide (Claude recommends: targeted regression tests only; broader suite deferred)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Remove-button confirmation only | | |
| Confirmation + save-state indicator | | |
| Confirmation + indicator + resume preview | All three improvements | ✓ |

**User's choice:** Confirmation + indicator + resume preview (full scope)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — fix all lint errors | Exclude client/dist, add prop-types, remove unused vars | ✓ |
| Yes, but exclude dist + unused vars only | Smaller effort, skip prop-types | |

**User's choice:** Yes — fix all lint errors
**Notes:** Confirmed 263 current lint errors via `npx eslint .` before asking.

---

## Analysis & writing quality (#4, #5-partial, #6-partial)

| Option | Description | Selected |
|--------|-------------|----------|
| Expand the whitelist with more categories | Add product/data/business-soft-skill terms | You decide → recommended |
| Switch to frequency/TF-IDF-style extraction | Broader but bigger heuristic change | |
| You decide | | |

**User's choice:** You decide (Claude recommends: expand whitelist with more categories, per project's simple-heuristics constraint)
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Fix specific grammar bugs only | Possessive apostrophes, acronym casing | |
| Fix grammar bugs + reduce genericness | Same fixes, plus template variation and more matched keywords | ✓ |

**User's choice:** Fix grammar bugs + reduce genericness
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Small acronym-exceptions list | sql→SQL, api→API, aws→AWS map | You decide → recommended |
| You decide | | |

**User's choice:** You decide (Claude recommends: small acronym-exceptions list, consistent with existing whitelist pattern)
**Notes:** None

---

## Claude's Discretion

- Redirect-after-save target/mechanism for New Application
- Explicit Save Application confirmation implementation details
- Test coverage scope beyond the resume-library contract test (recommended: targeted regression tests only)
- Keyword-extraction broadening approach (recommended: expand whitelist with more categories)
- Acronym casing mechanism (recommended: small acronym-exceptions list)

## Deferred Ideas

- Shared save-feedback/toast component applied app-wide (Applications list, status updates) — not a tracked issue, deferred to a future polish phase if it recurs.
- Broader API contract test suite across all API routes — deferred as its own future phase; too large for this polish pass.
- Phase 12 CR-01/CR-02 (applyPatches missing `education` and `summary`+`remove` handling) — pre-existing deferred item from STATE.md, not re-opened in this discussion.
