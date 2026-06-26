# ApplyTrail

A local web app for managing job applications — from resume editing to cover letter generation to application tracking.

---

## What It Does

ApplyTrail streamlines the job application process in a browser-based UI:

1. Edit your resume with structured sections (experience, projects, skills, education)
2. Paste job postings with company and role details
3. Generate tailored cover letter paragraphs (Phase 3)
4. Save and track applications with status updates (Phase 4)
5. Get follow-up reminders for stale applications (Phase 4)

---

## Who It Is For

Job seekers who:

* Apply to multiple jobs
* Want personalized cover letters
* Need a simple way to track applications
* Often forget to follow up

---

## Tech Stack

* **Frontend:** React 18 + Vite + React Router
* **Backend:** Express 4 + Node.js
* **Storage:** JSON files on disk
* **Styling:** CSS Modules

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development servers (client + server)
npm run dev
```

The app runs at:

* Frontend: http://localhost:5173
* API: http://localhost:3000

---

## Project Structure

```text
.
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Reusable UI components
│       │   ├── Navbar/      # Navigation bar
│       │   └── SectionEditor.jsx  # Resume section wrapper
│       ├── pages/           # Route pages
│       │   ├── Dashboard.jsx
│       │   ├── Resume.jsx   # Resume editor
│       │   ├── NewApplication.jsx  # Job posting input
│       │   └── Applications.jsx    # Application list (Phase 4)
│       ├── App.jsx          # Layout + Router
│       └── main.jsx         # Entry point
├── server/                  # Express API
│   ├── index.js             # API routes
│   └── data/                # JSON file storage
│       ├── resume.json
│       ├── job_postings.json
│       └── applications.json
├── package.json             # Root config (concurrently)
└── README.md
```

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resume` | Get resume data |
| PUT | `/api/resume` | Update resume data |
| GET | `/api/job-postings` | List job postings |
| POST | `/api/job-postings` | Create job posting |
| GET | `/api/applications` | List applications |

---

## Roadmap

- [x] **Phase 1:** Foundation — React + Express scaffold, JSON storage, app shell
- [x] **Phase 2:** Resume & Job Input — Resume editor, job posting form
- [ ] **Phase 3:** Cover Letter Generation — Keyword-matching heuristics
- [ ] **Phase 4:** Application Tracking — Save, view, update, follow-up

---

## Development

This project uses a monorepo structure with concurrent development servers:

* `npm run dev` — Start both client and server
* `npm run client` — Start only Vite dev server
* `npm run server` — Start only Express API

---

## What I Learned

* How to structure a React + Express monorepo
* How to use CSS Modules for component-scoped styling
* How to build reusable form components (SectionEditor)
* How to set up Vite proxy for API requests
