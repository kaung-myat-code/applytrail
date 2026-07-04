---
marp: true
paginate: true
size: 16:9
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@500&display=swap');
:root { --bg:#0a0a0a; --ink:#fafafa; --muted:#a3a3a3; --accent:#ffd60a; --code:#171717; }
section {
  background:var(--bg); color:var(--ink);
  font-family:'Inter','Noto Sans','Pyidaungsu',sans-serif;
  font-size:30px; line-height:1.4; padding:60px 76px; font-weight:400;
}
h1 { color:var(--accent); font-weight:900; font-size:2.1em; line-height:1.05; letter-spacing:-.02em; }
h2 { color:var(--ink); font-weight:700; font-size:1.4em; }
h3 { color:var(--muted); font-weight:700; }
strong { color:var(--accent); }
a { color:var(--accent); text-decoration:none; }
ul { font-weight:700; font-size:1.1em; }
code { background:var(--code); color:var(--accent); padding:.05em .3em; border-radius:5px; font-family:'JetBrains Mono',monospace; }
pre  { background:var(--code); border-radius:10px; }
pre code { background:none; color:#fafafa; }
blockquote { border-left:6px solid var(--accent); color:var(--muted); padding:.4em 1em; font-size:1.2em; }
header,footer,section::after { color:#525252; font-size:.5em; }
section.cover { background:linear-gradient(135deg,#0a0a0a 0%, #1a1400 100%); }
section.cover h1 { font-size:3em; }
section.lead { background:#111; }
section.lead h1 { font-size:3.4em; }
</style>

<!-- _class: cover -->

# Tech Stack

ApplyTrail — local job application workflow

---

## Frontend

- **React 19** — UI library
- **React Router 7** — client-side routing
- **Vite 6** — dev server + bundler
- **CSS Modules** — scoped component styles
- **react-diff-viewer-continued** — resume diff viewer

### Pages

`Dashboard` · `Resume` · `ResumeLibrary` · `NewApplication` · `Applications` · `CoverLetter` · `Analysis` · `ReviewSuggestions`

---

## Backend

- **Express 4** — REST API
- **Node.js** — runtime
- **Helmet** — production security headers
- **Compression** — gzip responses

### Storage

`resume.json` · `job_postings.json` · `applications.json` · `resume_library/` (per-resume versions)

---

## AI Layer

- **Vercel AI SDK** — provider abstraction
- **Google Gemini** · **Groq** · **OpenAI-compatible** — analysis providers
- **Zod** — schema validation for AI responses

### Endpoints

`POST /api/analyze` — match report + suggestions
`POST /api/generate-cover-letter` — tailored paragraph

---

## Tooling

- **Vitest 3** — test runner
- **ESLint 9** — linting
- **Prettier** — formatting
- **concurrently** — parallel dev scripts

### Scripts

`npm run dev` — Vite + Express together
`npm test` · `npm run lint`

---

## Agents

| Agent | Role |
|-------|------|
| `application-tracker` | Audit applications for staleness |
| `gsd-resume-reviewer` | Quality audit of analysis suggestions |

### GSD Framework

36 specialized agents — planning, research, execution, verification, review, UI, security, docs

---

## Skills

| Skill | Trigger |
|-------|---------|
| `custom-cover-letter` | User pastes a job posting + resume |
| `resume-schema` | Resume validation, repair, or JSON work |
| `frontend-design` | Build or style web components |

---

## GSD Commands

| Command | Purpose |
|---------|---------|
| `/gsd-quick` | Small fixes, doc updates, ad-hoc tasks |
| `/gsd-debug` | Investigation and bug fixing |
| `/gsd-execute-phase` | Run a planned phase |
| `/gsd-review` | Review code changes |
| `/gsd-code-review` | Structured code review |
| `/gsd-ship` | Ship completed work |

### Workflow

`/gsd-new-project` → `/gsd-new-milestone` → `/gsd-plan-phase` → `/gsd-execute-phase` → `/gsd-ship`
