# Pitfalls Research

**Domain:** Deployment readiness, production deployment, documentation, and release assets for a React + Express web app
**Researched:** 2026-06-26
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Express Not Serving Vite Build Output

**What goes wrong:**
The app works in development (Vite dev server on :5173, Express on :3000) but in production the user sees a blank page or 404. The Express server does not serve the compiled React assets, so there is no frontend.

**Why it happens:**
Developers assume the production setup mirrors development. In dev, Vite serves the frontend and proxies `/api` to Express. In production, there is no Vite dev server -- Express must serve the built static files from `client/dist/` and also handle the SPA catch-all route for client-side routing.

**How to avoid:**
Add static file serving and SPA fallback to `server/index.js`:

```javascript
// Serve Vite build output
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// SPA catch-all — must come AFTER API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});
```

Gate this behind `NODE_ENV=production` so development still uses Vite's dev server and proxy.

**Warning signs:**
- `npm run build` succeeds but `curl http://localhost:3000` returns the Express default response or 404
- Navigating to `/resume` directly returns "Cannot GET /resume"
- Console shows API calls to `localhost:5173` in production

**Phase to address:**
Deployment readiness phase (production server configuration)

---

### Pitfall 2: API Base URL Hardcoded to localhost:3000

**What goes wrong:**
The frontend fetches from `http://localhost:3000/api/...` which works in development but fails in production where the app is served from a different origin (e.g., `https://applytrail.onrender.com`). CORS errors appear or requests simply fail.

**Why it happens:**
During development, the Vite proxy makes `/api` calls work without specifying a full URL. Developers never set up an environment-aware base URL because the proxy masks the problem. When deployed, the frontend tries to call `localhost:3000` which does not exist on the user's machine.

**How to avoid:**
Use relative URLs for all API calls. Change every `fetch('http://localhost:3000/api/...')` to `fetch('/api/...')`. This works in both development (Vite proxy handles it) and production (same origin). Create a shared API utility:

```javascript
// client/src/api.js
const BASE = import.meta.env.VITE_API_BASE || '';
export const api = (path, opts) => fetch(`${BASE}${path}`, opts);
```

**Warning signs:**
- Any `fetch` call in the frontend contains `localhost:3000` or a hardcoded domain
- Network tab shows requests to a different port than the page was served from
- CORS errors in production but not in development

**Phase to address:**
Deployment readiness phase (before any deployment attempt)

---

### Pitfall 3: JSON File Storage Breaks on Hosting Platforms

**What goes wrong:**
The app works locally but loses all data after deployment. On platforms like Render, Railway, or Vercel, the filesystem is ephemeral -- files written during runtime are lost on every redeploy or container restart.

**Why it happens:**
The app stores `resume.json`, `job_postings.json`, and `applications.json` on the local filesystem. Hosting platforms use containerized environments where the filesystem is read-only or ephemeral. Every deploy or restart wipes the data.

**How to avoid:**
For a portfolio MVP, accept the limitation and document it clearly. Add a note in the README: "Data resets on redeploy. This is a portfolio demo." For a real product, migrate to SQLite or a hosted database. For the portfolio use case, consider:
- Seeding demo data on startup so the app always looks populated
- Adding an export/import feature so users can back up their data
- Using Render's persistent disk (paid) or Railway's volume mounts

**Warning signs:**
- Data disappears after redeploy
- `writeJSON` calls succeed but data is gone on next request
- Container logs show the app running but data files are empty

**Phase to address:**
Deployment readiness phase (data persistence strategy)

---

### Pitfall 4: Missing NODE_ENV=production

**What goes wrong:**
The app runs slower than expected, exposes debug information, and Express serves development-mode error messages with stack traces to users.

**Why it happens:**
Developers forget to set `NODE_ENV=production` in the hosting platform's environment variables. Express defaults to development mode, which disables caching, enables verbose error output, and skips production optimizations.

**How to avoid:**
Set `NODE_ENV=production` in the hosting platform's environment variable configuration (not in code). In Express, verify it at startup:

