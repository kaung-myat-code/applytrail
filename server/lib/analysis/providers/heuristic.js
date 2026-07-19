/**
 * Heuristic Analysis Provider
 *
 * Keyword-matching engine that scores resume-job posting compatibility.
 * Returns a MatchReport with score, keyword groups, and section findings.
 */

const { extractKeywords, extractResumeKeywords, ACRONYM_CASING } = require('../keywords')

/**
 * Compute keyword match data for a single section.
 * @param {string[]} sectionKeywords - keywords from the section
 * @param {string[]} postingKeywords - keywords from the job posting
 * @returns {{ matched: string[], missing: string[] }}
 */
function matchSection(sectionKeywords, postingKeywords) {
  const matched = []
  const missing = []

  for (const pk of postingKeywords) {
    const found = sectionKeywords.some(sk =>
      sk.includes(pk) || pk.includes(sk)
    )
    if (found) {
      matched.push(pk)
    } else {
      missing.push(pk)
    }
  }

  return { matched, missing }
}

/**
 * Generate a one-sentence summary for a section finding.
 */
function sectionSummary(sectionName, matchRate, matchedCount, missingCount) {
  if (matchRate >= 0.7) {
    return `Strong ${sectionName} alignment: ${matchedCount} keyword matches found.`
  }
  if (matchRate >= 0.4) {
    return `Moderate ${sectionName} alignment: ${matchedCount} matches, ${missingCount} gaps.`
  }
  if (matchedCount > 0) {
    return `Weak ${sectionName} alignment: only ${matchedCount} of ${matchedCount + missingCount} keywords found.`
  }
  return `No ${sectionName} keyword matches found. Consider adding relevant keywords.`
}

/**
 * Analyze resume against a job posting using keyword-matching heuristics.
 * @param {object} resume - Resume data object
 * @param {object} jobPosting - Job posting with posting_text field
 * @returns {object} MatchReport
 */
