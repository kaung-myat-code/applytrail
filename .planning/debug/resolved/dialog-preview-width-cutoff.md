---
status: resolved
trigger: |
  DATA_START
  Two UI bugs, possibly sharing a root cause:
  (1) On the analysis suggestions page, clicking "Save to Library" opens a dialog
      that isn't full width -- parts of the dialog are cut off / not showing on screen.
  (2) The resume preview at Resume Library has a similar display/rendering issue
      (content appears cut off / not full width).
  Timeline: not sure when this started, may have always been broken.
  Reproduction: happens regardless of browser window size or screen resolution.
  DATA_END
created: 2026-07-21T00:00:00Z
updated: 2026-07-21T00:20:00Z
---

## Current Focus

hypothesis: "The `<main>` wrapper in App.jsx (App.module.css `.main`) runs `animation: fadeInUp ... both` on mount. The `both` fill-mode holds the ending keyframe's `transform: translateY(0)` (a value 'other than none') on `.main` forever after the animation completes, because fill-mode `both`/`forwards` never reverts. Per CSS spec, any ancestor with a transform value other than the literal keyword `none` becomes the containing block for `position: fixed` (and absolute) descendants. Since EVERY routed page is rendered inside this `<main>`, any `position: fixed` dialog nested inside a page (both dialogs in this bug reuse `CreateApplicationModal.module.css` `.backdrop`) gets sized/positioned relative to `<main>`'s padding box instead of the viewport -- causing it to be narrower than the viewport (bounded by `.app`'s max-width:1120px) and to scroll with the page instead of staying viewport-fixed, producing the reported width-cutoff / off-screen clipping."
test: "Grep-confirmed only two animation rules in the codebase use fill-mode `both` (App.module.css `.main`, and an unused `.stagger` utility in index.css). Confirmed via MDN 'Layout and the containing block' that transform values other than `none` on an ancestor establish containing block for fixed/absolute descendants. Confirmed both bug flows reuse the same fixed-position dialog CSS: CreateApplicationModal.jsx (Save to Library flow, PreviewTailored.jsx) and the 'Preview Resume' modal in Resume.jsx (lines 599-697, imports the same modalStyles from CreateApplicationModal.module.css) -- both nested under App.jsx's `<main className={styles.main}>`."
expecting: "If hypothesis is correct, changing `.main`'s animation fill-mode from `both` to `backwards` (so the ending keyframe state is not held forever, while still preventing pre-animation flash) should restore `position: fixed` dialogs to being sized/positioned against the viewport, fixing both the Save to Library dialog and the Resume Preview modal simultaneously."
next_action: "Apply fix: change `.main` animation fill-mode in client/src/App.module.css from `both` to `backwards`. Then verify by inspecting that `.main` has no static or lingering transform after mount (~500ms), and confirm both modals (CreateApplicationModal via Save to Library, and Resume Preview modal in Resume.jsx) render as true viewport-fixed full-size overlays."

