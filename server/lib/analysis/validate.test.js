/**
 * Regression test for findInResume/validateSuggestions rejecting valid
 * Gemini responses: an AI provider's 'modify' suggestion whose `current`
 * field has only benign formatting drift (trailing ellipsis truncation,
 * collapsed whitespace, smart quotes) versus the real resume text was
 * treated as a hard error, invalidating the whole suggestions array and
 * forcing a fallback to the heuristic provider even though the AI response
 * was substantively correct.
 *
 * Fix: findInResume now normalizes (trim, collapse whitespace, lowercase,
 * smart-quote normalization, strip trailing ellipsis) before comparing, so
 * benign formatting variance no longer causes a false rejection -- while
 * genuinely fabricated/paraphrased text (not present anywhere in the
 * resume) still correctly fails validation.
 *
 * Plain Node assertions -- no test runner is installed in this repo
 * (matches the existing convention used by heuristic.test.js). Run
 * directly with `node server/lib/analysis/validate.test.js`.
 */

const assert = require('assert')
const { validateSuggestions } = require('./validate')

function test(name, fn) {
  try {
    fn()
    console.log(`PASS: ${name}`)
  } catch (err) {
    console.error(`FAIL: ${name}`)
    console.error(err)
    process.exitCode = 1
  }
}

const resume = {
  summary: 'Fullstack developer with 3 years of experience building web applications with React, Node.js, and PostgreSQL.',
  skills: ['REST API', 'Docker'],
  experience: [
    {
      bullets: [
        'Built a customer dashboard with React and TypeScript that reduced support tickets by 35%',
      ],
    },
  ],
  projects: [
    {
      bullets: [
        'Built with React, Express, and PostgreSQL; deployed on Render with CI/CD from GitHub',
      ],
    },
  ],
}

function modifySuggestion(overrides) {
  return {
    id: 'sX',
    section: 'experience',
    type: 'modify',
    current: null,
    suggested: 'placeholder suggested text',
    reason: 'placeholder reason',
    ...overrides,
  }
}

test('modify suggestion with exact current text is valid', () => {
  const s = modifySuggestion({
    current: 'Built a customer dashboard with React and TypeScript that reduced support tickets by 35%',
  })
  const result = validateSuggestions([s], resume)
  assert.strictEqual(result.valid, true, `expected valid, got errors: ${JSON.stringify(result.errors)}`)
})

test('modify suggestion truncated with a trailing ellipsis is valid (benign LLM truncation)', () => {
  const s = modifySuggestion({
    current: 'Built a customer dashboard with React and TypeScript...',
  })
  const result = validateSuggestions([s], resume)
  assert.strictEqual(result.valid, true, `expected valid, got errors: ${JSON.stringify(result.errors)}`)
})

test('modify suggestion with collapsed/extra whitespace is valid (benign LLM formatting)', () => {
  const s = modifySuggestion({
    section: 'projects',
    current: 'Built with React, Express, and PostgreSQL;  deployed on   Render with CI/CD from GitHub',
  })
  const result = validateSuggestions([s], resume)
  assert.strictEqual(result.valid, true, `expected valid, got errors: ${JSON.stringify(result.errors)}`)
})

test('modify suggestion with smart quotes normalized against straight-quote resume text is valid', () => {
  const quotedResume = {
    ...resume,
    experience: [{ bullets: ["Shipped the team's first GraphQL API"] }],
  }
  const s = modifySuggestion({
    current: 'Shipped the team’s first GraphQL API',
  })
  const result = validateSuggestions([s], quotedResume)
  assert.strictEqual(result.valid, true, `expected valid, got errors: ${JSON.stringify(result.errors)}`)
})

test('modify suggestion with genuinely paraphrased/fabricated current text is still invalid', () => {
  const s = modifySuggestion({
    current: 'Designed and built a completely different feature not present in this resume',
  })
  const result = validateSuggestions([s], resume)
  assert.strictEqual(result.valid, false, 'expected paraphrased/fabricated current text to be rejected')
  assert.ok(
    result.errors.some(e => e.includes('current value not found in resume')),
    `expected a "current value not found" error, got: ${JSON.stringify(result.errors)}`
  )
})

test('one benignly-formatted suggestion among several does not invalidate the whole batch', () => {
  const batch = [
    modifySuggestion({
      id: 's1',
      current: 'Built a customer dashboard with React and TypeScript...',
    }),
    modifySuggestion({
      id: 's2',
      section: 'projects',
      current: 'Built with React, Express, and PostgreSQL;  deployed on   Render with CI/CD from GitHub',
    }),
  ]
  const result = validateSuggestions(batch, resume)
  assert.strictEqual(result.valid, true, `expected valid, got errors: ${JSON.stringify(result.errors)}`)
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
