---
phase: quick-260721-vc7
plan: 01
subsystem: infra
tags: [helmet, csp, goatcounter, security-headers, express]

requires:
  - phase: quick-260721-t54
    provides: GoatCounter analytics wiring (client/src/lib/analytics.js, main.jsx, render.yaml VITE_GOATCOUNTER_SITE)
provides:
  - Production CSP now allows loading the GoatCounter script and sending the tracking beacon to gc.zgo.at
affects: [analytics, deployment, production-hardening]

tech-stack:
  added: []
  patterns: [Scoped CSP allowlisting per external host rather than broadening or disabling CSP]

key-files:
  created: []
  modified: [server/index.js]

key-decisions:
  - "Added https://gc.zgo.at to only scriptSrc and connectSrc, leaving defaultSrc/styleSrc/fontSrc/imgSrc untouched to keep the allowlist minimal"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "Production helmet CSP scriptSrc and connectSrc directives include https://gc.zgo.at, unblocking GoatCounter's count.js load and beacon fetch"
    verification:
      - kind: unit
        ref: "node -e regex check for gc.zgo.at in scriptSrc/connectSrc (inline verify script from PLAN.md task 1)"
        status: pass
      - kind: other
        ref: "node -c server/index.js (syntax check)"
        status: pass
    human_judgment: true
    rationale: "Full confirmation requires deploying to Render and checking the GoatCounter dashboard receives pageview data — outside this local plan's automated scope, per plan's success_criteria."

duration: 2min
completed: 2026-07-21
status: complete
---

# Quick Task 260721-vc7: Fix GoatCounter Analytics CSP Summary

**Allowlisted gc.zgo.at in production helmet CSP scriptSrc and connectSrc so GoatCounter's script and beacon are no longer blocked**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-07-21T14:35:00Z
- **Completed:** 2026-07-21T14:37:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Diagnosed root cause (confirmed via prior live Chrome DevTools inspection referenced in the plan): production CSP `scriptSrc: ["'self'"]` and `connectSrc: ["'self'"]` blocked both loading `//gc.zgo.at/count.js` and the beacon fetch to GoatCounter
- Added `https://gc.zgo.at` to both `scriptSrc` and `connectSrc` in the production-only helmet block in `server/index.js`
- Verified via inline regex check and `node -c` syntax check — both passed

## Task Commits

Each task was committed atomically:

1. **Task 1: Allowlist gc.zgo.at in production CSP scriptSrc and connectSrc** - `b79cf00` (fix)

**Plan metadata:** committed separately by orchestrator (docs commit not made by this executor per constraints)

## Files Created/Modified
- `server/index.js` - Added `https://gc.zgo.at` to helmet `contentSecurityPolicy.directives.scriptSrc` and `.connectSrc` in the production-only CSP block

## Decisions Made
- Kept the CSP change scoped to exactly the two directives GoatCounter needs (script load + beacon connect), leaving `defaultSrc`, `styleSrc`, `fontSrc`, and `imgSrc` unchanged — no broadening or disabling of CSP beyond this single host allowlist

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This is a code-only fix; once deployed to Render, GoatCounter should begin receiving pageview data (post-deploy confirmation is outside this local plan's automated scope, as noted in the plan's success criteria).

## Next Phase Readiness

- Fix is committed and ready to deploy. After the next Render auto-deploy from `main`, verify in the GoatCounter dashboard (kaungmyat site) that pageviews begin appearing for https://applytrail.onrender.com.
- No blockers.

---
*Phase: quick-260721-vc7*
*Completed: 2026-07-21*

## Self-Check: PASSED

- FOUND: server/index.js
- FOUND: b79cf00 (commit exists in git log)
- FOUND: 260721-vc7-SUMMARY.md
