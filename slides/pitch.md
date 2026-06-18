---

marp: true
paginate: true
transition: fade

# PechaKucha: 6 slides, 20s auto-advance. Do not change the count.

## auto-advance: 20

<!-- slide 1 -->

# Who's my person?

**Job seekers** who apply to many positions and want to keep applications organized while creating tailored cover letters quickly.

---

<!-- slide 2 -->

# Their problem

* Writing a custom cover letter for every application takes time.
* It's easy to reuse generic letters.
* Tracking application status manually is messy.
* Follow-ups are often forgotten.

---

<!-- slide 3 -->

# What I built

A Claude Code workflow that:

* Reads `resume.md`
* Generates a tailored cover letter paragraph from a pasted job posting
* Records the application in `applications.json`
* Tracks applications that need follow-up

---

<!-- slide 4 -->

# How I built it

* **MCP:** Filesystem MCP reads `resume.md` and updates `applications.json`.
* **Skill:** `cover-letter-style` matches resume experience to job requirements and follows my writing style.
* **Agent:** `application-tracker` flags applications with no status change for 10+ days.

---

<!-- slide 5 -->

# Why it matters

* Saves time on repetitive applications.
* Produces more personalized cover letters.
* Keeps all applications in one place.
* Reminds users when it's time to follow up.

---

<!-- slide 6 -->

# Done checklist

* [X] repo public
* [X] MCP + skill + agent used
* [X] report.md in team repo
