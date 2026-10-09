/**
 * Normalize Report
 *
 * Normalizes the top-level score and per-section matchRate fields on a
 * MatchReport object returned by the AI provider (ai.js analyzeResume).
 * Split into its own module (same rationale as suggestionSchema.js) so
 * normalizeReport.test.js can exercise the normalization logic without
 * loading ai.js -- and with it the ESM-only 'ai' package -- which keeps the
 * OUT-06 regression test cheap to run in the server test chain with no API
 * key required.
 *
 * Contracts:
 * - matchRate: genuinely a 0-1 decimal. Some models occasionally return a
 *   percentage (e.g. 85 instead of 0.85), so values > 1 are divided by 100,
 *   then clamped to [0, 1] regardless. This block is intentionally kept
 *   separate from the score fix (Pitfall 1): matchRate is NOT a 0-100 value
 *   and must never gain the score's "*100 if in [0,1]" treatment.
 * - score: matchReportSchema already declares score as z.number().min(0).max(100),
 *   so generateObject guarantees a 0-100 value -- a genuine low score like 1
 *   is a legitimate 1%, not a 0-1 fraction needing rescaling. An earlier
 *   version of ai.js wrongly rescaled any value in [0,1] by *100 (score 1
 *   became 100); that branch has been removed. Now the score is only rounded
 *   half-up (Math.round) then clamped to [0, 100].
 */

function normalizeReportScores(object) {
  if (!object || typeof object !== 'object') return object

  // matchRate: >1 -> /100 (percentage correction), then clamp to [0,1]
  for (const key of ['summary', 'skills', 'experience', 'projects', 'education']) {
    const section = object.sections?.[key]
    if (section && section.matchRate != null) {
      if (section.matchRate > 1) {
        section.matchRate = section.matchRate / 100
      }
      section.matchRate = Math.max(0, Math.min(1, section.matchRate))
    }
  }

  // score: round half-up, then clamp to [0,100]. Deliberately does NOT
  // rescale [0,1] values -- see OUT-06 history in the header comment.
  if (object.score != null) {
    object.score = Math.max(0, Math.min(100, Math.round(object.score)))
  }

  return object
}

module.exports = { normalizeReportScores }
