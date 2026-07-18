/**
 * Tests for server/lib/analysis/keywords.js.
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by server/lib/pdf.test.js). Run directly with
 * `node server/lib/analysis/keywords.test.js`.
 */

const assert = require('assert')
const { TECH_KEYWORDS, extractKeywords, extractResumeKeywords, ACRONYM_CASING } = require('./keywords')

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

test('extractKeywords broadens whitelist to cover the CONTEXT.md Product Analyst posting example', () => {
  const posting = 'SQL, dashboarding, stakeholder communication, experimentation, product metrics, React, and Python'
  const found = extractKeywords(posting)

  const expected = ['sql', 'dashboarding', 'stakeholder communication', 'experimentation', 'product metrics', 'react', 'python']
  for (const kw of expected) {
    assert.ok(found.includes(kw), `expected extractKeywords to include "${kw}", got ${JSON.stringify(found)}`)
  }
})

test('extractKeywords single-word matching is unchanged for existing technical terms', () => {
  const found = extractKeywords('We use React and TypeScript daily')
  assert.deepStrictEqual(found, ['react', 'typescript'])
})

test('ACRONYM_CASING maps known acronyms to their conventional display casing', () => {
  assert.strictEqual(ACRONYM_CASING.sql, 'SQL')
  assert.strictEqual(ACRONYM_CASING.api, 'API')
})

test('module exports all four expected names', () => {
  assert.strictEqual(typeof TECH_KEYWORDS, 'object')
  assert.strictEqual(typeof extractKeywords, 'function')
  assert.strictEqual(typeof extractResumeKeywords, 'function')
  assert.strictEqual(typeof ACRONYM_CASING, 'object')
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
