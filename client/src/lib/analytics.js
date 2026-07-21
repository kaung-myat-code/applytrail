const GOATCOUNTER_SCRIPT_SRC = '//gc.zgo.at/count.js'

/**
 * Injects the GoatCounter pageview counter script, but only when
 * VITE_GOATCOUNTER_SITE is set (e.g. in production). Local dev is
 * untracked by default since the env var is unset.
 *
 * Safe to call multiple times (idempotent — will not inject a duplicate
 * script) and safe to call in non-browser environments (no-op).
 */
export function initAnalytics() {
  const site = import.meta.env.VITE_GOATCOUNTER_SITE

  if (!site) {
    return
  }

  if (typeof document === 'undefined') {
    return
  }

  if (document.querySelector(`script[src*="${GOATCOUNTER_SCRIPT_SRC}"]`)) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = GOATCOUNTER_SCRIPT_SRC
  script.setAttribute('data-goatcounter', `https://${site}.goatcounter.com/count`)
  document.body.appendChild(script)
}
