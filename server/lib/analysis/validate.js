/**
 * Suggestion Validation
 *
 * Structural validation for match reports and suggestions.
 * Catches schema violations, duplicates, and invalid patches
 * before they reach the client. Used by the /api/analyze endpoint
 * as a quality gate.
 */

/**
 * Validate a match report against expected structure.
 * @param {object} report - MatchReport from analyzeResume
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateMatchReport(report) {
  const errors = []

  if (!report || typeof report !== 'object') {
    return { valid: false, errors: ['Match report is not an object'] }
  }

  // Score
  if (typeof report.score !== 'number' || report.score < 0 || report.score > 100) {
    errors.push(`Invalid score: ${report.score} (expected 0-100)`)
  }

  // Summary
  if (!report.summary || typeof report.summary !== 'string') {
    errors.push('Missing or empty summary')
  }

  // Arrays
  for (const field of ['strengths', 'gaps']) {
    if (!Array.isArray(report[field])) {
      errors.push(`Missing or invalid field: ${field}`)
    }
  }

  // Keywords
  if (!report.keywords || typeof report.keywords !== 'object') {
    errors.push('Missing keywords object')
  } else {
    for (const field of ['matched', 'missing', 'bonus']) {
      if (!Array.isArray(report.keywords[field])) {
        errors.push(`Missing keywords.${field}`)
      }
    }
  }

  // Sections
  const expectedSections = ['summary', 'skills', 'experience', 'projects', 'education']
  if (!report.sections || typeof report.sections !== 'object') {
    errors.push('Missing sections object')
  } else {
    for (const section of expectedSections) {
      const s = report.sections[section]
      if (!s) {
        errors.push(`Missing section: ${section}`)
        continue
      }
      if (typeof s.matchRate !== 'number' || s.matchRate < 0 || s.matchRate > 1) {
        errors.push(`${section}.matchRate invalid: ${s.matchRate}`)
      }
      if (!Array.isArray(s.matchedItems)) {
        errors.push(`${section}.matchedItems is not an array`)
      }
      if (!Array.isArray(s.missingItems)) {
        errors.push(`${section}.missingItems is not an array`)
      }
      if (typeof s.summary !== 'string') {
        errors.push(`${section}.summary is not a string`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validate an array of suggestions.
 * @param {object[]} suggestions - Array of suggestion objects
 * @param {object} resume - The source resume (for patch correctness checks)
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateSuggestions(suggestions, resume) {
  const errors = []
  const warnings = []

  if (!Array.isArray(suggestions)) {
    return { valid: false, errors: ['Suggestions is not an array'], warnings: [] }
  }

  const validSections = ['summary', 'skills', 'experience', 'projects', 'education']
  const validTypes = ['add', 'modify', 'remove']
  const seenIds = new Set()

  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i]
    const prefix = `suggestion[${i}]`

    // Required fields
    if (!s || typeof s !== 'object') {
      errors.push(`${prefix}: not an object`)
      continue
    }

    // ID
    if (typeof s.id !== 'string' || !s.id) {
      errors.push(`${prefix}: missing or empty id`)
    } else if (seenIds.has(s.id)) {
      errors.push(`${prefix}: duplicate id "${s.id}"`)
    } else {
      seenIds.add(s.id)
    }

    // Section
    if (!validSections.includes(s.section)) {
      errors.push(`${prefix}: invalid section "${s.section}"`)
    }

    // Type
    if (!validTypes.includes(s.type)) {
      errors.push(`${prefix}: invalid type "${s.type}"`)
    }

    // Suggested content
    if (typeof s.suggested !== 'string' || !s.suggested.trim()) {
      errors.push(`${prefix}: empty or missing suggested content`)
    }

    // Reason
    if (typeof s.reason !== 'string' || !s.reason.trim()) {
      warnings.push(`${prefix}: empty or missing reason`)
    }

    // Current (for modify)
    if (s.type === 'modify') {
      if (s.current === null || s.current === undefined) {
        warnings.push(`${prefix}: modify suggestion has no current value — patch may not apply correctly`)
      } else if (resume && typeof s.current === 'string') {
        // Check if current matches actual resume content
        const found = findInResume(resume, s.section, s.current)
        if (!found) {
          errors.push(`${prefix}: current value not found in resume — patch will fail`)
        }
      }
    }

    // Add to education (factual data, shouldn't be heuristic-patched)
    if (s.type === 'add' && s.section === 'education') {
      warnings.push(`${prefix}: adding to education section — education is factual and should not be heuristic-patched`)
    }

    // Empty current on add
    if (s.type === 'add' && s.current !== null) {
      warnings.push(`${prefix}: add suggestion has non-null current value (expected null)`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

/**
 * Normalize text for lenient-but-still-exact substring comparison.
 *
 * LLM providers (e.g. Gemini) reliably introduce benign formatting drift when
 * echoing resume text back as a suggestion's `current` field -- extra/collapsed
 * whitespace, smart quotes instead of straight quotes, or a trailing ellipsis
 * when truncating a long bullet. None of these change the substance of the
 * text, so they should not cause findInResume to reject a legitimate match.
 * This intentionally does NOT do fuzzy/token-overlap matching -- genuinely
 * paraphrased or fabricated text must still fail, since the match determines
 * whether a string-replacement patch can actually be applied to the resume.
 * @param {string} str
 * @returns {string}
 */
function normalizeText(str) {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    // Curly/smart quotes and apostrophes -> straight equivalents
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    // Trailing ellipsis (unicode "…" or literal "...") used when the model
    // truncates a long bullet instead of quoting it in full
    .replace(/(\.\.\.|…)\s*$/, '')
    // Collapse any run of whitespace (including newlines) to a single space
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Search for a string value in the resume's relevant section.
 * @param {object} resume
 * @param {string} section
 * @param {string} value
 * @returns {boolean}
 */
function findInResume(resume, section, value) {
  if (!resume || !value) return false

  const normValue = normalizeText(value)
  if (!normValue) return false

  switch (section) {
    case 'summary':
      return normalizeText(resume.summary || '').includes(normValue)

    case 'skills':
      return (resume.skills || []).some(s => {
        const normSkill = normalizeText(s)
        return normSkill.includes(normValue) || normValue.includes(normSkill)
      })

    case 'experience':
      return (resume.experience || []).some(e =>
        (e.bullets || []).some(b => normalizeText(b).includes(normValue))
      )

    case 'projects':
      return (resume.projects || []).some(p =>
        (p.bullets || []).some(b => normalizeText(b).includes(normValue))
      )

    default:
      return false
  }
}

module.exports = { validateMatchReport, validateSuggestions }
