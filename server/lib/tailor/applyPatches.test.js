/**
 * Regression tests for server/lib/tailor/applyPatches.js covering all 15
 * section x type combinations (summary/skills/experience/projects/education
 * x add/modify/remove).
 *
 * History (Phase 15): two combinations were originally found silently
 * no-oping with zero signal to the caller -- summary+remove and
 * skills+modify. A broader audit of the full matrix surfaced education
 * (all three types) as a third gap. Decision: implement summary+remove and
 * skills+modify in applyPatches.js; drop education from the AI provider's
 * suggestion schema instead of implementing it here (education is factual,
 * not something a writing suggestion should change). applyPatches.js keeps
 * education handling as a defense-in-depth defect path (SKIP_REASON.
 * UNSUPPORTED_COMBINATION) in case a suggestion ever reaches it bypassing
 * the schema (e.g. a draft persisted before this change).
 *
 * Plain Node assertions -- no test runner is installed in this repo (matches
 * the existing convention used by pdf.test.js, heuristic.test.js). Run
 * directly with `node server/lib/tailor/applyPatches.test.js`.
 *
 * Phase 17 / OUT-05 additions: add-type experience/projects patches now
 * honor an optional suggestion.target_entry (company/name) and attach the
 * bullet to the named entry via normalizeText comparison; an unmatched
 * target_entry falls back to the last entry but records a visible
 * SKIP_REASON.TARGET_ENTRY_NOT_FOUND skip carrying the target_entry value
 * (never a silent mis-target). Cases live between the projects section and
 * the reachability guard.
 */

const assert = require('assert')
const { applyPatches, SKIP_REASON } = require('./applyPatches')
const { suggestionSchema } = require('../analysis/providers/suggestionSchema')

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

function baseResume() {
  return {
    name: 'Jamie Doe',
    contact: { email: 'jamie@example.com', github: '', location: '' },
    summary: 'Experienced engineer with a background in backend systems.',
    experience: [
      { company: 'Acme Corp', role: 'Engineer', period: '2020-2023', bullets: ['Built internal tools.'] },
    ],
    projects: [
      { name: 'Side Project', description: 'A thing.', bullets: ['Shipped a feature.'] },
    ],
    education: [
      { degree: 'B.S. Computer Science', school: 'State University', period: '2016-2020' },
    ],
    skills: ['javascript'],
  }
}

function accept(id) {
  return { [id]: { status: 'accepted' } }
}

function findApplied(result, id) {
  return result.applied.find(a => a.id === id)
}

function findSkipped(result, id) {
  return result.skipped.find(s => s.id === id)
}

// --- summary (add / modify / remove) ---

test('summary + add: applied, summary set', () => {
  const resume = baseResume()
  resume.summary = ''
  const suggestions = [{ id: 's1', section: 'summary', type: 'add', current: null, suggested: 'New summary.', reason: 'r' }]
  const { resume: out, applied } = applyPatches(resume, suggestions, accept('s1'))
  assert.strictEqual(out.summary, 'New summary.')
  assert.ok(applied.find(a => a.id === 's1'))
})

