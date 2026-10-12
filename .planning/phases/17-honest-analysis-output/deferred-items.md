# Deferred Items — Phase 17, Plan 01

## Out-of-scope discoveries during execution

**1. `server/lib/analysis/analyze-route.test.js` fails in the worktree with "Cannot find module 'express'"**
* Discovered during: Plan-wide verification (`cd server && npm test`)
* Classification: Pre-existing environment issue, NOT caused by this plan's changes
* Root cause: The git worktree is a fresh checkout with no `node_modules` installed. `analyze-route.test.js` requires `express` (via `server/index.js`), which is absent. The heuristic and validate test suites pass because they use only Node's built-in `assert` and require no third-party packages.
* Scope reasoning: This plan modifies only `heuristic.js` and `heuristic.test.js`, adds no dependencies, and does not touch `server/package.json` (verified unmodified — threat model T-17-SC). The failure is orthogonal to OUT-01/OUT-02.
* Action taken: None (out of scope per SCOPE BOUNDARY). Correct resolution is `npm install` in the worktree before running the express-dependent test — an environment-setup concern the orchestrator/worktree lifecycle owns, not a package-install this executor should auto-run.
* Not deferred to a future plan — resolved by standard worktree dependency installation.