function analyzeResume(resume, jobPosting) {
  // Edge case: empty or missing posting text
  const postingText = jobPosting.posting_text || ''
  if (!postingText.trim()) {
    return {
      score: 0,
      summary: 'Add a job posting with description text to run analysis.',
      strengths: [],
      gaps: ['No job posting text provided.'],
      keywords: { matched: [], missing: [], bonus: [] },
      sections: {
        summary: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No posting text to analyze.' },
        skills: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No posting text to analyze.' },
        experience: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No posting text to analyze.' },
        projects: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No posting text to analyze.' },
        education: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No posting text to analyze.' },
      },
    }
  }

  // Edge case: empty resume
  const hasContent = (resume.skills || []).length > 0 ||
    (resume.experience || []).length > 0 ||
    (resume.projects || []).length > 0 ||
    (resume.summary || '').trim().length > 0

  if (!hasContent) {
    return {
      score: 0,
      summary: 'Add content to your resume before running analysis.',
      strengths: [],
      gaps: ['Resume has no content to analyze.'],
      keywords: { matched: [], missing: extractKeywords(postingText), bonus: [] },
      sections: {
        summary: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No resume content.' },
        skills: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No resume content.' },
        experience: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No resume content.' },
        projects: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No resume content.' },
        education: { matchRate: 0, matchedItems: [], missingItems: [], summary: 'No resume content.' },
      },
    }
  }

  // Extract keywords
  const postingKeywords = extractKeywords(postingText)
  const resumeKeywords = extractResumeKeywords(resume)

  // Categorize keywords
  const matchedKeywords = []
  const missingKeywords = []
  const bonusKeywords = []

  for (const pk of postingKeywords) {
    const found = resumeKeywords.some(rk => rk.includes(pk) || pk.includes(rk))
    if (found) {
      matchedKeywords.push(pk)
    } else {
      missingKeywords.push(pk)
    }
  }

  for (const rk of resumeKeywords) {
    const isPostingKeyword = postingKeywords.some(pk => pk.includes(rk) || rk.includes(pk))
    if (!isPostingKeyword) {
      bonusKeywords.push(rk)
    }
  }

  // Section analysis
  const summaryKeywords = extractKeywords(resume.summary || '')
  const skillsKeywords = (resume.skills || []).map(s => s.toLowerCase().trim())

  const experienceBullets = []
  for (const exp of (resume.experience || [])) {
    experienceBullets.push(...(exp.bullets || []))
  }
  const experienceKeywords = extractKeywords(experienceBullets.join(' '))

  const projectBullets = []
  for (const proj of (resume.projects || [])) {
    projectBullets.push(...(proj.bullets || []))
  }
  const projectKeywords = extractKeywords(projectBullets.join(' '))

  const educationText = (resume.education || [])
    .map(e => [e.degree, e.school].filter(Boolean).join(' '))
    .join(' ')
  const educationKeywords = extractKeywords(educationText)

  const sectionResults = {
    summary: computeSectionFindings('Summary', summaryKeywords, postingKeywords),
    skills: computeSectionFindings('Skills', skillsKeywords, postingKeywords),
    experience: computeSectionFindings('Experience', experienceKeywords, postingKeywords),
    projects: computeSectionFindings('Projects', projectKeywords, postingKeywords),
    education: computeSectionFindings('Education', educationKeywords, postingKeywords),
  }

  // Score calculation (three weighted components)
  const keywordScore = postingKeywords.length > 0
    ? (matchedKeywords.length / postingKeywords.length) * 100
    : 0

  const sectionsWithMatches = Object.values(sectionResults).filter(s => s.matchRate > 0).length
  const sectionScore = (sectionsWithMatches / 5) * 100

  const uniqueMatchedItems = new Set(matchedKeywords).size
  const depthScore = Math.min(100, (uniqueMatchedItems / 5) * 100)

  const score = Math.min(100, Math.round(
    keywordScore * 0.50 + sectionScore * 0.30 + depthScore * 0.25
  ))

  // Generate strengths and gaps
  const strengths = []
  const gaps = []

  for (const [name, findings] of Object.entries(sectionResults)) {
    if (findings.matchRate >= 0.5) {
      strengths.push(`${name}: ${Math.round(findings.matchRate * 100)}% keyword match`)
    }
    if (findings.matchRate < 0.3) {
      gaps.push(`${name}: only ${Math.round(findings.matchRate * 100)}% keyword match`)
    }
  }

  if (matchedKeywords.length > 0 && keywordScore >= 50) {
    strengths.push(`Strong keyword coverage: ${matchedKeywords.length} of ${postingKeywords.length} keywords matched`)
  }

  if (missingKeywords.length > 0) {
    gaps.push(`${missingKeywords.length} posting keywords missing from resume`)
  }

  // Summary sentence
  const topStrength = strengths.length > 0 ? strengths[0] : 'limited alignment'
  const topGap = gaps.length > 0 ? gaps[0] : 'no major gaps'
  const summaryText = `Score ${score}/100: ${topStrength}. Key gap: ${topGap}.`

  return {
    score,
    summary: summaryText,
    strengths,
    gaps,
    keywords: {
      matched: matchedKeywords,
      missing: missingKeywords,
      bonus: bonusKeywords.slice(0, 50), // Cap bonus to avoid overwhelming display
    },
    sections: sectionResults,
  }
}

/**
 * Compute findings for a single resume section.
 */
