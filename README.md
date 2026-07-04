# ApplyTrail

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A web app for managing job applications — from resume editing to cover letter generation to application tracking.

**Live Demo:** https://applytrail.onrender.com

---

## Screenshots

![Dashboard](docs/screenshots/dashboard.png)
*Application dashboard with status overview*

![Resume Editor](docs/screenshots/resume-editor.png)
*Structured resume editor*

![Applications](docs/screenshots/applications.png)
*Application tracking with follow-up alerts*

---

## What It Does

* Edit resume with structured sections (experience, projects, skills, education)
* Paste job postings with company and role details
* Generate tailored cover letter paragraphs via keyword matching
* Save and track applications with status updates
* Get follow-up reminders for stale applications (10+ days without status change)
* Launch with demo data on first visit

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Express 4, Node.js |
| Storage | JSON files on disk |
| Styling | CSS Modules |
| Deployment | Render free tier |
| AI Analysis | Vercel AI SDK (Gemini, OpenRouter, Groq) |

---

## Getting Started

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/YOUR_USERNAME/applytrail.git
cd applytrail
npm install
npm run dev
```

The app runs at:

* Frontend: http://localhost:5173
* API: http://localhost:3000

Demo data is seeded automatically on first launch.

---

## AI Analysis Providers

ApplyTrail supports multiple AI providers for resume analysis with automatic fallback. The default uses keyword matching (heuristic), but you can enable AI-powered analysis with:

* **Gemini** - Google's fast multimodal model
* **OpenRouter** - Access to multiple models including free options
* **Groq** - Ultra-fast inference with free tier

**Quick Start:**

```bash
# Add to server/.env
ANALYSIS_PROVIDER=gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

**Full Configuration Guide:** [AI_PROVIDERS.md](AI_PROVIDERS.md)

---

## Project Structure

```text
.
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── App.jsx          # Layout + Router
│       └── main.jsx         # Entry point
├── server/                  # Express API
│   ├── index.js             # API routes + production server
│   ├── data/                # JSON file storage
│   └── demo-data/           # Seed data for first launch
├── docs/
│   └── screenshots/         # App screenshots
├── slides/
│   └── pitch.md             # Marp presentation
├── render.yaml              # Render deployment config
├── package.json             # Root config (concurrently)
├── LICENSE                  # MIT License
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
| POST | `/api/applications` | Save application |
| GET | `/api/health` | Health check |

---

## Deployment

The app is deployed on Render free tier using the `render.yaml` blueprint.

To deploy your own instance:

1. Fork this repository
2. Go to [Render](https://render.com) and create a new Blueprint
3. Connect your GitHub account and select the forked repo
4. Render detects `render.yaml` and auto-configures the service
5. Click Apply — the app deploys in 2-5 minutes

Environment variables:

* `NODE_ENV=production` — enables helmet, compression, and static file serving (set in render.yaml)
* `PORT` — auto-set by Render

Data resets on each redeploy (acceptable for a portfolio demo).

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
