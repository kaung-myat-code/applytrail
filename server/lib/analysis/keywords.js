/**
 * Shared keyword extraction utilities for analysis and cover letter generation.
 * Single source of truth for stop words and keyword parsing.
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
  'plus', 'bonus', 'nice', 'have', 'years', 'year',
])

/**
 * Extract meaningful keywords from text.
 * Returns deduplicated array of lowercase keyword strings.
 */
function extractKeywords(text) {
  if (!text || typeof text !== 'string') return []

  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9.+#]+/)
    .filter(t => t.length >= 2 && t.length <= 30 && !STOP_WORDS.has(t))

  return [...new Set(tokens)]
}

/**
 * Extract keywords from all resume sections.
 * Aggregates keywords from skills, summary, experience, projects, and education.
 * Returns a deduplicated array of lowercase keyword strings.
 */
function extractResumeKeywords(resume) {
  const keywords = new Set()

  // Skills: use directly (lowercased)
  for (const skill of (resume.skills || [])) {
    if (typeof skill === 'string') {
      keywords.add(skill.toLowerCase().trim())
    }
  }

  // Summary: extract keywords from summary text
  for (const kw of extractKeywords(resume.summary || '')) {
    keywords.add(kw)
  }

  // Experience bullets
  for (const exp of (resume.experience || [])) {
    for (const bullet of (exp.bullets || [])) {
      for (const kw of extractKeywords(bullet)) {
        keywords.add(kw)
      }
    }
  }

  // Project bullets
  for (const proj of (resume.projects || [])) {
    for (const bullet of (proj.bullets || [])) {
      for (const kw of extractKeywords(bullet)) {
        keywords.add(kw)
      }
    }
  }

  // Education: degree, institution, and bullets
  for (const edu of (resume.education || [])) {
    if (edu.degree) {
      for (const kw of extractKeywords(edu.degree)) {
        keywords.add(kw)
      }
    }
    if (edu.institution) {
      for (const kw of extractKeywords(edu.institution)) {
        keywords.add(kw)
      }
    }
    for (const bullet of (edu.bullets || [])) {
      for (const kw of extractKeywords(bullet)) {
        keywords.add(kw)
      }
    }
  }

  return [...keywords]
}

module.exports = { STOP_WORDS, extractKeywords, extractResumeKeywords }
