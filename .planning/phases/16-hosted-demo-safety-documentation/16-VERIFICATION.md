---
phase: 16-hosted-demo-safety-documentation
verified: 2026-10-02T23:25:30+08:00
status: human_needed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Open the client at desktop and narrow/mobile widths, then visit each registered route: /, /resume, /resume/:id, /resume-library, /new, /applications, /cover-letter, /analysis, /analysis/review, and /analysis/preview."
    expected: "The hosted-demo warning remains visible beside the navigation on every route, is readable with sufficient contrast and wrapping, and does not obscure or replace routed content."
    why_human: "Visual appearance, responsive layout, and real browser route presentation cannot be established completely from source inspection and jsdom tests."
---

# Phase 16: Hosted Demo Safety & Documentation Verification Report

**Phase Goal:** Users can recognize the hosted demo's safety boundaries from every client route, and developers can configure and describe the project accurately without changes to authentication, APIs, persistence, or deployment behavior.
**Verified:** 2026-10-02
**Status:** Human verification required
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A visitor sees an always-visible client-shell warning on every route identifying the hosted demo as unauthenticated, shared, writable, disposable, and for demonstration purposes only. | ✓ VERIFIED | `client/src/main.jsx:19-34` places every registered route beneath `<App />`; `client/src/App.jsx:7-19` renders the alert before `<Outlet />`. Focused tests passed for `/` and `/applications`, including child-content preservation. |
| 2 | The warning tells visitors not to submit real resumes, contact information, credentials, secrets, or other private job-search data without implying privacy, account isolation, or durable hosted storage. | ✓ VERIFIED | `client/src/App.jsx:11-16` contains all required terms and makes no privacy, isolation, or durable-storage promise. `client/src/App.test.jsx` asserts each required warning term and prohibition. |
| 3 | README and AI-provider documentation accurately distinguish local JSON behavior from disposable hosted behavior, identify runtime versions and the development environment file, and disclose the optional AI transfer boundary. | ✓ VERIFIED | `README.md:18`, `README.md:87-89`, `README.md:107`, `README.md:137-142`, and `README.md:215-223` document the safety, storage, manifest-backed versions, `server/.env`, and Render context. `AI_PROVIDERS.md:5-7` explicitly distinguishes local heuristic processing from Gemini/OpenRouter/Groq third-party transfer. |
| 4 | Render configuration, if unchanged, continues to preserve service type, build/start commands, persistence behavior, and environment handling. | ✓ VERIFIED | `render.yaml` is unchanged in the phase diff and still declares the same Node web service, build/start commands, environment variables, and no persistence configuration. |
| 5 | Focused warning tests and existing validation remain passing without API or server/persistence changes. | ✓ VERIFIED | Focused App test: 3/3 passed. Full `npm test`: 5 client files/27 tests plus all server tests passed. `npm run lint` passed; `npm run build` passed; `git diff --check` passed. Phase diff contains no server source, API, package manifest, lockfile, or `render.yaml` changes. |

