# Architecture Research: Deployment and Release

**Domain:** Local web app deployment to public hosting
**Researched:** 2026-06-26
**Confidence:** HIGH

## Current Architecture (Dev Mode)

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (User)                          │
│              React SPA on localhost:5173                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (proxied via Vite)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Vite Dev Server                            │
│                  localhost:5173                               │
│  Serves React source files (HMR)                            │
│  Proxies /api → localhost:3000                               │
└─────────────────────────────────────────────────────────────┘
                         │ proxy
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                          │
│                  localhost:3000                               │
│  GET/PUT /api/resume                                         │
│  GET/POST /api/job-postings                                  │
│  GET/POST/PUT /api/applications                              │
│  POST /api/generate-cover-letter                             │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    JSON File Storage                          │
│                    (project root)                             │
│  applications.json  job_postings.json  resume.json           │
└─────────────────────────────────────────────────────────────┘
```

**Problem:** Two separate processes (Vite on 5173, Express on 3000) with a dev-only proxy. Not deployable as-is.

## Target Architecture (Production)

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (User)                          │
│              React SPA on public URL                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express Server (single process)            │
│                   PORT (from env)                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Static File Serving (built React assets)            │    │
│  │  GET /* → client/dist/index.html (SPA fallback)      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Routes                                          │    │
│  │  GET/PUT /api/resume                                 │    │
│  │  GET/POST /api/job-postings                          │    │
│  │  GET/POST/PUT /api/applications                      │    │
│  │  POST /api/generate-cover-letter                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Data Directory                                      │    │
│  │  /data/applications.json (writable volume)           │    │
│  │  /data/job_postings.json                             │    │
│  │  /data/resume.json                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Key change:** Single Express process serves both the built React assets and the API. No proxy needed.

## Component Responsibilities (Modified)

| Component | Dev Mode | Production Mode | Change |
|-----------|----------|-----------------|--------|
| Express Server | API only (port 3000) | API + static files (PORT from env) | **Modified** — add static serving |
| Vite Dev Server | Serves React + proxies API | Not used | **Removed** in production |
| React App | Served by Vite (HMR) | Pre-built static files served by Express | **Modified** — build step added |
| JSON Storage | Project root directory | Configurable DATA_DIR (env var) | **Modified** — path configurable |
| Build Process | None (Vite handles it) | `vite build` produces `client/dist/` | **New** — build step required |

## New vs Modified Components

### Modified Components

**1. Express Server (`server/index.js`)**

Changes needed:
- Serve static files from `client/dist/` in production
- Use `process.env.DATA_DIR` for JSON file storage location
- Use `process.env.PORT` (already done)
- SPA fallback: all non-API routes serve `index.html`
- CORS only in development (not needed when same origin in production)

```javascript
// Production static serving (add to server/index.js)
const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist')
  app.use(express.static(clientDist))
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}
```

**2. Data Directory Path**

Changes needed:
- `DATA_DIR` should be configurable via environment variable
- Default to project root for local dev, `/data` or similar for production

```javascript
// Change from:
const DATA_DIR = path.join(__dirname, '..')
// To:
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..')
```

**3. Root `package.json` Scripts**

Changes needed:
- Add `build` script that builds the client
- Add `start` script that runs the server in production mode

```json
{
  "scripts": {
    "dev": "concurrently -n client,server -c blue,green \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && node index.js",
    "build": "cd client && npm run build",
    "start": "NODE_ENV=production node server/index.js",
    "lint": "cd client && npm run lint",
    "test": "cd client && npm run test"
  }
}
```

**4. Vite Config (`client/vite.config.js`)**

Changes needed:
- Add base path configuration if deploying to a subdirectory
- Add API_URL environment variable for production API endpoint (if different origin)

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/',  // Change if deploying to subdirectory
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### New Components

**1. Demo/Seed Data**

Purpose: Bundle sample data for portfolio demos so visitors can see the app in action without creating their own data.

Files:
- `server/data/demo/applications.json` — Sample applications with various statuses
- `server/data/demo/job_postings.json` — Sample job postings
- `server/data/demo/resume.json` — Sample resume

Usage: Server seeds from demo data if production data directory is empty.

**2. Build Script / CI Configuration**

Purpose: Automate the build process for deployment.

Options:
- `package.json` scripts (simplest)
- GitHub Actions workflow (for CI/CD)
- Platform-specific build configuration (Render, Railway)

**3. Health Check Endpoint**

Purpose: Allow hosting platform to verify the service is running.

```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
```

## Data Flow (Production)

### Static Asset Serving

```
Browser requests /app.js
    ↓
Express static middleware
    ↓
Serves client/dist/app.js (with cache headers)
```

### API Request (Production)

```
Browser requests /api/applications
    ↓
Express API route handler
    ↓
Reads DATA_DIR/applications.json
    ↓
Returns JSON response
```

### SPA Navigation (Production)

```
Browser requests /resume (direct URL or refresh)
    ↓
Express checks: not an API route, not a static file
    ↓
Serves client/dist/index.html (SPA fallback)
    ↓
