# Project Research Summary

**Project:** ApplyTrail
**Domain:** Portfolio-ready web app deployment and release polish
**Researched:** 2026-06-26
**Confidence:** HIGH

## Executive Summary

ApplyTrail is a local React + Express job application tracker that needs to transition from a development-only setup (Vite dev server + Express with proxy) to a production-deployable portfolio piece. The core challenge is architectural: the current two-process dev setup must collapse into a single Express process that serves both the built React frontend and the API. Research confirms this is a well-understood pattern with clear implementation steps.

The recommended approach is to deploy to Render's free tier using a single Node.js web service. Express serves the Vite-built static files from `client/dist/` and handles all API routes on the same origin, eliminating CORS concerns entirely. JSON file storage works as-is on Render's filesystem, though data will reset on redeploy -- acceptable for a portfolio demo and mitigated by seeding demo data on startup. Three npm packages (`helmet`, `compression`, `dotenv`) provide production-grade middleware with minimal complexity.

The primary risks are: (1) hardcoded `localhost:3000` URLs in frontend fetch calls that will break in production, (2) Express not serving the Vite build output or SPA catch-all route, and (3) real personal data (resume, applications) committed to a public repo. All three are preventable with straightforward code changes and should be addressed in the first deployment-readiness phase before any deployment attempt.

## Key Findings

### Recommended Stack

The stack remains unchanged -- React 18, Express 4, Vite 6, Node.js 18+. The only additions are three production middleware packages and Render as the hosting platform. No framework migration, no database, no Docker.

**Core technologies:**
- **Render (Web Service):** Free tier hosting with native monorepo support, auto-deploy from GitHub, persistent filesystem for JSON storage. Beats Vercel/Netlify (no filesystem), Railway (no free tier), and Fly.io (requires Docker).
- **helmet ^8.0.0:** Security headers middleware. Zero-config baseline protection (X-Content-Type-Options, X-Frame-Options, CSP). Required for any public-facing Express app.
- **compression ^1.7.5:** Gzip response middleware. 60-80% payload reduction for JSON responses. One `require` + one `app.use`.
- **dotenv ^16.4.7:** Environment variable loading for development. Production uses Render dashboard env vars directly.

**What NOT to use:** Vercel/Netlify (no persistent filesystem), Docker (unnecessary complexity), PM2 (Render handles process management), nginx (Express serves static files directly), Next.js migration (rewrites entire frontend).

### Expected Features

**Must have (v1.1 launch):**
- Production build serving (Express serves `client/dist/` with SPA catch-all) -- makes app deployable
- Health check endpoint (`GET /api/health`) -- required by hosting platforms
- Environment-based configuration (`NODE_ENV` toggles) -- separates dev from prod behavior
- Security headers via helmet -- baseline security expectation
- Response compression -- performance baseline
- `render.yaml` blueprint -- declarative deployment config
- README update with screenshots, badges, live demo link -- first impression
- LICENSE file (MIT) -- legal clarity for public repo

**Should have (competitive differentiators):**
- Live demo URL on Render -- instant differentiator, reviewers can click and try
- Animated demo GIF showing key workflow -- proves interactivity
- Architecture diagram updated for production state -- shows system design thinking
- Tech stack and deployment badges -- quick visual scan

**Defer (v2+):**
- GitHub Actions CI/CD -- no tests to run yet
- Docker containerization -- unnecessary for single-service app
- Custom domain -- `.onrender.com` subdomain sufficient for portfolio
- Database migration -- violates core JSON file storage constraint
- Rate limiting, CORS whitelist, morgan logging -- add after validation

### Architecture Approach

The architecture transforms from a two-process dev setup (Vite on :5173, Express on :3000 with proxy) to a single Express process serving everything. In production, Express serves the pre-built React static files from `client/dist/`, handles all API routes, and falls back to `index.html` for SPA client-side routing. The Vite dev server is not used in production. JSON data files remain on disk with a configurable `DATA_DIR` environment variable. Demo/seed data files enable portfolio visitors to see a populated app without manual setup.

**Major components:**
1. **Express Server (modified)** -- Adds static file serving, health check, helmet/compression middleware, SPA catch-all route. Single process, single port in production.
2. **Vite Build (new step)** -- `vite build` produces `client/dist/` with hashed assets. Run once at deploy time, not at runtime.
3. **Demo Seed Data (new)** -- Pre-populated resume, job postings, and applications in `server/data/demo/`. Server seeds from demo data if production data directory is empty.
4. **render.yaml (new)** -- Declarative deployment blueprint. Build command installs client deps, runs Vite build, installs server deps. Start command runs Express in production mode.

### Critical Pitfalls

1. **Express not serving Vite build output** -- The app works in dev but shows blank page in production. Add `express.static(path.join(__dirname, '..', 'client', 'dist'))` and SPA catch-all `app.get('*', ...)` gated behind `NODE_ENV=production`. Verify with `curl http://localhost:3000` after `npm run build`.

2. **Hardcoded `localhost:3000` in frontend fetch calls** -- Works via Vite proxy in dev, fails in production with CORS errors or connection refused. Change all `fetch('http://localhost:3000/api/...')` to `fetch('/api/...')`. Verify with `grep -r "localhost:3000" client/src/`.

3. **Real personal data in public repo** -- `applications.json`, `resume.json` contain real names, emails, job applications. Replace with demo data before making repo public. Check full git history with `git log --all --full-history -- applications.json`.

4. **Missing `NODE_ENV=production`** -- Express defaults to dev mode: slower, verbose errors, no caching. Set in Render dashboard environment variables. Verify in startup logs.

