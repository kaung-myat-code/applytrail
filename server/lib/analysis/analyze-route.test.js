/**
 * Regression test for G-14-5: POST /api/analyze returned HTTP 500 on every
 * request because server/index.js checked `reportValidation.ok` /
 * `suggestionsValidation.ok`, but server/lib/analysis/validate.js's
 * validateMatchReport and validateSuggestions return `{ valid, errors }` —
 * there is no `.ok` field, so the guard was always true and the handler
 * always bailed to the 500 "Analysis failed" path.
 *
 * Boots the real Express app on a dedicated test port, hits the live
 * heuristic-provider path end-to-end, and asserts HTTP 200 with a report
 * and suggestions. Plain Node assertions -- no test runner is installed in
 * this repo (matches the existing convention used by heuristic.test.js).
 * Run directly with `node server/lib/analysis/analyze-route.test.js`.
 */

const assert = require('assert')

const TEST_PORT = 41234
const BASE_URL = `http://localhost:${TEST_PORT}`

// Must be set before requiring index.js: index.js reads process.env.PORT at
// module load time to determine which port to bind, and only enables the
// static-file/production branch when NODE_ENV === 'production'.
process.env.PORT = String(TEST_PORT)
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_ENV = 'test'
}

async function waitForHealth(timeoutMs = 5000, intervalMs = 100) {
  const deadline = Date.now() + timeoutMs
  let lastErr
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`)
      if (res.status === 200) return
    } catch (err) {
      lastErr = err
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  throw new Error(`Server did not become healthy within ${timeoutMs}ms: ${lastErr?.message}`)
}

async function main() {
  // Requiring index.js boots the Express app (it calls app.listen at module
  // load time), bound to TEST_PORT above.
  require('../../index.js')

  await waitForHealth()

  const postingsRes = await fetch(`${BASE_URL}/api/job-postings`)
  const postings = await postingsRes.json()

  if (!Array.isArray(postings) || postings.length === 0) {
    console.error('FAIL: POST /api/analyze returns 200 for heuristic provider')
    console.error('No job postings available to run the test against (server/data or demo-data seeding did not produce any postings).')
    process.exit(1)
  }

  const jobPostingId = postings[0].id

  const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_posting_id: jobPostingId, provider: 'heuristic' }),
  })

  try {
    assert.strictEqual(analyzeRes.status, 200, `expected HTTP 200, got ${analyzeRes.status}`)

    const body = await analyzeRes.json()

    assert.ok(body.report && typeof body.report === 'object', 'expected body.report to be an object')
    assert.strictEqual(typeof body.report.score, 'number', 'expected body.report.score to be a number')
    assert.ok(Array.isArray(body.report.keywords?.matched), 'expected body.report.keywords.matched to be an array')
    assert.ok(Array.isArray(body.suggestions), 'expected body.suggestions to be an array')
    assert.strictEqual(body.provider, 'heuristic', `expected body.provider === "heuristic", got ${body.provider}`)

    console.log('PASS: POST /api/analyze returns 200 with report and suggestions for heuristic provider')
    process.exit(0)
  } catch (err) {
    console.error('FAIL: POST /api/analyze returns 200 for heuristic provider')
    console.error(err)
    process.exit(1)
  }
}

main().catch(err => {
  console.error('FAIL: analyze-route.test.js crashed')
  console.error(err)
  process.exit(1)
})
