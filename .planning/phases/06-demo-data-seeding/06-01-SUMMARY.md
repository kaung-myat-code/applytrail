---
phase: 06-demo-data-seeding
plan: 01
status: complete
completed_at: "2026-06-27"
requirements_met:
  - DEMO-01
  - DEMO-02
  - DEMO-03
  - DEMO-04
---

# Summary: Phase 6 Plan 01 — Demo Data & Seeding

## What Changed

Created three demo data files for a fictional persona (Jordan Rivera) and a server-side seeding mechanism that populates data files on first launch.

## Files Created

| File | Purpose |
|------|---------|
| `server/demo-data/resume.json` | Complete resume for Jordan Rivera (mid-level fullstack developer) |
| `server/demo-data/job_postings.json` | 3 job postings with stable IDs (demo-posting-1 through 3) |
| `server/demo-data/applications.json` | 4 applications in statuses: drafted, applied, interviewing, rejected |

## Files Modified

| File | Change |
|------|--------|
| `server/index.js` | Added `DEMO_DIR` constant, `seedDemoData()` function, and startup call before `migrateApplications()` |

## Key Details

- **Persona**: Jordan Rivera, mid-level fullstack developer in Austin, TX
- **Seeding trigger**: Runs at server startup; checks each data file for missing, empty, or invalid JSON
- **Safety**: Never overwrites existing data files with content
- **Order**: `seedDemoData()` runs before `migrateApplications()` so demo records get migrated if needed
- **Internal consistency**: All application `job_posting_id` values reference valid demo posting IDs; company/role fields match

## Verification Results

- Automated schema validation: passed
- Seeding on empty data: passed (all 3 files seeded)
- Seeding skips existing data: passed (Alex Tan data untouched)
- Integration test (backup → delete → seed → verify → restore): passed