5. **Build command runs in wrong directory** -- Hosting platform runs `npm run build` at root, but Vite config is in `client/`. Add root-level `"build": "cd client && npm run build"` script. Verify with `npm run build` locally.

## Implications for Roadmap

### Phase 1: Deployment Readiness

**Rationale:** This comes first because nothing else works until the app can run in production mode. All subsequent phases depend on a working production build. This phase also prevents the highest-severity pitfalls (blank page, broken API calls, stale README).

**Delivers:** A production-ready Express server that serves the React build, handles API routes, and works locally with `npm run build && npm start`.

**Addresses:**
- Production build serving (Express static + SPA catch-all)
- Health check endpoint
- Environment-based configuration
- Security headers (helmet)
- Response compression
- Root-level `build` and `start` scripts
- Hardcoded URL cleanup
- `render.yaml` blueprint
- `.env.example` documentation

**Avoids:**
- Pitfall 1 (Express not serving build output)
- Pitfall 2 (Hardcoded localhost URLs)
- Pitfall 4 (Missing NODE_ENV)
- Pitfall 7 (No health check)
- Pitfall 9 (SPA routing 404)
- Pitfall 10 (Build command wrong directory)

### Phase 2: Demo Data and Seed Logic

**Rationale:** Comes second because deployment needs populated data to be useful. Demo data must exist before deployment so the live app looks complete. Also prevents the real-data-in-public-repo pitfall.

**Delivers:** Pre-populated demo data files and server-side seed logic that initializes data from demo files when the data directory is empty.

**Addresses:**
- Demo/seed data files (resume, job postings, applications in various statuses)
- Seed-on-startup logic in Express server
- Data persistence strategy documentation (data resets on redeploy)

**Avoids:**
- Pitfall 3 (JSON storage on hosting -- documented limitation with demo mitigation)
- Pitfall 8 (Real data in public repo -- demo data replaces real data)

### Phase 3: Deploy to Render

**Rationale:** Comes third because the app must be production-ready locally before deploying. This phase is mostly configuration and platform setup, not code changes.

**Delivers:** Live demo URL on Render free tier. App accessible via `https://applytrail.onrender.com`.

**Addresses:**
- Live deployment on Render
- Environment variable configuration on platform
- Health check verification on platform
- Data directory configuration for Render

### Phase 4: Documentation and Release Assets

**Rationale:** Comes last because screenshots and documentation require a live deployment to reference. README, LICENSE, screenshots, and slides all need the production URL.

**Delivers:** Polished README with screenshots, LICENSE file, updated architecture diagram, deployment badge, animated demo GIF, updated Marp slides.

**Addresses:**
- README update (screenshots, badges, live demo link, accurate structure)
- LICENSE file (MIT)
- Animated demo GIF
- Marp slides update
- Architecture diagram update

**Avoids:**
- Pitfall 5 (Screenshots showing localhost)
- Pitfall 6 (README referencing dead features)

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** Server modifications must work before demo data can be tested. Seed logic depends on the production server configuration.
- **Phase 2 before Phase 3:** Demo data must exist before deployment so the live app is not empty. Replacing real data with demo data must happen before the repo goes public.
- **Phase 3 before Phase 4:** Screenshots and documentation need a live URL. Deploying first, then documenting the deployment, is the natural order.
- **All phases avoid pitfalls:** Each phase explicitly addresses the pitfalls most relevant to its scope, preventing compounding issues.

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented Express middleware patterns. helmet, compression, express.static are all standard with excellent docs. Health check is a single endpoint.
- **Phase 2:** JSON file seeding is straightforward. No complex patterns.
- **Phase 3:** Render documentation covers Node.js monorepo deployment thoroughly. `render.yaml` is declarative and simple.
- **Phase 4:** README, LICENSE, screenshots are standard release activities. No research needed.

**No phases require deeper research.** All patterns are well-documented and the research confidence is high across all areas.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies already in use or have excellent official documentation. Render docs verified. helmet/compression are standard Express middleware. |
| Features | MEDIUM | Feature prioritization based on portfolio project best practices and competitive analysis. "What looks good to reviewers" is somewhat subjective. |
| Architecture | HIGH | Express static serving + SPA catch-all is a well-documented pattern. Single-process production architecture is standard for Node.js apps. |
| Pitfalls | HIGH | All pitfalls sourced from official documentation and verified against project structure. Recovery strategies are concrete and testable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Render free tier limitations:** Research did not deeply verify current Render free tier limits (sleep after inactivity, bandwidth caps, persistent disk availability on free tier). Validate during Phase 3 deployment.
- **Demo data content quality:** The demo resume and applications need to be realistic enough to showcase the app well. This is a content creation task, not a technical gap -- address during Phase 2.
- **Animated GIF tooling:** LICEcap and ScreenToGif were suggested but not evaluated for macOS compatibility. `capture-website-cli` was recommended for static screenshots but may not handle animated capture. Evaluate during Phase 4.

## Sources

### Primary (HIGH confidence)
- Render monorepo docs: https://docs.render.com/monorepo
- Express production best practices: https://expressjs.com/en/advanced/best-practice-security.html
- Vite production build: https://vitejs.dev/guide/build.html
- helmet npm: https://www.npmjs.com/package/helmet
- compression npm: https://www.npmjs.com/compression

### Secondary (MEDIUM confidence)
- Shields.io badge generation: https://shields.io
- Marp CLI: https://github.com/marp-team/marp-cli
- capture-website-cli: https://github.com/sindresorhus/capture-website-cli

### Tertiary (LOW confidence)
- Railway/Fly.io docs: Compared against Render but not deeply verified for this project's specific constraints

---
*Research completed: 2026-06-26*
*Ready for roadmap: yes*
