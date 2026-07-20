/**
 * Shared application-staleness rules.
 *
 * Single source of truth for the "N days since last status change" rule so
 * Applications.jsx and Dashboard.jsx cannot drift apart when the threshold
 * or excluded-status list changes.
 */

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
