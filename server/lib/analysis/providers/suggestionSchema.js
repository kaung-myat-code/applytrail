/**
 * Suggestion Schema
 *
 * Zod schema for AI-generated resume suggestions, shared between ai.js (which
 * uses it to validate generateObject output) and applyPatches.test.js (which
 * needs it to derive the schema-permitted section x type combinations).
 * Split into its own module so applyPatches.test.js doesn't have to load
 * ai.js -- and with it the ESM-only 'ai' package -- just to read this schema.
 */

const { z } = require('zod')

// 'education' is deliberately excluded: applyPatches.js (server/lib/tailor/)
// has no education-patch handling, and education content is factual rather
// than something a writing suggestion should alter. Kept in sync with the
// prompt instruction in ai.js, which tells the model not to suggest it.
const suggestionSchema = z.object({
  id: z.string(),
  section: z.enum(['summary', 'skills', 'experience', 'projects']),
  type: z.enum(['add', 'modify', 'remove']),
  current: z.string().nullable(),
  suggested: z.string(),
  reason: z.string(),
})

module.exports = { suggestionSchema }
