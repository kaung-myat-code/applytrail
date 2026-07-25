/**
 * Error message sanitization — strips API keys from error messages.
 *
 * Deliberately dependency-free (no `ai` / `@ai-sdk/*` / `zod`) so it can be
 * required at server boot time without pulling in the ESM-only AI SDK
 * (see providers/ai.js, which requires `ai` and cannot be require()'d on
 * Node versions without stable require(esm) support, e.g. 18.x/20.x).
 * Used both internally by providers/ai.js and externally by index.js.
 */

function sanitizeError(err) {
  let message = err.message || 'Unknown AI error'
  // Only strip patterns that look like API keys
  message = message.replace(/AIza[A-Za-z0-9_-]{30,}/g, '[redacted]')  // Google API key prefix
  message = message.replace(/sk-[A-Za-z0-9]{20,}/g, '[redacted]')     // OpenAI-style keys
  message = message.replace(/gsk_[A-Za-z0-9]{20,}/g, '[redacted]')    // Groq API key prefix
  return message
}

module.exports = { sanitizeError }
