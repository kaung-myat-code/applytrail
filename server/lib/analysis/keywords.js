/**
 * Shared keyword extraction utilities for analysis and cover letter generation.
 * Single source of truth for stop words and keyword parsing.
 */

/**
 * Whitelist of known technical terms.
 * Only tokens matching this list are extracted as keywords from job postings.
 * This prevents common English words ("passionate", "description", "job") from
 * being treated as missing skills.
 *
 * Keep alphabetically sorted within each category for easy maintenance.
 */
const TECH_KEYWORDS = new Set([
  // --- Languages ---
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'go', 'golang',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
  'haskell', 'elixir', 'clojure', 'f#', 'objective-c', 'assembly', 'bash',
  'shell', 'powershell', 'sql', 'nosql', 'html', 'css', 'scss', 'sass',
  'less', 'graphql', 'protobuf', 'yaml', 'json', 'xml', 'markdown',

  // --- Frontend frameworks ---
  'react', 'reactjs', 'react.js', 'next', 'nextjs', 'next.js', 'vue', 'vuejs',
  'vue.js', 'nuxt', 'nuxtjs', 'angular', 'angularjs', 'svelte', 'sveltejs',
  'ember', 'backbone', 'jquery', 'htmx', 'solid', 'solidjs', 'remix', 'astro',

  // --- Backend frameworks ---
  'node', 'nodejs', 'node.js', 'express', 'expressjs', 'nestjs', 'fastify',
  'koa', 'hapi', 'django', 'flask', 'fastapi', 'spring', 'springboot',
  'rails', 'rubyonrails', 'laravel', 'symfony', 'asp.net', '.net', '.netcore',
  'dotnet', 'gin', 'fiber', 'actix', 'axum', 'actix-web',

  // --- Mobile ---
  'reactnative', 'react-native', 'flutter', 'dart', 'ionic', 'xamarin',
  'capacitor', 'expo', 'android', 'ios', 'swiftui', 'uikit',

  // --- Databases ---
  'postgresql', 'postgres', 'mysql', 'mariadb', 'sqlite', 'mongodb', 'mongo',
  'redis', 'memcached', 'elasticsearch', 'elastic', 'cassandra', 'dynamodb',
  'couchdb', 'couchbase', 'neo4j', 'influxdb', 'timescaledb', 'supabase',
  'firebase', 'planetscale', 'neon', 'turso',

  // --- Cloud & infrastructure ---
  'aws', 'amazon', 'gcp', 'googlecloud', 'azure', 'digitalocean', 'heroku',
  'vercel', 'netlify', 'cloudflare', 'render', 'fly.io', 'railway',

  // --- DevOps & CI/CD ---
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'puppet', 'chef',
  'jenkins', 'gitlab', 'github', 'bitbucket', 'circleci', 'travisci',
  'githubactions', 'github-actions', 'argo', 'argocd', 'helm', 'istio',
  'prometheus', 'grafana', 'datadog', 'newrelic', 'splunk', 'pagerduty',

  // --- Testing ---
  'jest', 'mocha', 'chai', 'jasmine', 'cypress', 'playwright', 'selenium',
  'puppeteer', 'vitest', 'pytest', 'unittest', 'junit', 'rspec', 'minitest',
  'k6', 'gatling', 'postman', 'supertest', 'testing-library',

  // --- Build tools & package managers ---
  'webpack', 'vite', 'rollup', 'esbuild', 'parcel', 'turbopack', 'turborepo',
  'npm', 'yarn', 'pnpm', 'bun', 'gradle', 'maven', 'sbt', 'pip', 'poetry',
  'pub', 'cargo', 'gem', 'composer',

  // --- API & protocols ---
  'rest', 'restful', 'api', 'apis', 'grpc', 'websocket', 'websockets',
  'soap', 'oauth', 'jwt', 'openid', 'saml', 'ldap',

  // --- Data & ML ---
  'pandas', 'numpy', 'scipy', 'scikit-learn', 'sklearn', 'tensorflow',
  'pytorch', 'keras', 'huggingface', 'langchain', 'openai', 'anthropic',
  'spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'snowflake', 'bigquery',
  'redshift', 'databricks', 'jupyter', 'notebook',

  // --- State management ---
  'redux', 'zustand', 'mobx', 'recoil', 'jotai', 'pinia', 'vuex', 'ngrx',
  'redux-saga', 'redux-thunk',

  // --- CSS & design ---
  'tailwind', 'tailwindcss', 'bootstrap', 'materialui', 'mui', 'chakra',
  'shadcn', 'radix', 'headlessui', 'styled-components', 'emotion',
  'figma', 'sketch', 'adobe', 'zeplin', 'invision',

  // --- Auth & security ---
  'passport', 'auth0', 'clerk', 'supabase-auth', 'keycloak', 'oauth2',
  'bcrypt', 'argon2', 'helmet', 'cors', 'csrf',

  // --- CMS & content ---
  'wordpress', 'drupal', 'strapi', 'contentful', 'sanity', 'prismic',
  'ghost', 'notion', 'airtable',

  // --- Misc tools ---
  'git', 'linux', 'unix', 'macos', 'windows', 'vim', 'neovim', 'vscode',
  'postman', 'insomnia', 'swagger', 'openapi', 'prisma', 'drizzle',
  'typeorm', 'sequelize', 'mongoose', 'knex', 'objection',
  'socket.io', 'pusher', 'algolia', 'meilisearch', 'typesense',
  'puppet', 'cheerio', 'playwright',

  // --- Methodologies ---
  'agile', 'scrum', 'kanban', 'lean', 'tdd', 'bdd', 'ci', 'cd',
  'devops', 'gitops', 'mlops', 'microservices', 'serverless', 'lamda',
  'event-driven', 'cqrs', 'ddd',

  // --- Product / Data / Business skills ---
  'ab-testing', 'b2b', 'b2c', 'cohort-analysis', 'cross-functional',
  'dashboarding', 'dashboards', 'data-visualization', 'experimentation',
  'forecasting', 'go-to-market', 'kpi', 'kpis', 'okr', 'okrs',
  'prioritization', 'product metrics', 'product-strategy', 'roadmapping',
  'roi', 'seo', 'stakeholder communication', 'stakeholder-management',
])

