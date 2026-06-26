---
marp: true
paginate: true
transition: fade
auto-advance: 20
---

# ApplyTrail

**Job Application Management — Web App**

---

# Who's my person?

**Job seekers** who apply to many positions and want to keep applications organized while creating tailored cover letters quickly.

---

# Their problem

* Writing a custom cover letter for every application takes time.
* It's easy to reuse generic letters.
* Tracking application status manually is messy.
* Follow-ups are often forgotten.

---

# What I built

A React + Express web app that:

* Edits resume with structured sections
* Generates tailored cover letter paragraphs via keyword matching
* Saves and tracks applications with status updates
* Flags stale applications needing follow-up

**Live:** https://applytrail.onrender.com

---

# How I built it

* **Frontend:** React 18 + Vite + React Router
* **Backend:** Express 4 + JSON file storage
* **Cover letters:** Keyword-matching heuristics that connect resume experience to job requirements
* **Deployment:** Render free tier with auto-deploy from GitHub

---

# Key features

* Resume editor with structured sections (experience, projects, skills, education)
* Job posting input with company and role
* Cover letter generation from resume-job matching
* Application tracking with status management
* Follow-up reminders for stale applications (10+ days)
* Demo data seeded on first launch

---

# Why it matters

* Saves time on repetitive applications.
* Produces more personalized cover letters.
* Keeps all applications in one place.
* Reminds users when it's time to follow up.
* No login required — runs locally or on Render.

---

# Done checklist

* [x] React + Express web app
* [x] Resume editing
* [x] Cover letter generation
* [x] Application tracking
* [x] Live on Render
* [x] Demo data seeded
