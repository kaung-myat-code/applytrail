---
phase: 17-honest-analysis-output
plan: 04
subsystem: ui
tags: [react, skip-reasons, preview, vitest, testing, copywriting]

# Dependency graph
requires:
  - phase: 17-03
    provides: server/lib/tailor/applyPatches.js's SKIP_REASON.TARGET_ENTRY_NOT_FOUND enum value ('target-entry-not-found') that this plan mirrors client-side
provides:
  - client/src/lib/skipReasons.js mirror enum value TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found'
  - PreviewTailored.jsx per-reason copy branch inside the existing staleSkips block
  - PreviewTailored.test.jsx covering mixed-reason and empty-skips rendering
affects: [verify-work, any future work touching skip-reason display or stale-skips copy]

# Tech tracking
tech-stack:
  added: []
  patterns: [client/server SKIP_REASON enum mirroring with no shared module boundary (client/src/lib/skipReasons.js stays in lockstep with server/lib/tailor/applyPatches.js)]

key-files:
  created: [client/src/pages/PreviewTailored.test.jsx]
  modified: [client/src/lib/skipReasons.js, client/src/pages/PreviewTailored.jsx]

key-decisions:
  - "target-entry-not-found flows through isKnownReason into the existing staleSkips bucket — isDefectSkip was left untouched (still only returns true for UNSUPPORTED_COMBINATION) since RESEARCH.md A3 and PATTERNS.md classify it as a known non-defect (stale/positional), not an internal-error defect"
  - "Per-reason string selection only, no new CSS class, component, or color — the TARGET_ENTRY_NOT_FOUND copy renders inside the existing amber .skippedWarning block per the UI-SPEC copy contract"
  - "The TARGET_ENTRY_NOT_FOUND copy interpolates the raw s.section value ('experience'/'projects'), not the human-cased SECTION_LABELS lookup, matching the UI-SPEC example string exactly"

patterns-established:
  - "Client/server SKIP_REASON enum mirroring: client/src/lib/skipReasons.js must gain any new value in lockstep with server/lib/tailor/applyPatches.js; KNOWN_REASONS derives from Object.values(SKIP_REASON) so no separate edit is needed there"

requirements-completed: [OUT-05]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "Client-side mirror of the server's target-entry-not-found skip reason in skipReasons.js, bucketed as a known non-defect (not a defect) so it flows into the stale-skips warning bucket"
    requirement: OUT-05
    verification:
      - kind: unit
        ref: "node -e source assertion: client/src/lib/skipReasons.js contains TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found' (exact string match against server/lib/tailor/applyPatches.js)"
        status: pass
      - kind: unit
        ref: "client/src/lib/skipReasons.js — isDefectSkip still returns true only for UNSUPPORTED_COMBINATION (grep-verified, unchanged)"
        status: pass
    human_judgment: false
  - id: D2
    description: "PreviewTailored.jsx branches stale-skips copy per s.reason: TARGET_ENTRY_NOT_FOUND interpolates the unmatched target_entry and raw section name; NOT_FOUND/CURRENT_MISMATCH keep the existing generic stale-content string; header pluralization and footer unchanged"
    requirement: OUT-05
    verification:
      - kind: unit
        ref: "client/src/pages/PreviewTailored.test.jsx — mixed-reason test asserts both the generic current-mismatch string and the exact target-entry-not-found copy (with 'Acme Corp' and 'experience' interpolated) render in the same stale-skips block"
        status: pass
    human_judgment: false
  - id: D3
    description: "New PreviewTailored.test.jsx covering mixed-reason stale-skip rendering and the empty-skips edge case (no stale-skips block rendered at all when skipped is empty)"
    requirement: OUT-05
    verification:
      - kind: unit
        ref: "cd client && npx vitest run src/pages/PreviewTailored.test.jsx (2/2 pass); full client suite npx vitest run (29/29 pass, no regressions)"
        status: pass
    human_judgment: false

# Metrics
duration: 43min
completed: 2026-10-09
status: complete
---

# Phase 17 Plan 04: Client Skip-Reason Mirror and Preview Copy Summary

**Mirrored the server's target-entry-not-found skip reason client-side and gave PreviewTailored distinct, accurate copy for the last-entry fallback case — no longer misdescribing it as generic stale-content drift.**

## Performance

