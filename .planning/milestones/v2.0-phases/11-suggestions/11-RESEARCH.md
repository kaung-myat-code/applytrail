# Research: Phase 11 - Section-by-Section Suggestions

**Researched:** 2026-07-03
**Domain:** Per-section resume improvement suggestions with accept/reject workflow and diff comparison
**Confidence:** HIGH

## Summary

Phase 11 extends the Phase 10 analysis engine to generate actionable improvement suggestions for each resume section. Users review suggestions grouped by section, accept or reject each one (with bulk controls), and compare current vs suggested content in a side-by-side diff view. The heuristic provider generates template-based suggestions from the analysis results (missing keywords, section gaps), and the provider-agnostic design ensures AI providers can produce richer suggestions later.

The key architectural decision is that suggestions are returned alongside the match report from the existing `POST /api/analyze` endpoint — they're part of the analysis output, not a separate computation. The frontend manages accept/reject state; the backend remains stateless. A new `POST /api/apply-suggestions` endpoint will be added in Phase 12 (Tailored Resume Generation) to actually apply accepted suggestions to create a new resume version.

**Primary recommendation:** Extend `heuristic.js` with a `generateSuggestions(resume, report)` function that produces structured suggestion objects. Install `react-diff-viewer-continued` for the diff view. Build a `ReviewSuggestions.jsx` page accessible from the Analysis report. Use React `useState` for accept/reject/edit state management.

## Codebase Patterns to Follow

### Analysis Engine Pattern (server/lib/analysis/)

The Phase 10 analysis engine established a clean provider pattern:

```javascript
// server/lib/analysis/providers/heuristic.js
function analyzeResume(resume, jobPosting) {
  // ... compute report ...
  return { score, summary, strengths, gaps, keywords, sections }
}
module.exports = { analyzeResume }
```

Phase 11 extends this with a suggestion generator:

```javascript
// Same module, new export
function generateSuggestions(resume, report) {
  // ... generate per-section suggestions ...
  return { suggestions: { summary: [...], skills: [...], ... } }
}
module.exports = { analyzeResume, generateSuggestions }
```

### API Endpoint Pattern

All endpoints follow the same structure in `server/index.js`:

```javascript
app.post('/api/endpoint', (req, res) => {
  // 1. Validate input
  // 2. Read data from JSON files
  // 3. Call library function
  // 4. Return result
  res.json({ ok: true, ... })
})
```

### Frontend Page Pattern

All pages use fetch-on-mount with useState:

```javascript
function PageName() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { fetch(...).then(...).catch(...) }, [])
  // render
}
```

### CSS Module Pattern

Component-scoped styles with CSS custom properties from `index.css`:

```css
/* ComponentName.module.css */
.page { ... }
.section { ... }
/* Use var(--color-success), var(--color-warning), var(--color-danger) */
```

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Suggestion generation | API / Backend | -- | Text processing and template logic belongs server-side |
| Suggestion data format | API / Backend | -- | Structured data, provider-agnostic |
| Accept/reject state | Browser / Client | -- | Ephemeral UI state, no persistence needed |
| Edit suggestion text | Browser / Client | -- | Local form state before commit |
| Diff rendering | Browser / Client | -- | Visual comparison is a UI concern |
| Apply suggestions | API / Backend | -- | Deep copy + patch application (Phase 12) |

## Technical Approach

### Requirement SUGGEST-01: Section-Level Suggestions

**What:** Generate section-level suggestions (add, modify, remove) with explanation for each recommendation.

**Suggestion Data Structure:**

```javascript
{
  id: 'suggest-1',           // Unique ID for state tracking
  section: 'summary',        // Resume section: summary, skills, experience, projects, education
  type: 'modify',            // add, modify, remove
  current: '...',            // Current content (null for 'add' type)
  suggested: '...',          // Suggested replacement content
  reason: '...'              // Human-readable explanation
}
```

**Suggestion Types:**
- `add` — New content to add to the section (e.g., missing skill, new bullet). `current` is null.
- `modify` — Replace existing content with improved version (e.g., rewrite summary to include keywords). Both `current` and `suggested` are populated.
- `remove` — Content to remove (e.g., irrelevant skill). `suggested` is null. Used sparingly by heuristics.

**Heuristic Provider Suggestion Generation:**

The heuristic provider generates suggestions from the analysis report's gap data:

1. **Summary suggestions (modify):**
   - If missing keywords exist, suggest rewriting the summary to incorporate 2-3 top missing keywords
   - Template: "{current summary} ... Experienced in {missing_kw_1} and {missing_kw_2}."
   - Only one modify suggestion per analysis (summary is a single block)

2. **Skills suggestions (add):**
   - Each missing keyword becomes an "add" suggestion
   - Template: "Add '{keyword}' to your skills — this keyword appears in the job posting"
   - Limit to top 5-8 missing keywords to avoid overwhelming

3. **Experience suggestions (add):**
   - For top 3-5 missing keywords, suggest a new bullet point
   - Template: "Led {keyword} initiatives that improved team efficiency and delivery quality"
   - Each suggestion targets a different missing keyword

