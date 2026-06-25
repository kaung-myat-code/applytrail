# Coding Conventions

**Analysis Date:** 2026-06-26

## Project Type

This is a **Claude Code workflow project**, not a traditional codebase. It has no source code, build system, or runtime. Quality is maintained through consistent markdown/JSON structure and Claude Code configuration patterns.

## File Formats

**Data files:**
- `applications.json` — Flat JSON array of application objects. Use lowercase snake_case keys (`date_applied`, `cover_letter_paragraph`, `status`). No nested objects. No schema version field.
- `resume.md` — Structured markdown with H2 sections (`## Summary`, `## Experience`, `## Skills`, `## Education`). Bullet points use `-` prefix with 4-space indent.

**Configuration files:**
- `.mcp.json` — MCP server definitions. Standard JSON format.
- `.gitignore` — Minimal. Currently only excludes `.env`.

**Documentation:**
- `README.md` — Project overview with ASCII flow diagrams, `## Section` headers, and fenced code blocks (`text` language).
- `slides/pitch.md` — Marp-format presentation. Uses YAML frontmatter (`marp: true`, `paginate: true`, `transition: fade`, `auto-advance`).

## Markdown Style

**Headers:**
- Use `# Title` for document title (one per file)
- Use `## Section` for major sections
- Use `### Subsection` for output categories (in agent files)
- No trailing punctuation on headers

**Lists:**
- Use `*` for unordered lists (not `-`)
- Indent nested items with 4 spaces
- No blank lines between list items

**Code blocks:**
- Use ` ```text ``` ` for non-language-specific content (file trees, flow diagrams)
- Use ` ```language ``` ` for syntax-highlighted code

**Frontmatter:**
- Skills and agents use YAML frontmatter delimited by `---`
- Fields: `name`, `description`, `tools`, `model`, `color`
- Some files use `---` as section separators (not frontmatter) — see `application-tracker.md` line 15

## Agent Conventions

**File location:** `.claude/agents/<agent-name>.md`

**Naming:** Lowercase kebab-case (e.g., `application-tracker.md`)

**Structure:**
1. YAML frontmatter with `name`, `description`, `tools`, `model`, `color`
2. Role statement ("You are an X assistant.")
3. `## Task` — What the agent does
4. `## Rules` — Constraints and guardrails
5. `## Output Format` — Structured output template

**Key pattern:** Agents are read-only by default. The `application-tracker` explicitly states "Do not modify `applications.json`."

## Skill Conventions

**File location:** `.claude/skills/<skill-name>/SKILL.md`

**Naming:** Lowercase kebab-case directory, `SKILL.md` file inside

**Structure:**
1. YAML frontmatter with `name`, `description`
2. `## Goal` — What the skill produces
3. `## Tone` / `## Style Rules` — Writing guidelines
4. `## Structure` — Output format requirements
5. `## Keyword Matching` / `## Resume Mapping` — Domain-specific logic

## JSON Data Conventions

**`applications.json` schema:**
```json
{
  "company": "string",
  "role": "string",
  "date_applied": "YYYY-MM-DD",
  "status": "drafted|applied|...",
  "cover_letter_paragraph": "string"
}
```

- Dates use ISO 8601 format (`YYYY-MM-DD`)
- Status values are lowercase single words
- `cover_letter_paragraph` is a single paragraph, 4-6 sentences

## GSD Framework Conventions

**Agent files in `.claude/agents/gsd-*.md`:**
- Follow GSD framework naming: `gsd-<role>.md`
- All use `model: inherit`
- All grant `tools: Read, Grep, Glob` (or subset)

**Hook files in `.claude/hooks/`:**
- JavaScript: `.js` extension
- Shell scripts: `.sh` extension
- CommonJS modules: `.cjs` extension
- Naming: `gsd-<purpose>.<ext>`

**Command files in `.claude/commands/`:**
- Naming: `gsd-<command>.md`
- All lowercase kebab-case

## Where to Add New Content

**New application entry:** Append to array in `applications.json`
**New agent:** Create `.claude/agents/<name>.md` with frontmatter
**New skill:** Create `.claude/skills/<name>/SKILL.md`
**New hook:** Create `.claude/hooks/gsd-<name>.js` or `.sh`

---

*Convention analysis: 2026-06-26*