```javascript
if (process.env.NODE_ENV !== 'production') {
  console.warn('WARNING: Not running in production mode');
}
```

**Warning signs:**
- Express error responses include full stack traces
- Response times are slower than expected
- Console output includes debug-level logging

**Phase to address:**
Deployment readiness phase (environment configuration)

---

### Pitfall 5: Portfolio Screenshots Show localhost:5173

**What goes wrong:**
README screenshots show the app running on `localhost:5173` with browser dev tools open, making it look like a development artifact rather than a polished product.

**Why it happens:**
Developers take screenshots during development rather than from the deployed production app. The URL bar shows `localhost`, the port number is visible, and the browser may show dev tools or development warnings.

**How to avoid:**
Take screenshots from the deployed production URL. Use a clean browser window (no dev tools, no bookmarks bar). Crop to show just the app content. Consider using a browser extension to hide the URL bar or use a screenshot tool that captures just the viewport.

**Warning signs:**
- URL bar in screenshots shows `localhost` or a port number
- Browser dev tools are visible
- Vite development overlay or HMR indicators appear

**Phase to address:**
Release assets phase (after deployment is live)

---

### Pitfall 6: README References Dead Features or Wrong Tech Stack

**What goes wrong:**
The README says "React 18" but the app uses React 19, or it references "Phase 3: Cover Letter Generation" as upcoming when it is already complete. Inconsistencies make the project look abandoned or poorly maintained.

**Why it happens:**
The README was written early in the project and never updated to reflect the current state. The tech stack section, roadmap, and feature descriptions drift from reality as the project evolves.

**How to avoid:**
Audit the README against the actual codebase before release. Check:
- `package.json` versions vs. README claims
- Roadmap items vs. actual completion status
- Feature descriptions vs. implemented functionality
- API route table vs. actual routes in `server/index.js`

**Warning signs:**
- `npm list` shows different versions than README claims
- Roadmap has unchecked items that are actually complete
- API documentation is missing routes that exist in code

**Phase to address:**
Documentation phase (README polish)

---

### Pitfall 7: No Health Check Endpoint

**What goes wrong:**
Hosting platforms like Render and Railway use health checks to determine if the app is running. Without a dedicated endpoint, the platform may mark the app as unhealthy and restart it repeatedly.

**Why it happens:**
Developers do not realize that hosting platforms ping a specific endpoint to verify the app is alive. The default `/` route may return HTML (which works) but a dedicated `/health` or `/api/health` endpoint is the standard pattern.

**How to avoid:**
Add a simple health check endpoint:

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

Configure the hosting platform to use this endpoint for health checks.

**Warning signs:**
- Platform dashboard shows the app as "unhealthy" or "deploying" indefinitely
- App restarts frequently without obvious errors
- Logs show repeated health check failures

**Phase to address:**
Deployment readiness phase (production server configuration)

---

### Pitfall 8: Data Files Committed to Git with Real User Data

**What goes wrong:**
The `applications.json`, `resume.json`, and `job_postings.json` files contain real personal data (names, emails, job applications) and are committed to a public GitHub repository.

**Why it happens:**
The files are tracked in git from the start because they are part of the project structure. When the repo is made public, all commit history containing personal data becomes publicly visible.

**How to avoid:**
Before making the repo public:
1. Replace real data with sample/demo data
2. Force-push to overwrite history, OR create a fresh repo with only the demo data
3. Add data files to `.gitignore` and provide a `sample-data/` directory instead
4. Verify no `.env` files or API keys are in the git history

**Warning signs:**
- `git log --all --full-history -- applications.json` shows real names and emails
- `.env` file appears in any commit
- `git log` shows API keys or tokens in commit messages

**Phase to address:**
Documentation phase (before making repo public)

---

### Pitfall 9: SPA Routing Returns 404 on Direct URL Access

**What goes wrong:**
User navigates to `https://applytrail.onrender.com/resume` directly (or refreshes the page) and sees a 404 error. The Express server does not have a catch-all route, so it tries to serve a file called `/resume` which does not exist.

