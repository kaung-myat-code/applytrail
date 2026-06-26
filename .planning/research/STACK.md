# Stack Research: ApplyTrail Deployment & Release

**Domain:** Portfolio-ready web app deployment and release polish
**Researched:** 2026-06-26
**Confidence:** HIGH

## Recommended Stack

### Hosting Platform

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| Render (Web Service) | Production hosting | Free tier available, native monorepo support via render.yaml, auto-deploy from GitHub, single service serves both Express API and Vite static build. No Dockerfile required. Simplest setup of all options. |

**Why Render over alternatives:**

- **Railway** -- No permanent free tier (trial credits only, ~$5). Better DX but costs money from day one. Overkill for a single-user local tool being deployed as a portfolio piece.
- **Fly.io** -- Free tier exists (3 shared VMs, 3GB storage) but requires Dockerfile and fly.toml configuration. More complex setup. Better suited for apps needing global edge distribution.
- **Vercel** -- Excellent for frontend-only deploys. Express backend requires adaptation to serverless functions, which breaks the JSON file storage model (no persistent filesystem).
- **Netlify** -- Static sites and serverless functions only. Same filesystem problem as Vercel.

Render wins because: free tier with persistent filesystem, single-service monorepo deploy, auto-deploy from GitHub, no Docker required, and the JSON file storage model works as-is.

### Production Server Middleware

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| helmet | ^8.0.0 | Security headers | Sets X-Content-Type-Options, X-Frame-Options, CSP, and other HTTP security headers. Zero config required for baseline protection. Standard for any Express app exposed to the internet. |
| compression | ^1.7.5 | Gzip responses | Compresses API responses and static assets. Reduces payload size by 60-80% for JSON responses. Place before routes for maximum effect. |
| dotenv | ^16.4.7 | Environment config | Loads .env files in development. In production, hosting platform sets env vars directly. Already in .gitignore pattern. |

**Why these three and nothing more:**

- **morgan** (HTTP logging) -- Not needed. Render provides request logs in its dashboard. Adding morgan to a portfolio project adds noise without value.
- **express-rate-limit** -- Not needed. Single-user local tool, no auth, no abuse vector. Would be premature hardening.
- **cors** -- Already a dependency but not currently used in server/index.js. In production, Express serves both API and static files from the same origin, so CORS is not needed. Keep it as a dependency for dev mode (Vite on port 5173 needs it).

### Build & Serve Configuration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vite (build) | ^6.0.0 | Frontend production build | Already installed. `vite build` outputs to client/dist/. Tree-shaking, code splitting, asset hashing included by default. |
| Express static serving | (built-in) | Serve Vite build | `express.static('client/dist')` plus SPA catch-all. No nginx, no separate static hosting. Single service, single port. |

**Production architecture:**

```text
Browser --> Express (single port, assigned by Render)
              |
              |-- /api/* --> Express route handlers (JSON file read/write)
              |-- /*      --> Static files from client/dist/ (Vite build)
              |-- SPA catch-all --> client/dist/index.html
```

This eliminates the Vite dev proxy entirely in production. Express serves everything from one origin.

### Documentation & Release Tools

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| @marp-team/marp-cli | ^4.0.0 | Export slides to PDF/PPTX | One-time use: export slides/pitch.md to PDF for release assets. Use via npx, no install needed. |
| shields.io | (web service) | README badges | Add tech stack badges, deployment status badge, license badge to README. No install -- just markdown image URLs. |
| capture-website-cli | ^4.0.0 | Screenshot tool | Capture portfolio screenshots of deployed app. Use via npx. Supports viewport sizing, wait-for-load, custom CSS. |

**Why npx for Marp and capture-website-cli:** These are one-time or occasional-use tools. No reason to add them as project dependencies. `npx @marp-team/marp-cli slides/pitch.md --pdf` works without install.

