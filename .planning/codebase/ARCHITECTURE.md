<!-- refreshed: 2026-06-26 -->
# Architecture

**Analysis Date:** 2026-06-26

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                    User (Claude Code CLI)                    │
│                   Paste job posting input                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MCP: Filesystem Server                     │
│                   `.mcp.json` (stdio)                        │
│        Reads resume.md, reads/writes applications.json       │
└──────────┬──────────────────────────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────┐    ┌──────────────────────────────┐
│  Skill: cover-letter    │    │  Agent: application-tracker  │
│  `.claude/skills/       │    │  `.claude/agents/            │
│   custom-cover-letter/  │    │   application-tracker.md`    │
│   SKILL.md`             │    │                              │
│  Generate paragraph     │    │  Flag 10+ day stale apps     │
└────────────┬────────────┘    └──────────────┬───────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  `applications.json`  —  job application records             │
│  `resume.md`          —  user resume content                 │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Filesystem MCP | Provide Claude read/write access to project files | `.mcp.json` |
| Cover Letter Skill | Match resume to job posting, generate tailored paragraph | `.claude/skills/custom-cover-letter/SKILL.md` |
| Application Tracker Agent | Scan applications.json, flag stale entries needing follow-up | `.claude/agents/application-tracker.md` |
| applications.json | Persist all job application records | `applications.json` |
| resume.md | Store user resume content as skill input | `resume.md` |

## Pattern Overview

**Overall:** Prompt-driven workflow — no runtime code, no build step. The entire system is defined declaratively in Markdown files that Claude Code interprets at conversation time.

**Key Characteristics:**
- Skill and Agent are Markdown-based instruction sets, not executable code
- MCP server is the only runtime component (stdio-based filesystem access)
- Data is a flat JSON array with no schema enforcement
- No server, no database, no framework — purely Claude Code orchestration

## Layers

**MCP Layer:**
- Purpose: Bridge Claude Code to local filesystem
- Location: `.mcp.json`
- Contains: MCP server configuration (stdio transport)
- Depends on: `@modelcontextprotocol/server-filesystem` npm package
- Used by: Both skill and agent (implicit via Claude Code)

**Skill Layer:**
- Purpose: Generate tailored cover letter paragraphs
- Location: `.claude/skills/custom-cover-letter/SKILL.md`
- Contains: Tone rules, structure rules, keyword mapping, resume-to-requirement mapping
- Depends on: `resume.md` (read via MCP), job posting (user input)
- Used by: Claude Code when user invokes the skill

**Agent Layer:**
- Purpose: Audit applications for follow-up needs
- Location: `.claude/agents/application-tracker.md`
- Contains: Follow-up rules, date priority logic, output format template
- Depends on: `applications.json` (read via MCP)
- Used by: Claude Code when user invokes the agent

**Data Layer:**
- Purpose: Persist application data and resume content
- Location: Project root (`applications.json`, `resume.md`)
- Contains: JSON application records, Markdown resume
- Depends on: Nothing (static files)
- Used by: Skill (reads resume), Agent (reads applications), Skill output (writes applications)

## Data Flow

### Cover Letter Generation

1. User pastes a job posting into Claude Code
2. Claude reads `resume.md` via Filesystem MCP (`resume.md`)
3. `custom-cover-letter` skill matches resume bullets to job requirements
4. Skill generates a 4–6 sentence tailored paragraph following tone/structure rules
5. Claude appends a new entry to `applications.json` with company, role, date, status "drafted", and cover letter paragraph

### Follow-up Tracking

1. User invokes the application-tracker agent
2. Agent reads `applications.json` via Filesystem MCP
3. Agent evaluates each entry against the 10+ day stale rule
4. Agent returns a structured report: summary, follow-ups needed, missing data, no-action items

**State Management:**
- All state lives in `applications.json` — a flat JSON array
- No in-memory state, no caching, no session persistence
- Each Claude Code conversation is stateless; files are the source of truth

## Key Abstractions

**Skill (custom-cover-letter):**
- Purpose: Declarative prompt that teaches Claude how to write cover letters
- Examples: `.claude/skills/custom-cover-letter/SKILL.md`
- Pattern: Markdown with frontmatter (name, description) + structured instructions

**Agent (application-tracker):**
- Purpose: Declarative prompt that teaches Claude how to audit applications
- Examples: `.claude/agents/application-tracker.md`
- Pattern: Markdown with frontmatter (name, description, tools, model, color) + task rules

## Entry Points

**Cover Letter Generation:**
- Location: User pastes job posting in Claude Code CLI
- Triggers: `/custom-cover-letter` skill invocation or natural language request
- Responsibilities: Read resume, match skills, generate paragraph, log application

**Follow-up Tracking:**
- Location: User invokes `application-tracker` agent in Claude Code
- Triggers: Explicit agent invocation
- Responsibilities: Read applications, evaluate staleness, produce report

## Architectural Constraints

- **No runtime code:** The project contains zero executable source files. All logic is encoded in Markdown prompts interpreted by Claude Code.
- **Filesystem-only storage:** No database. `applications.json` is a flat file with no schema validation.
- **MCP dependency:** Filesystem MCP must be running for Claude to read/write files. Configured in `.mcp.json`.
- **No schema enforcement:** `applications.json` entries have inconsistent fields (e.g., some have `date_applied`, the agent expects `last_status_change`).

## Anti-Patterns

### Inconsistent Date Fields

**What happens:** `applications.json` uses `date_applied` but the agent expects `last_status_change`, `status_updated_at`, `updated_at`, or `applied_at`
**Why it's wrong:** The agent cannot reliably determine staleness without a consistent date field
**Do this instead:** Standardize on `date_applied` and `last_status_change` fields, update the agent to match

### No Schema Validation

**What happens:** Any field can be added or omitted in application entries
**Why it's wrong:** Agent may flag entries as "missing data" when the schema is simply inconsistent
**Do this instead:** Define a minimal JSON schema or at least document required fields in README

## Error Handling

**Strategy:** Declarative — the agent and skill include rules for edge cases (missing dates, missing resume) but there is no programmatic error handling.

**Patterns:**
- Agent flags entries with missing dates as "missing/unclear data" rather than crashing
- Skill instructs Claude to "never invent skills, tools, industries, or achievements"
- Agent rule: "Do not modify applications.json" (read-only audit)

## Cross-Cutting Concerns

**Logging:** None — no runtime logging exists
**Validation:** None — no schema validation on applications.json
**Authentication:** None — local filesystem only, no auth needed

---

*Architecture analysis: 2026-06-26*
