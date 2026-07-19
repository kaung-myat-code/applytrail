---
phase: 14-ux-quality-polish-from-user-feedback
plan: 07
subsystem: build-tooling
tags: [eslint, npm, devdependency, flat-config, prop-types]

# Dependency graph
requires:
  - phase: 14-ux-quality-polish-from-user-feedback
    provides: 14-UI-SPEC.md and phase-level requirements mapped to GitHub issues #2-#8
provides:
  - client/eslint.config.js excludes client/dist from linting via a flat-config global-ignore object
  - prop-types is a real, directly-declared devDependency of client/package.json (was previously only a phantom transitive resolution via eslint-plugin-react)
affects: [14-08-eslint-cleanup]

# Tech tracking
tech-stack:
  added: [prop-types@^15.8.1 (direct devDependency)]
  patterns: ["ESLint 9 flat-config global ignore as first array element ({ ignores: [...] }) applies before any other config object is evaluated"]

key-files:
  created: []
  modified: [client/eslint.config.js, client/package.json, client/package-lock.json]

key-decisions:
  - "Human approved prop-types as a legitimate direct devDependency on npmjs.com (Facebook/Meta React org, millions of weekly downloads) before install, satisfying the Task 1 blocking-human package-legitimacy checkpoint"
  - "Pinned prop-types to ^15.8.1, matching the version already resolved transitively (via eslint-plugin-react, not react-diff-viewer-continued as originally suspected) so no new/unreviewed code entered the dependency tree"

patterns-established:
  - "ESLint 9 flat-config projects: place { ignores: [...] } as the very first element of the exported config array for global excludes, never mixed into a files-scoped config object"

requirements-completed: [UX-ISSUE-08]

coverage:
  - id: D1
    description: "client/dist is excluded from ESLint via a global ignores entry, eliminating all minified-bundle lint noise"
    requirement: UX-ISSUE-08
    verification:
      - kind: unit
        ref: "cd client && npx eslint . 2>&1 | grep -c 'dist/assets' (returns 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "prop-types added as a direct devDependency of client/package.json, pinned to the already-resolved transitive version, and installed"
    requirement: UX-ISSUE-08
    verification:
      - kind: unit
        ref: "cd client && node -e \"require.resolve('prop-types')\" (exits 0)"
        status: pass
      - kind: unit
        ref: "client/package-lock.json root packages['']['devDependencies'] contains prop-types: ^15.8.1"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-07-19
status: complete
---

# Phase 14 Plan 07: ESLint dist exclusion and prop-types direct dependency Summary

**client/dist excluded from ESLint via flat-config global ignore; prop-types promoted from phantom transitive to declared direct devDependency, unblocking Plan 14-08's PropTypes cleanup**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-19T15:36:00Z
- **Completed:** 2026-07-19T15:48:31Z
- **Tasks:** 2 (1 checkpoint + 1 auto)
- **Files modified:** 3

## Accomplishments
- `client/eslint.config.js` now has `{ ignores: ['dist/**'] }` as the first element of its exported flat-config array, so `npx eslint .` never scans the built production bundle
- `prop-types` is now declared directly in `client/package.json` devDependencies (pinned `^15.8.1`) and recorded as a direct (not only transitive) dependency in `client/package-lock.json` after `npm install`
- `npx eslint .` in `client/` now reports 88 problems (down from the 411 baseline cited in the plan, with zero references to `client/dist`), ready for Plan 14-08 to fix at the source

## Task Commits

Each task was committed atomically:

1. **Task 1: Package legitimacy checkpoint for prop-types** - human-verify checkpoint, satisfied via explicit human approval in the real conversation prior to this dispatch (see Checkpoint Handling below). No code commit for this task.
2. **Task 2: Exclude client/dist from ESLint and add prop-types as a direct dependency** - `bac5026` (feat)

**Plan metadata:** committed separately per worktree protocol (SUMMARY.md commit below)

## Files Created/Modified
- `client/eslint.config.js` - Added `{ ignores: ['dist/**'] }` as the first element of the exported flat-config array
- `client/package.json` - Added `"prop-types": "^15.8.1"` to `devDependencies`
- `client/package-lock.json` - `npm install` recorded `prop-types` as a direct dependency of the root package (previously only appeared as a transitive dependency of `eslint-plugin-react`)

## Decisions Made
- Verified during Task 2 that `prop-types`'s existing transitive resolution actually comes from `eslint-plugin-react`'s own `dependencies` block (package-lock.json line 3210), not `react-diff-viewer-continued` as the plan's Task 1 checkpoint text speculated. This does not change the outcome — the version pinned (`15.8.1`) is identical to what was already resolved and audited, so the checkpoint's approval still fully covers the installed artifact. Documented here for accuracy since a future auditor grepping `package-lock.json` for the provenance chain would otherwise be misled by the plan text.

## Deviations from Plan

None - plan executed exactly as written. Task 1's blocking-human checkpoint was satisfied via the explicit human approval documented in this dispatch's retry context (see Checkpoint Handling below) rather than re-prompting for the same package-legitimacy sign-off already given in a prior attempt whose worktree was destroyed before landing any commits.

## Checkpoint Handling

**Task 1 (checkpoint:human-verify, gate="blocking-human")** — This is a retry dispatch. A prior attempt reached this exact checkpoint and paused correctly awaiting human sign-off on the legitimacy of adding `prop-types` as a direct npm devDependency. The human explicitly reviewed and approved in the real conversation: "prop-types is confirmed as Facebook/Meta's legitimate React PropTypes package, already resolved at 15.8.1 as a transitive dependency via react-diff-viewer-continued — approved to add as a direct devDependency pinned to ^15.8.1." The prior worktree was destroyed before any commits landed (verified clean state on `main` before this fresh worktree was spawned). This dispatch treated that approval as satisfying Task 1 and proceeded directly to Task 2's implementation without re-prompting. During Task 2's implementation, it was further confirmed (see Decisions Made above) that the exact pinned version (`15.8.1`) was already present in `package-lock.json` prior to this plan's `npm install`, consistent with the approved provenance.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `prop-types` is installed and resolvable from `client/`, ready for Plan 14-08 to import into the ~10 components currently flagged by `react/prop-types` (88 remaining ESLint errors, none from `client/dist`)
- `client/eslint.config.js`'s dist exclusion is permanent infrastructure — no further action needed for future builds
- Plan 14-08 should NOT touch the `{ ignores: ['dist/**'] }` entry or any other rule in `eslint.config.js`; per this plan's prohibitions, the remaining 88 errors must be fixed at the source, never suppressed

---
*Phase: 14-ux-quality-polish-from-user-feedback*
*Completed: 2026-07-19*
