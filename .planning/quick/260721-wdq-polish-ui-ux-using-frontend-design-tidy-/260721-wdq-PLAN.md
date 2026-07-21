---
phase: quick-260721-wdq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - client/src/index.css
  - client/src/pages/Applications.module.css
  - client/src/pages/Dashboard.module.css
  - client/src/pages/NewApplication.module.css
  - client/src/pages/CoverLetter.module.css
  - client/src/pages/Analysis.module.css
  - client/src/pages/Resume.module.css
  - client/src/pages/ResumeLibrary.module.css
  - client/src/pages/PreviewTailored.module.css
  - client/src/pages/ReviewSuggestions.module.css
  - client/src/pages/Dashboard.jsx
  - client/src/pages/Applications.jsx
autonomous: false
requirements: [UIUX-POLISH]

must_haves:
  truths:
    - "App is usable on a 375px-wide mobile viewport with no horizontal scroll on any page"
    - "Status pill colors come from shared design tokens, not duplicated hardcoded hex values"
    - "Loading, error, and empty states share a consistent, polished visual treatment across pages"
  artifacts:
    - "client/src/index.css with neutral status tokens and a documented mobile breakpoint convention"
    - "@media blocks in every page module that previously lacked responsive rules"
  key_links:
    - "index.css tokens consumed by Applications/Dashboard status pills"
    - "Global .app/.main mobile padding wrapping every routed page"
---

<objective>
Polish UI/UX consistency across the ApplyTrail client using the frontend-design skill's guidance. Three focus areas, each a concrete gap found in the current code:
1. Color/token consistency — remove duplicated hardcoded status-pill hex; add neutral tokens.
2. Responsive/mobile layout — 8 of 9 pages currently have zero `@media` rules; add mobile breakpoints so nothing overflows and touch targets are adequate.
3. Empty/error/loading states — unify bare state divs (Dashboard) with the polished card treatment already used on Applications.

Purpose: The app already has a mature token system (index.css) and Phase 14 did a feedback-driven pass, but responsiveness and a few consistency gaps remain. This is a CSS-Modules + JSX-structure-only polish pass — no backend, API, data-schema, or dependency changes.

Output: Updated index.css tokens plus responsive/state polish across page modules; verified by a clean production build.
</objective>

<execution_context>
@/Users/kmpg/VibeCodeTours/applytrail/.claude/gsd-core/workflows/execute-plan.md
@/Users/kmpg/VibeCodeTours/applytrail/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@client/src/index.css
@client/src/App.module.css

# Design guidance — read before writing any CSS
@.claude/skills/frontend-design/SKILL.md

# Existing patterns to match (do NOT invent new visual language — extend these)
@client/src/pages/Applications.module.css
@client/src/pages/Dashboard.module.css
@client/src/components/Navbar/Navbar.module.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add neutral status tokens and mobile-padding convention to index.css; de-duplicate hardcoded hex</name>
  <files>client/src/index.css, client/src/pages/Applications.module.css, client/src/pages/Dashboard.module.css</files>
  <action>
Follow frontend-design skill: extend the existing warm-stone + indigo-violet system, do not introduce a new palette or generic AI aesthetics.

In client/src/index.css `:root`, add two neutral status tokens beside the existing status colors: a neutral background token (value matching the current drafted/withdrawn pill background) and a neutral text token (value matching the current muted pill text). Name them consistently with existing tokens (e.g. `--color-neutral-bg`, `--color-neutral-text`). Add a short comment noting these back the drafted/withdrawn status pills.

Also in index.css, reduce global page gutters on small screens so no page needs to repeat this: add a single `@media (max-width: 640px)` block that tightens body/global spacing only if a global wrapper lives here. NOTE the actual gutter wrapper is `.app`/`.main` in App.module.css (see Task 2) — do the gutter change there, not here. In index.css only add the tokens and (if helpful) a brief comment documenting the project mobile breakpoints as 768px (tablet) and 480px (phone) so future work is consistent.

