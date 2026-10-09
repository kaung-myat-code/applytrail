/**
 * Patch Application Engine
 *
 * Applies accepted/edited suggestion patches to a deep copy of a source
 * resume. This is the correctness boundary for tailored resume generation:
 * the original resume is never mutated, only decisions with status
 * "accepted" or "edited" are applied, and modify/remove patches search ALL
 * matching entries (not just the last one) within experience and projects.
 *
 * Suggestion shape (from server/lib/analysis/providers/heuristic.js):
 *   { id, section, type, current, suggested, reason, target_entry? }
 * (OUT-05: add-type experience/projects suggestions may carry target_entry —
 * the experience company / projects name the bullet should attach to.)
 *
 * Decision shape (from client review workflow):
 *   { status: 'accepted' | 'rejected' | 'edited', editedContent?: string }
 */

const { validateResume } = require('../validateResume')
// OUT-05: the sanctioned resume matcher (exported by validate.js in this
// phase) — used for target_entry name comparison. Never hand-roll a fuzzy
// matcher here; see PATTERNS.md "Shared Patterns → Resume content matching".
const { normalizeText } = require('../analysis/validate')

/**
 * Closed enum of reasons a decided (accepted/edited) suggestion may fail to
 * apply. Exported so callers (routes, client) branch on stable machine
 * values rather than parsing free-text log messages.
 *
 *   NOT_FOUND               - modify/remove target substring absent from
 *                              every entry (experience/projects bullets,
 *                              skills modify). Expected: the resume changed
 *                              since the suggestion was generated.
 *   CURRENT_MISMATCH         - modify/remove target's `current` no longer
 *                              equals the live field value (summary modify/
 *                              remove, exact-match comparison). Expected:
 *                              same cause as NOT_FOUND, different section
 *                              shape.
 *   UNSUPPORTED_COMBINATION  - suggestion.section is not one of the four
 *                              sections this engine handles (summary,
 *                              skills, experience, projects). Every
 *                              section/type pairing this engine recognizes
 *                              is fully handled, so this is a code defect,
 *                              not a data condition -- it means a
 *                              suggestion reached here that should have
 *                              been rejected upstream (e.g. at the AI
 *                              provider's schema boundary).
 *   TARGET_ENTRY_NOT_FOUND   - (OUT-05) an add-type suggestion named a
 *                              specific entry via target_entry (experience
 *                              company / projects name), but no entry
 *                              matched under normalizeText comparison. The
 *                              bullet still lands on the last entry
 *                              (informational fallback, NOT a hard
 *                              failure); the skip record carries the
 *                              target_entry value so the UI can explain the
 *                              mis-target. A known non-defect (stale or
 *                              positional suggestion), bucketed with
 *                              NOT_FOUND/CURRENT_MISMATCH -- not with
 *                              UNSUPPORTED_COMBINATION.
 */
const SKIP_REASON = Object.freeze({
  NOT_FOUND: 'not-found',
  CURRENT_MISMATCH: 'current-mismatch',
  UNSUPPORTED_COMBINATION: 'unsupported-combination',
  TARGET_ENTRY_NOT_FOUND: 'target-entry-not-found',
})

/**
 * Deep clone via JSON round-trip. Resume data is plain JSON (no functions,
 * dates, or circular references), so this is safe and simple.
 * @param {object} resume
 * @returns {object}
 */
function deepClone(resume) {
  return JSON.parse(JSON.stringify(resume))
}

/**
 * Resolve the content to apply for a suggestion: editedContent overrides
 * suggestion.suggested when present.
 * @param {object} suggestion
 * @param {object} decision
 * @returns {string}
 */
function resolveContent(suggestion, decision) {
  if (decision && decision.status === 'edited' && typeof decision.editedContent === 'string' && decision.editedContent) {
    return decision.editedContent
  }
  return suggestion.suggested
}

/**
 * Search all entries in a list (experience or projects) for a bullet
 * containing the given value, and replace or remove it in place.
 * @param {object[]} entries - experience or projects array
 * @param {string} currentValue - substring to search for in bullets
 * @param {string|null} replacement - replacement text, or null to remove
 * @returns {boolean} true if a match was found and applied
 */
function applyToAllEntries(entries, currentValue, replacement) {
  if (!Array.isArray(entries) || !currentValue) return false

  for (const entry of entries) {
    if (!entry || !Array.isArray(entry.bullets)) continue
    const idx = entry.bullets.findIndex(b => typeof b === 'string' && b.includes(currentValue))
    if (idx !== -1) {
      if (replacement === null) {
        entry.bullets.splice(idx, 1)
      } else {
        entry.bullets[idx] = replacement
      }
      return true
    }
  }
  return false
}

