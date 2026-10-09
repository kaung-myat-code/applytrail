/**
 * Regression tests for server/lib/analysis/providers/normalizeReport.js
 * (Phase 17, OUT-06).
 *
 * History: ai.js previously inlined both the section matchRate (>1 -> /100,
 * then clamp to [0,1]) and the top-level score normalization. The score block
 * contained an extra branch that rescaled any value in [0,1] by *100 -- so a
 * genuine low score of 1 was silently inflated to 100. Because
 * matchReportSchema already declares score as z.number().min(0).max(100),
 * generateObject guarantees a 0-100 value; any [0,1] value is a legitimate
 * low score, not a 0-1 fraction needing rescaling. The fix deletes only the
 * score *100 branch and keeps the clamp. The adjacent matchRate loop is
 * separate and correct (matchRate genuinely is 0-1) and must keep its
 * >1 -> /100 handling -- a naive "fix the score bug" edit that also removes
 * the matchRate normalization is the Pitfall 1 this module exists to guard.
 *
 * Split into its own module (mirroring suggestionSchema.js's rationale) so
 * these tests can exercise the normalization logic without loading ai.js --
 * and with it the ESM-only 'ai' package -- which keeps the regression cheap
 * to run in the server test chain with no API key required.
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by applyPatches.test.js, pdf.test.js, etc).
 * Run directly with `node server/lib/analysis/providers/normalizeReport.test.js`.
 */

const assert = require('assert')
const { normalizeReportScores } = require('./normalizeReport')

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

function baseReport() {
  return {
    score: 0,
    summary: 'Test summary',
    strengths: ['s1'],
    gaps: ['g1'],
    keywords: { matched: ['a'], missing: ['b'], bonus: ['c'] },
    sections: {
      summary: { matchRate: 0.5, matchedItems: [], missingItems: [], summary: 'x' },
      skills: { matchRate: 0.5, matchedItems: [], missingItems: [], summary: 'x' },
      experience: { matchRate: 0.5, matchedItems: [], missingItems: [], summary: 'x' },
      projects: { matchRate: 0.5, matchedItems: [], missingItems: [], summary: 'x' },
      education: { matchRate: 0.5, matchedItems: [], missingItems: [], summary: 'x' },
    },
  }
}

test('score 1 stays 1 (OUT-06 regression: genuine low score is not inflated to 100)', () => {
  const report = baseReport()
  report.score = 1
  const result = normalizeReportScores(report)
  assert.strictEqual(result.score, 1)
})

test('matchRate > 1 is divided by 100; matchRate <= 1 is left as-is then clamped (Pitfall 1 guard)', () => {
  const report = baseReport()
  report.sections.summary.matchRate = 85   // percentage form -> 0.85
  report.sections.skills.matchRate = 0.5   // already decimal -> 0.5
  const result = normalizeReportScores(report)
  assert.strictEqual(result.sections.summary.matchRate, 0.85)
  assert.strictEqual(result.sections.skills.matchRate, 0.5)
})

test('score is rounded half-up then clamped to [0, 100]', () => {
  const report = baseReport()
  report.score = 100.6
  normalizeReportScores(report)
  assert.strictEqual(report.score, 100)

  report.score = -5
  normalizeReportScores(report)
  assert.strictEqual(report.score, 0)

  report.score = 42.4
  normalizeReportScores(report)
  assert.strictEqual(report.score, 42)
})

test('normalizes score and every section matchRate, leaving other fields untouched', () => {
  const report = baseReport()
  report.score = 55
  report.sections.education.matchRate = 150  // >1 -> 1.5 -> clamp to 1
  const result = normalizeReportScores(report)
  assert.strictEqual(result.score, 55)
  assert.strictEqual(result.sections.summary.matchRate, 0.5)
  assert.strictEqual(result.sections.skills.matchRate, 0.5)
  assert.strictEqual(result.sections.experience.matchRate, 0.5)
  assert.strictEqual(result.sections.projects.matchRate, 0.5)
  assert.strictEqual(result.sections.education.matchRate, 1)
  assert.strictEqual(result.summary, 'Test summary')
  assert.deepStrictEqual(result.strengths, ['s1'])
  assert.deepStrictEqual(result.gaps, ['g1'])
  assert.deepStrictEqual(result.keywords, { matched: ['a'], missing: ['b'], bonus: ['c'] })
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