In Applications.module.css and Dashboard.module.css, replace the hardcoded `#f3f4f6` / `#6b7280` values in `.statusDrafted` and `.statusWithdrawn` with the new `var(--color-neutral-bg)` / `var(--color-neutral-text)` tokens. Do not change any other colors.
  </action>
  <verify>
    <automated>cd client && grep -rn "#f3f4f6\|#6b7280" src/pages/*.module.css; test $(grep -rc "#f3f4f6\|#6b7280" src/pages/*.module.css | grep -v ':0$' | wc -l | tr -d ' ') -eq 0 && grep -q "color-neutral-bg" src/index.css && grep -q "color-neutral-text" src/index.css</automated>
  </verify>
  <done>index.css defines neutral-bg and neutral-text tokens; Applications and Dashboard status pills reference them; zero hardcoded #f3f4f6/#6b7280 remain in any page module.</done>
</task>

<task type="auto">
  <name>Task 2: Add responsive mobile layout to App wrapper and all page modules lacking @media rules</name>
  <files>client/src/App.module.css, client/src/pages/Applications.module.css, client/src/pages/NewApplication.module.css, client/src/pages/CoverLetter.module.css, client/src/pages/Analysis.module.css, client/src/pages/Resume.module.css, client/src/pages/ResumeLibrary.module.css, client/src/pages/PreviewTailored.module.css, client/src/pages/ReviewSuggestions.module.css</files>
  <action>
Goal: every page renders cleanly at 375px wide with no horizontal scroll and comfortable touch targets. Match the existing Dashboard/Navbar responsive style (`@media (max-width: 768px)`, and `480px` where phone-specific). Use existing spacing tokens; do not hardcode new px spacing values.

In App.module.css: add an `@media (max-width: 640px)` block reducing `.app` horizontal padding (e.g. to `var(--space-4)` or `var(--space-3)`) and reducing `.main` top/bottom padding so content is not cramped against edges on phones.

For each page module, add an `@media (max-width: 768px)` block (plus `480px` only where a phone-specific tweak is needed) addressing that page's actual layout. Read each module first, then apply the relevant subset of:
- Shrink display headings (`.page > h1` / `.title`) from 2.25rem–2.5rem down to ~1.75rem–2rem so long titles do not overflow.
- Any multi-column grid → collapse to single column (or 2 cols max for stat grids). Check Analysis, ResumeLibrary, PreviewTailored, ReviewSuggestions for grid/flex-row layouts that must stack.
- Any horizontal flex row that holds a title + badge/button (e.g. Applications `.cardHeader`, `.meta`, `.statusRow`) → allow wrap or switch to `flex-direction: column` with `gap`, `align-items: flex-start`.
- Ensure interactive controls (`select`, `button`, action links) have a min height of ~44px on mobile for touch (add `min-height` via tokens/rem where a control is currently compact, e.g. Applications `.statusSelect`, submit buttons).
- Guard against overflow: add `max-width: 100%` / `overflow-wrap: break-word` where long unbroken strings (job posting text, URLs, cover letter output) could push width — check CoverLetter, Analysis, PreviewTailored, ReviewSuggestions, NewApplication textarea.

Do not restructure JSX in this task and do not alter desktop appearance — all changes live inside `@media` blocks (except the touch-target min-heights, which may be baseline if they do not change desktop visuals).
  </action>
  <verify>
    <automated>cd client && for f in Applications NewApplication CoverLetter Analysis Resume ResumeLibrary PreviewTailored ReviewSuggestions; do grep -q "@media" src/pages/$f.module.css || { echo "MISSING @media in $f"; exit 1; }; done && grep -q "@media" src/App.module.css && npm run build</automated>
  </verify>
  <done>App wrapper and all 8 previously-unresponsive page modules contain @media rules; production build succeeds; manual mobile check confirms no horizontal scroll at 375px.</done>
</task>

<task type="auto">
  <name>Task 3: Unify loading, error, and empty states across pages</name>
  <files>client/src/pages/Dashboard.module.css, client/src/pages/Dashboard.jsx, client/src/pages/Applications.jsx, client/src/pages/CoverLetter.module.css, client/src/pages/ResumeLibrary.module.css, client/src/pages/Analysis.module.css</files>
  <action>
Goal: loading/error/empty states look intentional and consistent, not like bare browser text. Use the polished Applications `.empty`/`.loading`/`.error` treatment (centered, card background, border, shadow, muted text) as the canonical pattern — extend it, following the frontend-design skill (restraint + precision, no generic spinners-as-afterthought).

Steps:
- Read the loading/error/empty classes in each listed module. Where a page's `.loading` or `.error` is a bare text div (Dashboard currently is), give it the same card-style treatment used in Applications: centered, `var(--color-surface)` background, `var(--color-border-light)` border, `var(--radius-lg)`, `var(--shadow-sm)`, muted text, generous `var(--space-10)` padding. Error variants use `var(--color-danger)` text on `var(--color-danger-bg)`.
- Add a subtle inline SVG or emoji glyph to empty states for warmth (match the Dashboard action-icon style already in use) — keep it tasteful, one glyph, not decorative clutter. Apply to Dashboard empty-ish states and the Applications empty block if it lacks one.
- Ensure loading states communicate progress (a simple pulsing text or a minimal CSS shimmer using existing tokens is fine — no new dependency). If adding a shimmer keyframe, define it locally in the module.
- In Dashboard.jsx and Applications.jsx, only adjust JSX if needed to wrap state text in the styled containers (e.g. add a glyph span or an icon element). Do not change data-fetching logic, state variables, or API calls.
- Verify spacing follows the 8px grid (use `--space-*` tokens only; no raw px for margins/padding).
  </action>
  <verify>
    <automated>cd client && npm run build && npm test -- --run 2>/dev/null || npm run build</automated>
  </verify>
  <done>Dashboard loading/error states use the shared card treatment; empty states carry a tasteful glyph; all state styling uses design tokens; build passes and existing tests are unaffected.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Responsive mobile layout across all pages, token-based status colors, and unified loading/error/empty states.</what-built>
  <how-to-verify>
1. Run `cd client && npm run dev` and open the app.
2. Open browser devtools, toggle device toolbar, set width to 375px (iPhone SE). Visit each route: Dashboard, /resume, /new, /cover-letter, /applications, /analysis, resume library, preview/review pages. Confirm: no horizontal scrollbar, headings fit, cards/rows stack cleanly, buttons/selects are comfortably tappable.
3. On /applications, confirm status pills (drafted/withdrawn = neutral grey, applied = indigo, etc.) look unchanged from before on desktop.
4. Trigger or observe an empty state (e.g. /applications with no data) and a loading state (throttle network) — confirm they look like polished cards, not bare text.
5. Confirm desktop (>1024px) appearance is unchanged from before this pass.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any spacing/color/mobile issues to fix.</resume-signal>
</task>

</tasks>

<verification>
- `cd client && npm run build` succeeds after every task.
- No hardcoded `#f3f4f6` / `#6b7280` remain in any page module.
- Every page module and the App wrapper contain `@media` rules.
- Manual 375px-width pass shows no horizontal scroll on any route.
- Desktop appearance unchanged (changes are additive/token-based).
</verification>

<success_criteria>
- App is fully usable on a 375px mobile viewport with no horizontal overflow on any page.
- Status colors and all state styling derive from shared design tokens (no duplicated hex).
- Loading, error, and empty states share one polished, consistent visual treatment.
- Zero backend, API, data-schema, or dependency changes; production build green.
</success_criteria>

<output>
Create `.planning/quick/260721-wdq-polish-ui-ux-using-frontend-design-tidy-/260721-wdq-SUMMARY.md` when done.
</output>