test('summary + modify: applied when current matches', () => {
  const resume = baseResume()
  const suggestions = [{ id: 's2', section: 'summary', type: 'modify', current: resume.summary, suggested: 'Updated summary.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('s2'))
  assert.strictEqual(result.resume.summary, 'Updated summary.')
  assert.ok(findApplied(result, 's2'))
})

test('summary + modify: skipped with CURRENT_MISMATCH when current is stale', () => {
  const resume = baseResume()
  const suggestions = [{ id: 's3', section: 'summary', type: 'modify', current: 'stale text', suggested: 'Updated summary.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('s3'))
  assert.strictEqual(result.resume.summary, resume.summary)
  const skip = findSkipped(result, 's3')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.CURRENT_MISMATCH)
})

test('summary + remove: applied, summary cleared', () => {
  const resume = baseResume()
  const suggestions = [{ id: 's4', section: 'summary', type: 'remove', current: resume.summary, suggested: '', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('s4'))
  assert.strictEqual(result.resume.summary, '')
  assert.ok(findApplied(result, 's4'))
})

test('summary + remove: skipped with CURRENT_MISMATCH when current is stale', () => {
  const resume = baseResume()
  const suggestions = [{ id: 's5', section: 'summary', type: 'remove', current: 'stale text', suggested: '', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('s5'))
  assert.strictEqual(result.resume.summary, resume.summary)
  const skip = findSkipped(result, 's5')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.CURRENT_MISMATCH)
})

// --- skills (add / modify / remove) ---

test('skills + add: applied, skill appended', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'k1', section: 'skills', type: 'add', current: null, suggested: 'python', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('k1'))
  assert.ok(result.resume.skills.includes('python'))
  assert.ok(findApplied(result, 'k1'))
})

test('skills + modify: applied when current found', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'k2', section: 'skills', type: 'modify', current: 'javascript', suggested: 'TypeScript', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('k2'))
  assert.deepStrictEqual(result.resume.skills, ['TypeScript'])
  assert.ok(findApplied(result, 'k2'))
})

test('skills + modify: skipped with NOT_FOUND when current absent', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'k3', section: 'skills', type: 'modify', current: 'rust', suggested: 'TypeScript', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('k3'))
  assert.deepStrictEqual(result.resume.skills, ['javascript'])
  const skip = findSkipped(result, 'k3')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.NOT_FOUND)
})

test('skills + remove: applied, skill removed', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'k4', section: 'skills', type: 'remove', current: 'javascript', suggested: '', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('k4'))
  assert.deepStrictEqual(result.resume.skills, [])
  assert.ok(findApplied(result, 'k4'))
})

// --- experience (add / modify / remove) ---

test('experience + add: applied, bullet appended to last entry', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'e1', section: 'experience', type: 'add', current: null, suggested: 'Led a new initiative.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('e1'))
  assert.ok(result.resume.experience[0].bullets.includes('Led a new initiative.'))
  assert.ok(findApplied(result, 'e1'))
})

test('experience + modify: applied when current bullet found', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'e2', section: 'experience', type: 'modify', current: 'Built internal tools.', suggested: 'Built internal tools using Python.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('e2'))
  assert.ok(result.resume.experience[0].bullets.includes('Built internal tools using Python.'))
  assert.ok(findApplied(result, 'e2'))
})

test('experience + modify: skipped with NOT_FOUND when bullet absent', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'e3', section: 'experience', type: 'modify', current: 'Nonexistent bullet.', suggested: 'Replacement.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('e3'))
  assert.deepStrictEqual(result.resume.experience[0].bullets, ['Built internal tools.'])
  const skip = findSkipped(result, 'e3')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.NOT_FOUND)
})

test('experience + remove: applied, bullet removed', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'e4', section: 'experience', type: 'remove', current: 'Built internal tools.', suggested: null, reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('e4'))
  assert.deepStrictEqual(result.resume.experience[0].bullets, [])
  assert.ok(findApplied(result, 'e4'))
})

test('experience + remove: skipped with NOT_FOUND when bullet absent', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'e5', section: 'experience', type: 'remove', current: 'Nonexistent bullet.', suggested: null, reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('e5'))
  assert.deepStrictEqual(result.resume.experience[0].bullets, ['Built internal tools.'])
  const skip = findSkipped(result, 'e5')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.NOT_FOUND)
})

// --- projects (add / modify / remove) ---

test('projects + add: applied, bullet appended to last entry', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'p1', section: 'projects', type: 'add', current: null, suggested: 'Added CI pipeline.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('p1'))
  assert.ok(result.resume.projects[0].bullets.includes('Added CI pipeline.'))
  assert.ok(findApplied(result, 'p1'))
})

