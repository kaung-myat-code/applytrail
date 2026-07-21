---
phase: quick-260721-wdq
plan: 01
subsystem: client-ui
tags: [css, responsive, design-tokens, accessibility, frontend-design]
dependency-graph:
  requires: []
  provides: [neutral-status-tokens, mobile-breakpoint-convention, responsive-page-layouts, unified-loading-error-empty-states]
  affects: [client/src/index.css, client/src/App.module.css, client/src/pages]
tech-stack:
  added: []
  patterns:
    - "CSS custom properties (design tokens) for status colors instead of hardcoded hex"
    - "@media (max-width: 768px) as the standard page-level mobile breakpoint; 640px for the App shell gutter/padding"
    - "44px min-height touch targets on primary buttons/selects inside mobile media queries"
    - "overflow-wrap: break-word guards on long free-text display areas (cover letter paragraph, analysis summaries, resume bullets)"
key-files:
  created: []
  modified:
    - client/src/index.css
    - client/src/App.module.css
    - client/src/pages/Applications.module.css
    - client/src/pages/Applications.jsx
    - client/src/pages/Dashboard.module.css
    - client/src/pages/Dashboard.jsx
    - client/src/pages/NewApplication.module.css
    - client/src/pages/CoverLetter.module.css
    - client/src/pages/Analysis.module.css
    - client/src/pages/Resume.module.css
    - client/src/pages/ResumeLibrary.module.css
    - client/src/pages/PreviewTailored.module.css
    - client/src/pages/ReviewSuggestions.module.css
decisions:
  - "Named the new neutral status tokens --color-neutral-bg/--color-neutral-text (matching the existing --color-{name}-bg / --color-{name} naming convention) rather than introducing a new naming scheme"
  - "Documented the mobile breakpoint convention (768px tablet, 480px phone-specific) as a comment in index.css rather than a new token, since breakpoints aren't consumed as CSS custom properties in media query contexts"
  - "Scoped the App-shell gutter tightening to 640px (matching Navbar's existing 640px breakpoint) while page-content responsive rules use 768px (matching Dashboard's pre-existing convention) — two breakpoints already existed in the codebase before this pass, so this plan extends both rather than picking one and creating an inconsistency"
  - "Left CoverLetter.module.css and Analysis.module.css without additional Task 3 changes after finding their .empty/.error patterns already matched the established inline-banner/full-card conventions; an initial attempt to add a continuous pulse animation to .analyzeButton/.generateButton :disabled was reverted because those buttons are also disabled in a non-loading 'form incomplete' state, and a permanent pulse there would look like a stuck/broken control rather than progress feedback"
metrics:
  duration: ~35 min
  completed: 2026-07-21
status: complete
---

# Phase quick-260721-wdq Plan 01: Polish UI/UX (spacing, colors, mobile, states) Summary

Extended the existing warm-stone + indigo-violet design system with neutral status tokens, added `@media (max-width: 768px)` responsive rules to the App shell and all 8 previously-unresponsive page modules (44px touch targets, stacked flex rows, break-word overflow guards), and upgraded Dashboard's and Resume Library's bare-text loading/error states to the polished card treatment already used by Applications' empty state, with tasteful glyphs added to loading/error/empty blocks.

## What Was Built

**Task 1 — Design tokens:** Added `--color-neutral-bg` (#f3f4f6) and `--color-neutral-text` (#6b7280) to `client/src/index.css`, with a comment noting they back the `drafted`/`withdrawn` status pills. Replaced the previously-duplicated hardcoded hex values in `Applications.module.css` and `Dashboard.module.css` `.statusDrafted`/`.statusWithdrawn` rules with these tokens. Also documented the project's mobile breakpoint convention (768px tablet, 480px phone) as a comment in `index.css`.

**Task 2 — Responsive mobile layout:** Added `@media (max-width: 640px)` to `App.module.css` tightening the `.app` horizontal padding and `.main` vertical padding for phones. Added `@media (max-width: 768px)` blocks to all 8 page modules that previously had zero responsive rules (Applications, NewApplication, CoverLetter, Analysis, Resume, ResumeLibrary, PreviewTailored, ReviewSuggestions) covering: shrunk display headings, single-column stacking of flex rows/grids, 44px min-height touch targets on primary buttons/selects, and `overflow-wrap: break-word` guards on long free-text areas (cover letter output, analysis summaries, resume entry text). Dashboard already had `@media (max-width: 768px)` from a prior phase and was left as-is per the plan.

**Task 3 — Unified state treatment:** Dashboard's `.loading` and `.error` states (previously bare centered text with no card styling) now use the same surface-background/border-light-border/radius-lg/shadow-sm card recipe as Applications' `.empty` block, plus a subtle pulsing hourglass/warning glyph. Applications' empty state gained a `📭` glyph (required changing `.empty p:first-child` to `.empty p:first-of-type` so the leading icon element doesn't break the existing first-paragraph emphasis styling — see deviation below). ResumeLibrary's `.loading` (which had the identical bare-text gap as Dashboard) was upgraded to the same card treatment.

