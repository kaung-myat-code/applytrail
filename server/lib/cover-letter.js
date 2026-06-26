/**
 * Cover Letter Generation Engine
 *
 * Keyword-matching heuristics that connect resume experience to job postings.
 * Designed to be replaceable — swap this module for an LLM API call later.
 */

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'if', 'this',
  'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our', 'they',
  'their', 'he', 'she', 'him', 'her', 'his', 'my', 'me', 'i', 'what', 'which',
  'who', 'whom', 'while', 'about', 'up', 'down', 'also', 'any', 'much', 'well',
  'get', 'got', 'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went',
  'give', 'gave', 'say', 'said', 'know', 'knew', 'think', 'thought', 'see',
  'saw', 'want', 'look', 'use', 'find', 'found', 'work', 'working', 'etc',
  'eg', 'ie', 'vs', 'per', 'via', 'new', 'one', 'two', 'first', 'second',
  'within', 'across', 'along', 'among', 'upon', 'like', 'including', 'based',
  'well', 'able', 'must', 'required', 'experience', 'working', 'knowledge',
  'understanding', 'familiarity', 'proficiency', 'strong', 'good', 'excellent',
  'great', 'solid', 'deep', 'proven', 'demonstrated', 'ability', 'skills',
  'responsible', 'responsibilities', 'role', 'position', 'team', 'company',
  'join', 'looking', 'seek', 'candidate', 'ideal', 'person', 'someone',
  'ensure', 'including', 'related', 'relevant', 'minimum', 'preferred',
  'plus', 'bonus', 'nice', 'have', 'years', 'year', 'plus', 'plus',
])

/**
 * Extract meaningful keywords from job posting text.
 * Returns deduplicated array of lowercase keyword strings.
 */
function extractKeywords(postingText) {
  if (!postingText || typeof postingText !== 'string') return []

  const tokens = postingText
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/)
    .filter(t => t.length >= 2 && t.length <= 30 && !STOP_WORDS.has(t))

  return [...new Set(tokens)]
}

/**
 * Match resume content to job posting keywords.
 * Returns { matchedSkills, matchedExperience, matchedProjects }.
 */
function matchResumeToJob(resume, postingText) {
  const keywords = extractKeywords(postingText)
  if (keywords.length === 0) {
    return { matchedSkills: [], matchedExperience: [], matchedProjects: [] }
  }

  // Match skills (case-insensitive substring)
  const matchedSkills = (resume.skills || []).filter(skill => {
    const lower = skill.toLowerCase()
    return keywords.some(kw => lower.includes(kw) || kw.includes(lower))
  })

  // Match experience bullets
  const matchedExperience = []
  const seenExpBullets = new Set()
  for (const exp of resume.experience || []) {
    for (const bullet of exp.bullets || []) {
      const lower = bullet.toLowerCase()
      const matches = keywords.some(kw => lower.includes(kw))
      if (matches && !seenExpBullets.has(lower)) {
        seenExpBullets.add(lower)
        matchedExperience.push(bullet)
      }
    }
  }

  // Match project bullets
  const matchedProjects = []
  const seenProjBullets = new Set()
  for (const proj of resume.projects || []) {
    for (const bullet of proj.bullets || []) {
      const lower = bullet.toLowerCase()
      const matches = keywords.some(kw => lower.includes(kw))
      if (matches && !seenProjBullets.has(lower)) {
        seenProjBullets.add(lower)
        matchedProjects.push(bullet)
      }
    }
  }

  return { matchedSkills, matchedExperience, matchedProjects }
}

/**
 * Find a bullet with measurable achievements (numbers, percentages).
 */
function findMeasurableAchievement(bullets) {
  for (const bullet of bullets) {
    if (/\d+%|\d+\s*(?:percent|k\b|k\+|x\b)|\b\d{2,}\b/.test(bullet)) {
      return bullet
    }
  }
  return null
}

/**
 * Rewrite a resume bullet into a clean statement.
 * Strips leading dash/bullet markers and normalizes whitespace.
 * Preserves original casing (React, TypeScript, API, etc.).
 */