React Router handles /resume client-side
```

## Platform Constraints

### JSON File Storage Impact

The JSON file storage constraint is the **primary architectural constraint** for deployment. Most cloud platforms have ephemeral filesystems — data written during one request may not persist after a container restart.

| Platform | Filesystem | JSON Storage Impact | Recommendation |
|----------|------------|---------------------|----------------|
| Render (Web Service) | Ephemeral | Data lost on redeploy | Use persistent disk add-on |
| Render (Static Site + Web Service) | Ephemeral | Data lost on redeploy | Use persistent disk add-on |
| Railway | Ephemeral | Data lost on redeploy | Use volume mount |
| Fly.io | Persistent (volume) | Data persists | Good fit, use volume |
| Vercel | Serverless (ephemeral) | No filesystem writes | **Not suitable** |
| Netlify | Serverless (ephemeral) | No filesystem writes | **Not suitable** |
| GitHub Pages | Static only | No server | **Not suitable** (frontend only) |

**Recommendation:** Use **Render** or **Railway** with a persistent disk/volume. Both support Node.js, allow mounting persistent storage, and have free/low-cost tiers suitable for portfolio projects.

### Single-User Constraint Impact

No auth means no session management, no cookies, no CSRF protection needed. This simplifies deployment significantly — no need for:
- Session stores (Redis, etc.)
- HTTPS cookie configuration
- OAuth callback URLs
- CORS credentials handling

## Integration Points

### Build Pipeline Integration

```
Source Code (git)
    ↓
npm install (dependencies)
    ↓
vite build (client/dist/)
    ↓
NODE_ENV=production node server/index.js
    ↓
Express serves API + static files
```

### Environment Variables

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `PORT` | Server listen port | 3000 | No |
| `NODE_ENV` | Environment mode | undefined | Yes (set to 'production') |
| `DATA_DIR` | JSON data directory | Project root | No (set for production) |

### GitHub Actions Integration (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - run: npm test
      # Platform-specific deployment step
```

## Documentation Integration

### README Updates Needed

- Add deployment section with platform-specific instructions
- Add environment variable documentation
- Add demo data explanation
- Update architecture diagram to show production mode
- Add screenshots section placeholder

### New Documentation Files

| File | Purpose | Integration |
|------|---------|-------------|
| `LICENSE` | MIT license for open source | Root directory, referenced in README |
| `CONTRIBUTING.md` | Contribution guidelines | Root directory, linked from README |
| `docs/DEPLOYMENT.md` | Detailed deployment guide | Linked from README |
| `.env.example` | Document required env vars | Root directory |

## Release Assets Integration

### Screenshots

- Capture from running local instance (consistent, reproducible)
- Store in `docs/screenshots/` or `assets/` directory
- Reference from README with relative paths
- Show key flows: resume editing, job posting, cover letter generation, application tracking

### Demo Data

- Seed data that showcases all features
- Pre-populated resume, job postings, and applications
- Applications in various statuses (drafted, applied, interviewing, offered, rejected)
- Enables visitors to explore the app immediately

### Presentation Slides

- Already have `slides/pitch.md` (Marp format)
- Update with deployment URL and screenshots
- No architectural changes needed

## Build Order (Dependency-Aware)

```
Phase 1: Deployment Readiness
├── 1.1: Add production build scripts (package.json)
├── 1.2: Modify Express to serve static files (server/index.js)
├── 1.3: Make DATA_DIR configurable (server/index.js)
├── 1.4: Add health check endpoint (server/index.js)
├── 1.5: Add .env.example with documented vars
└── 1.6: Test production build locally (npm run build && npm start)

Phase 2: Production Deployment
├── 2.1: Create demo/seed data files
├── 2.2: Add seed logic to Express server
├── 2.3: Configure hosting platform (Render/Railway)
├── 2.4: Set environment variables on platform
├── 2.5: Deploy and verify
└── 2.6: Test with demo data on live URL

Phase 3: Documentation
├── 3.1: Add LICENSE file
├── 3.2: Update README with deployment info
├── 3.3: Add CONTRIBUTING.md
├── 3.4: Add docs/DEPLOYMENT.md
└── 3.5: Update architecture diagrams

Phase 4: Release Assets
├── 4.1: Capture screenshots
├── 4.2: Update slides with deployment URL
├── 4.3: Add screenshots to README
└── 4.4: Final review and tag release
```

## Anti-Patterns

### Anti-Pattern 1: Serving Dev and Prod from Same Config

**What people do:** Use Vite proxy in production or try to run both Vite and Express.

**Why it's wrong:** Vite dev server is not meant for production. Proxy adds latency. Two processes = two things to manage.

**Do this instead:** Build the client once, serve static files from Express. Single process, single port.

### Anti-Pattern 2: Hardcoding File Paths

**What people do:** Use `__dirname + '/../data'` everywhere.

**Why it's wrong:** Breaks when directory structure changes between dev and production environments.

**Do this instead:** Use `process.env.DATA_DIR` with a sensible default. One variable controls all data paths.

### Anti-Pattern 3: Ignoring Ephemeral Filesystem

**What people do:** Deploy to Vercel/Netlify and expect JSON writes to persist.

**Why it's wrong:** Serverless platforms destroy the filesystem after each request. Data is lost.

**Do this instead:** Choose a platform with persistent storage (Render with disk, Railway with volume, Fly.io with volume). Or accept data loss for demo purposes and seed on startup.

### Anti-Pattern 4: No SPA Fallback

**What people do:** Only serve static files, forget about client-side routing.

**Why it's wrong:** Direct URL navigation (e.g., `/resume`) returns 404 because no file exists at that path.

**Do this instead:** Add a catch-all route that serves `index.html` for any non-API, non-static-file request. React Router handles the rest.

## Sources

- Express static file serving: https://expressjs.com/en/starter/static-files.html
- Vite production build: https://vitejs.dev/guide/build.html
- Render persistent disks: https://render.com/docs/disks
- Railway volumes: https://docs.railway.app/guides/volumes
- Fly.io volumes: https://fly.io/docs/reference/volumes/

---
*Architecture research for: ApplyTrail deployment readiness*
*Researched: 2026-06-26*
