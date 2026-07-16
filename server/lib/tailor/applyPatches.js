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
 *   { id, section, type, current, suggested, reason }
 *
 * Decision shape (from client review workflow):
 *   { status: 'accepted' | 'rejected' | 'edited', editedContent?: string }
 */

const { validateResume } = require('../validateResume')

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
 * bullet to the last entry, or create a new entry if the list is empty.
 * @param {object[]} entries
 * @param {string} suggestedBullet
 * @param {'experience'|'projects'} kind
 */
function applyAddToList(entries, suggestedBullet, kind) {
  if (entries.length === 0) {
    if (kind === 'experience') {
      entries.push({ company: '', role: '', period: '', bullets: [suggestedBullet] })
    } else {
      entries.push({ name: '', description: '', bullets: [suggestedBullet] })
    }
    return
  }
  const last = entries[entries.length - 1]
  if (!Array.isArray(last.bullets)) {
    last.bullets = []
  }
  last.bullets.push(suggestedBullet)
}

/**
 * Apply accepted/edited suggestions to a deep copy of the source resume.
 * @param {object} resume - source resume JSON
 * @param {object[]} suggestions - array of suggestion objects
 * @param {object} decisions - map of suggestion id -> { status, editedContent? }
 * @returns {{ resume: object, validation: { ok: boolean, errors?: string[] } }}
 */
function applyPatches(resume, suggestions, decisions) {
  const cloned = deepClone(resume)
  const decisionMap = decisions || {}
  const suggestionList = Array.isArray(suggestions) ? suggestions : []

  const accepted = suggestionList.filter(s => {
    const d = decisionMap[s.id]
    return d && (d.status === 'accepted' || d.status === 'edited')
  })

  for (const suggestion of accepted) {
    const decision = decisionMap[suggestion.id]
    const { section, type } = suggestion

    switch (section) {
      case 'summary': {
        if (type === 'modify') {
          if (cloned.summary === suggestion.current) {
            cloned.summary = resolveContent(suggestion, decision)
          } else {
            console.warn(`applyPatches: modify suggestion "${suggestion.id}" (summary) — current value does not match, skipped`)
          }
        } else if (type === 'add') {
          cloned.summary = resolveContent(suggestion, decision)
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
        } else if (type === 'remove') {
          cloned.skills = cloned.skills.filter(sk => sk !== suggestion.current)
        }
        break
      }

      case 'experience': {
        if (!Array.isArray(cloned.experience)) cloned.experience = []
        if (type === 'add') {
          applyAddToList(cloned.experience, resolveContent(suggestion, decision), 'experience')
        } else if (type === 'modify') {
          const replacement = resolveContent(suggestion, decision)
          const found = applyToAllEntries(cloned.experience, suggestion.current, replacement)
          if (!found) {
            console.warn(`applyPatches: modify suggestion "${suggestion.id}" (experience) — current value not found in any entry, skipped`)
          }
        } else if (type === 'remove') {
          const found = applyToAllEntries(cloned.experience, suggestion.current, null)
          if (!found) {
            console.warn(`applyPatches: remove suggestion "${suggestion.id}" (experience) — current value not found in any entry, skipped`)
          }
        }
        break
      }

      case 'projects': {
        if (!Array.isArray(cloned.projects)) cloned.projects = []
        if (type === 'add') {
          applyAddToList(cloned.projects, resolveContent(suggestion, decision), 'projects')
        } else if (type === 'modify') {
          const replacement = resolveContent(suggestion, decision)
          const found = applyToAllEntries(cloned.projects, suggestion.current, replacement)
          if (!found) {
            console.warn(`applyPatches: modify suggestion "${suggestion.id}" (projects) — current value not found in any entry, skipped`)
          }
        } else if (type === 'remove') {
          const found = applyToAllEntries(cloned.projects, suggestion.current, null)
          if (!found) {
            console.warn(`applyPatches: remove suggestion "${suggestion.id}" (projects) — current value not found in any entry, skipped`)
          }
        }
        break
      }

      default:
        console.warn(`applyPatches: suggestion "${suggestion.id}" has unsupported section "${section}", skipped`)
        break
    }
  }

  return { resume: cloned, validation: validateResume(cloned) }
}

module.exports = { applyPatches }
