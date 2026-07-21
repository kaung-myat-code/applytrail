---
phase: quick-260721-vks
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - server/index.js
autonomous: true
requirements: []
must_haves:
  truths:
    - "The GoatCounter pageview beacon to https://{site}.goatcounter.com/count is no longer blocked by the production CSP"
  artifacts:
    - "server/index.js with connectSrc allowing https://*.goatcounter.com"
  key_links:
    - "helmet contentSecurityPolicy.directives.connectSrc → allows the analytics beacon origin"
---

<objective>
Add `https://*.goatcounter.com` to the production helmet CSP `connectSrc` directive in server/index.js so the GoatCounter pageview beacon (`https://{site}.goatcounter.com/count`) is no longer blocked.

Purpose: A prior fix (commit b79cf00) unblocked loading the tracking script from `gc.zgo.at`, but the beacon the script sends targets a different origin (`https://kaungmyat.goatcounter.com/count`, driven by VITE_GOATCOUNTER_SITE). Live Chrome DevTools inspection of the deployed site confirmed this beacon is still blocked by `connect-src 'self' https://gc.zgo.at`. Using a wildcard subdomain keeps the fix correct if the site name ever changes.

Output: One-line CSP change in server/index.js.
</objective>

<execution_context>
@/Users/kmpg/VibeCodeTours/applytrail/.claude/gsd-core/workflows/execute-plan.md
@/Users/kmpg/VibeCodeTours/applytrail/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@server/index.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Allow GoatCounter beacon origin in production CSP connectSrc</name>
  <files>server/index.js</files>
  <action>In the production helmet contentSecurityPolicy directives (currently around line 35), change the `connectSrc` directive from `["'self'", 'https://gc.zgo.at']` to `["'self'", 'https://gc.zgo.at', 'https://*.goatcounter.com']`. Keep `gc.zgo.at` — the tracking script itself still loads from there. Add the wildcard subdomain (not a hardcoded `kaungmyat.goatcounter.com`) so the beacon origin stays allowed if VITE_GOATCOUNTER_SITE changes. Do NOT modify scriptSrc — the script only ever loads from gc.zgo.at. Do not touch any other directive.</action>
  <verify>
    <automated>cd /Users/kmpg/VibeCodeTours/applytrail && NODE_ENV=production node -e "const h=require('helmet'); const fs=require('fs'); const s=fs.readFileSync('server/index.js','utf-8'); if(!/connectSrc:\s*\[[^\]]*'https:\/\/\*\.goatcounter\.com'/.test(s)){console.error('connectSrc missing goatcounter wildcard');process.exit(1)} if(!/connectSrc:\s*\[[^\]]*'https:\/\/gc\.zgo\.at'/.test(s)){console.error('connectSrc lost gc.zgo.at');process.exit(1)} require('./server/index.js'); process.exit(0)" 2>&1 | grep -qv 'missing\|lost' && echo PASS</automated>
  </verify>
  <done>connectSrc contains 'self', 'https://gc.zgo.at', and 'https://*.goatcounter.com'; scriptSrc unchanged; server/index.js still parses and loads without error.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Added `https://*.goatcounter.com` to the production CSP connectSrc directive so the GoatCounter pageview beacon is no longer blocked.</what-built>
  <how-to-verify>
    This CSP only activates in production (NODE_ENV=production), so the real confirmation happens after deploy to https://applytrail.onrender.com. After this change is committed and Render redeploys:
    1. Open https://applytrail.onrender.com in Chrome
    2. Open DevTools → Console. Confirm there is NO CSP error mentioning `kaungmyat.goatcounter.com/count` and `connect-src`.
    3. Open DevTools → Network, filter for `count`. Confirm the request to `https://kaungmyat.goatcounter.com/count?...` returns a successful status (not blocked).
    4. (Optional) Check the GoatCounter dashboard for the site `kaungmyat` to confirm the pageview was recorded.
  </how-to-verify>
  <resume-signal>Type "approved" once the beacon fires without a CSP error on the deployed site, or describe what you still see blocked.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser → third-party analytics | The client sends a pageview beacon to the GoatCounter origin |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-vks-01 | Information Disclosure | CSP connectSrc wildcard `*.goatcounter.com` | low | accept | Wildcard is scoped to a single trusted analytics vendor domain; only anonymous pageview data (path, title, screen size) is sent, consistent with the existing gc.zgo.at allowance. No secrets cross this boundary. |
</threat_model>

<verification>
- server/index.js `connectSrc` includes `'self'`, `'https://gc.zgo.at'`, and `'https://*.goatcounter.com'`
- `scriptSrc` is unchanged (still `["'self'", 'https://gc.zgo.at']`)
- Server module loads without error under NODE_ENV=production
- Post-deploy: no `connect-src` CSP console error for the goatcounter beacon on the live site
</verification>

<success_criteria>
The GoatCounter pageview beacon to `https://{site}.goatcounter.com/count` is allowed by the production CSP and records pageviews on the deployed site without a CSP violation.
</success_criteria>

<output>
Create `.planning/quick/260721-vks-fix-remaining-goatcounter-csp-block-add-/260721-vks-SUMMARY.md` when done
</output>
