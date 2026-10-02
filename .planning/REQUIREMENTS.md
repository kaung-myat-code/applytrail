# Requirements: v2.1 Protect and Clearly Label the Hosted Demo

## Overview

This milestone makes the public Render deployment’s safety boundaries explicit while preserving the existing unauthenticated, single-user local architecture. The warning is always visible because the repository has no reliable existing hosted/demo-mode flag and adding one would introduce unnecessary configuration complexity for this first safety milestone.

## User Stories

* As a visitor to the hosted demo, I want to understand that it is unauthenticated and shared before entering data.
* As a local user, I want the existing application workflow to continue working without authentication or deployment-specific behavior.
* As a developer, I want setup and provider documentation to match the actual repository so I do not accidentally put private data into the hosted demo or configure the wrong environment file.

## Requirements

### Hosted Demo Warning

- [ ] **DEMO-01**: Users see an always-visible warning in the top-level client application shell stating that the hosted demo is unauthenticated, shared, writable, disposable, and for demonstration purposes only.
- [ ] **DEMO-02**: The warning tells users not to submit real resumes, contact information, credentials, secrets, or other private job-search data.
- [ ] **DEMO-03**: The warning does not imply privacy, account isolation, authentication, or durable hosted storage, and it does not require a new dependency or API change.

### Documentation Accuracy

- [ ] **DOCS-01**: The README contains a prominent live-demo warning covering unauthenticated access, possible shared visibility/modification, reset/loss of hosted data, private-data prohibition, and demonstration-only use.
- [ ] **DOCS-02**: The README explains local JSON-file behavior separately from hosted-demo behavior, including the hosted deployment’s disposable-data limitation.
- [ ] **DOCS-03**: README framework/version information matches the package manifests and environment-variable instructions identify the actual file loaded by the root development command.
- [ ] **DOCS-04**: AI-provider documentation clearly states that enabling optional AI analysis may send resume and job-posting content to the selected third-party provider, while heuristic mode remains local.
- [ ] **DOCS-05**: `render.yaml` is changed only if needed to support or accurately document the warning; deployment service type, build commands, persistence settings, and environment handling remain unchanged.

### Validation

- [ ] **TEST-01**: Client tests verify the warning renders and includes the required unauthenticated, shared/disposable, private-data, and demo-only guidance.
- [ ] **TEST-02**: Existing client tests, lint, the full project test command, and the production build continue to pass.

## Out of Scope

* Authentication, authorization, accounts, or session isolation
* API route changes or server/persistence refactoring
* SQLite migration, durable hosted persistence, backups, or data recovery
* Changes to Render service type, build commands, or deployment settings unrelated to the warning
* New AI providers, changes to provider fallback behavior, or AI prompt/schema changes
* Broad README rewriting unrelated to safety, setup accuracy, runtime versions, or local-versus-hosted behavior
* Fixing every issue listed in `PROJECT_REVIEW.md`

## Definition of Done

* A visitor can see and understand the hosted-demo warning from every client route.
* The README and `AI_PROVIDERS.md` make no inaccurate privacy, persistence, or version claims.
* No API contract, local workflow, or deployment command changes.
* Focused warning tests pass, followed by lint, tests, and production build.

## Traceability

| Requirement | Phase |
|---|---|
| DEMO-01 | Phase 16 |
| DEMO-02 | Phase 16 |
| DEMO-03 | Phase 16 |
| DOCS-01 | Phase 16 |
| DOCS-02 | Phase 16 |
| DOCS-03 | Phase 16 |
| DOCS-04 | Phase 16 |
| DOCS-05 | Phase 16 |
| TEST-01 | Phase 16 |
| TEST-02 | Phase 16 |