/**
 * Maps known lowercase acronyms/terms to their conventional display casing.
 * Consumed by callers that render extracted keywords back to the user
 * (e.g. the Analysis page's keyword badges) so "sql" displays as "SQL"
 * instead of naive Title Case. Any keyword not present here is left as-is
 * by the caller's own casing logic.
 */
const ACRONYM_CASING = {
  sql: 'SQL', api: 'API', apis: 'APIs', aws: 'AWS', gcp: 'GCP', css: 'CSS',
  html: 'HTML', ui: 'UI', ux: 'UX', ci: 'CI', cd: 'CD', tdd: 'TDD', bdd: 'BDD',
  php: 'PHP', rest: 'REST', restful: 'RESTful', grpc: 'gRPC', graphql: 'GraphQL',
  json: 'JSON', xml: 'XML', yaml: 'YAML', jwt: 'JWT', oauth: 'OAuth',
  saml: 'SAML', ldap: 'LDAP', kpi: 'KPI', kpis: 'KPIs', okr: 'OKR', okrs: 'OKRs',
  roi: 'ROI', seo: 'SEO', b2b: 'B2B', b2c: 'B2C', nosql: 'NoSQL', dotnet: '.NET',
}

/**
 * Extract meaningful keywords from text.
 * Uses a whitelist approach: only tokens matching known technical terms
 * are extracted. This prevents common English words from being treated
 * as keywords.
 *
 * Returns deduplicated array of lowercase keyword strings.
 */
function extractKeywords(text) {
  if (!text || typeof text !== 'string') return []

  const lower = text.toLowerCase()

  const tokens = lower
    .split(/[^a-z0-9.+#-]+/)
    .filter(t => t.length >= 2 && t.length <= 30 && TECH_KEYWORDS.has(t))

  const phrases = [...TECH_KEYWORDS]
    .filter(member => member.includes(' ') && lower.includes(member))

  return [...new Set([...tokens, ...phrases])]
}

/**
 * Extract keywords from all resume sections.
 * Aggregates keywords from skills, summary, experience, projects, and education.
 * Returns a deduplicated array of lowercase keyword strings.
 */
function extractResumeKeywords(resume) {
  const keywords = new Set()

  // Skills: use directly (lowercased)
  for (const skill of (resume.skills || [])) {
    if (typeof skill === 'string') {
      keywords.add(skill.toLowerCase().trim())
    }
  }

  // Summary: extract keywords from summary text
  for (const kw of extractKeywords(resume.summary || '')) {
    keywords.add(kw)
  }

  // Experience bullets
  for (const exp of (resume.experience || [])) {
    for (const bullet of (exp.bullets || [])) {
      for (const kw of extractKeywords(bullet)) {
        keywords.add(kw)
      }
    }
  }

  // Project bullets
  for (const proj of (resume.projects || [])) {
    for (const bullet of (proj.bullets || [])) {
      for (const kw of extractKeywords(bullet)) {
        keywords.add(kw)
      }
    }
  }

  // Education: degree and school (no bullets — education entries don't have them)
  for (const edu of (resume.education || [])) {
    if (edu.degree) {
      for (const kw of extractKeywords(edu.degree)) {
        keywords.add(kw)
      }
    }
    if (edu.school) {
      for (const kw of extractKeywords(edu.school)) {
        keywords.add(kw)
      }
    }
  }

  return [...keywords]
}

/**
 * Normalize a keyword/skill string for exact comparison: lowercase, trim,
 * and collapse whitespace/underscore separators to a single canonical
 * hyphen so equivalent phrasings (e.g. "react native" vs "react-native")
 * compare equal without resorting to substring containment.
 */
function normalizeKeyword(str) {
  return String(str).toLowerCase().trim().replace(/[\s_]+/g, '-')
}

/**
 * Compare two keyword/skill strings for an exact (normalized) match.
 * Deliberately NOT a substring check — plain `.includes()` comparisons
 * produce false positives like "django".includes("go") or
 * "javascript".includes("java"), which silently mark unrelated posting
 * keywords as matched.
 */
function keywordsMatch(a, b) {
  return normalizeKeyword(a) === normalizeKeyword(b)
}

/**
 * Check whether `keyword` appears in `text` as a whole word/phrase rather
 * than as an arbitrary substring — avoids the same false-positive class as
 * keywordsMatch (e.g. "go" inside "django") when scanning longer free text
 * such as resume bullets.
 */
function textContainsKeyword(text, keyword) {
  if (!text || !keyword) return false
  const escaped = String(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i')
  return pattern.test(String(text))
}

module.exports = { TECH_KEYWORDS, extractKeywords, extractResumeKeywords, ACRONYM_CASING, keywordsMatch, textContainsKeyword }
