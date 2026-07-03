/**
 * AI Analysis Provider
 *
 * Uses Vercel AI SDK with multiple providers (Gemini, OpenRouter, Groq)
 * to generate structured resume analysis.
 * Returns Zod-validated MatchReport and suggestions matching the heuristic interface.
 */

const { generateObject, LoadAPIKeyError, APICallError, NoObjectGeneratedError } = require('ai')
const { google } = require('@ai-sdk/google')
const { createOpenAICompatible } = require('@ai-sdk/openai-compatible')
const { groq } = require('@ai-sdk/groq')
const { z } = require('zod')

// --- Zod Schemas ---

const sectionFindingsSchema = z.object({
  matchRate: z.number().min(0).max(1),
  matchedItems: z.array(z.string()),
  missingItems: z.array(z.string()),
  summary: z.string().min(1),
})

const matchReportSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string()),
    bonus: z.array(z.string()),
  }),
  sections: z.object({
    summary: sectionFindingsSchema,
    skills: sectionFindingsSchema,
    experience: sectionFindingsSchema,
    projects: sectionFindingsSchema,
    education: sectionFindingsSchema,
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

function getModel(provider = 'gemini') {
  const modelName = process.env.ANALYSIS_MODEL

  switch (provider) {
    case 'gemini':
      return google(modelName || 'gemini-2.5-flash')
    case 'openrouter': {
      const or = createOpenAICompatible({
        name: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      })
      return or(modelName || 'meta-llama/llama-3.3-70b-instruct:free')
    }
    case 'groq':
      return groq(modelName || 'llama-3.3-70b-versatile')
    default:
      throw new Error(`Unknown AI provider: ${provider}. Available: gemini, openrouter, groq`)
  }
}

// --- Error sanitization ---

function sanitizeError(err) {
  let message = err.message || 'Unknown AI error'
  // Only strip patterns that look like API keys
  message = message.replace(/AIza[A-Za-z0-9_-]{30,}/g, '[redacted]')  // Google API key prefix
  message = message.replace(/sk-[A-Za-z0-9]{20,}/g, '[redacted]')     // OpenAI-style keys
  message = message.replace(/gsk_[A-Za-z0-9]{20,}/g, '[redacted]')    // Groq API key prefix
  return message
}

// --- Shared error handler ---

function handleAIError(err, operation, provider) {
  if (err instanceof LoadAPIKeyError) {
    const keyVar = {
      gemini: 'GOOGLE_GENERATIVE_AI_API_KEY',
      openrouter: 'OPENROUTER_API_KEY',
      groq: 'GROQ_API_KEY',
    }[provider] || 'API_KEY'
    throw new Error(`AI analysis requires ${keyVar}. Set it in your .env file or use the heuristic provider.`)
  }
  if (err instanceof APICallError) {
    throw new Error(`AI ${operation} failed: ` + sanitizeError(err))
  }
  if (err instanceof NoObjectGeneratedError) {
    throw new Error(`AI returned invalid ${operation} format. Falling back to heuristic.`)
  }
  throw err
}

// --- Provider functions ---

/**
 * Analyze resume against a job posting using AI.
 * @param {object} resume - Resume data object
 * @param {object} jobPosting - Job posting with posting_text field
 * @returns {Promise<object>} MatchReport (same shape as heuristic provider)
 */
async function analyzeResume(resume, jobPosting, provider = 'gemini') {
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
      'IMPORTANT FORMAT: matchRate must be a decimal between 0 and 1 (e.g. 0.85, not 85).',
      'score must be a number between 0 and 100.',
      '',
      '## Resume',
      JSON.stringify(resume, null, 2),
      '',
      '## Job Posting',
      postingText,
    ].join('\n')

    const { object } = await generateObject({
      model: getModel(provider),
      schema: matchReportSchema,
      prompt,
    })

    // Normalize matchRate: if model returned percentage (e.g. 85), convert to decimal (0.85)
    // Then clamp to valid 0-1 range regardless
    for (const key of ['summary', 'skills', 'experience', 'projects', 'education']) {
      const section = object.sections?.[key]
      if (section && section.matchRate != null) {
        if (section.matchRate > 1) {
          section.matchRate = section.matchRate / 100
        }
        section.matchRate = Math.max(0, Math.min(1, section.matchRate))
      }
    }

    // Normalize score: if model returned 0-1 scale, convert to 0-100
    if (object.score != null) {
      if (object.score <= 1 && object.score >= 0) {
        object.score = Math.round(object.score * 100)
      }
      object.score = Math.max(0, Math.min(100, Math.round(object.score)))
    }

    return object
  } catch (err) {
    handleAIError(err, 'analysis', provider)
  }
}

/**
 * Generate per-section improvement suggestions using AI.
 * @param {object} resume - Resume data object
 * @param {object} report - MatchReport from analyzeResume
 * @returns {Promise<object[]>} Array of suggestion objects (same shape as heuristic)
 */
async function generateSuggestions(resume, report, provider = 'gemini') {
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
      model: getModel(provider),
      schema: z.array(suggestionSchema),
      prompt,
    })

    return object
  } catch (err) {
    handleAIError(err, 'suggestion generation', provider)
  }
}

module.exports = { analyzeResume, generateSuggestions, sanitizeError }
