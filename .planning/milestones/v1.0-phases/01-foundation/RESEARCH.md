# Phase 1: Foundation - Research

**Researched:** 2026-06-26
**Status:** Complete

## 1. Monorepo Structure

**Recommendation:** Flat `client/` + `server/` at project root with a single root `package.json`.

```text
applytrail/
├── package.json              # Root: scripts for dev, build, lint
├── client/                   # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.module.css
│       ├── components/
│       │   └── Navbar/
│       │       ├── Navbar.jsx
│       │       └── Navbar.module.css
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Resume.jsx
│           ├── NewApplication.jsx
│           └── Applications.jsx
├── server/
│   ├── package.json
│   └── index.js              # Express server entry
├── applications.json         # Existing data (root)
└── resume.json               # New structured resume (root)
```

**Why not Turborepo/pnpm workspaces:** Overkill for a 2-package monorepo. A root `package.json` with `concurrently` is simpler and sufficient.

**Key decisions:**
- Each `package.json` manages its own dependencies
- Root `package.json` has `concurrently` and orchestration scripts only
- No shared `packages/` directory — no shared code needed yet

## 2. Vite Configuration

**Setup:** Vite with `@vitejs/plugin-react` and a proxy to Express.

```js
// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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

**How it works:**
- Vite dev server runs on port 5173
- Express runs on port 3000
- Any `fetch('/api/...')` from React is proxied to Express
- No CORS configuration needed in dev
- CSS Modules work out of the box with Vite (`.module.css` files)

## 3. Express Server Setup

**Minimal Express server with JSON file read/write:**

```js
// server/index.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, '..');

// Helper: read JSON file
function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

// Helper: write JSON file
function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
}

// Routes
app.get('/api/applications', (req, res) => {
  res.json(readJSON('applications.json'));
});

app.get('/api/resume', (req, res) => {
  res.json(readJSON('resume.json'));
});

app.put('/api/resume', (req, res) => {
  writeJSON('resume.json', req.body);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**Key points:**
- `express.json()` middleware handles JSON body parsing (no need for `body-parser`)
- JSON files live in project root (one level up from `server/`)
- `readJSON`/`writeJSON` helpers keep routes clean
- File reads are synchronous — fine for a local single-user tool

## 4. Concurrently Setup

**Root package.json scripts:**

```json
{
  "name": "applytrail",
  "private": true,
  "scripts": {
    "dev": "concurrently -n client,server -c blue,green \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "cd client && npm run dev",
    "dev:server": "cd server && node index.js",
    "lint": "cd client && npm run lint",
    "test": "cd client && npm run test"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

**How it works:**
- `npm run dev` starts both Vite and Express in one terminal
- `-n client,server` labels output streams
- `-c blue,green` color-codes them
- Each sub-package has its own `dev` script

## 5. React Router Setup

**React Router v7 in library mode** (not framework mode — we don't need SSR):

```jsx
// client/src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import Resume from './pages/Resume'
import NewApplication from './pages/NewApplication'
import Applications from './pages/Applications'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'resume', element: <Resume /> },
      { path: 'new', element: <NewApplication /> },
      { path: 'applications', element: <Applications /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
```

**App.jsx as layout:**

```jsx
// client/src/App.jsx
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
```

**Key points:**
- `createBrowserRouter` is the v7 API (library mode)
- `<Outlet />` renders child routes inside the layout
- `index: true` makes Dashboard the landing page

## 6. CSS Modules with Vite

**CSS Modules work out of the box** — no configuration needed.

**Convention:** `ComponentName.module.css` alongside `ComponentName.jsx`.

```css
/* client/src/App.module.css */
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main {
  padding: 2rem 0;
}
```

```jsx
import styles from './App.module.css'
// Use: <div className={styles.app}>
```

**Global styles:** Create `client/src/index.css` for resets and CSS custom properties (imported in `main.jsx`).

## 7. ESLint + Prettier Configuration

**ESLint 9 flat config** (the default since ESLint 9):

```js
// client/eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import prettierConfig from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  prettierConfig, // must be last — disables rules that conflict with Prettier
]
```

**Prettier config:**

```json
// client/.prettierrc
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all"
}
```

**Packages to install:**
- `eslint`, `@eslint/js`, `globals`
- `eslint-plugin-react`, `eslint-plugin-react-hooks`
- `eslint-config-prettier`, `prettier`

## 8. Vitest Configuration

**Vitest with Vite** — shares the same config file:

```js
// Add to client/vite.config.js
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
```

**Setup file:**

```js
// client/src/setupTests.js
import '@testing-library/jest-dom'
```

**Packages to install:**
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `jsdom`

**Scripts:** Add `"test": "vitest"` to `client/package.json`.

## 9. Resume Migration (resume.md → resume.json)

**Current resume.md structure:**
- `## Summary` — paragraph
- `## Experience` — job entries with bullets
- `## Projects` — project entries with bullets
- `## Skills` — comma-separated list
- `## Education` — degree info

