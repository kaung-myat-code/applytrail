# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## dialog-preview-width-cutoff — Shared animated `<main>` wrapper broke position:fixed dialogs app-wide
- **Date:** 2026-07-21
- **Error patterns:** dialog cut off, not full width, cut off content, preview cut off, position fixed, containing block, transform, animation fill-mode both, modal off screen, resume preview cut off
- **Root cause:** App.jsx's shared `<main>` wrapper (App.module.css `.main`) used `animation: fadeInUp ... both`, whose ending keyframe set `transform: translateY(0)`. Fill-mode `both` held this ending transform on `.main` permanently after the animation completed (never reverting to the literal `none`), which per CSS spec makes `.main` the containing block for every `position: fixed` descendant app-wide instead of the viewport — causing any fixed-position dialog nested inside a routed page to be sized/positioned relative to `.main`'s box (narrower than viewport, bounded by `.app`'s max-width, and scrolling with the page) instead of behaving as a true full-viewport fixed overlay.
- **Fix:** Changed `.main`'s animation fill-mode in client/src/App.module.css from `both` to `backwards`. This preserves the pre-animation-delay flash prevention while allowing `.main`'s transform to revert to `none` once the animation completes, restoring the viewport as the containing block for all fixed-position descendants app-wide.
- **Files changed:** client/src/App.module.css
---
