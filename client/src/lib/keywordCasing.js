/**
 * Client-side display-casing helper for keyword badges.
 *
 * client/ and server/ are separate npm packages with no shared module
 * boundary, so this mirrors server/lib/analysis/keywords.js's
 * ACRONYM_CASING map. Keep the two in sync when either changes.
 */
export const ACRONYM_CASING = {
  sql: 'SQL', api: 'API', apis: 'APIs', aws: 'AWS', gcp: 'GCP', css: 'CSS',
  html: 'HTML', ui: 'UI', ux: 'UX', ci: 'CI', cd: 'CD', tdd: 'TDD', bdd: 'BDD',
  php: 'PHP', rest: 'REST', restful: 'RESTful', grpc: 'gRPC', graphql: 'GraphQL',
  json: 'JSON', xml: 'XML', yaml: 'YAML', jwt: 'JWT', oauth: 'OAuth',
  saml: 'SAML', ldap: 'LDAP', kpi: 'KPI', kpis: 'KPIs', okr: 'OKR', okrs: 'OKRs',
  roi: 'ROI', seo: 'SEO', b2b: 'B2B', b2c: 'B2C', nosql: 'NoSQL', dotnet: '.NET',
}

/**
 * Returns a display-cased version of a keyword string.
 * - Known acronyms are mapped to their conventional casing (e.g. "sql" -> "SQL").
 * - Fully-lowercase keywords (the heuristic provider's default output) are
 *   capitalized (e.g. "dashboarding" -> "Dashboarding").
 * - Keywords that already contain uppercase letters (e.g. from a future AI
 *   provider) are left exactly as returned, never re-capitalized.
 */
export function displayCase(kw) {
  if (ACRONYM_CASING[kw]) return ACRONYM_CASING[kw]
  if (kw === kw.toLowerCase()) {
    return kw.charAt(0).toUpperCase() + kw.slice(1)
  }
  return kw
}
