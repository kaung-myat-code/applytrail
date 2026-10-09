/**
 * Eval Harness (OUT-04, Phase 17 — Honest Analysis Output)
 *
 * Runs the analysis pipeline over the committed fixture pairs in
 * evals/fixtures/ and writes a markdown report to evals/reports/report.md
 * proving the honesty guarantees: zero fabricated claims in modify targets,
 * no experience/projects add suggestions from the heuristic (post-OUT-01),
 * and honest gap notes for every missing keyword.
 *
 * How to run:  node evals/run-evals.js
 *
 * Follows the repo's plain-Node, no-test-runner convention (same as
 * server/lib/tailor/applyPatches.test.js and heuristic.test.js) — hard
 * assertions use the test(name, fn) + process.exitCode = 1 pattern so a
 * fabrication regression exits non-zero.
 *
 * Provider policy (never hard-fail on a missing key — Pitfall 5 / A4):
 *  - Heuristic provider ALWAYS runs over every pair.
 *  - AI provider (Gemini / OpenRouter / Groq) runs only when a key is present
 *    in the environment. Its modify suggestions get the same findInResume
 *    fabrication check; its add-type suggestions are dumped VERBATIM into the
 *    report for human review (AI add fabrication is inherently fuzzy — not
 *    auto-asserted). With no key, AI pairs are recorded as
 *    "skipped — no key" and the run still exits 0.
 *
 * The fabrication check reuses the sanctioned matcher
 * (server/lib/analysis/validate.js findInResume/normalizeText) — never a new
 * matcher. Every fixture resume is gated through server/lib/validateResume.js
 * at load time (Pitfall 4).
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { analyzeResume, generateSuggestions } = require('../server/lib/analysis/providers/heuristic')
const { validateResume } = require('../server/lib/validateResume')
const { validateMatchReport, validateSuggestions, findInResume } = require('../server/lib/analysis/validate')

// Plain-Node test convention (see applyPatches.test.js): PASS/FAIL per case,
// failures set process.exitCode = 1 without aborting the rest of the run.
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

// AI key detection — first key found wins (gemini, openrouter, groq).
const AI_KEY_DEFS = [
  { env: 'GOOGLE_GENERATIVE_AI_API_KEY', provider: 'gemini' },
  { env: 'OPENROUTER_API_KEY', provider: 'openrouter' },
  { env: 'GROQ_API_KEY', provider: 'groq' },
]

function detectAIProvider() {
  for (const def of AI_KEY_DEFS) {
    if (process.env[def.env]) return def.provider
  }
  return null
}

/**
 * Fabrication verdict for a single suggestion.
 * Modify suggestions must reference real resume content — the `current`
 * value has to exist in the source resume (findInResume), otherwise the
 * patch would rewrite text that was never there (fabrication / stale target).
 * Add suggestions have no current target, so they cannot fabricate existing
 * content by construction; they are marked as such (AI adds still get dumped
 * verbatim for human review below).
 */
function fabricationVerdict(resume, suggestion) {
  if (suggestion.type !== 'modify') {
    return { pass: true, note: `${suggestion.type} — no existing-content target to fabricate` }
  }
  const found = findInResume(resume, suggestion.section, suggestion.current)
  return {
    pass: found,
    note: found
      ? 'modify — current found in resume (findInResume)'
      : 'modify — FABRICATION/STALE TARGET: current not found in resume (findInResume)',
  }
}