reasoning_checkpoint:
  hypothesis: "App.module.css `.main` uses `animation: fadeInUp var(--duration-slow) var(--ease-out) both`, whose `to` keyframe sets `transform: translateY(0)`. Fill-mode `both` holds this ending value on `.main` forever after the animation completes (it never reverts to the literal keyword `none`), which per CSS spec makes `.main` a permanent containing block for every `position: fixed` descendant app-wide, instead of the viewport. Both reported dialogs (Save to Library's CreateApplicationModal, and Resume.jsx's Preview Resume modal, which reuses the identical .backdrop/.dialog CSS) are descendants of `.main`, so both get sized/positioned against `.main`'s box (narrower than viewport, bounded by `.app` max-width:1120px, and scrolling with the page) instead of behaving as true full-viewport fixed overlays."
  confirming_evidence:
    - "Direct read of App.jsx confirms `<main className={styles.main}>` wraps `<Outlet/>`, i.e. every routed page, with no other wrapper in between."
    - "Direct read of App.module.css confirms `.main`'s animation uses fill-mode `both` and its `to` keyframe sets `transform: translateY(0)` (not `none`)."
    - "Direct read of CreateApplicationModal.module.css confirms `.backdrop { position: fixed; inset: 0; ... }`, the CSS class used for both reported dialogs."
    - "Direct read of Resume.jsx confirms it imports and reuses this exact modalStyles module for its 'Preview Resume' modal, reachable from Resume Library's per-version Edit link -- matching symptom 2 exactly."
    - "MDN 'Layout and the containing block' (external reference) confirms the containing-block rule: an ancestor's transform value other than the literal keyword `none` establishes the containing block for fixed/absolute descendants."
  falsification_test: "If, after changing `.main`'s fill-mode from `both` to `backwards`, the dialogs still render narrower than the viewport or scroll with the page instead of staying fixed, the hypothesis is wrong (or incomplete) -- there would have to be another ancestor still holding a non-none transform/filter/will-change value, which would need to be found and reasoned through separately."
  fix_rationale: "Changing fill-mode from `both` to `backwards` preserves the pre-animation-delay flash prevention (the 'before' phase still applies the 0% keyframe styles) while removing the 'after' phase that was permanently pinning `.main`'s transform to a non-none value. Once the animation's active period ends (~500ms after mount), `.main` fully reverts to its non-animated cascade value for `transform`, which is unset/`none` (no other rule sets a static transform on `.main`), restoring the viewport as the containing block for all fixed-position descendants app-wide. This addresses the root cause (the accidental permanent containing block) rather than special-casing each dialog."
  blind_spots: "Have not yet run the app in an actual browser to visually confirm layout before/after (no browser automation tool available in this environment); relying on CSS spec reasoning plus static code reading. Have not checked whether any other ancestor (e.g. a browser extension, a future added wrapper) could independently reintroduce a containing block. Have not verified there isn't a *second*, independent bug also contributing to the reported symptoms (e.g. actual intentional narrow reading-column widths on `.page` classes being misread by the user as 'cut off') -- but the user's own description of 'parts of the dialog are cut off / not showing on screen' matches the fixed-positioning failure mode specifically, not a narrow-column design choice."

## Symptoms

expected: "Save to Library" dialog (from analysis suggestions flow) and the Resume Library preview should render fully within the visible viewport at proper full width, with no cut-off content.
actual: Both the Save to Library dialog and the Resume Library preview show cut-off / missing parts -- content extends beyond what's visible on screen, not filling the dialog/preview area correctly.
errors: none reported (visual/layout bug, not a console error)
timeline: unknown -- may have always been broken; not a known regression
reproduction: Occurs regardless of browser window size or screen resolution. (1) Go through resume analysis, view suggestions, click "Save to Library" -- dialog appears cut off. (2) Go to Resume Library and open a resume preview -- similar cut-off rendering.

## Eliminated

## Evidence

- timestamp: 2026-07-21T00:05:00Z
  checked: client/src/App.jsx and client/src/App.module.css
  found: "App.jsx wraps every routed page in `<main className={styles.main}>{<Outlet/>}</main>`. `.main` has `animation: fadeInUp var(--duration-slow) var(--ease-out) both;` where the `to` keyframe sets `transform: translateY(0)`."
  implication: "Every page in the app (including PreviewTailored and Resume) renders its content, and any nested position:fixed elements, as descendants of this animated `<main>`."

- timestamp: 2026-07-21T00:06:00Z
  checked: "grep for 'both' fill-mode across client/src/**/*.css"
  found: "Only two rules use fill-mode `both`: App.module.css `.main` (used on every page) and an unused `.stagger > *` utility in index.css (no JSX currently applies `.stagger`)."
  implication: "`.main` is the only currently-active, universally-applied source of a persistent post-animation transform."

- timestamp: 2026-07-21T00:07:00Z
  checked: "CreateApplicationModal.module.css .backdrop / .dialog rules"
  found: ".backdrop uses `position: fixed; inset: 0;` intended to cover the full viewport, centering .dialog via flex."
  implication: "This is the CSS used by the 'Save to Library' modal in PreviewTailored.jsx (rendered after handleSave) as well as any other consumer of the same module."

- timestamp: 2026-07-21T00:08:00Z
  checked: "client/src/pages/Resume.jsx lines 1-60, 570-697"
  found: "Resume.jsx imports `modalStyles from '../components/CreateApplicationModal.module.css'` and renders a 'Preview Resume' modal (showPreview state, 'Preview Resume' button) reusing `modalStyles.backdrop` / `modalStyles.dialog`. This page is reached from Resume Library via the per-version 'Edit' link (`/resume/:id`)."
  implication: "This is the second reported bug ('resume preview at Resume Library') -- confirms both symptoms share the exact same fixed-position dialog CSS and the exact same ancestor (`<main>`)."

