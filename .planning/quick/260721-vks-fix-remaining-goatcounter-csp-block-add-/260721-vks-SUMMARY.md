---
phase: quick-260721-vks
plan: 01
subsystem: infra
tags: [helmet, csp, goatcounter, security-headers, express]

requires:
  - phase: quick-260721-vc7
    provides: Initial (incomplete) CSP fix allowlisting gc.zgo.at in scriptSrc/connectSrc
provides:
  - Production CSP now allows the GoatCounter count beacon to reach https://{site}.goatcounter.com
affects: [analytics, deployment, production-hardening]

tech-stack:
  added: []
  patterns: [Scoped CSP allowlisting per external host rather than broadening or disabling CSP]

key-files:
  created: []
  modified: [server/index.js]

key-decisions:
  - "Used a wildcard https://*.goatcounter.com in connectSrc rather than hardcoding https://kaungmyat.goatcounter.com, so the CSP stays correct if VITE_GOATCOUNTER_SITE ever changes"
  - "scriptSrc left untouched — the GoatCounter script itself only ever loads from gc.zgo.at, only the beacon target differs"

patterns-established: []

requirements-completed: []

coverage:
  - id: D1
    description: "Production helmet CSP connectSrc includes https://*.goatcounter.com, unblocking the GoatCounter count beacon"
    verification:
      - kind: unit
        ref: "regex assertion + node --check syntax validation (executor worktree had no node_modules installed, so require() smoke test was skipped)"
        status: pass
      - kind: other
        ref: "Live confirmation via Chrome DevTools on https://applytrail.onrender.com after deploy — pending orchestrator follow-up"
        status: pending
    human_judgment: true
    rationale: "CSP only activates under NODE_ENV=production; full confirmation requires the Render deploy to land, then checking the live console/network panel and the GoatCounter dashboard for incoming pageviews."

duration: 5min
completed: 2026-07-21
status: complete
---

# Quick Task 260721-vks: Fix Remaining GoatCounter CSP Block Summary

**Added https://*.goatcounter.com to production CSP connectSrc so the GoatCounter count beacon is no longer blocked**

## Performance

- **Duration:** ~5 min
- **Tasks:** 1 automated + 1 deferred human-verify checkpoint
- **Files modified:** 1

## Accomplishments
- Root cause: prior fix (260721-vc7) only allowlisted `gc.zgo.at` (script host); the beacon itself POSTs/connects to `https://kaungmyat.goatcounter.com/count`, a different origin, confirmed blocked via live Chrome DevTools console error on the deployed site.
- Added `https://*.goatcounter.com` to `connectSrc` in the production-only helmet CSP block in `server/index.js`.
- Verified via regex assertion and `node --check` syntax validation.

## Task Commits

1. **Task 1: Allow goatcounter beacon origin in production CSP connectSrc** - `cd17d08` (fix)

## Files Created/Modified
- `server/index.js` - Added `'https://*.goatcounter.com'` to `helmet.contentSecurityPolicy.directives.connectSrc`

## Deviations from Plan
- The plan's verify step included a `require('./server/index.js')` boot smoke test; the isolated executor worktree had no `node_modules` installed, so this sub-check was skipped in favor of regex + syntax validation only. Not a code defect.

## Next Phase Readiness

- Fix committed (`cd17d08`, merged via `741cccc`). Needs deploy + live confirmation (orchestrator will push and verify via Chrome DevTools against the deployed site, then check the GoatCounter dashboard for incoming pageviews).

---
*Phase: quick-260721-vks*
*Completed: 2026-07-21*