### CI/CD

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| Render auto-deploy | Deploy on push to main | Native GitHub integration. No workflow YAML needed. Render detects the render.yaml blueprint and deploys automatically. |
| GitHub Actions (optional) | Lint + test before deploy | Only if you want a quality gate. Run `npm run lint` and `npm test` before allowing merge to main. Not required for a portfolio project. |

**Recommendation:** Use Render auto-deploy only. Skip GitHub Actions for this milestone. The project has no CI pipeline today and adding one is not part of the "release polish" scope.

## Installation

```bash
# Production middleware (root package.json)
npm install helmet compression dotenv

# Release tools (use via npx, no install)
npx @marp-team/marp-cli slides/pitch.md --pdf
npx capture-website-cli http://localhost:5173 --output=screenshot.png

# Shields.io badges (no install -- markdown image URLs in README)
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Render | Railway | If you want better DX and are willing to pay ~$5/month from day one |
| Render | Fly.io | If you need global edge distribution or want to learn Docker-based deploys |
| Express static serving | Nginx reverse proxy | If you deploy to a VPS (DigitalOcean, Linode) instead of a PaaS |
| dotenv | Platform env vars only | dotenv is only needed in development; production uses Render dashboard |
| capture-website-cli | Manual screenshots | If you only need 2-3 screenshots, manual browser screenshots are faster |
| Marp CLI | Google Slides / Keynote | If you prefer GUI-based slide editors |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Vercel | No persistent filesystem. JSON file writes fail on serverless. Breaks the core data model. | Render (persistent disk) |
| Netlify | Same filesystem problem as Vercel. Serverless functions cannot write to disk reliably. | Render |
| PM2 | Process manager for VPS deployments. Render handles process management automatically. | Render built-in |
| Docker | Unnecessary complexity for a single-service Node.js app. Render detects Node.js and runs `npm start` automatically. | render.yaml blueprint |
| nginx | Not needed when Express serves static files directly. Adds a configuration layer with no benefit for this architecture. | Express static middleware |
| next.js migration | Would require rewriting the entire frontend. React + Vite + Express is the correct stack for this project. | Current stack |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| helmet@8.x | express@4.x | helmet 8 requires Express 4+. Works out of the box. |
| compression@1.7.x | express@4.x | No compatibility issues. Standard Express middleware interface. |
| dotenv@16.x | node@18+ | Works with the Node.js 18+ requirement already in place. |
| vite@6.x | node@18+ | Vite 6 requires Node.js 18+. Already satisfied. |

## Production Configuration Changes Required

### server/index.js modifications

```javascript
// Add at top (before routes)
const helmet = require('helmet')
const compression = require('compression')
const path = require('path')

app.use(helmet())
app.use(compression())

// Add after API routes (production static serving)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))
  })
}
```

### Root package.json scripts additions

```json
{
  "scripts": {
    "build": "cd client && npm run build",
    "start": "cd server && node index.js",
    "render-build": "npm install --prefix client && npm run build && npm install --prefix server"
  }
}
```

### render.yaml blueprint

```yaml
services:
  - type: web
    name: applytrail
    runtime: node
    buildCommand: npm run render-build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## Sources

- Render monorepo docs: https://docs.render.com/monorepo
- Railway monorepo docs: https://docs.railway.com/guides/monorepo-support
- Fly.io monorepo docs: https://fly.io/docs/apps/guides/monorepo/
- Express production best practices: https://expressjs.com/en/advanced/best-practice-security.html
- helmet npm: https://www.npmjs.com/package/helmet
- compression npm: https://www.npmjs.com/package/compression
- dotenv npm: https://www.npmjs.com/package/dotenv
- Marp CLI: https://github.com/marp-team/marp-cli
- shields.io: https://shields.io
- capture-website-cli: https://github.com/sindresorhus/capture-website-cli

---
*Stack research for: ApplyTrail deployment readiness and release polish*
*Researched: 2026-06-26*
