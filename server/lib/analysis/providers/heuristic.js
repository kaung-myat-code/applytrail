/**
 * Heuristic Analysis Provider
 *
 * Keyword-matching engine that scores resume-job posting compatibility.
 * Returns a MatchReport with score, keyword groups, and section findings.
 */

const { extractKeywords, extractResumeKeywords } = require('../keywords')

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
    .map(e => [e.degree, e.institution, ...(e.bullets || [])].filter(Boolean).join(' '))
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

module.exports = { analyzeResume }
