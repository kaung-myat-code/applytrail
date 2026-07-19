/**
 * Tests for server/lib/defaultResumeData.js (defaultResumeData).
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by server/lib/pdf.test.js). Run directly with
 * `node server/lib/defaultResumeData.test.js`.
 */

const assert = require('assert')
const { defaultResumeData } = require('./defaultResumeData')
const { validateResume } = require('./validateResume')

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

test('is a function', () => {
  assert.strictEqual(typeof defaultResumeData, 'function')
})

test('returns contact with email/github/location empty strings, not an empty object', () => {
  assert.deepStrictEqual(defaultResumeData().contact, { email: '', github: '', location: '' })
})

test('defaultResumeData() passes validateResume -- this is the D-08 regression guard', () => {
  assert.strictEqual(validateResume(defaultResumeData()).ok, true)

  // Regression-proof companion: reconstruct the original buggy fallback
  // (contact: {} carrying none of the three required contact keys) and
  // assert it is REJECTED by validateResume. This proves the fix actually
  // fixes something -- the D-08 bug was that this exact shape was used as
  // the fallback in POST /api/resume-library and failed validation.
  const buggyResume = {
    name: '',
    contact: {},
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: []
  }
  assert.strictEqual(validateResume(buggyResume).ok, false)
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