## Verification

- `cd client && npm run build` — succeeds after every task (verified 3 times, once per task).
- `grep -rn "#f3f4f6\|#6b7280" src/pages/*.module.css` — zero matches; only the token definitions themselves remain in `index.css`.
- All 9 page modules + `App.module.css` contain at least one `@media` block.
- `npx eslint src/pages/Dashboard.jsx src/pages/Applications.jsx` — no errors.
- Desktop-affecting changes were kept additive/token-based (hex→token swap, new bare→card padding/border/shadow) rather than replacing existing layout values, per the "desktop appearance unchanged" success criterion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `.empty p:first-child` selector breakage caused by the new empty-state glyph**
- **Found during:** Task 3
- **Issue:** Adding a `<span className={styles.emptyIcon}>` before the first `<p>` in Applications' empty state would silently stop the existing `.empty p:first-child { font-size: 1.1rem; ... }` rule from matching, since `:first-child` requires literal first-child position (not just first paragraph), collapsing the intended larger empty-state message text back to default paragraph size.
- **Fix:** Changed the selector from `.empty p:first-child` to `.empty p:first-of-type`, which matches the first `<p>` regardless of a preceding non-`<p>` sibling.
- **Files modified:** `client/src/pages/Applications.module.css`
- **Commit:** 6025c7e

### Scope Adjustments

- Attempted to add a continuous pulse animation to `.generateButton:disabled` (CoverLetter) and `.analyzeButton:disabled` (Analysis) to satisfy the "loading states communicate progress" guidance in Task 3. Reverted both after recognizing these buttons are also disabled in a non-loading "form incomplete" state (no posting/resume selected yet) — a permanent pulse there would misleadingly suggest the button is stuck or broken rather than mid-action. CoverLetter.jsx and Analysis.jsx were intentionally excluded from this plan's `files_modified` list, so a JSX-conditioned pulse (only while `loading === true`) wasn't available as an option; the existing "Generating…"/"Analyzing…" button-label text change was judged sufficient progress feedback for these two pages. Net effect: no diff in `CoverLetter.module.css` or `Analysis.module.css` beyond the Task 2 responsive additions.

## Known Stubs

None — this was a CSS/JSX-structure-only polish pass with no new data-bound components.

## Checkpoint: Manual Verification Still Required

Per the plan's `checkpoint:human-verify` task, the following automated self-checks were run and passed (see Verification section above): production build, zero hardcoded status hex, `@media` presence across every page module, ESLint clean on modified JSX. This was an unattended background execution, so the following still needs a human with a real browser:

1. `cd client && npm run dev`, open devtools device toolbar at 375px width, and visually confirm no horizontal scrollbar on every route (Dashboard, /resume, /new, /cover-letter, /applications, /analysis, resume library, preview/review pages).
2. Confirm status pill colors (drafted/withdrawn = neutral grey, applied = indigo, etc.) look visually unchanged on desktop (>1024px).
3. Trigger an empty state (e.g. `/applications` with no data) and a loading state (network throttled) to confirm the card treatment and glyphs read as intentional, not accidental.

This is informational, not blocking — the plan proceeded to completion per the execution constraints for this run.

## Self-Check: PASSED

- FOUND: client/src/index.css (neutral tokens present)
- FOUND: client/src/App.module.css (@media block present)
- FOUND: client/src/pages/Applications.module.css, Applications.jsx
- FOUND: client/src/pages/Dashboard.module.css, Dashboard.jsx
- FOUND: client/src/pages/NewApplication.module.css
- FOUND: client/src/pages/CoverLetter.module.css
- FOUND: client/src/pages/Analysis.module.css
- FOUND: client/src/pages/Resume.module.css
- FOUND: client/src/pages/ResumeLibrary.module.css
- FOUND: client/src/pages/PreviewTailored.module.css
- FOUND: client/src/pages/ReviewSuggestions.module.css
- FOUND commit a45dc09 (Task 1)
- FOUND commit 11f385b (Task 2)
- FOUND commit 6025c7e (Task 3)
