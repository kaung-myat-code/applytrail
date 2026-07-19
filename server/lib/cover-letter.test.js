/**
 * Tests for server/lib/cover-letter.js (possessive apostrophe fix + template variance).
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by pdf.test.js). Run directly with
 * `node server/lib/cover-letter.test.js`.
 */

const assert = require('assert')
const { generateCoverLetter, possessive } = require('./cover-letter')

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
  summary: 'Experienced software engineer with a track record of shipping features.',
  skills: ['React', 'Node', 'SQL'],
  experience: [
    {
      company: 'Prior Co',
      role: 'Engineer',
      period: '2020-2024',
      bullets: [
        'Built a React and Node application that improved page load speed by 30%',
        'Wrote SQL queries to optimize reporting pipelines',
      ],
    },
  ],
  projects: [],
}

const jobPostingA = {
  company: 'Northstar Analytics',
  role: 'Software Engineer',
  posting_text: 'We need someone skilled in React and Node to join our team.',
}

const jobPostingB = {
  company: 'Acme',
  role: 'Backend Developer',
  posting_text: 'Looking for a candidate experienced in SQL and Node development.',
}

test("possessive('Northstar Analytics') === \"Northstar Analytics'\"", () => {
  assert.strictEqual(possessive('Northstar Analytics'), "Northstar Analytics'")
})

test("possessive('Acme') === \"Acme's\"", () => {
  assert.strictEqual(possessive('Acme'), "Acme's")
})

test('generateCoverLetter for two different job postings produces paragraphs whose first sentence differs', () => {
  const letterA = generateCoverLetter(resume, jobPostingA)
  const letterB = generateCoverLetter(resume, jobPostingB)

  const firstSentenceA = letterA.split('. ')[0]
  const firstSentenceB = letterB.split('. ')[0]

  assert.notStrictEqual(firstSentenceA, firstSentenceB, 'first sentence should vary between different (company, role) pairs')
})

test('no generated paragraph contains the literal substring "s\'s" immediately after a company name', () => {
  const letterA = generateCoverLetter(resume, jobPostingA)
  const letterB = generateCoverLetter(resume, jobPostingB)

  assert.ok(!letterA.includes("Analytics's"), 'company ending in "s" must not get a doubled-s possessive')
  assert.ok(letterA.includes("Analytics' goals") || letterA.includes("Analytics'"), 'company ending in "s" should get a bare apostrophe possessive')
  assert.ok(letterB.includes("Acme's"), 'company not ending in "s" should get the standard apostrophe-s possessive')
})

test('no-match fallback paragraph also uses correct possessive for a company ending in "s"', () => {
  const emptyResume = { summary: '', skills: [], experience: [], projects: [] }
  const noMatchPosting = { company: 'Northstar Analytics', role: 'Engineer', posting_text: 'Completely unrelated posting text with no technical keywords.' }
  const letter = generateCoverLetter(emptyResume, noMatchPosting)

  assert.ok(!letter.includes("Analytics's"), 'fallback paragraph must not double the s in possessive')
  assert.ok(letter.includes("Analytics'"), 'fallback paragraph should use bare apostrophe possessive')
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