**Why it happens:**
React Router handles client-side routing, but the server must return `index.html` for all non-API routes so React can take over. Without the catch-all, Express returns 404 for any path that does not match a static file or API route.

**How to avoid:**
Add the SPA catch-all route AFTER all API routes:

```javascript
// API routes first
app.get('/api/resume', ...);
app.post('/api/applications', ...);

// SPA catch-all — must be last
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});
```

**Warning signs:**
- Direct navigation to any page except `/` returns 404
- Page refresh on any route returns 404
- Browser back/forward buttons lead to 404

**Phase to address:**
Deployment readiness phase (production server configuration)

---

### Pitfall 10: Build Command Runs in Wrong Directory

**What goes wrong:**
The hosting platform runs `npm run build` at the project root, but the Vite config and React code are in `client/`. The build fails or produces nothing.

**Why it happens:**
The monorepo structure has separate `package.json` files for root, client, and server. Hosting platforms typically run build commands from the repo root. The root `package.json` has no `build` script -- it only has `dev`, `lint`, and `test`.

**How to avoid:**
Add a root-level build script that builds the client:

```json
{
  "scripts": {
    "build": "cd client && npm run build",
    "start": "cd server && node index.js"
  }
}
```

Or configure the hosting platform's build command explicitly: `cd client && npm install && npm run build`.

**Warning signs:**
- Deploy fails with "missing script: build"
- Build succeeds but `client/dist/` is empty
- Platform shows build output but the app serves nothing

**Phase to address:**
Deployment readiness phase (build configuration)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping `helmet` middleware | No extra dependency | Missing security headers (XSS, clickjacking) | Never for public deployment |
| No input validation on API routes | Faster development | Malformed data corrupts JSON files | Only for local-only MVP |
| Using `fs.writeFileSync` for all writes | Simple code | Blocks event loop, race conditions on concurrent writes | Acceptable for single-user local tool; not for multi-user |
| Hardcoding port 3000 | Works locally | Conflicts with hosting platform's `$PORT` injection | Never for deployment |
| No error boundary in React | Less code | Unhandled errors show blank white page | Never for portfolio |
| Console.log for all logging | No dependencies | No structured logs, hard to debug in production | Acceptable for MVP |
| Skipping CORS configuration | Works with Vite proxy | Breaks when frontend and API are on different origins | Only if same-origin in production |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Render.com | Not setting `PORT` env var (Render injects `$PORT`) | Use `process.env.PORT \|\| 3000` -- already correct in this codebase |
| Render.com | Build command runs at root, not in `client/` | Set build command to `cd client && npm install && npm run build` |
| Render.com | Not setting `NODE_ENV=production` | Add in Render dashboard environment variables |
| Railway | Forgetting to set root directory for monorepo | Set root directory or use `railway.json` with explicit build/start commands |
| Vercel | Trying to deploy Express as serverless functions | Do not use Vercel for Express -- use Render or Railway instead |
| GitHub Pages | Cannot host Express backend | Only viable for static sites -- not suitable for this project |
| Vite build | `outDir` defaults to `dist/` inside `client/` | Verify `client/dist/` exists after build; adjust Express static path accordingly |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading JSON file on every request | Slow API responses under load | Acceptable for single-user; add in-memory cache if needed | 10+ concurrent requests |
| Large `applications.json` file | Slow reads/writes as file grows | Archive old applications periodically | 1000+ applications |
| No compression middleware | Large API responses transfer slowly | Add `compression` middleware | Any production deployment |
| Vite sourcemaps in production | Larger bundle size, slower loads | Set `build.sourcemap: false` in vite.config.js | Any production deployment |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving `node_modules/` or project files | Source code exposure, dependency listing | Only serve `client/dist/` as static files |
| No rate limiting on API | Abuse potential (though low risk for single-user) | Acceptable for portfolio; add `express-rate-limit` for real product |
| Accepting any JSON body without validation | Malformed data corrupts storage | Add minimal validation on POST/PUT routes |
| Exposing `.env` or config files | API keys or secrets leaked | Verify `.gitignore` covers all sensitive files; do not serve project root as static |
| No Content-Security-Policy headers | XSS vulnerability | Add `helmet` middleware for security headers |
| CORS set to `*` in production | Any origin can call API | Only needed if frontend and API are on different origins; same-origin deployment avoids this entirely |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading states during API calls | User clicks button, nothing happens, clicks again | Add loading indicators to all async operations |
| `alert()` for save confirmation | Jarring, blocks UI, looks amateurish | Use inline toast/notification component |
| No error feedback on failed requests | User does not know why action failed | Show error message near the relevant UI element |
| Empty state shows nothing | New user sees blank page with no guidance | Add placeholder content or onboarding hints |
| Screenshots show empty/dummy data | Portfolio looks unfinished | Seed demo data or take screenshots with populated data |

