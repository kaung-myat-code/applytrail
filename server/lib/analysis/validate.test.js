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
 *
 * Phase 17 / OUT-05 additions: validate.js now also exports the sanctioned
 * matcher (findInResume/normalizeText) for reuse by applyPatches.js and the
 * eval script, and validateSuggestions warns (not errors) when a suggestion's
 * optional target_entry names no experience/projects entry (predicting the
 * last-entry fallback in applyPatches). Cases for both live at the bottom of
 * this file.
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

// --- OUT-05: target_entry warning ---

test('validate.js exports the sanctioned matcher (findInResume, normalizeText) for reuse', () => {
  const validate = require('./validate')
  assert.strictEqual(typeof validate.validateMatchReport, 'function', 'expected validateMatchReport export')
  assert.strictEqual(typeof validate.validateSuggestions, 'function', 'expected validateSuggestions export')
  assert.strictEqual(typeof validate.findInResume, 'function', 'expected findInResume export (OUT-05)')
  assert.strictEqual(typeof validate.normalizeText, 'function', 'expected normalizeText export (OUT-05)')
})

// The base fixture's experience/projects entries have no company/name field,
// so a dedicated fixture with real entry names is used for the target_entry
// cases below.
const targetEntryResume = {
  summary: 'Experienced engineer.',
  skills: ['javascript'],
  experience: [
    { company: 'Acme Corp', role: 'Engineer', bullets: ['Built internal tools.'] },
    { company: 'Beta LLC', role: 'Developer', bullets: ['Maintained services.'] },
  ],
  projects: [
    { name: 'Side Project', description: 'A thing.', bullets: ['Shipped a feature.'] },
  ],
}

function addTargetSuggestion(overrides) {
  return {
    id: 'tX',
    section: 'experience',
    type: 'add',
    current: null,
    target_entry: null,
    suggested: 'placeholder suggested bullet',
    reason: 'placeholder reason',
    ...overrides,
  }
}

test('target_entry matching an existing experience company produces no fallback warning', () => {
  const s = addTargetSuggestion({ target_entry: 'Acme Corp' })
  const result = validateSuggestions([s], targetEntryResume)
  assert.strictEqual(result.valid, true, `expected valid, got errors: ${JSON.stringify(result.errors)}`)
  assert.ok(
    !result.warnings.some(w => w.includes('matches no experience entry')),
    `expected no fallback warning, got: ${JSON.stringify(result.warnings)}`
  )
})

test('target_entry matching no experience company warns (not errors) about the last-entry fallback', () => {
  const s = addTargetSuggestion({ target_entry: 'Nonexistent Corp' })
  const result = validateSuggestions([s], targetEntryResume)
  assert.ok(
    result.warnings.some(w => w.includes('target_entry "Nonexistent Corp" matches no experience entry')),
    `expected a fallback warning, got: ${JSON.stringify(result.warnings)}`
  )
  assert.ok(
    !result.errors.some(e => e.includes('target_entry')),
    `target_entry mismatch must be a warning, not an error; got errors: ${JSON.stringify(result.errors)}`
  )
})

test('target_entry match is case-insensitive (normalizeText, not raw equality)', () => {
  const s = addTargetSuggestion({ target_entry: 'acme corp' })
  const result = validateSuggestions([s], targetEntryResume)
  assert.ok(
    !result.warnings.some(w => w.includes('matches no experience entry')),
    `expected case-insensitive match to suppress the warning, got: ${JSON.stringify(result.warnings)}`
  )
})

test('projects target_entry matching an existing project name produces no fallback warning', () => {
  const s = addTargetSuggestion({ id: 'tP', section: 'projects', target_entry: 'Side Project' })
  const result = validateSuggestions([s], targetEntryResume)
  assert.ok(
    !result.warnings.some(w => w.includes('matches no projects entry')),
    `expected no fallback warning, got: ${JSON.stringify(result.warnings)}`
  )
})

test('absent, empty, or summary/skills target_entry produces no fallback warning', () => {
  const absent = addTargetSuggestion({ target_entry: undefined })
  const empty = addTargetSuggestion({ id: 'tE2', target_entry: '' })
  const nullish = addTargetSuggestion({ id: 'tE3', target_entry: null })
  // target_entry is only meaningful for entry lists — summary/skills sections
  // must not warn even when a target_entry is present.
  const summaryWithTarget = addTargetSuggestion({ id: 'tE4', section: 'summary', target_entry: 'No Such Entry' })
  const skillsWithTarget = addTargetSuggestion({ id: 'tE5', section: 'skills', target_entry: 'No Such Entry' })
  const result = validateSuggestions([absent, empty, nullish, summaryWithTarget, skillsWithTarget], targetEntryResume)
  assert.ok(
    !result.warnings.some(w => w.includes('matches no')),
    `expected no fallback warning for absent/empty target_entry or summary/skills sections, got: ${JSON.stringify(result.warnings)}`
  )
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