/**
 * Apply an add-type patch to experience or projects: append the suggested
 * bullet to the entry named by targetEntry when it matches (OUT-05),
 * otherwise append to the last entry, or create a new entry if the list is
 * empty.
 *
 * RESOLVED (was WR-06 KNOWN LIMITATION): suggestions can now carry a target
 * entry identifier (suggestion.target_entry — the experience company or
 * projects name), and this function attaches the bullet to that entry via
 * normalized name comparison (normalizeText from validate.js — the
 * sanctioned matcher, never raw string equality: 'Acme Corp' and 'acme
 * corp' match the same entry). When a non-empty targetEntry matches no
 * entry, the bullet still falls back to the last entry (informational, not
 * a hard failure) and this function returns fellBack=true so the caller
 * records a visible SKIP_REASON.TARGET_ENTRY_NOT_FOUND — never a silent
 * mis-target. Absent/empty targetEntry keeps the pre-OUT-05 last-entry
 * behavior with fellBack=false.
 * @param {object[]} entries
 * @param {string} suggestedBullet
 * @param {'experience'|'projects'} kind
 * @param {string} [targetEntry] - entry name to attach to (company for experience, name for projects)
 * @returns {boolean} fellBack - true when a non-empty targetEntry matched no entry and the bullet landed on the last entry instead
 */
function applyAddToList(entries, suggestedBullet, kind, targetEntry) {
  if (entries.length === 0) {
    if (kind === 'experience') {
      entries.push({ company: '', role: '', period: '', bullets: [suggestedBullet] })
    } else {
      entries.push({ name: '', description: '', bullets: [suggestedBullet] })
    }
    return false
  }

  const hasTarget = typeof targetEntry === 'string' && !!targetEntry.trim()
  if (hasTarget) {
    // OUT-05: attach to the named entry — normalized (case/whitespace/
    // smart-quote-insensitive) comparison on entry.company (experience) or
    // entry.name (projects).
    const nameField = kind === 'experience' ? 'company' : 'name'
    const normTarget = normalizeText(targetEntry)
    const target = entries.find(e => e && normalizeText(e[nameField]) === normTarget)
    if (target) {
      if (!Array.isArray(target.bullets)) {
        target.bullets = []
      }
      target.bullets.push(suggestedBullet)
      return false
    }
    // No match — fall through to the last-entry fallback; the caller
    // records the visible TARGET_ENTRY_NOT_FOUND skip.
  }

  const last = entries[entries.length - 1]
  if (!Array.isArray(last.bullets)) {
    last.bullets = []
  }
  last.bullets.push(suggestedBullet)
  return hasTarget
}

/**
 * Apply accepted/edited suggestions to a deep copy of the source resume.
 * @param {object} resume - source resume JSON
 * @param {object[]} suggestions - array of suggestion objects
 * @param {object} decisions - map of suggestion id -> { status, editedContent? }
 * @returns {{
 *   resume: object,
 *   validation: { ok: boolean, errors?: string[] },
 *   applied: { id: string, section: string, type: string }[],
 *   skipped: { id: string, section: string, type: string, reason: string, target_entry?: string }[],
 * }}
 */