## "Looks Done But Isn't" Checklist

- [ ] **Production build works:** `cd client && npm run build` produces `client/dist/index.html` -- verify the file exists
- [ ] **Express serves static files:** `NODE_ENV=production node server/index.js` serves the React app at `/` -- verify with `curl`
- [ ] **SPA routing works:** Direct navigation to `/resume` returns the app, not 404 -- verify with `curl http://localhost:3000/resume`
- [ ] **API routes still work:** `GET /api/resume` returns JSON, not the React app -- verify with `curl`
- [ ] **PORT is configurable:** `PORT=8080 node server/index.js` works -- verify with `curl`
- [ ] **No hardcoded URLs in frontend:** `grep -r "localhost:3000" client/src/` returns nothing
- [ ] **Demo data is populated:** App looks complete when deployed, not empty
- [ ] **README is current:** Tech stack, roadmap, and API docs match actual code
- [ ] **Screenshots are from production:** No localhost URLs visible, no dev tools
- [ ] **LICENSE file exists:** Required for public GitHub repo
- [ ] **`.env` is not committed:** `git log --all -- .env` returns nothing
- [ ] **No real personal data in repo:** `applications.json` has demo data only

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Express not serving build output | LOW | Add `express.static` and catch-all route to `server/index.js` |
| Hardcoded API URLs in frontend | MEDIUM | Search-and-replace all `localhost:3000` references; test all pages |
| Real data committed to public repo | HIGH | Create fresh repo with demo data; old commits remain in GitHub history |
| SPA routing returns 404 | LOW | Add catch-all route after API routes |
| Build command fails on platform | LOW | Add root-level `build` script; test locally with `npm run build` |
| Data lost after redeploy | MEDIUM | Accept for MVP; document limitation; add export feature |
| Missing health check | LOW | Add `/api/health` endpoint; configure platform health check |
| README is stale | LOW | Audit against codebase; update versions, roadmap, features |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Express not serving build output | Deployment readiness | `curl http://localhost:3000` returns HTML after `npm run build` |
| Hardcoded API URLs | Deployment readiness | `grep -r "localhost:3000" client/src/` returns nothing |
| JSON file storage on hosting | Deployment readiness | Document limitation; seed demo data |
| Missing NODE_ENV=production | Deployment readiness | Check Express startup logs |
| Portfolio screenshots show localhost | Release assets | Screenshots taken from production URL |
| README references wrong versions | Documentation | Audit `package.json` vs README |
| No health check endpoint | Deployment readiness | `curl /api/health` returns 200 |
| Real data in public repo | Documentation | `git log` shows no personal data |
| SPA routing 404 | Deployment readiness | `curl /resume` returns HTML |
| Build command fails | Deployment readiness | `npm run build` succeeds locally |

## Sources

- Express.js production best practices: https://expressjs.com/en/advanced/best-practice-security.html
- Vite production build documentation: https://vitejs.dev/guide/build.html
- Render.com deployment documentation: https://render.com/docs
- Railway deployment documentation: https://docs.railway.app
- React Router documentation on server configuration: https://reactrouter.com/en/main/guides/ssr
- Node.js security best practices: https://nodejs.org/en/learn/getting-started/security-best-practices

---
*Pitfalls research for: Deployment readiness, production deployment, documentation, and release assets*
*Researched: 2026-06-26*
