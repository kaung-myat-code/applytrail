# Phase 7 Context: Production Deployment

## Goal

App is live and fully functional on a public URL via Render free tier.

## Requirements (PROD-01 through PROD-04)

| ID | Requirement | Notes |
|----|-------------|-------|
| PROD-01 | App deployed to Render free tier as a web service with auto-deploy from GitHub | Use render.yaml blueprint or manual dashboard setup |
| PROD-02 | Configure required Render environment variables, or document that none are required | NODE_ENV=production is set in render.yaml; PORT is auto-set by Render |
| PROD-03 | Health check endpoint is verified working on deployed instance | GET /api/health returns JSON { status: "ok", uptime: ... } |
| PROD-04 | Live demo URL is accessible and all features work end-to-end | Resume editing, job posting input, cover letter generation, application tracking |

## Current State

### Deployment Infrastructure (Already Complete from Phase 5)

- `render.yaml` exists at project root with web service definition
- Root `package.json` has `build`, `start`, and `postinstall` scripts
- `server/index.js` has production middleware (helmet, compression, static serving, SPA catch-all)
- Health endpoint at `GET /api/health` returns JSON status
- `.env.example` documents PORT and NODE_ENV

### render.yaml Content

```yaml
services:
  - type: web
    name: applytrail
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### Demo Data (Already Complete from Phase 6)

- `server/demo-data/` contains resume.json, job_postings.json, applications.json
- `seedDemoData()` in server/index.js seeds data on startup when files are empty/missing
- Demo data uses fictional persona "Jordan Rivera" with realistic content

### Repository State

- Git repo on `main` branch
- All Phase 5 and Phase 6 code committed
- No uncommitted changes

## Success Criteria

1. App is accessible at a public `*.onrender.com` URL
2. All features work end-to-end on the deployed instance (resume editing, job posting input, cover letter generation, application tracking)
3. Production health check endpoint returns a successful response
4. Pushing to the main branch triggers automatic redeployment on Render

## Constraints

- Render free tier: single web service, 750 hours/month, spins down after 15 min of inactivity
- No custom domain needed (use *.onrender.com)
- No database (JSON file storage — data resets on redeploy, acceptable for portfolio demo)
- No Docker
- No GitHub Actions CI/CD (Render auto-deploy sufficient)
- Must verify the deployed instance works end-to-end before marking phase complete

## Deployment Verification Checklist

After deployment, verify:
1. `curl https://applytrail.onrender.com/api/health` returns JSON with status "ok"
2. `curl https://applytrail.onrender.com/api/resume` returns resume data
3. Browser loads the app at the public URL
4. Resume page displays and allows editing
5. New Application page allows pasting job postings
6. Cover letter generation works
7. Applications list shows demo data with multiple statuses
8. Status updates persist within the session (note: data resets on redeploy)

## Files to Verify (No Code Changes Expected)

- `render.yaml` — already exists, may need adjustment
- `server/index.js` — already production-ready
- `package.json` — already has build/start scripts
- `.env.example` — already exists

## Key Notes

- This phase is primarily operational (dashboard setup + verification), not code-writing
- The render.yaml blueprint should handle most configuration automatically
- Render auto-deploy from GitHub main branch is the standard setup
- Free tier spins down after inactivity — first request after idle may take 30+ seconds
