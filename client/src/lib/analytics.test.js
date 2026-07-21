import { describe, it, expect, afterEach, vi } from 'vitest'
import { initAnalytics } from './analytics.js'

function getGoatCounterScript() {
  return document.querySelector('script[src*="gc.zgo.at/count.js"]')
}

describe('initAnalytics', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllEnvs()
  })

  it('injects the GoatCounter script when VITE_GOATCOUNTER_SITE is set', () => {
    vi.stubEnv('VITE_GOATCOUNTER_SITE', 'applytrail')

    initAnalytics()

    const script = getGoatCounterScript()
    expect(script).not.toBeNull()
    expect(script.getAttribute('data-goatcounter')).toBe('https://applytrail.goatcounter.com/count')
  })

  it('injects no script when VITE_GOATCOUNTER_SITE is unset', () => {
    vi.stubEnv('VITE_GOATCOUNTER_SITE', '')

    initAnalytics()

    expect(getGoatCounterScript()).toBeNull()
  })

  it('does not inject a duplicate script when called twice', () => {
    vi.stubEnv('VITE_GOATCOUNTER_SITE', 'applytrail')

    initAnalytics()
    initAnalytics()

    const scripts = document.querySelectorAll('script[src*="gc.zgo.at/count.js"]')
    expect(scripts.length).toBe(1)
  })
})
