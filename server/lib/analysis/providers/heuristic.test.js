/**
 * Tests for server/lib/analysis/providers/heuristic.js (analyzeResume +
 * generateSuggestions): honest per-keyword gap notes (OUT-02) and
 * fabrication removal (OUT-01), plus acronym-casing (displayCase).
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by pdf.test.js). Run directly with
 * `node server/lib/analysis/providers/heuristic.test.js`.
 */

const assert = require('assert')
const { analyzeResume, generateSuggestions } = require('./heuristic')

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

// --- OUT-02: honest per-keyword gap notes from analyzeResume ---

const GAP_TAIL = ': not on your resume; add a bullet only if you have real experience.'

test('analyzeResume emits one honest gap note per missing keyword', () => {
  const resume = {
    summary: 'Experienced developer.',
    skills: ['JavaScript', 'React'],
    experience: [{ title: 'Dev', organization: 'Acme', bullets: ['Built web apps with JavaScript and React.'] }],
    projects: [],
    education: [],
  }
  const posting = { posting_text: 'We need SQL, Docker, and Kubernetes experience.' }

  const report = analyzeResume(resume, posting)
  assert.ok(report.keywords.missing.length > 0, 'expected some missing keywords')

  for (const kw of report.keywords.missing) {
    const expected = (kw === 'sql' ? 'SQL' : kw.charAt(0).toUpperCase() + kw.slice(1)) + GAP_TAIL
    assert.ok(
      report.gaps.includes(expected),
      `expected gaps to include "${expected}"\ngaps: ${JSON.stringify(report.gaps)}`
    )
  }

  // Deterministic acronym-casing assertion for a missing 'sql'.
  if (report.keywords.missing.includes('sql')) {
    assert.ok(
      report.gaps.some(g => g.startsWith('SQL: ')),
      `expected a gap line starting "SQL: "\ngaps: ${JSON.stringify(report.gaps)}`
    )
  }
})

test('analyzeResume preserves per-section match-rate gaps and drops the aggregate line', () => {
  const resume = {
    summary: 'Experienced developer.',
    skills: ['JavaScript'],
    experience: [],
    projects: [],
    education: [],
  }
  const posting = { posting_text: 'We need SQL, Docker, and Kubernetes experience.' }

  const report = analyzeResume(resume, posting)

  // Per-section match-rate gap still present (experience section is empty -> 0% match).
  assert.ok(
    report.gaps.some(g => /experience: only \d+% keyword match/i.test(g)),
    `expected a per-section "experience: only N% keyword match" gap\ngaps: ${JSON.stringify(report.gaps)}`
  )

  // Aggregate line replaced by per-keyword lines.
  assert.ok(
    !report.gaps.some(g => g.includes('posting keywords missing from resume')),
    `did not expect the aggregate "posting keywords missing from resume" line\ngaps: ${JSON.stringify(report.gaps)}`
  )
})

test('analyzeResume emits no per-keyword gap note when nothing is missing', () => {
  const resume = {
    summary: '',
    skills: ['SQL'],
    experience: [],
    projects: [],
    education: [],
  }
  const posting = { posting_text: 'Experience with SQL required.' }

  const report = analyzeResume(resume, posting)
  assert.deepStrictEqual(report.keywords.missing, [], 'expected zero missing keywords')
  assert.ok(
    !report.gaps.some(g => g.includes('not on your resume')),
    `did not expect any per-keyword gap note\ngaps: ${JSON.stringify(report.gaps)}`
  )
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
