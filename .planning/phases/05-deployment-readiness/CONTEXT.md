# Phase 5 Context: Deployment Readiness

## Goal

App runs in production mode with Express serving built React files, security headers, compression, and environment-based configuration.

## Requirements (DEPLOY-01 through DEPLOY-09)

| ID | Requirement | Notes |
|----|-------------|-------|
| DEPLOY-01 | Express serves built React static files from `client/dist/` with SPA catch-all | Must handle client-side routing |
| DEPLOY-02 | `GET /api/health` returns server status | For hosting platform monitoring |
| DEPLOY-03 | Security headers via helmet middleware in production | Install `helmet` package |
| DEPLOY-04 | Response compression via compression middleware in production | Install `compression` package |
| DEPLOY-05 | Environment-based config separates dev/prod (`NODE_ENV` toggles) | Dev: Vite proxy. Prod: Express serves static. |
| DEPLOY-06 | Root `package.json` has `build` and `start` scripts | `build` = cd client && npm run build. `start` = cd server && node index.js |
| DEPLOY-07 | All frontend fetch calls use relative URLs | ALREADY DONE — all fetch calls use `/api/...` |
| DEPLOY-08 | `render.yaml` blueprint exists | Build command, start command, env config |
| DEPLOY-09 | `.env.example` documents configurable env vars | PORT, NODE_ENV |

## Current State

### Architecture
- **Monorepo**: Root `package.json` + `client/` + `server/` subdirectories
- **Dev mode**: `npm run dev` runs Vite (port 5173) + Express (port 3000) concurrently, Vite proxies `/api` to Express
- **Server**: `server/index.js` — Express 4, serves API only, no static file serving
- **Client**: React SPA with React Router 6, Vite build tool
- **Data**: JSON files in project root (`resume.json`, `job_postings.json`, `applications.json`)

### Key Observations
1. `server/index.js` already reads `PORT` from env (`process.env.PORT || 3000`)
2. No `NODE_ENV` checks exist anywhere — helmet/compression not installed
3. `DATA_DIR` in server points to `path.join(__dirname, '..')` — the project root
4. Client fetch calls all use relative URLs already (DEPLOY-07 satisfied)
5. Root `package.json` has `dev` script but no `build` or `start` scripts
6. Client `package.json` has `build` script (`vite build`) — output goes to `client/dist/` by default
7. No `render.yaml`, no `.env.example`, no health endpoint

### Dependencies to Add
- `helmet` — security headers middleware
- `compression` — response compression middleware

### Files to Modify
- `server/index.js` — Add static file serving, health endpoint, helmet, compression, NODE_ENV checks
- `package.json` (root) — Add `build` and `start` scripts

### Files to Create
- `render.yaml` — Render deployment blueprint
- `.env.example` — Environment variable documentation

## Success Criteria

1. `npm run build && npm start` at project root → app at localhost:3000
2. All pages and API endpoints work from single Express origin (no CORS, no blank pages)
3. `GET /api/health` returns JSON status
4. Security headers (helmet) and compression active when `NODE_ENV=production`
5. All frontend fetch calls use relative URLs (already done)

## Constraints

- No auth (single-user local tool)
- No external APIs
- JSON file storage must remain
- No Docker (per requirements out-of-scope)
- Data files currently at project root — may need to handle path differences in production