**Score:** 5/5 truths verified (0 behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `client/src/App.jsx` | Always-visible warning in the top-level shell | ✓ VERIFIED | Substantive semantic `role="alert"` with explicit safety copy; imports scoped CSS and renders alongside `Navbar` before routed `<Outlet />`. |
| `client/src/App.module.css` | Scoped, readable responsive warning presentation | ✓ VERIFIED | Defines `.demoWarning` with existing spacing/color/radius tokens and a mobile column layout at 640px. Imported and used by `App.jsx`. Browser visual behavior remains in human verification. |
| `client/src/App.test.jsx` | Vitest/Testing Library warning and route inheritance coverage | ✓ VERIFIED | Three focused tests assert required terms, private-data prohibitions, alternate-route warning visibility, and child content. |
| `README.md` | Hosted safety, local/hosted storage, runtime, environment, and deployment documentation | ✓ VERIFIED | Prominent warning, separate local/hosted data section, versions matching package manifests, `server/.env` command explanation, and unchanged Render behavior description are present. |
| `AI_PROVIDERS.md` | Accurate local heuristic versus third-party processing documentation | ✓ VERIFIED | Provider boundary is explicit while existing provider names, fallback order, keys, models, and troubleshooting sections remain present. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `client/src/main.jsx` route configuration | `client/src/App.jsx` | `createBrowserRouter` parent `element: <App />` with all route children | ✓ WIRED | All ten registered routes are nested under the shared shell, whose `<Outlet />` renders child content. |
| Root `package.json` dev command | `server/.env` | `dev:server`: `cd server && node --env-file=.env index.js` | ✓ WIRED | README line 107 names the actual server-relative environment file and command. |
| Package manifests | README version claims | React/client/server/root manifest values | ✓ WIRED | README claims React 19.2.8, React Router 7.18.1, Express 5.2.1, Vite 6.0.0, and Node >=20.19.0, matching the inspected manifests. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `client/src/App.jsx` warning | Static safety copy | App-shell JSX literal | Not applicable; this is intentional static guidance, not dynamic data | ✓ VERIFIED |
| `README.md`, `AI_PROVIDERS.md` | Documentation claims | Repository manifests, root scripts, `render.yaml`, and provider implementation/docs | Yes; claims match inspected sources | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| App-shell warning contains required wording and survives a second child route | `cd client && npx vitest run src/App.test.jsx` | 1 file, 3 tests passed | ✓ PASS |
| Existing client and server behavior remains valid | `npm test` | 27 client tests passed; all server test groups passed | ✓ PASS |
| Client lint | `npm run lint` | ESLint completed successfully | ✓ PASS |
| Production client build | `npm run build` | Vite production build completed successfully | ✓ PASS |
| Whitespace and protected Render config check | `git diff --check && test "$(git diff --name-only -- render.yaml ...)" = "0"` | Passed | ✓ PASS |

## Probe Execution

No phase-declared or conventional `scripts/*/tests/probe-*.sh` probes were found. Probe execution: SKIPPED (not applicable).

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| DEMO-01 | 16-01 | Always-visible unauthenticated/shared/writable/disposable/demo-only warning | ✓ SATISFIED | App shell implementation, route nesting, and focused tests |
| DEMO-02 | 16-01 | Prohibit real/private job-search data | ✓ SATISFIED | Alert copy and focused assertions |
| DEMO-03 | 16-01 | No misleading privacy/isolation/durability promise or new dependency/API | ✓ SATISFIED | Copy, unchanged manifests/server/API, and phase diff |
| DOCS-01 | 16-01 | Prominent README hosted-demo warning | ✓ SATISFIED | `README.md:18` |
| DOCS-02 | 16-01 | Separate local JSON and disposable hosted behavior | ✓ SATISFIED | `README.md:87-89` |
| DOCS-03 | 16-01 | Manifest-backed versions and actual environment file | ✓ SATISFIED | `README.md:95-107,137-142`; inspected manifests/root script |
| DOCS-04 | 16-01 | Third-party AI transfer versus local heuristic behavior | ✓ SATISFIED | `AI_PROVIDERS.md:5-7` |
| DOCS-05 | 16-01 | Render configuration unchanged unless necessary | ✓ SATISFIED | `render.yaml` absent from phase diff |
| TEST-01 | 16-01 | Focused warning assertions | ✓ SATISFIED | `App.test.jsx`; 3/3 passed |
| TEST-02 | 16-01 | Existing tests, lint, and production build pass | ✓ SATISFIED | Full gates passed |

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| — | — | None found in phase files | — | No unreferenced `TBD`, `FIXME`, `XXX`, TODO, placeholder, empty implementation, or console-only implementation markers were found. |

## Human Verification Required

### Hosted warning visual and route coverage

**Test:** Open the client at desktop and narrow/mobile widths, then visit every registered route listed in the frontmatter.

**Expected:** The warning remains visible beside the navigation on every route, wraps cleanly, has readable contrast, and leaves routed page content usable.

**Why human:** Visual appearance, responsive presentation, and browser-level route navigation are not fully proven by source inspection and jsdom.

## Gaps Summary

Automated goal-backward verification found no blocking gaps. The implementation is substantive and wired: the warning is in the shared route parent, the tests exercise required copy and alternate child content, and the documentation matches the inspected manifests, scripts, provider boundary, and unchanged Render configuration. The only remaining gate is visual/browser confirmation of the warning's presentation across routes and viewport sizes.

---

_Verified: 2026-10-02T23:25:30+08:00_
_Verifier: Claude (gsd-verifier)_