function cleanBullet(bullet) {
  return bullet
    .replace(/^[-•*]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Pick the best bullets for the cover letter — prefer ones with measurable results.
 */
function pickBestBullets(bullets, count) {
  if (bullets.length <= count) return bullets

  // Score bullets: prefer those with numbers/percentages
  const scored = bullets.map(b => ({
    text: b,
    score: (/\d+%/.test(b) ? 3 : 0) + (/\b\d{2,}\b/.test(b) ? 2 : 0) + (b.length > 80 ? 1 : 0),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, count).map(s => s.text)
}

/**
 * Build the intro sentence mentioning role, company, and top skills.
 */
function buildIntro(role, company, matchedSkills) {
  const skillMention = matchedSkills.length > 0
    ? ` with hands-on experience in ${matchedSkills.slice(0, 3).join(', ')}`
    : ''

  return `My background in software development${skillMention} aligns well with your need for a ${role} at ${company}.`
}

/**
 * Build experience sentences from matched bullets.
 * Wraps each bullet in a natural sentence frame.
 * Returns { sentences: string[], usedBullets: string[] }.
 */
function buildExperienceSentences(matchedExperience, matchedProjects) {
  const allBullets = [...matchedExperience, ...matchedProjects]
  if (allBullets.length === 0) return { sentences: [], usedBullets: [] }

  const best = pickBestBullets(allBullets, 2)
  const frames = [
    'For instance, ',
    'Additionally, ',
  ]

  const sentences = best.map((bullet, i) => {
    const cleaned = cleanBullet(bullet)
    const body = cleaned.charAt(0).toLowerCase() + cleaned.slice(1)
    const frame = frames[i] || 'I also '
    return `${frame}${body.endsWith('.') ? body : body + '.'}`
  })

  return { sentences, usedBullets: best.map(b => b.toLowerCase()) }
}

/**
 * Build a sentence highlighting a measurable achievement.
 * Picks a different bullet than the experience sentences used.
 */
function buildAchievementSentence(usedBullets, allMatchedBullets) {
  // Find a bullet with a number that wasn't already used (case-insensitive)
  const usedSet = new Set(usedBullets.map(b => b.toLowerCase()))
  const unused = allMatchedBullets.filter(b => !usedSet.has(b.toLowerCase()))
  const achievement = findMeasurableAchievement(unused.length > 0 ? unused : allMatchedBullets)

  if (!achievement) return null

  const cleaned = cleanBullet(achievement)
  const body = cleaned.charAt(0).toLowerCase() + cleaned.slice(1)
  return `These kinds of results — ${body.endsWith('.') ? body : body + '.'} — reflect the impact I aim to deliver.`
}

/**
 * Build the closing sentence about contributing to the company.
 */
function buildClosing(company, role) {
  return `I would welcome the chance to bring this experience to the ${role} position and contribute to ${company}'s goals.`
}

/**
 * Generate a cover letter paragraph from resume and job posting.
 * Returns a single string of 4-6 sentences.
 */
function generateCoverLetter(resume, jobPosting) {
  const { company, role, posting_text } = jobPosting
  const matches = matchResumeToJob(resume, posting_text || '')

  // If no matches at all, return a generic paragraph
  if (matches.matchedSkills.length === 0 && matches.matchedExperience.length === 0) {
    return `I am writing to express my interest in the ${role} position at ${company}. ` +
      `${resume.summary || 'I bring a strong background in software development with experience across the full stack.'} ` +
      `I am confident that my skills and experience would be a valuable addition to your team. ` +
      `I would welcome the opportunity to discuss how I can contribute to ${company}'s goals.`
  }

  const parts = []

  // Sentence 1: Intro
  parts.push(buildIntro(role, company, matches.matchedSkills))

  // Sentences 2-3: Experience matches
  const { sentences: expSentences, usedBullets } = buildExperienceSentences(matches.matchedExperience, matches.matchedProjects)
  parts.push(...expSentences)

  // Sentence 4: Measurable achievement (pick a different bullet than experience used)
  const allBullets = [...matches.matchedExperience, ...matches.matchedProjects]
  const achievementSentence = buildAchievementSentence(usedBullets, allBullets)
  if (achievementSentence) {
    parts.push(achievementSentence)
  }

  // Sentence 5-6: Closing
  parts.push(buildClosing(company, role))

  return parts.join(' ')
}

module.exports = { extractKeywords, matchResumeToJob, generateCoverLetter }