function applyPatches(resume, suggestions, decisions) {
  const cloned = deepClone(resume)
  const decisionMap = decisions || {}
  const suggestionList = Array.isArray(suggestions) ? suggestions : []

  const accepted = suggestionList.filter(s => {
    const d = decisionMap[s.id]
    return d && (d.status === 'accepted' || d.status === 'edited')
  })

  const applied = []
  const skipped = []

  function markApplied(suggestion) {
    applied.push({ id: suggestion.id, section: suggestion.section, type: suggestion.type })
  }

  function markSkipped(suggestion, reason, logMessage, extra) {
    console.warn(`applyPatches: ${logMessage}`)
    skipped.push({ id: suggestion.id, section: suggestion.section, type: suggestion.type, reason, ...(extra || {}) })
  }

  for (const suggestion of accepted) {
    const decision = decisionMap[suggestion.id]
    const { section, type } = suggestion

    switch (section) {
      case 'summary': {
        if (type === 'modify') {
          if (cloned.summary === suggestion.current) {
            cloned.summary = resolveContent(suggestion, decision)
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.CURRENT_MISMATCH, `modify suggestion "${suggestion.id}" (summary) — current value does not match, skipped`)
          }
        } else if (type === 'add') {
          cloned.summary = resolveContent(suggestion, decision)
          markApplied(suggestion)
        } else if (type === 'remove') {
          if (cloned.summary === suggestion.current) {
            cloned.summary = ''
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.CURRENT_MISMATCH, `remove suggestion "${suggestion.id}" (summary) — current value does not match, skipped`)
          }
        }
        break
      }

      case 'skills': {
        if (!Array.isArray(cloned.skills)) cloned.skills = []
        if (type === 'add') {
          const value = resolveContent(suggestion, decision)
          const alreadyPresent = cloned.skills.some(sk => sk === value)
          if (!alreadyPresent) {
            cloned.skills.push(value)
          }
          markApplied(suggestion)
        } else if (type === 'remove') {
          cloned.skills = cloned.skills.filter(sk => sk !== suggestion.current)
          markApplied(suggestion)
        } else if (type === 'modify') {
          const value = resolveContent(suggestion, decision)
          const idx = cloned.skills.findIndex(sk => sk === suggestion.current)
          if (idx !== -1) {
            cloned.skills[idx] = value
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.NOT_FOUND, `modify suggestion "${suggestion.id}" (skills) — current value not found, skipped`)
          }
        }
        break
      }

      case 'experience': {
        if (!Array.isArray(cloned.experience)) cloned.experience = []
        if (type === 'add') {
          const fellBack = applyAddToList(cloned.experience, resolveContent(suggestion, decision), 'experience', suggestion.target_entry)
          if (fellBack) {
            // OUT-05: mis-targeted — the bullet still lands on the last
            // entry, but the suggestion is recorded as skipped (not applied)
            // with a visible reason carrying target_entry so the UI can
            // explain where the bullet actually went.
            markSkipped(suggestion, SKIP_REASON.TARGET_ENTRY_NOT_FOUND, `add suggestion "${suggestion.id}" (experience) — target_entry "${suggestion.target_entry}" matched no entry, bullet fell back to the last entry`, { target_entry: suggestion.target_entry })
          } else {
            markApplied(suggestion)
          }
        } else if (type === 'modify') {
          const replacement = resolveContent(suggestion, decision)
          const found = applyToAllEntries(cloned.experience, suggestion.current, replacement)
          if (found) {
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.NOT_FOUND, `modify suggestion "${suggestion.id}" (experience) — current value not found in any entry, skipped`)
          }
        } else if (type === 'remove') {
          const found = applyToAllEntries(cloned.experience, suggestion.current, null)
          if (found) {
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.NOT_FOUND, `remove suggestion "${suggestion.id}" (experience) — current value not found in any entry, skipped`)
          }
        }
        break
      }

      case 'projects': {
        if (!Array.isArray(cloned.projects)) cloned.projects = []
        if (type === 'add') {
          const fellBack = applyAddToList(cloned.projects, resolveContent(suggestion, decision), 'projects', suggestion.target_entry)
          if (fellBack) {
            // OUT-05: see the experience branch — informational mis-target,
            // recorded as skipped with target_entry, not silently applied.
            markSkipped(suggestion, SKIP_REASON.TARGET_ENTRY_NOT_FOUND, `add suggestion "${suggestion.id}" (projects) — target_entry "${suggestion.target_entry}" matched no entry, bullet fell back to the last entry`, { target_entry: suggestion.target_entry })
          } else {
            markApplied(suggestion)
          }
        } else if (type === 'modify') {
          const replacement = resolveContent(suggestion, decision)
          const found = applyToAllEntries(cloned.projects, suggestion.current, replacement)
          if (found) {
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.NOT_FOUND, `modify suggestion "${suggestion.id}" (projects) — current value not found in any entry, skipped`)
          }
        } else if (type === 'remove') {
          const found = applyToAllEntries(cloned.projects, suggestion.current, null)
          if (found) {
            markApplied(suggestion)
          } else {
            markSkipped(suggestion, SKIP_REASON.NOT_FOUND, `remove suggestion "${suggestion.id}" (projects) — current value not found in any entry, skipped`)
          }
        }
        break
      }

      default:
        markSkipped(suggestion, SKIP_REASON.UNSUPPORTED_COMBINATION, `suggestion "${suggestion.id}" has unsupported section "${section}", skipped`)
        break
    }
  }

  return { resume: cloned, validation: validateResume(cloned), applied, skipped }
}

module.exports = { applyPatches, SKIP_REASON }