test('projects + modify: applied when current bullet found', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'p2', section: 'projects', type: 'modify', current: 'Shipped a feature.', suggested: 'Shipped a feature using React.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('p2'))
  assert.ok(result.resume.projects[0].bullets.includes('Shipped a feature using React.'))
  assert.ok(findApplied(result, 'p2'))
})

test('projects + modify: skipped with NOT_FOUND when bullet absent', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'p3', section: 'projects', type: 'modify', current: 'Nonexistent bullet.', suggested: 'Replacement.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('p3'))
  assert.deepStrictEqual(result.resume.projects[0].bullets, ['Shipped a feature.'])
  const skip = findSkipped(result, 'p3')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.NOT_FOUND)
})

test('projects + remove: applied, bullet removed', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'p4', section: 'projects', type: 'remove', current: 'Shipped a feature.', suggested: null, reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('p4'))
  assert.deepStrictEqual(result.resume.projects[0].bullets, [])
  assert.ok(findApplied(result, 'p4'))
})

test('projects + remove: skipped with NOT_FOUND when bullet absent', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'p5', section: 'projects', type: 'remove', current: 'Nonexistent bullet.', suggested: null, reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('p5'))
  assert.deepStrictEqual(result.resume.projects[0].bullets, ['Shipped a feature.'])
  const skip = findSkipped(result, 'p5')
  assert.ok(skip)
  assert.strictEqual(skip.reason, SKIP_REASON.NOT_FOUND)
})

// --- OUT-05: target_entry targeting (add-type experience/projects) ---
// These use a multi-entry resume so a targeted attach is distinguishable
// from the old "always last entry" behavior (with a single entry, the named
// entry IS the last entry and the old code would pass by coincidence).

function multiEntryResume() {
  const r = baseResume()
  r.experience.push({ company: 'Beta LLC', role: 'Developer', period: '2023-2024', bullets: ['Maintained services.'] })
  r.projects.push({ name: 'Other Project', description: 'Another thing.', bullets: ['Wrote docs.'] })
  return r
}

