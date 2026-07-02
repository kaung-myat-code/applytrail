/**
 * Analysis Engine - Provider Registry
 *
 * Provider-agnostic interface for resume analysis. New providers can be added
 * by placing a module in providers/ and registering it here.
 */

const providers = {
  heuristic: require('./providers/heuristic'),
}

/**
 * Get a named analysis provider.
 * @param {string} name - Provider name (default: 'heuristic')
 * @returns {object} Provider module with analyzeResume function
 * @throws {Error} If provider name is unknown
 */
function getProvider(name = 'heuristic') {
  // Lazy-load AI provider to avoid crashing server if AI SDK has issues
  if (name === 'ai' && !providers.ai) {
    try {
      providers.ai = require('./providers/ai')
    } catch (err) {
      throw new Error('AI provider unavailable: ' + err.message + '. Use the heuristic provider instead.')
    }
  }
  const provider = providers[name]
  if (!provider) {
    throw new Error(`Unknown analysis provider: ${name}. Available: ${Object.keys(providers).join(', ')}`)
  }
  return provider
}

module.exports = { getProvider }