function computeSectionFindings(sectionName, sectionKeywords, postingKeywords) {
  const { matched, missing } = matchSection(sectionKeywords, postingKeywords)
  const total = postingKeywords.length
  const matchRate = total > 0 ? matched.length / total : 0

  return {
    matchRate,
    matchedItems: matched,
    missingItems: missing,
    summary: sectionSummary(sectionName, matchRate, matched.length, missing.length),
  }
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Display-case a lowercase extracted keyword: use the known acronym casing
 * if present (e.g. 'sql' -> 'SQL'), otherwise fall back to simple
 * capitalization. Unlike keywords.js consumers that render arbitrary text,
 * every input here is always an already-lowercase extracted keyword, so an
 * unconditional capitalize() fallback is safe.
 */
function displayCase(kw) {
  return ACRONYM_CASING[kw] || capitalize(kw)
}

/**
 * Deterministically pick one of several phrasing variants based on a seed
 * string, so output stays reproducible/testable while still varying across
 * different missing-keyword sets.
 */
function pickVariant(variants, seed) {
  const sum = [...String(seed)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return variants[sum % variants.length]
}

/**
 * Generate per-section improvement suggestions from the match report.
 * @param {object} resume - Resume data object
 * @param {object} report - MatchReport from analyzeResume
 * @returns {object[]} Array of suggestion objects
 */
function generateSuggestions(resume, report) {
  const suggestions = []
  let idCounter = 1

  function nextId() {
    return 's' + (idCounter++)
  }

  const missing = (report.keywords && report.keywords.missing) || []
  const matched = (report.keywords && report.keywords.matched) || []

  // If no missing keywords, no suggestions needed
  if (missing.length === 0) {
    return []
  }

  // Track which keywords have been used for experience/project suggestions
  // to avoid duplicates across sections
  const usedForExperience = new Set()
  const usedForProjects = new Set()

  // --- Summary suggestions (modify or add) ---
  const summary = (resume.summary || '').trim()
  const topMissingForSummary = missing.slice(0, 3)

  if (topMissingForSummary.length > 0) {
    if (summary) {
      // Modify: append keywords to existing summary
      const kwPhrase = topMissingForSummary.length === 1
        ? displayCase(topMissingForSummary[0])
        : topMissingForSummary.slice(0, -1).map(displayCase).join(', ') + ' and ' + displayCase(topMissingForSummary[topMissingForSummary.length - 1])
      const suggested = summary + (summary.endsWith('.') ? ' ' : '. ') + 'Experienced in ' + kwPhrase + '.'
      suggestions.push({
        id: nextId(),
        section: 'summary',
        type: 'modify',
        current: summary,
        suggested,
        reason: 'Your summary is missing key technologies mentioned in the job posting.',
      })
    } else {
      // Add: no summary exists
      const kwPhrase = matched.slice(0, 3).map(displayCase).join(', ')
      const suggested = kwPhrase
        ? 'Professional with experience in ' + kwPhrase + '.'
        : 'Professional with relevant industry experience.'
      suggestions.push({
        id: nextId(),
        section: 'summary',
        type: 'add',
        current: null,
        suggested,
        reason: 'Your resume has no summary. Adding one helps recruiters quickly understand your profile.',
      })
    }
  }

  // --- Skills suggestions (add) ---
  const skills = (resume.skills || []).map(s => s.toLowerCase().trim())
  const missingSkills = missing.filter(kw => {
    // Only suggest skills not already in the skills list
    return !skills.some(sk => sk.includes(kw) || kw.includes(sk))
  }).slice(0, 5)

  for (const kw of missingSkills) {
    suggestions.push({
      id: nextId(),
      section: 'skills',
      type: 'add',
      current: null,
      suggested: displayCase(kw),
      reason: "'" + displayCase(kw) + "' appears in the job posting but is not in your skills list.",
    })
  }

  // --- Experience suggestions (add) ---
  const EXPERIENCE_TEMPLATES = [
    kwText => 'Led ' + kwText + ' initiatives that improved project delivery and team productivity.',
    kwText => 'Drove ' + kwText + ' efforts, partnering across teams to ship measurable improvements.',
    kwText => 'Applied ' + kwText + ' to streamline workflows and boost team output.',
  ]

  const topMissingForExp = missing.slice(0, 3)
  for (let i = 0; i < topMissingForExp.length; i += 2) {
    const pair = topMissingForExp.slice(i, i + 2)
    for (const kw of pair) usedForExperience.add(kw)

    const kwText = pair.map(displayCase).join(' and ')
    const reasonText = pair.map(displayCase).join(' or ')
    const template = pickVariant(EXPERIENCE_TEMPLATES, kwText)

    suggestions.push({
      id: nextId(),
      section: 'experience',
      type: 'add',
      current: null,
      suggested: template(kwText),
      reason: 'No experience bullets mention ' + reasonText + ', which is a key requirement in this job posting.',
    })
  }

  // --- Projects suggestions (add) ---
  const PROJECT_TEMPLATES = [
    kwText => 'Implemented ' + kwText + ' solutions to address real-world technical challenges.',
    kwText => 'Built a project centered on ' + kwText + ', solving a concrete real-world problem.',
    kwText => 'Delivered a ' + kwText + '-driven project from concept through completion.',
  ]

  const remainingForProjects = missing.filter(kw => !usedForExperience.has(kw)).slice(0, 2)
  for (let i = 0; i < remainingForProjects.length; i += 2) {
    const pair = remainingForProjects.slice(i, i + 2)
    for (const kw of pair) usedForProjects.add(kw)

    const kwText = pair.map(displayCase).join(' and ')
    const reasonText = pair.map(displayCase).join(' or ')
    const template = pickVariant(PROJECT_TEMPLATES, kwText)

    suggestions.push({
      id: nextId(),
      section: 'projects',
      type: 'add',
      current: null,
      suggested: template(kwText),
      reason: 'Consider adding a project that demonstrates ' + reasonText + ' experience.',
    })
  }

  // --- Education: skip (factual, not improved by heuristics) ---

  // Cap total at 20
  return suggestions.slice(0, 20)
}

module.exports = { analyzeResume, generateSuggestions }