test('experience + add with target_entry: attaches to the named entry, not the last', () => {
  const resume = multiEntryResume()
  const suggestions = [{ id: 't1', section: 'experience', type: 'add', current: null, target_entry: 'Acme Corp', suggested: 'Led the tooling migration.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('t1'))
  assert.ok(
    result.resume.experience[0].bullets.includes('Led the tooling migration.'),
    'bullet should attach to the Acme Corp entry'
  )
  assert.ok(
    !result.resume.experience[1].bullets.includes('Led the tooling migration.'),
    'bullet must not attach to the last (Beta LLC) entry'
  )
  assert.ok(findApplied(result, 't1'), 'expected the suggestion to be recorded as applied')
  assert.ok(!findSkipped(result, 't1'), 'no skip expected when target_entry matches')
})

test('experience + add with unmatched target_entry: falls back to last entry with TARGET_ENTRY_NOT_FOUND skip carrying target_entry', () => {
  const resume = multiEntryResume()
  const suggestions = [{ id: 't2', section: 'experience', type: 'add', current: null, target_entry: 'Nonexistent Corp', suggested: 'Led the tooling migration.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('t2'))
  assert.ok(
    result.resume.experience[result.resume.experience.length - 1].bullets.includes('Led the tooling migration.'),
    'bullet should still land on the last entry (informational fallback, not a hard failure)'
  )
  const skip = findSkipped(result, 't2')
  assert.ok(skip, 'expected a visible skip record for the unmatched target_entry — never a silent fallback')
  assert.strictEqual(skip.reason, SKIP_REASON.TARGET_ENTRY_NOT_FOUND)
  assert.strictEqual(skip.target_entry, 'Nonexistent Corp', 'skip record must carry target_entry for client copy interpolation')
  assert.ok(!findApplied(result, 't2'), 'mis-targeted suggestion is recorded as skipped, not applied')
})

test('experience + add without target_entry: unchanged last-entry behavior, no skip', () => {
  const resume = multiEntryResume()
  const suggestions = [{ id: 't3', section: 'experience', type: 'add', current: null, suggested: 'Led the tooling migration.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('t3'))
  assert.ok(result.resume.experience[1].bullets.includes('Led the tooling migration.'), 'absent target_entry keeps last-entry behavior')
  assert.ok(findApplied(result, 't3'))
  assert.ok(!findSkipped(result, 't3'), 'no skip expected when target_entry is absent')
})

test('projects + add with target_entry: attaches to the named project entry', () => {
  const resume = multiEntryResume()
  const suggestions = [{ id: 't4', section: 'projects', type: 'add', current: null, target_entry: 'Side Project', suggested: 'Added a REST API.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('t4'))
  assert.ok(
    result.resume.projects[0].bullets.includes('Added a REST API.'),
    'bullet should attach to the Side Project entry'
  )
  assert.ok(
    !result.resume.projects[1].bullets.includes('Added a REST API.'),
    'bullet must not attach to the last (Other Project) entry'
  )
  assert.ok(findApplied(result, 't4'))
  assert.ok(!findSkipped(result, 't4'))
})

test('experience + add with case-different target_entry: normalizeText match still attaches to the named entry', () => {
  const resume = multiEntryResume()
  const suggestions = [{ id: 't5', section: 'experience', type: 'add', current: null, target_entry: 'acme corp', suggested: 'Led the tooling migration.', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('t5'))
  assert.ok(
    result.resume.experience[0].bullets.includes('Led the tooling migration.'),
    "'acme corp' must match 'Acme Corp' via normalizeText, not raw equality"
  )
  assert.ok(findApplied(result, 't5'))
  assert.ok(!findSkipped(result, 't5'))
})

// --- reachability guard ---
// After Phase 15, every section the schema permits (suggestionSchema.js)
// should be fully handled by applyPatches's switch, so SKIP_REASON.
// UNSUPPORTED_COMBINATION should be provably impossible to hit for any
// schema-permitted section x type pair. This walks the full cross product
// derived directly from the schema (not a hardcoded list), so if the schema
// ever grows a section without a matching applyPatches branch, this test
// starts failing loudly instead of the gap going unnoticed.

test('UNSUPPORTED_COMBINATION is unreachable for every schema-permitted section x type combination', () => {
  const sections = suggestionSchema.shape.section.options
  const types = suggestionSchema.shape.type.options

  // Canary: if this fails, the schema's allowed sections/types changed --
  // update applyPatches.js to handle the new combination(s), then update
  // these expected lists deliberately.
  assert.deepStrictEqual(
    [...sections].sort(),
    ['experience', 'projects', 'skills', 'summary'],
    'suggestionSchema section enum changed -- verify applyPatches.js handles the new section before updating this list'
  )
  assert.deepStrictEqual(
    [...types].sort(),
    ['add', 'modify', 'remove'],
    'suggestionSchema type enum changed -- verify applyPatches.js handles the new type before updating this list'
  )

  let walked = 0
  for (const section of sections) {
    for (const type of types) {
      walked++
      const id = `reach-${section}-${type}`
      // `current`/`suggested` values are deliberately arbitrary: this test
      // does not care whether the patch actually applies (that's covered by
      // the per-combination tests above) -- only that the outcome is never
      // the UNSUPPORTED_COMBINATION defect path.
      const suggestion = { id, section, type, current: 'irrelevant probe value', suggested: 'irrelevant replacement', reason: 'r' }
      const result = applyPatches(baseResume(), [suggestion], accept(id))
      const skip = findSkipped(result, id)
      if (skip) {
        assert.notStrictEqual(
          skip.reason,
          SKIP_REASON.UNSUPPORTED_COMBINATION,
          `section=${section} type=${type} unexpectedly hit the UNSUPPORTED_COMBINATION defect path`
        )
      }
    }
  }
  assert.strictEqual(walked, 12, 'expected to walk all 12 schema-permitted section x type combinations')
})

// --- education (add / modify / remove) ---
// Dropped from the AI provider's schema (server/lib/analysis/providers/ai.js)
// rather than implemented here. Two layers of defense are tested:
// (1) the schema layer rejects education suggestions before they can ever
//     reach applyPatches; (2) applyPatches itself treats an education
//     suggestion as a loud, tracked defect (UNSUPPORTED_COMBINATION) rather
//     than a silent no-op, in case one arrives anyway (e.g. a draft
//     persisted before this change).

test('education + add: rejected at the schema layer (not a valid section)', () => {
  const candidate = { id: 'd1', section: 'education', type: 'add', current: null, suggested: 'M.S. Computer Science', reason: 'r' }
  const parsed = suggestionSchema.safeParse(candidate)
  assert.strictEqual(parsed.success, false, 'expected education to be rejected by suggestionSchema')
})

test('education + modify: rejected at the schema layer (not a valid section)', () => {
  const candidate = { id: 'd2', section: 'education', type: 'modify', current: 'B.S. Computer Science', suggested: 'B.S. Computer Science, ML concentration', reason: 'r' }
  const parsed = suggestionSchema.safeParse(candidate)
  assert.strictEqual(parsed.success, false, 'expected education to be rejected by suggestionSchema')
})

test('education + remove: rejected at the schema layer (not a valid section)', () => {
  const candidate = { id: 'd3', section: 'education', type: 'remove', current: 'B.S. Computer Science', suggested: null, reason: 'r' }
  const parsed = suggestionSchema.safeParse(candidate)
  assert.strictEqual(parsed.success, false, 'expected education to be rejected by suggestionSchema')
})

test('education + add: if it reaches applyPatches anyway, tracked as UNSUPPORTED_COMBINATION, not silently dropped', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'd4', section: 'education', type: 'add', current: null, suggested: 'M.S. Computer Science', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('d4'))
  assert.deepStrictEqual(result.resume.education, resume.education, 'education must be unchanged')
  const skip = findSkipped(result, 'd4')
  assert.ok(skip, 'expected the suggestion to be tracked in skipped, not silently ignored')
  assert.strictEqual(skip.reason, SKIP_REASON.UNSUPPORTED_COMBINATION)
})

test('education + modify: if it reaches applyPatches anyway, tracked as UNSUPPORTED_COMBINATION, not silently dropped', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'd5', section: 'education', type: 'modify', current: 'B.S. Computer Science', suggested: 'B.S. Computer Science, ML concentration', reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('d5'))
  assert.deepStrictEqual(result.resume.education, resume.education, 'education must be unchanged')
  const skip = findSkipped(result, 'd5')
  assert.ok(skip, 'expected the suggestion to be tracked in skipped, not silently ignored')
  assert.strictEqual(skip.reason, SKIP_REASON.UNSUPPORTED_COMBINATION)
})

test('education + remove: if it reaches applyPatches anyway, tracked as UNSUPPORTED_COMBINATION, not silently dropped', () => {
  const resume = baseResume()
  const suggestions = [{ id: 'd6', section: 'education', type: 'remove', current: 'B.S. Computer Science', suggested: null, reason: 'r' }]
  const result = applyPatches(resume, suggestions, accept('d6'))
  assert.deepStrictEqual(result.resume.education, resume.education, 'education must be unchanged')
  const skip = findSkipped(result, 'd6')
  assert.ok(skip, 'expected the suggestion to be tracked in skipped, not silently ignored')
  assert.strictEqual(skip.reason, SKIP_REASON.UNSUPPORTED_COMBINATION)
})

if (process.exitCode === 1) {
  console.error('\nSome tests failed.')
} else {
  console.log('\nAll tests passed.')
}