**Proposed resume.json structure:**

```json
{
  "name": "Alex Tan",
  "contact": {
    "email": "alex.tan.dev@gmail.com",
    "github": "github.com/alextan-dev",
    "location": "Malacca, Malaysia (open to remote)"
  },
  "summary": "Software developer with 2+ years building and shipping web applications end to end...",
  "experience": [
    {
      "company": "Brightlane Solutions",
      "role": "Software Developer",
      "period": "Jan 2024 – Present",
      "bullets": [
        "Built and shipped a customer-facing booking dashboard in React and TypeScript...",
        ...
      ]
    },
    {
      "company": "Tigerwave Apps",
      "role": "Junior Developer",
      "period": "Jun 2022 – Dec 2023",
      "bullets": [...]
    }
  ],
  "projects": [
    {
      "name": "Habit Tracker Web App",
      "description": "Personal project, 2025",
      "bullets": [...]
    },
    {
      "name": "Repo Health CLI",
      "description": "Personal project, 2026",
      "bullets": [...]
    }
  ],
  "skills": [
    "JavaScript", "TypeScript", "React", "Node.js", "Express",
    "PostgreSQL", "MySQL", "REST API design", "Git/GitHub",
    "GitHub Actions (CI/CD)", "Jest", "basic AWS (S3, EC2)", "agile/Scrum"
  ],
  "education": [
    {
      "degree": "B.Sc. Computer Science",
      "school": "Multimedia University (MMU), Malaysia",
      "year": "Graduated 2022"
    }
  ]
}
```

**Migration approach:**
1. Create a one-time script or do it manually — the resume is small
2. Write the JSON to `resume.json` in project root
3. Keep `resume.md` as-is for reference (don't delete it)
4. Express serves `resume.json` via `/api/resume`

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Vite proxy misconfiguration | Medium | Blocks API calls | Test with `curl` before building React pages |
| CSS Modules naming conflicts | Low | Visual bugs | Use component-scoped `.module.css` files |
| React Router v7 breaking changes | Low | Routing breaks | Use library mode, not framework mode |
| JSON file corruption on concurrent writes | Low | Data loss | Single-user tool — no concurrent writes expected |
| Express port conflict | Low | Server won't start | Use `process.env.PORT` fallback |

## 11. Dependency Summary

**Root (`package.json`):**
- `concurrently` (dev)

**Client (`client/package.json`):**
- `react`, `react-dom`
- `react-router-dom`
- `@vitejs/plugin-react` (dev)
- `vite` (dev)
- `eslint`, `@eslint/js`, `globals` (dev)
- `eslint-plugin-react`, `eslint-plugin-react-hooks` (dev)
- `eslint-config-prettier`, `prettier` (dev)
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (dev)

**Server (`server/package.json`):**
- `express`

---

*Research complete: 2026-06-26*