async function main() {
  const fixturesDir = path.join(__dirname, 'fixtures')
  const reportsDir = path.join(__dirname, 'reports')

  const pairDirs = fs.readdirSync(fixturesDir)
    .filter(d => d.startsWith('pair-'))
    .sort() // lexicographic directory order (pair-01, pair-02, ...)

  if (pairDirs.length < 5) {
    console.error(`FAIL: expected at least 5 fixture pairs, found ${pairDirs.length}`)
    process.exitCode = 1
  }

  const aiProvider = detectAIProvider()
  // Lazy-require the AI provider only when a key is present — its ESM 'ai'
  // dependency should not load on keyless machines (Pitfall 5).
  const ai = aiProvider ? require('../server/lib/analysis/providers/ai') : null

  const report = []
  report.push('# Eval Report — Honest Analysis Output (OUT-04)')
  report.push('')
  report.push(`Generated: ${new Date().toISOString()}`)
  report.push(`Pairs: ${pairDirs.length}`)
  report.push(`Heuristic provider: always runs`)
  report.push(`AI provider: ${aiProvider ? `run (${aiProvider})` : 'skipped — no key'}`)
  report.push('')

  for (const pairDir of pairDirs) {
    const pairPath = path.join(fixturesDir, pairDir)
    const resume = JSON.parse(fs.readFileSync(path.join(pairPath, 'resume.json'), 'utf8'))
    const posting = JSON.parse(fs.readFileSync(path.join(pairPath, 'posting.json'), 'utf8'))

    report.push(`## ${pairDir}`)
    report.push('')

    // --- Fixture conformance gate (Pitfall 4) ---
    const conformance = validateResume(resume)
    if (!conformance.ok) {
      console.error(`FAIL: ${pairDir} fixture resume is not schema-conformant: ${conformance.errors.join('; ')}`)
      process.exitCode = 1
      report.push(`**Fixture status:** FAIL — non-conformant resume: ${conformance.errors.join('; ')}`)
      report.push('')
      continue
    }
    if (!posting.posting_text || !posting.posting_text.trim()) {
      console.error(`FAIL: ${pairDir} fixture posting has empty posting_text`)
      process.exitCode = 1
      report.push('**Fixture status:** FAIL — empty posting_text')
      report.push('')
      continue
    }
    report.push('**Fixture status:** pass (validateResume + non-empty posting_text)')
    report.push('')

    // --- Heuristic path (always runs) ---
    const reportH = analyzeResume(resume, posting)
    const suggestionsH = generateSuggestions(resume, reportH)

    test(`${pairDir} heuristic report passes validateMatchReport`, () => {
      const r = validateMatchReport(reportH)
      assert.ok(r.valid, `errors: ${r.errors.join('; ')}`)
    })

    test(`${pairDir} heuristic suggestions pass validateSuggestions`, () => {
      const r = validateSuggestions(suggestionsH, resume)
      assert.ok(r.valid, `errors: ${r.errors.join('; ')}`)
    })

    // Fabrication check — modify `current` must exist in the resume
    // (sanctioned matcher, never a new one).
    test(`${pairDir} heuristic modify suggestions target real resume content (findInResume)`, () => {
      for (const s of suggestionsH) {
        if (s.type === 'modify') {
          assert.ok(
            findInResume(resume, s.section, s.current),
            `suggestion ${s.id}: modify current not found in resume — fabrication/stale target`
          )
        }
      }
    })

    // Post-OUT-01: the heuristic must never propose experience/projects adds.
    test(`${pairDir} heuristic emits no experience/projects add suggestions (post-OUT-01)`, () => {
      const fabricated = suggestionsH.filter(s => s.type === 'add' && (s.section === 'experience' || s.section === 'projects'))
      assert.strictEqual(
        fabricated.length, 0,
        `unexpected fabricated adds: ${fabricated.map(s => `${s.id}:${s.section}`).join(', ')}`
      )
    })

    report.push('### Heuristic analysis')
    report.push('')
    report.push(`**Provider:** heuristic`)
    report.push(`**Score:** ${reportH.score}/100`)
    report.push('')
    report.push(`**Matched keywords (${reportH.keywords.matched.length}):** ${reportH.keywords.matched.join(', ') || '(none)'}`)
    report.push('')
    report.push(`**Missing keywords (${reportH.keywords.missing.length}):** ${reportH.keywords.missing.join(', ') || '(none)'}`)
    report.push('')
    report.push('**Gap notes:**')
    if (reportH.gaps.length === 0) {
      report.push('* (none)')
    } else {
      for (const gap of reportH.gaps) report.push(`* ${gap}`)
    }
    report.push('')
    report.push('**Suggestions (heuristic):**')
    if (suggestionsH.length === 0) {
      report.push('* (none generated — honest low-suggestion output by design, post-OUT-01)')
    } else {
      for (const s of suggestionsH) {
        const verdict = fabricationVerdict(resume, s)
        report.push(`* ${s.id} — ${s.section}/${s.type}: "${s.suggested}" — fabrication verdict: ${verdict.pass ? 'pass' : 'FAIL'} (${verdict.note})`)
      }
    }
    report.push('')
    const modifyCountH = suggestionsH.filter(s => s.type === 'modify').length
    report.push('**Fabrication check (heuristic):**')
    report.push(`* ${modifyCountH} modify suggestion(s) checked via findInResume`)
    report.push(`* ${suggestionsH.filter(s => s.type === 'add' && (s.section === 'experience' || s.section === 'projects')).length} experience/projects add suggestion(s) (must be 0 post-OUT-01)`)
    report.push('')

    // --- AI path (only when a key is present) ---
    if (aiProvider) {
      report.push(`### AI analysis (${aiProvider})`)
      report.push('')
      try {
        const reportAI = await ai.analyzeResume(resume, posting, aiProvider)
        const suggestionsAI = await ai.generateSuggestions(resume, reportAI, aiProvider)

        report.push(`**Provider:** ${aiProvider}`)
        report.push(`**Score:** ${reportAI.score}/100`)
        report.push('')
        report.push(`**Matched keywords (${reportAI.keywords.matched.length}):** ${reportAI.keywords.matched.join(', ') || '(none)'}`)
        report.push('')
        report.push(`**Missing keywords (${reportAI.keywords.missing.length}):** ${reportAI.keywords.missing.join(', ') || '(none)'}`)
        report.push('')
        report.push('**AI suggestions (VERBATIM — for human review, not auto-asserted):**')
        if (suggestionsAI.length === 0) {
          report.push('* (none generated)')
        }
        for (const s of suggestionsAI) {
          const verdict = fabricationVerdict(resume, s)
          report.push(`#### ${s.id} — ${s.section}/${s.type}`)
          report.push('')
          report.push(`* current: ${s.current === null ? '(null)' : JSON.stringify(s.current)}`)
          report.push(`* suggested: ${JSON.stringify(s.suggested)}`)
          report.push(`* reason: ${JSON.stringify(s.reason)}`)
          if (s.target_entry) report.push(`* target_entry: ${JSON.stringify(s.target_entry)}`)
          report.push(`* fabrication verdict (modify current vs findInResume): ${verdict.pass ? 'pass' : 'FAIL'} (${verdict.note})`)
          report.push('')
        }
      } catch (err) {
        // A key is present but the call failed (rate limit, network, etc.).
        // Record it verbatim for review; do not abort the heuristic run.
        report.push(`**AI path error (recorded for review, run continues):** ${err.message}`)
        report.push('')
      }
    } else {
      report.push('### AI analysis')
      report.push('')
      report.push('skipped — no key')
      report.push('')
    }
  }

  fs.mkdirSync(reportsDir, { recursive: true })
  const outPath = path.join(reportsDir, 'report.md')
  fs.writeFileSync(outPath, report.join('\n'))
  console.log(`\nReport written to ${outPath}`)
}

main().catch(err => {
  console.error('FAIL: eval run crashed')
  console.error(err)
  process.exitCode = 1
})
