/**
 * Shared application-status constants and staleness rules.
 *
 * Single source of truth for the status enum (within the client package) so
 * CreateApplicationModal.jsx and Applications.jsx cannot drift apart, and
 * for the "N days since last status change" rule so Applications.jsx and
 * Dashboard.jsx cannot drift apart either.
 *
 * NOTE: server/index.js maintains its own VALID_STATUSES copy of this enum.
 * client/ and server/ are separate npm packages with no shared module
 * boundary (see client/src/lib/keywordCasing.js for the same documented
 * tradeoff), so keep STATUS_OPTIONS below in sync with server/index.js's
 * VALID_STATUSES whenever a status is added, renamed, or removed.
 */

export const STATUS_OPTIONS = ['drafted', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn']

const STALE_THRESHOLD_DAYS = 10
const STALE_EXCLUDED_STATUSES = ['withdrawn', 'rejected']

/**
 * Days since an application's last status change (or its applied date if
 * no status change has been recorded yet).
 */
export function daysSinceLastChange(application) {
  const lastChange = new Date(application.last_status_change || application.date_applied)
  const now = new Date()
  return Math.floor((now - lastChange) / (1000 * 60 * 60 * 24))
}

/**
 * True when an application hasn't had a status change in
 * STALE_THRESHOLD_DAYS days and isn't in a terminal status
 * (withdrawn/rejected) that makes follow-up moot.
 */
export function isStale(application) {
  if (STALE_EXCLUDED_STATUSES.includes(application.status)) return false
  return daysSinceLastChange(application) >= STALE_THRESHOLD_DAYS
}
