/**
 * AI Analysis Provider
 *
 * Uses Vercel AI SDK with Google Gemini to generate structured resume analysis.
 * Returns Zod-validated MatchReport and suggestions matching the heuristic interface.
 */

const { generateObject, LoadAPIKeyError, APICallError, NoObjectGeneratedError } = require('ai')
const { google } = require('@ai-sdk/google')
const { z } = require('zod')

// --- Zod Schemas ---

const matchReportSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    bonus: z.array(z.string()),
  }),
  sections: z.object({
    summary: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    skills: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    experience: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    projects: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
    education: z.object({
      matchRate: z.number().min(0).max(1),
      matchedItems: z.array(z.string()),
      missingItems: z.array(z.string()),
      summary: z.string(),
    }),
  }),
})

const suggestionSchema = z.object({
  id: z.string(),
  section: z.enum(['summary', 'skills', 'experience', 'projects', 'education']),
  type: z.enum(['add', 'modify', 'remove']),
  current: z.string().nullable(),
  suggested: z.string(),
  reason: z.string(),
})

// --- Model helper ---

function getModel() {
  const modelName = process.env.ANALYSIS_MODEL || 'gemini-2.5-flash'
  return google(modelName)
}

// --- Error sanitization ---

function sanitizeError(err) {
  let message = err.message || 'Unknown AI error'
  // Strip any potential API key fragments (long alphanumeric strings)
  message = message.replace(/[A-Za-z0-9_-]{20,}/g, '[redacted]')
  return message
}

// --- Provider functions ---

/**
 * Analyze resume against a job posting using AI.
 * @param {object} resume - Resume data object
 * @param {object} jobPosting - Job posting with posting_text field
 * @returns {Promise<object>} MatchReport (same shape as heuristic provider)
 */
async function analyzeResume(resume, jobPosting) {
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

  try {
    const prompt = [
      'You are a resume reviewer. Compare this resume against the job posting and return a MatchReport.',
      'Be strict — only count a keyword as matched if the resume genuinely demonstrates competence.',
      'Provide detailed section summaries citing specific resume content.',
      '',
      '## Resume',
      JSON.stringify(resume, null, 2),
      '',
      '## Job Posting',
      postingText,
    ].join('\n')

    const { object } = await generateObject({
      model: getModel(),
      schema: matchReportSchema,
      prompt,
    })

    return object
  } catch (err) {
    if (err instanceof LoadAPIKeyError) {
      throw new Error('AI analysis requires GOOGLE_GENERATIVE_AI_API_KEY. Set it in your .env file or use the heuristic provider.')
    }
    if (err instanceof APICallError) {
      throw new Error('AI analysis failed: ' + sanitizeError(err))
    }
    if (err instanceof NoObjectGeneratedError) {
      throw new Error('AI returned invalid analysis format. Falling back to heuristic.')
    }
    throw err
  }
}

/**
 * Generate per-section improvement suggestions using AI.
 * @param {object} resume - Resume data object
 * @param {object} report - MatchReport from analyzeResume
 * @returns {Promise<object[]>} Array of suggestion objects (same shape as heuristic)
 */
async function generateSuggestions(resume, report) {
  try {
    const prompt = [
      'Based on this MatchReport, generate actionable suggestions to improve the resume.',
      'Each suggestion must be a structured patch (add, modify, or remove) with clear reasoning referencing actual resume content.',
      '',
      '## Resume',
      JSON.stringify(resume, null, 2),
      '',
      '## MatchReport',
      JSON.stringify(report, null, 2),
    ].join('\n')

    const { object } = await generateObject({
      model: getModel(),
      schema: z.array(suggestionSchema),
      prompt,
    })

    return object
  } catch (err) {
    if (err instanceof LoadAPIKeyError) {
      throw new Error('AI analysis requires GOOGLE_GENERATIVE_AI_API_KEY. Set it in your .env file or use the heuristic provider.')
    }
    if (err instanceof APICallError) {
      throw new Error('AI suggestion generation failed: ' + sanitizeError(err))
    }
    if (err instanceof NoObjectGeneratedError) {
      throw new Error('AI returned invalid suggestion format. Falling back to heuristic.')
    }
    throw err
  }
}

module.exports = { analyzeResume, generateSuggestions }
