/**
 * Tests for server/lib/pdf.js (buildResumePdfDefinition).
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention of raw `node -e` verification scripts used
 * throughout PLAN.md files). Run directly with `node server/lib/pdf.test.js`.
 */

const assert = require('assert')
const { buildResumePdfDefinition } = require('./pdf')

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
  assert.strictEqual(typeof buildResumePdfDefinition, 'function')
})

test('full resume produces content blocks in Summary/Skills/Experience/Projects/Education order with defaultStyle.font Roboto', () => {
  const resume = {
    name: 'Jordan Rivera',
    contact: { email: 'j@x.com', github: '', location: 'Remote' },
    summary: 'Experienced engineer.',
    experience: [
      { company: 'Acme', role: 'Engineer', period: '2020-2024', bullets: ['Shipped X', 'Improved Y by 30%'] }
    ],
    projects: [
      { name: 'Side Project', description: 'A thing', bullets: ['Built it'] }
    ],
    education: [
      { degree: 'BS CS', school: 'State U', year: '2019' }
    ],
    skills: ['React', 'Node', 'Express']
  }

  const def = buildResumePdfDefinition(resume)

  assert.ok(Array.isArray(def.content), 'content must be an array')
  assert.ok(def.content.length > 0, 'content must be non-empty')
  assert.ok(typeof def.styles === 'object' && def.styles !== null, 'styles must be an object')
  assert.strictEqual(def.defaultStyle && def.defaultStyle.font, 'Roboto', 'defaultStyle.font must be Roboto')

  const serialized = JSON.stringify(def.content)
  const nameIdx = serialized.indexOf('Jordan Rivera')
  const summaryIdx = serialized.indexOf('Summary')
  const skillsIdx = serialized.indexOf('React')
  const expIdx = serialized.indexOf('Acme')
  const projIdx = serialized.indexOf('Side Project')
  const eduIdx = serialized.indexOf('State U')

  assert.ok(nameIdx !== -1, 'name should appear in content')
  assert.ok(summaryIdx !== -1, 'summary section should appear')
  assert.ok(skillsIdx !== -1, 'skills should appear')
  assert.ok(expIdx !== -1, 'experience should appear')
  assert.ok(projIdx !== -1, 'projects should appear')
  assert.ok(eduIdx !== -1, 'education should appear')

  assert.ok(nameIdx < summaryIdx, 'name should come before summary')
  assert.ok(summaryIdx < skillsIdx, 'summary should come before skills')
  assert.ok(skillsIdx < expIdx, 'skills should come before experience')
  assert.ok(expIdx < projIdx, 'experience should come before projects')
  assert.ok(projIdx < eduIdx, 'projects should come before education')
})

test('blank resume (empty arrays/strings) does not throw and only includes the name block', () => {
  const blank = { name: '', contact: {}, summary: '', experience: [], projects: [], education: [], skills: [] }
  const def = buildResumePdfDefinition(blank)

  assert.ok(Array.isArray(def.content))
  assert.strictEqual(def.content.length, 1, 'only the name block should be present')
  assert.strictEqual(def.defaultStyle && def.defaultStyle.font, 'Roboto')
})

test('missing experience/projects/education keys entirely do not throw', () => {
  const partial = { name: 'No Sections', contact: { email: 'a@b.com' }, summary: 'Hi' }
  const def = buildResumePdfDefinition(partial)
  assert.ok(Array.isArray(def.content))
  assert.ok(def.content.length > 0)
})

test('missing contact entirely does not throw', () => {
  const noContact = { name: 'No Contact', summary: '', experience: [], projects: [], education: [], skills: [] }
  const def = buildResumePdfDefinition(noContact)
  assert.ok(Array.isArray(def.content))
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
