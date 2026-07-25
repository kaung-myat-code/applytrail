/**
 * Client-side mirror of server/lib/tailor/applyPatches.js's SKIP_REASON enum.
 *
 * client/ and server/ are separate npm packages with no shared module
 * boundary (see client/src/lib/keywordCasing.js for the same pattern), so
 * this duplicates the enum values rather than importing them. Keep the two
 * in sync when either changes.
 */
export const SKIP_REASON = {
  NOT_FOUND: 'not-found',
  CURRENT_MISMATCH: 'current-mismatch',
  UNSUPPORTED_COMBINATION: 'unsupported-combination',
}

const KNOWN_REASONS = new Set(Object.values(SKIP_REASON))

/**
 * UNSUPPORTED_COMBINATION means a suggestion reached applyPatches with a
 * section this engine doesn't recognize -- every known section/type pairing
 * is fully handled, so this indicates a bug (e.g. a suggestion that should
 * have been rejected upstream), not an expected data condition like a stale
 * suggestion no longer matching the live resume.
 */
export function isDefectSkip(reason) {
  return reason === SKIP_REASON.UNSUPPORTED_COMBINATION
}

/**
 * True if `reason` is one this client version knows how to explain. A
 * server ahead of the client (new SKIP_REASON value added but this file not
 * yet updated -- see the "keep in sync" note above) would otherwise produce
 * a skip the UI silently drops or mislabels. Callers should render a
 * generic fallback message for unknown reasons instead.
 */
export function isKnownReason(reason) {
  return KNOWN_REASONS.has(reason)
}