- timestamp: 2026-07-21T00:09:00Z
  checked: "MDN 'Layout and the containing block' (web search)"
  found: "For position:fixed/absolute descendants, the containing block is the padding box of the nearest ancestor with a transform (or filter/perspective/will-change equivalent) value other than the literal keyword `none`. `translateY(0)` is a value other than `none`."
  implication: "With fill-mode `both`, `.main`'s computed transform never returns to the literal `none` after mount, so `.main` permanently becomes the containing block for all `position: fixed` descendants app-wide -- instead of the viewport. This explains both the width constraint (bounded by `.app` max-width:1120px) and the 'cut off / not on screen' symptom (the dialog scrolls with the page instead of staying viewport-fixed), independent of window size -- matching the reported reproduction exactly."

- timestamp: 2026-07-21T00:15:00Z
  checked: "Launched real dev server (client on :5174 proxying to server on :3000, real project data) and drove it with a headless Playwright script. Opened the 'Preview Resume' modal (Resume Library -> Edit -> Preview Resume) and the 'Create Application' modal (same CreateApplicationModal component used by 'Save to Library'), scrolled the page 200-250px first to simulate a realistic non-zero scroll position, then read getBoundingClientRect() of the backdrop/dialog plus getComputedStyle(main).transform, BEFORE and AFTER the fix (toggled via git stash / git stash pop on client/src/App.module.css)."
  found: "BEFORE fix: mainTransform = 'matrix(1, 0, 0, 1, 0, 0)' (confirmed non-none). backdropRect exactly equaled mainRect (x:164, y:-1907.6, w:1072, h:3980.5) instead of the viewport (0,0,1400,900). dialogRect.y = -318.3, i.e. the dialog's top ~318px was rendered above/outside the visible viewport -- reproducing 'parts of the dialog are cut off / not showing on screen' and 'isn't full width' exactly. AFTER fix: mainTransform = 'none', backdropRect = (0,0,1400,900) matching the full viewport exactly, dialogRect fully within viewport bounds (y: 49 to 859). Same result for the CreateApplicationModal (Save to Library) dialog: backdropRect = full viewport, mainTransform = 'none'. Screenshots confirm both dialogs render centered and fully visible after the fix."
  implication: "Direct causal confirmation (not just correlation): reverting the one-line fill-mode change reproduces the exact bug numerically and visually; reapplying it resolves both reported dialogs simultaneously. Root cause and fix are verified, not theoretical."

## Resolution

root_cause: "App.jsx's shared `<main>` wrapper (App.module.css `.main`) applies `animation: fadeInUp ... both`, whose ending keyframe sets `transform: translateY(0)`. Because fill-mode `both` holds the ending keyframe state indefinitely after the animation completes, `.main`'s computed transform never reverts to the literal keyword `none` -- confirmed empirically as `matrix(1, 0, 0, 1, 0, 0)`. Per CSS spec this makes `.main` the containing block for all `position: fixed` descendants app-wide (instead of the viewport), so every fixed-position dialog (CreateApplicationModal used by the 'Save to Library' flow, and the reused modal styles in Resume.jsx's 'Preview Resume') is sized/positioned relative to `.main`'s box (narrower than the viewport, bounded by `.app`'s max-width:1120px, and scrolling with the page) rather than being a true full-viewport fixed overlay -- producing the reported width cutoff / off-screen clipping, independent of browser window size."
fix: "Changed `.main`'s animation fill-mode in client/src/App.module.css from `both` to `backwards`. This keeps the pre-animation-delay flash prevention (0% keyframe still applied during the 100ms delay) but stops holding the ending keyframe's transform after the animation completes, so `.main` reverts to `transform: none` ~500ms after mount, restoring the viewport as the containing block for all fixed-position descendants app-wide."
files_changed:
  - client/src/App.module.css
verification: "Human confirmed fixed end-to-end in real workflow after self-verification via headless Playwright script (BEFORE/AFTER measurements of backdrop/dialog rects and getComputedStyle(main).transform), confirming both the 'Save to Library' dialog and the Resume Library preview modal now render as true full-viewport fixed overlays. Session archived as resolved."