4. **Projects suggestions (add):**
   - For top 2-3 missing keywords, suggest a new project bullet
   - Template: "Implemented {keyword} solutions to solve real-world challenges"
   - Fewer project suggestions than experience (projects are supplementary)

5. **Education suggestions:**
   - Minimal suggestions (education is factual, not easily improved)
   - Only suggest if education section is empty and could benefit from relevant coursework mention

**Edge Cases:**
- No missing keywords: return empty suggestions array (no improvements needed)
- Empty resume section: generate "add" suggestions only (nothing to modify)
- Very few posting keywords: limit suggestions proportionally (don't generate 10 suggestions from 3 keywords)

### Requirement SUGGEST-02: Accept/Reject/Edit Each Suggestion

**What:** User can accept, reject, or manually edit each suggestion individually.

**Frontend State Design:**

```javascript
// State tracked per suggestion ID
const [decisions, setDecisions] = useState({})
// Shape: { [suggestionId]: { status: 'accepted' | 'rejected' | 'edited', editedContent?: string } }

function handleAccept(id) {
  setDecisions(prev => ({ ...prev, [id]: { status: 'accepted' } }))
}

function handleReject(id) {
  setDecisions(prev => ({ ...prev, [id]: { status: 'rejected' } }))
}

function handleEdit(id, newContent) {
  setDecisions(prev => ({ ...prev, [id]: { status: 'edited', editedContent: newContent } }))
}
```

**SuggestionCard Component:**
- Displays suggestion type badge (add/modify/remove)
- Shows section name and reason
- For "modify" type: shows current vs suggested preview
- For "add" type: shows the suggested new content
- Three action buttons: Accept (green), Reject (red), Edit (blue)
- Edit mode: textarea for modifying the suggested content, Save/Cancel buttons
- Visual state: accepted (green border), rejected (dimmed/struck-through), edited (blue border with "edited" badge), undecided (default)

### Requirement SUGGEST-03: Bulk Controls

**What:** User can accept all or reject all suggestions with bulk controls.

**Implementation:**
- "Accept All" button: sets all undecided suggestions to accepted
- "Reject All" button: sets all undecided suggestions to rejected
- Buttons placed at the top of the suggestion list
- Count display: "X of Y suggestions accepted"
- Confirmation: no confirmation dialog needed (decisions aren't final until "Generate Resume" in Phase 12)

### Requirement SUGGEST-04: Side-by-Side Diff View

**What:** User can compare current and suggested content side-by-side in a diff view.

**Approach: react-diff-viewer-continued**

Install `react-diff-viewer-continued@^4.2.2` (per STACK.md recommendation). This provides:
- Split view (side-by-side) and unified view modes
- Word-level diff highlighting
- Dark/light theme support
- React 19 compatibility (peer dependency includes ^19.0.0)

**Note on @emotion/css dependency:** react-diff-viewer-continued pulls in @emotion/css and @emotion/react. These are scoped to the diff component and won't conflict with CSS Modules. Verified in STACK.md research.

**DiffViewer Component:**

```jsx
import ReactDiffViewer from 'react-diff-viewer-continued'

function ResumeDiffViewer({ current, suggested }) {
  return (
    <ReactDiffViewer
      oldValue={current || ''}
      newValue={suggested || ''}
      splitView={true}
      useDarkTheme={false}
      leftTitle="Current"
      rightTitle="Suggested"
    />
  )
}
```

**When to show diff:**
- For "modify" suggestions: diff between current content and suggested content
- For "add" suggestions: show only the new content (no diff needed, left side empty)
- For "remove" suggestions: show only the current content (no diff needed, right side empty)
- Diff is shown inline within the SuggestionCard when user clicks "View Diff" or expands the card

**Alternative if dependency issues arise:** Build a simple CSS-grid-based two-column view without a diff library. Each column shows the text with manual highlighting of added/removed words. Less polished but zero dependency risk.

### API Design

**Extend POST /api/analyze response:**

The existing `/api/analyze` endpoint already returns a `report` object. Phase 11 adds a `suggestions` field to this response:

```javascript
// Current response (Phase 10):
{ ok: true, report: { score, summary, strengths, gaps, keywords, sections } }

// Extended response (Phase 11):
{
  ok: true,
  report: { score, summary, strengths, gaps, keywords, sections },
  suggestions: [
    { id: 's1', section: 'summary', type: 'modify', current: '...', suggested: '...', reason: '...' },
    { id: 's2', section: 'skills', type: 'add', current: null, suggested: 'Docker', reason: '...' },
    // ...
  ]
}
```

**Why add to existing endpoint, not a new one:**
- Suggestions are derived from the same analysis computation
- Avoids a redundant second API call with the same inputs
- The heuristic provider computes suggestions in the same pass as the report
- Statelessness preserved — suggestions are computed, not stored

**Future endpoint (Phase 12, not this phase):**
```
POST /api/apply-suggestions
Body: { job_posting_id, resume_version_id, decisions: { [id]: { status, editedContent? } } }
Returns: { ok: true, tailored_resume: { ... } }
```

### Installation

```bash
# Client dependency (diff viewer)
cd client && npm install react-diff-viewer-continued@^4.2.2
```

No server dependencies needed — suggestion generation is pure JavaScript.

## Implementation Considerations

### Suggestion Quality

The heuristic provider generates template-based suggestions. These are starting points, not final content:
- Suggestions are useful for identifying gaps (what to add)
- Suggested wording is generic and should be customized by the user
- The "Edit" feature (SUGGEST-02) is critical — users must be able to refine template suggestions
- Future AI providers will produce much better suggestions; the heuristic is a baseline

### Performance

- Suggestion generation adds <5ms to analysis time (pure string operations)
- react-diff-viewer-continued renders diffs client-side, no server cost
- No additional API calls needed — suggestions come with the analysis response

### Navigation Flow

1. User runs analysis on `/analysis` page
2. Analysis report displays (Phase 10)
3. New: "Review Suggestions" button appears below the report
4. Click navigates to `/analysis/review` with the analysis data (passed via React Router state or re-fetched)
5. Review page shows all suggestions grouped by section
6. User accepts/rejects/edits suggestions
7. "Generate Tailored Resume" button (Phase 12) — disabled for now, shown as "Coming in Phase 12"

### CSS Module Additions

New CSS classes needed in `ReviewSuggestions.module.css`:
- `.page` — standard page container
- `.bulkActions` — top bar with Accept All / Reject All buttons
- `.sectionGroup` — wrapper for suggestions in the same section
- `.sectionGroupHeader` — section name with count badge
- `.suggestionCard` — individual suggestion card
- `.suggestionCardAccepted` / `.suggestionCardRejected` / `.suggestionCardEdited` — state variants
- `.suggestionType` — badge for add/modify/remove type
- `.suggestionReason` — explanation text
- `.diffContainer` — wrapper for diff viewer
- `.editTextarea` — textarea for editing suggestion content
- `.actionButtons` — row of accept/reject/edit buttons

### Edge Cases

1. **No suggestions generated:** Show message "Your resume already covers the key requirements well. No suggestions at this time." with a link back to the analysis report.

2. **All suggestions rejected:** The "Generate Tailored Resume" button (Phase 12) would produce an unchanged copy. Phase 12 should handle this gracefully.

3. **User navigates away and returns:** Suggestions are re-fetched from the analysis endpoint (stateless). Accept/reject decisions are lost. This is acceptable — the workflow is designed to be completed in one session.

4. **Large number of suggestions:** Cap at ~20 suggestions total. If more are generated, keep the most impactful (highest keyword relevance) and note "Showing top N suggestions."

5. **react-diff-viewer-continued CSS conflicts:** Monitor during implementation. If conflicts arise, fall back to a simple two-column layout without the library.

## Open Questions

1. **Should suggestions be persisted (saved to disk) or ephemeral?**
   - Recommendation: Ephemeral. Suggestions are re-generated from the analysis. No disk persistence needed. Accept/reject decisions are managed in React state and passed to Phase 12's apply endpoint.

2. **Should the "Edit" feature be inline (in the card) or a modal?**
   - Recommendation: Inline textarea within the SuggestionCard. Keeps context visible (the reason, the diff). Modal would hide surrounding suggestions.

3. **Should the diff view be shown by default or on click?**
   - Recommendation: On click (collapsed by default). Many suggestions are simple adds that don't need a diff. Showing diffs for all would be overwhelming. A "View Diff" toggle button on each card.

4. **How should the page handle re-analysis?**
   - Recommendation: The Review Suggestions page links back to Analysis. If the user wants to re-analyze with different inputs, they go to Analysis, run a new analysis, and then return to Review Suggestions.

5. **Should "Generate Tailored Resume" button be visible in Phase 11?**
   - Recommendation: Show a disabled button with "Coming in Phase 12" tooltip. Sets expectations and shows the planned flow. Remove the disabled state in Phase 12.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of `server/lib/analysis/providers/heuristic.js` — verified analysis output structure, section findings, keyword categorization
- Codebase analysis of `server/lib/analysis/engine.js` — verified provider registry pattern
- Codebase analysis of `server/index.js` — verified API endpoint patterns, resume library helpers
- Codebase analysis of `client/src/pages/Analysis.jsx` — verified report display components (ScoreDisplay, KeywordGroups, SectionFindings)
- Codebase analysis of `client/package.json` — verified React 19, no diff viewer installed

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` — react-diff-viewer-continued 4.2.2 recommended, @emotion dependency noted
- `.planning/research/PITFALLS.md` — Pitfall 5 (tailored resume loses structure) informs suggestion format design
- `.planning/research/ARCHITECTURE.md` — Phase 3 suggestion generation and review interface design
- `.planning/REQUIREMENTS.md` — SUGGEST-01 through SUGGEST-04 requirement definitions

### Tertiary (LOW confidence)
- None — all findings derived from codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — react-diff-viewer-continued is the only new dependency, well-documented
- Architecture: HIGH — extends existing analysis engine pattern exactly
- Pitfalls: MEDIUM — diff viewer @emotion dependency may cause minor CSS issues; fallback plan documented
