---
task: resume-review-skill-to-agent
status: complete
started: 2026-07-04
completed: 2026-07-04
---

## What Was Done

Refactored Resume Review from a Claude skill to a GSD subagent.

### Changes

1. **Created** `.claude/agents/gsd-resume-reviewer.md` — GSD agent with proper frontmatter (`tools`, `color`, `effort`), `<role>` block, `<audit_dimensions>` (4 dimensions preserved), `<execution_flow>` (8 steps), `<quick_reference>`, `<critical_rules>`, and `<success_criteria>`.

2. **Removed** `.claude/skills/resume-review/` — Deleted `SKILL.md` and `evals/evals.json`.

3. **No other references** — CLAUDE.md and README.md do not reference the skill. No code changes needed.

### What Was Preserved

- All 4 audit dimensions (Match Report Quality, Suggestion Quality, Patch Correctness, Job-Specificity)
- All severity levels and red flags
- Output formats (markdown report + JSON findings)
- Verdict rules (ready/review_needed/reject)
- File location references
- Provider notes (heuristic vs AI)

### New Invocation

**Via Agent tool (manual):**
```
Agent: subagent_type = "gsd-resume-reviewer"
Prompt: Include <required_reading> block with file paths, or describe what to review
```

**Via Workflow (automated):**
```javascript
agent('Review suggestions for this job posting', {
  agentType: 'gsd-resume-reviewer',
  label: 'resume-review'
})
```

**No more `/resume-review` slash command** — skills are user-invoked, agents are workflow-invoked.
