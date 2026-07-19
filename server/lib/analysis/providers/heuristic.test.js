/**
 * Tests for server/lib/analysis/providers/heuristic.js (generateSuggestions):
 * acronym-casing (displayCase) and reduced-genericness (paired keywords +
 * template variance) fixes.
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by pdf.test.js). Run directly with
 * `node server/lib/analysis/providers/heuristic.test.js`.
 */

const assert = require('assert')
const { generateSuggestions } = require('./heuristic')

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

test("summary 'add' suggestion displays 'SQL' correctly-cased, never 'Sql'", () => {
  const resume = { summary: '', skills: ['SQL'], experience: [], projects: [] }
  const report = {
    keywords: {
      matched: ['sql'],
      missing: ['docker', 'kubernetes'],
      bonus: [],
    },
  }

  const suggestions = generateSuggestions(resume, report)
  const summaryAdd = suggestions.find(s => s.section === 'summary' && s.type === 'add')

  assert.ok(summaryAdd, 'expected a summary add suggestion')
  assert.ok(summaryAdd.suggested.includes('SQL'), `expected "SQL" in: ${summaryAdd.suggested}`)
  assert.ok(!summaryAdd.suggested.includes('Sql'), `did not expect "Sql" in: ${summaryAdd.suggested}`)
})

test('experience add suggestion incorporates two distinct missing keywords in one bullet', () => {
  const resume = { summary: 'Existing summary.', skills: [], experience: [], projects: [] }
  const report = {
    keywords: {
      matched: [],
      missing: ['docker', 'kubernetes'],
      bonus: [],
    },
  }

  const suggestions = generateSuggestions(resume, report)
  const experienceAdds = suggestions.filter(s => s.section === 'experience' && s.type === 'add')

  assert.ok(experienceAdds.length > 0, 'expected at least one experience add suggestion')
  const multiKeywordBullet = experienceAdds.find(s => s.suggested.includes('Docker') && s.suggested.includes('Kubernetes'))
  assert.ok(multiKeywordBullet, `expected a bullet mentioning both Docker and Kubernetes, got: ${JSON.stringify(experienceAdds)}`)
})

test('experience add bullets use different sentence templates for different missing-keyword sets', () => {
  const resumeA = { summary: 'Existing summary.', skills: [], experience: [], projects: [] }
  const reportA = { keywords: { matched: [], missing: ['docker', 'kubernetes'], bonus: [] } }

  const resumeB = { summary: 'Existing summary.', skills: [], experience: [], projects: [] }
  const reportB = { keywords: { matched: [], missing: ['python', 'java'], bonus: [] } }

  const suggestionsA = generateSuggestions(resumeA, reportA)
  const suggestionsB = generateSuggestions(resumeB, reportB)

  const bulletA = suggestionsA.find(s => s.section === 'experience' && s.type === 'add')
  const bulletB = suggestionsB.find(s => s.section === 'experience' && s.type === 'add')

  assert.ok(bulletA && bulletB, 'expected experience add suggestions from both reports')

  // Strip the keyword text so we compare only the surrounding template phrasing.
  const templateA = bulletA.suggested.replace(/Docker and Kubernetes|Kubernetes and Docker/i, '{kw}')
  const templateB = bulletB.suggested.replace(/Python and Java|Java and Python/i, '{kw}')

  assert.notStrictEqual(templateA, templateB, `expected different templates, got:\nA: ${templateA}\nB: ${templateB}`)
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