- **Duration:** 43 min
- **Started:** 2026-10-09T19:59:55Z
- **Completed:** 2026-10-09T20:43:27Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Client `skipReasons.js` now mirrors the server's `TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found'` enum value exactly, and it correctly buckets as a known non-defect (flows through `isKnownReason` into `staleSkips`, not the defect bucket — `isDefectSkip` untouched)
- `PreviewTailored.jsx` now branches stale-skips copy per `s.reason`: the target-entry-not-founds case interpolates the unmatched `target_entry` and raw `section` name ("no entry named "Acme Corp" was found — this was attached to your most recent experience entry instead."), while NOT_FOUND/CURRENT_MISMATCH keep the existing generic stale-content string; header pluralization and footer are unchanged
- New `PreviewTailored.test.jsx` covers mixed-reason rendering (both copy strings asserted in the same stale-skips block) and the empty-skips edge case (no stale-skips block rendered at all) — full client suite still passes (29/29)

## Task Commits

Each task was committed atomically:

1. **Task 1: Mirror the SKIP_REASON value and branch skip copy per reason (OUT-05)** - `2527ba8` (feat)
2. **Task 2: Add a PreviewTailored test covering mixed-reason stale-skip rendering (OUT-05)** - `524212c` (test)

**Plan metadata:** this SUMMARY.md commit (docs: complete plan summary)

## Files Created/Modified
- `client/src/lib/skipReasons.js` - Added `TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found'` to the client mirror of the server's SKIP_REASON enum; `isDefectSkip` left unchanged (still only returns true for UNSUPPORTED_COMBINATION), so the new value flows through `isKnownReason` into the `staleSkips` bucket
- `client/src/pages/PreviewTailored.jsx` - Imported `SKIP_REASON` and branched the `staleSkips` `.map()` body on `s.reason`: TARGET_ENTRY_NOT_FOUND interpolates `s.target_entry` and raw `s.section`; all other known stale reasons keep the original generic string. Header pluralization and footer unchanged
- `client/src/pages/PreviewTailored.test.jsx` (new) - Two tests following the existing `CreateApplicationModal.test.jsx` vitest/@testing-library/MemoryRouter conventions: one for mixed-reason copy rendering, one confirming the stale-skips block is absent when `skipped` is empty

## Decisions Made
- Followed RESEARCH.md A3 / PATTERNS.md Pitfall 3: target-entry-not-found is a known non-defect (stale/positional data condition), so it was added to the enum and left to flow through the existing `isKnownReason`/`staleSkips` path — `isDefectSkip` was explicitly not touched, keeping the defect bucket reserved for genuine internal-error cases (UNSUPPORTED_COMBINATION only)
- Interpolated the raw `s.section` value (not the human-cased `SECTION_LABELS` lookup) in the TARGET_ENTRY_NOT_FOUND copy, to match the UI-SPEC example string exactly ("...most recent experience entry instead." not "...most recent Experience entry instead.")
- No new CSS class, color, or component — both reason variants render inside the existing amber `.skippedWarning` block, per the UI-SPEC copy contract ("no new color/component needed, just per-reason string selection")

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed the client's already-declared dependencies to enable test verification in the fresh worktree**
- **Found during:** Task 1 (verification step — `npx vitest run` failed)
- **Issue:** This isolated worktree checkout did not have `client/node_modules` populated (gitignored, not carried over from the main checkout), so vitest could not start to run the plan's required verification steps. This was missing environment setup, not a missing or hallucinated package — `client/package.json` already declared every dependency, none were added or changed.
- **Fix:** Ran `npm install` in `client/` to install the project's already-declared dependencies (vitest, @testing-library/react, jsdom, etc.). `npm install` incidentally re-synced a non-functional `engines` metadata block into `client/package-lock.json` (npm self-metadata, no dependency resolution change) — this was reverted via `git checkout -- client/package-lock.json` to keep the task commits scoped strictly to the plan's deliverables, since that lockfile touch was an environment-setup side effect, not part of Task 1 or Task 2's intent.
- **Files modified:** `client/node_modules/` (untracked, gitignored — not committed); `client/package-lock.json` (reverted, not committed)
- **Verification:** Full client test suite runs cleanly (29/29 pass across 6 test files); `client/package.json` confirmed unmodified via `git diff` (threat model check T-17-SC satisfied)
- **Committed in:** No commit — environment setup only, reverted file was never staged

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Routine worktree environment setup, not a scope or design change — no new packages were added, only the project's existing declared dependencies were installed so the plan's verification steps could run. No scope creep.

## Issues Encountered
None — both planned tasks executed cleanly against the already-landed Plan 03 server enum with no source-level bugs, type errors, or logic issues requiring debugging beyond the environment setup above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OUT-05's client-side half is complete: the server (Plan 03) and client (this plan) now share an exact `target-entry-not-found` string, PreviewTailored renders accurate fallback copy, and a regression test locks in the per-reason string contract
- No blockers for subsequent Phase 17 plans — this plan's dependency (Plan 03) is satisfied and no other plan depends on this one's output per the wave structure
- OUT-05 is now fully checkable end-to-end (server patch engine behavior from Plan 03 + client display from this plan); remaining Phase 17 requirements OUT-03, OUT-04, OUT-06 are untouched by this plan and still pending

## Self-Check: PASSED

Verified before final commit:
- `client/src/lib/skipReasons.js` — FOUND
- `client/src/pages/PreviewTailored.jsx` — FOUND
- `client/src/pages/PreviewTailored.test.jsx` — FOUND
- `.planning/phases/17-honest-analysis-output/17-04-SUMMARY.md` — FOUND
- Commit `2527ba8` (feat, Task 1) — FOUND
- Commit `524212c` (test, Task 2) — FOUND

---
*Phase: 17-honest-analysis-output*
*Completed: 2026-10-09*
