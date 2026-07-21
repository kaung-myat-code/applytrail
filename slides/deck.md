---
marp: true
paginate: true
size: 16:9
transition: fade
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@500&display=swap');
:root { --bg:#0a0a0a; --ink:#fafafa; --muted:#a3a3a3; --accent:#ffd60a; --code:#171717; --line:#262626; }
section {
  background:var(--bg); color:var(--ink);
  font-family:'Inter','Noto Sans','Pyidaungsu',sans-serif;
  font-size:28px; line-height:1.45; padding:56px 72px;
}
h1 { color:var(--accent); font-weight:900; font-size:2em; line-height:1.05; letter-spacing:-.02em; }
h2 { color:var(--ink); font-weight:700; font-size:1.3em; }
h3 { color:var(--muted); font-weight:700; font-size:.95em; text-transform:uppercase; letter-spacing:.04em; }
strong { color:var(--accent); }
a { color:var(--accent); text-decoration:none; }
ul { font-weight:400; }
table { font-size:.85em; border-collapse:collapse; }
th, td { border-bottom:1px solid var(--line); padding:.35em .8em .35em 0; }
code { background:var(--code); color:var(--accent); padding:.05em .3em; border-radius:5px; font-family:'JetBrains Mono',monospace; }
pre { background:var(--code); border-radius:10px; }
pre code { background:none; color:#fafafa; }
header,footer,section::after { color:#525252; font-size:.5em; }
section.cover { background:radial-gradient(900px 400px at 82% 10%, rgba(255,214,10,.10), transparent 60%), linear-gradient(135deg,#0a0a0a 0%, #141400 100%); }
section.cover h1 { font-size:3em; }
section.cover h2 { color:var(--muted); font-weight:400; font-size:1.1em; }
section.shot { background:#000; padding:0; display:flex; align-items:center; justify-content:center; }
section.shot img { box-shadow:0 20px 50px rgba(0,0,0,.6); border-radius:8px; max-width:88%; max-height:82%; }
</style>

<!-- _class: cover -->

# ApplyTrail

## From resume to tailored cover letter to tracked application — one local web app, no login required

kaung-myat-code · github.com/kaung-myat-code/applytrail · **Live:** https://applytrail.onrender.com

---

# The problem

* Writing a custom cover letter for every application takes time — so it's easy to reuse generic ones.
* A resume that fits one posting rarely fits the next without manual rework.
* Tracking application status by hand is messy, and follow-ups get forgotten.

---

# What ApplyTrail does

* Keeps a **library of resume versions**, not just one file
* **Analyzes** a resume against a pasted job posting — score, strengths, gaps, keyword match, section breakdown
* Turns the analysis into **section-by-section suggestions** you accept, reject, or edit
* Saves an approved rewrite as a new **tailored resume version**, original untouched
* Generates a tailored **cover letter paragraph** from resume ↔ posting keyword matching
* **Tracks applications** end-to-end and flags ones stale 10+ days for follow-up
* Exports any resume version as **PDF or JSON**

---

<!-- _class: shot -->

![](../docs/screenshots/dashboard.png)

---

# The end-to-end flow

1. Build a resume library and pick a working version
2. Paste a job posting (company + role)
3. Run **Match Analysis** → compatibility score, strengths/gaps, keyword hits
4. Review **suggestions** side-by-side, accept/reject/edit each
5. Generate a **tailored resume**, auto-named "Company - Role"
6. Start an application pre-filled from the posting, tailored resume linked
7. Export as PDF/JSON; get flagged when a status goes stale

---

# How it's built

```bash
git clone https://github.com/kaung-myat-code/applytrail.git
cd applytrail && npm install && npm run dev
```

**Frontend:** React 19 · React Router 7 · Vite 6 · CSS Modules
**Backend:** Express 4 · Helmet · Compression · JSON file storage
**AI layer:** Vercel AI SDK — Gemini · Groq · OpenAI-compatible, with offline heuristic fallback
**Analytics:** GoatCounter (privacy-friendly, self-hosted-style)

---

# Key API surface

| Route | Purpose |
|-------|---------|
| `GET/PUT /api/resume-library/:id` | Resume version CRUD |
| `POST /api/analyze` | Match report + suggestions |
| `POST /api/drafts` · `POST /api/drafts/:id/save` | Suggestion review → tailored save |
| `POST /api/generate-cover-letter` | Tailored paragraph |
| `GET /api/resume-library/:id/export/{pdf,json}` | Export |
| `PUT /api/applications/:id` | Status tracking |

---

# Why it matters

* Saves time on repetitive, low-effort applications
* Produces more personalized resumes and cover letters, backed by a real match report
* Keeps every resume version and application in one inspectable place — plain JSON on disk
* Reminds the user when it's time to follow up
* No login, no job-board scraping, no cloud account required to start
* Responsive on mobile, deployed on Render with auto-deploy from GitHub

---

# Done checklist

* [x] Resume library with versioning, PDF/JSON export
* [x] Match analysis (heuristic + AI providers) with section-by-section suggestions
* [x] Tailored resume generation, application pre-fill
* [x] Cover letter generation via keyword matching
* [x] Application tracking with stale-follow-up flags
* [x] Mobile-responsive layout, privacy-friendly analytics
* [x] Live on Render — **https://applytrail.onrender.com**
