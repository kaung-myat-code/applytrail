# applytrail

A Claude Code workflow that generates tailored cover letter paragraphs, tracks job applications, and reminds users when applications need follow-up.

---

## What It Does

This project streamlines the job application process using Claude Code.

Given a pasted job posting, Claude:

1. Reads my resume from `resume.md`
2. Generates a tailored cover letter paragraph
3. Records the application in `applications.json`
4. Tracks applications that need follow-up after 10 days without a status change

---

## Who It Is For

Job seekers who:

* Apply to multiple jobs
* Want personalized cover letters
* Need a simple way to track applications
* Often forget to follow up

---

## How It Works

```text
Paste Job Posting
        │
        ▼
Read resume.md
        │
        ▼
Match skills & experience
        │
        ▼
Generate cover letter
        │
        ▼
Append entry to applications.json
        │
        ▼
Application Tracker Agent
        │
        ▼
Flag applications with no status change for 10+ days
```

---

## Project Files

```text
.
├── .mcp.json
├── resume.md
├── applications.json
├── .claude/
│   ├── skills/
│   │   └── custom-cover-letter/
│   │       └── SKILL.md
│   └── agents/
│       └── application-tracker.md
└── README.md
```

---

## MCP / Skill / Agent

### Filesystem MCP

Provides Claude Code with access to local project files.

Used to:

* Read `resume.md`
* Read and update `applications.json`

---

### Cover Letter Skill

**File**

```text
.claude/skills/custom-cover-letter/SKILL.md
```

Purpose:

* Match resume experience to job requirements
* Follow my preferred tone and structure
* Reuse relevant keywords naturally
* Generate concise, professional cover letter paragraphs

---

### Application Tracker Agent

**File**

```text
.claude/agents/application-tracker.md
```

Purpose:

* Review `applications.json`
* Detect applications with no status change for 10+ days
* Recommend which applications need follow-up

---

## Example Workflow

```text
Job Posting
      │
      ▼
Claude reads resume.md
      │
      ▼
Tailored Cover Letter
      │
      ▼
Application Logged
      │
      ▼
Later...
      │
      ▼
Tracker Agent checks applications.json
      │
      ▼
Follow-up reminder
```

---

## What I Learned

* How to use the Filesystem MCP to work with local files.
* How a custom Skill improves writing consistency.
* How a Subagent can automate a focused task.
* The value of building one complete workflow before adding extra features.

---

## Future Improvements

* Import job postings from URLs.
* Add customizable follow-up reminders.
* Generate complete cover letters instead of a single paragraph.
* Track interview dates and application outcomes.
