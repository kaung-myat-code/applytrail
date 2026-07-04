# Refactor Resume Review: Skill → GSD Subagent

## Description
The Resume Review was incorrectly created as a Claude skill (`.claude/skills/resume-review/`). It should be a GSD subagent (`.claude/agents/gsd-resume-reviewer.md`) so it can be spawned by workflows and other agents, not just invoked by users.

## Requirements
- Preserve existing review logic and prompts (4 audit dimensions, output format, verdict rules)
- Convert to GSD agent format with proper frontmatter (`tools`, `color`, `effort`)
- Remove the old skill directory
- Move evals if applicable, or note they need re-registration
- Update CLAUDE.md if it references the skill

## Plan

### Task 1: Create GSD agent file
- Create `.claude/agents/gsd-resume-reviewer.md`
- Frontmatter: `name: gsd-resume-reviewer`, `tools: Read, Write, Bash, Grep, Glob`, `color: teal`, `effort: high`
- Body: Same audit logic from SKILL.md (4 dimensions, output format, verdict rules)
- Add `<role>` block explaining it's spawned by workflows
- Add `<execution_flow>` with steps for reading inputs, running audits, writing findings

### Task 2: Remove old skill
- Delete `.claude/skills/resume-review/` directory (SKILL.md + evals/)

### Task 3: Update references
- No references in CLAUDE.md or README.md (verified)
- No other files reference the skill
- Clean up — no additional updates needed

### Task 4: Summary for user
- New invocation: Agent tool with `subagent_type: gsd-resume-reviewer`
- Or: Workflow can spawn it via `agent('Review suggestions', {agentType: 'gsd-resume-reviewer'})`
- No more `/resume-review` slash command
