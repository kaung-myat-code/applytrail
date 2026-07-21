const express = require('express')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const compression = require('compression')
const { generateCoverLetter } = require('./lib/cover-letter')
const { getProvider } = require('./lib/analysis/engine')
const { sanitizeError } = require('./lib/analysis/providers/ai')
const { validateMatchReport, validateSuggestions } = require('./lib/analysis/validate')
const { validateResume } = require('./lib/validateResume')
const { defaultResumeData } = require('./lib/defaultResumeData')
const { applyPatches } = require('./lib/tailor/applyPatches')
const pdfmake = require('pdfmake')
const { buildResumePdfDefinition } = require('./lib/pdf')

const app = express()
const DATA_DIR = path.join(__dirname, '..')
const DEMO_DIR = path.join(__dirname, 'demo-data')

app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  // Scoped CSP rather than disabling it outright: the built client only
  // needs 'unsafe-inline' for style-src (a handful of components use the
  // inline `style` attribute) and the Google Fonts stylesheet/font hosts
  // referenced in client/index.html. Everything else stays same-origin.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'https://gc.zgo.at'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://gc.zgo.at', 'https://*.goatcounter.com'],
      },
    },
  }))
  app.use(compression())
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11)
}

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) {
    return []
  }
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

const VALID_ID = /^[a-z0-9]+$/
const LIBRARY_DIR = path.join(DATA_DIR, 'resume_library')

function readLibraryIndex() {
  const indexPath = path.join(LIBRARY_DIR, 'index.json')
  if (!fs.existsSync(indexPath)) {
    return { selected_id: null, versions: [] }
  }
  const raw = fs.readFileSync(indexPath, 'utf-8')
  return JSON.parse(raw)
}

function writeLibraryIndex(index) {
  if (!fs.existsSync(LIBRARY_DIR)) {
    fs.mkdirSync(LIBRARY_DIR, { recursive: true })
  }
  fs.writeFileSync(
    path.join(LIBRARY_DIR, 'index.json'),
    JSON.stringify(index, null, 2) + '\n',
    'utf-8'
  )
}

function readResumeVersion(id) {
  if (!VALID_ID.test(id)) return null
  const filePath = path.join(LIBRARY_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function writeResumeVersion(id, data) {
  if (!VALID_ID.test(id)) return
  if (!fs.existsSync(LIBRARY_DIR)) {
    fs.mkdirSync(LIBRARY_DIR, { recursive: true })
  }
  fs.writeFileSync(
    path.join(LIBRARY_DIR, `${id}.json`),
    JSON.stringify(data, null, 2) + '\n',
    'utf-8'
  )
}

// Drafts: ephemeral storage for suggestion accept/reject decisions while
// the user reviews a tailored resume. DRAFTS_DIR resolves to project-root
// drafts/ (DATA_DIR = path.join(__dirname, '..')), consistent with the
// existing convention where job_postings.json and resume_library/ also
// live at the project root.
const DRAFTS_DIR = path.join(DATA_DIR, 'drafts')

function ensureDraftsDir() {
  if (!fs.existsSync(DRAFTS_DIR)) {
    fs.mkdirSync(DRAFTS_DIR, { recursive: true })
  }
}

function readDraft(id) {
  if (!VALID_ID.test(id)) return null
  const filePath = path.join(DRAFTS_DIR, `${id}.json`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function writeDraft(id, data) {
  ensureDraftsDir()
  fs.writeFileSync(
    path.join(DRAFTS_DIR, `${id}.json`),
    JSON.stringify(data, null, 2) + '\n',
    'utf-8'
  )
}

function deleteDraftFile(id) {
  const filePath = path.join(DRAFTS_DIR, `${id}.json`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

// Clean up orphaned draft files older than 24 hours (runs once at startup)
function cleanOldDrafts() {
  if (!fs.existsSync(DRAFTS_DIR)) return

  const MAX_AGE_MS = 24 * 60 * 60 * 1000
  const now = Date.now()
  const files = fs.readdirSync(DRAFTS_DIR)
  let removed = 0

  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const filePath = path.join(DRAFTS_DIR, file)
    try {
      const stat = fs.statSync(filePath)
      if (now - stat.mtimeMs > MAX_AGE_MS) {
        fs.unlinkSync(filePath)
        removed++
      }
    } catch {
      // Ignore files that disappear mid-scan
    }
  }

  if (removed > 0) {
    console.log(`Cleaned up ${removed} orphaned draft(s) older than 24 hours`)
  }
}

// Seed demo data on startup when data files are missing or empty
function seedDemoData() {
  const files = ['resume.json', 'job_postings.json', 'applications.json']

  for (const filename of files) {
    const dataPath = path.join(DATA_DIR, filename)
    const demoPath = path.join(DEMO_DIR, filename)

    // Check if demo source exists
    if (!fs.existsSync(demoPath)) {
      continue
    }

    // Check if data file needs seeding
    let needsSeed = false
    if (!fs.existsSync(dataPath)) {
      needsSeed = true
    } else {
      try {
        const raw = fs.readFileSync(dataPath, 'utf-8').trim()
        if (!raw) {
          needsSeed = true
        } else {
          const parsed = JSON.parse(raw)
          if (filename === 'resume.json') {
            needsSeed = typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0
          } else {
            needsSeed = Array.isArray(parsed) && parsed.length === 0
          }
        }
      } catch {
        needsSeed = true
      }
    }

    if (needsSeed) {
      const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf-8'))
      writeJSON(filename, demoData)
      console.log(`Seeded ${filename} from demo data`)
    }
  }
}

// Migrate legacy application records (runs once at startup)
function migrateApplications() {
  const applications = readJSON('applications.json')
  let migrated = false

  for (const app of applications) {
    if (!app.id) {
      app.id = generateId()
      migrated = true
    }
    if (!app.last_status_change) {
      app.last_status_change = app.date_applied || new Date().toISOString().split('T')[0]
      migrated = true
    }
    if (!app.job_posting_id) {
      app.job_posting_id = ''
      migrated = true
    }
  }

  if (migrated) {
    writeJSON('applications.json', applications)
    console.log('Migrated ' + applications.length + ' legacy application records')
  }
}

// Migrate existing resume.json to library structure (runs once at startup)
function migrateResumeLibrary() {
  if (fs.existsSync(LIBRARY_DIR)) return

  fs.mkdirSync(LIBRARY_DIR, { recursive: true })

  const resume = readJSON('resume.json')
  if (
    (Array.isArray(resume) && resume.length === 0) ||
    (typeof resume === 'object' && !Array.isArray(resume) && Object.keys(resume).length === 0)
  ) {
    return
  }

  const id = generateId()
  const now = new Date().toISOString().split('T')[0]

  const index = {
    selected_id: id,
    versions: [{
      id,
      name: 'Default Resume',
      created_at: now,
      updated_at: now,
      source_id: null
    }]
  }

  writeLibraryIndex(index)
  writeResumeVersion(id, resume)
  console.log('Migrated resume to library structure')
}

seedDemoData()
migrateApplications()
migrateResumeLibrary()
cleanOldDrafts()

// Register the Roboto font for PDF export (once, at startup). pdfmake only
// resolves a font for a text block when the document definition names a
// registered font (see buildResumePdfDefinition's defaultStyle.font). The
// installed pdfmake version exposes { vfs, fonts } from the Roboto font
// package -- addFonts() only accepts the flat `fonts` descriptor, so the
// font file bytes (`vfs`) must be separately written into pdfmake's virtual
// filesystem before addFonts is called, or font resolution fails at render time.
const RobotoFont = require('pdfmake/build/fonts/Roboto')
pdfmake.addFonts(RobotoFont.fonts)
for (const [filename, entry] of Object.entries(RobotoFont.vfs)) {
  pdfmake.virtualfs.writeFileSync(filename, Buffer.from(entry.data, entry.encoding || 'base64'))
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.get('/api/applications', (req, res) => {
  const applications = readJSON('applications.json')
  applications.sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))
  res.json(applications)
})

// NOTE: client/src/lib/applicationStatus.js's STATUS_OPTIONS is the client-side
// copy of this same enum. client/ and server/ are separate npm packages with
// no shared module boundary, so keep the two lists in sync whenever a status
// is added, renamed, or removed -- otherwise the client dropdown can offer a
// status this API then rejects with a 400.
const VALID_STATUSES = ['drafted', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn']

app.post('/api/applications', (req, res) => {
  const { job_posting_id, resume_version_id, company, role, cover_letter_paragraph, status } = req.body

  if (!job_posting_id) {
    return res.status(400).json({ error: 'job_posting_id is required' })
  }

  const postings = readJSON('job_postings.json')
  const posting = postings.find(p => p.id === job_posting_id)

  if (!posting) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  if (resume_version_id) {
    if (!VALID_ID.test(resume_version_id)) {
      return res.status(400).json({ error: 'Invalid resume version ID' })
    }
    if (!readResumeVersion(resume_version_id)) {
      return res.status(404).json({ error: 'Resume version not found' })
    }
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  const applications = readJSON('applications.json')
  const now = new Date().toISOString().split('T')[0]

  const newApplication = {
    id: generateId(),
    job_posting_id,
    resume_version_id: resume_version_id || null,
    company: company || posting.company,
    role: role || posting.role,
    cover_letter_paragraph: cover_letter_paragraph || '',
    status: status || 'drafted',
    date_applied: now,
    last_status_change: now
  }

  applications.push(newApplication)
  writeJSON('applications.json', applications)
  res.json({ ok: true, application: newApplication })
})

app.put('/api/applications/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
  }

  const applications = readJSON('applications.json')
  const index = applications.findIndex(a => a.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Application not found' })
  }

  const now = new Date().toISOString().split('T')[0]
  applications[index].status = status
  applications[index].last_status_change = now

  writeJSON('applications.json', applications)
  res.json({ ok: true, application: applications[index] })
})

app.get('/api/job-postings', (req, res) => {
  res.json(readJSON('job_postings.json'))
})

app.post('/api/job-postings', (req, res) => {
  const postings = readJSON('job_postings.json')
  const newPosting = {
    id: generateId(),
    company: req.body.company,
    role: req.body.role,
    posting_text: req.body.posting_text,
    created_at: new Date().toISOString().split('T')[0]
  }
  postings.push(newPosting)
  writeJSON('job_postings.json', postings)
  res.json({ ok: true, posting: newPosting })
})

app.get('/api/resume', (req, res) => {
  const index = readLibraryIndex()
  if (index.selected_id) {
    const data = readResumeVersion(index.selected_id)
    if (data) return res.json(data)
  }
  res.json(readJSON('resume.json'))
})

app.put('/api/resume', (req, res) => {
  const validation = validateResume(req.body)
  if (!validation.ok) {
    return res.status(400).json({ error: 'Invalid resume data', details: validation.errors })
  }

  const index = readLibraryIndex()
  if (index.selected_id) {
    writeResumeVersion(index.selected_id, req.body)
    const entry = index.versions.find(v => v.id === index.selected_id)
    if (entry) entry.updated_at = new Date().toISOString().split('T')[0]
    writeLibraryIndex(index)
  } else {
    writeJSON('resume.json', req.body)
  }
  res.json({ ok: true })
})

// Resume Library CRUD endpoints

app.get('/api/resume-library', (req, res) => {
  const index = readLibraryIndex()
  res.json(index)
})

app.post('/api/resume-library', (req, res) => {
  const name = req.body.name || 'Untitled Resume'
  const id = generateId()
  const now = new Date().toISOString().split('T')[0]
  const resumeData = req.body.resume_data || defaultResumeData()

  const validation = validateResume(resumeData)
  if (!validation.ok) {
    return res.status(400).json({ error: 'Invalid resume data', details: validation.errors })
  }

  const index = readLibraryIndex()
  const entry = { id, name, created_at: now, updated_at: now, source_id: null }
  index.versions.push(entry)
  if (index.versions.length === 1) {
    index.selected_id = id
  }

  writeResumeVersion(id, resumeData)
  writeLibraryIndex(index)
  res.json({ ok: true, version: entry })
})

app.get('/api/resume-library/:id', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }
  const data = readResumeVersion(id)
  if (!data) {
    return res.status(404).json({ error: 'Resume version not found' })
  }
  res.json(data)
})

app.put('/api/resume-library/:id', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }

  const index = readLibraryIndex()
  const entry = index.versions.find(v => v.id === id)
  if (!entry) {
    return res.status(404).json({ error: 'Resume version not found' })
  }

  if (req.body.name) {
    entry.name = req.body.name
  }
  if (req.body.resume_data) {
    const validation = validateResume(req.body.resume_data)
    if (!validation.ok) {
      return res.status(400).json({ error: 'Invalid resume data', details: validation.errors })
    }
    writeResumeVersion(id, req.body.resume_data)
  }
  entry.updated_at = new Date().toISOString().split('T')[0]
  writeLibraryIndex(index)
  res.json({ ok: true, version: entry })
})

app.delete('/api/resume-library/:id', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }

  const index = readLibraryIndex()
  const idx = index.versions.findIndex(v => v.id === id)
  if (idx === -1) {
    return res.status(404).json({ error: 'Resume version not found' })
  }
  if (index.versions.length === 1) {
    return res.status(400).json({ error: 'Cannot delete the last resume version' })
  }

  index.versions.splice(idx, 1)
  if (index.selected_id === id) {
    index.selected_id = index.versions[0].id
  }

  const filePath = path.join(LIBRARY_DIR, `${id}.json`)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
  writeLibraryIndex(index)
  res.json({ ok: true })
})

app.put('/api/resume-library/:id/select', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }

  const index = readLibraryIndex()
  const exists = index.versions.some(v => v.id === id)
  if (!exists) {
    return res.status(404).json({ error: 'Resume version not found' })
  }

  index.selected_id = id
  writeLibraryIndex(index)
  res.json({ ok: true, selected_id: id })
})

// Resume Library export endpoints

app.get('/api/resume-library/:id/export/json', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }
  const data = readResumeVersion(id)
  if (!data) {
    return res.status(404).json({ error: 'Resume version not found' })
  }
  res.attachment('resume.json').json(data)
})

app.get('/api/resume-library/:id/export/pdf', async (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid resume version ID' })
  }
  const data = readResumeVersion(id)
  if (!data) {
    return res.status(404).json({ error: 'Resume version not found' })
  }

  try {
    const docDefinition = buildResumePdfDefinition(data)
    const pdfDoc = pdfmake.createPdf(docDefinition)
    const buffer = await pdfDoc.getBuffer()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"')
    res.send(buffer)
  } catch (err) {
    console.error('PDF export error:', err)
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message })
  }
})

// Draft CRUD endpoints -- ephemeral storage for tailored resume review sessions

app.post('/api/drafts', (req, res) => {
  const { resume_id, posting_id, suggestions, decisions, provider } = req.body

  if (!resume_id || !VALID_ID.test(resume_id)) {
    return res.status(400).json({ error: 'Invalid or missing resume_id' })
  }
  const sourceResume = readResumeVersion(resume_id)
  if (!sourceResume) {
    return res.status(400).json({ error: 'resume_id not found in library' })
  }

  if (!posting_id) {
    return res.status(400).json({ error: 'posting_id is required' })
  }
  const postings = readJSON('job_postings.json')
  const posting = postings.find(p => p.id === posting_id)
  if (!posting) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  if (!Array.isArray(suggestions)) {
    return res.status(400).json({ error: 'suggestions must be an array' })
  }
  const VALID_SECTIONS = ['summary', 'skills', 'experience', 'projects', 'education']
  const VALID_TYPES = ['add', 'modify', 'remove']
  const seenSuggestionIds = new Set()
  for (const s of suggestions) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' ||
        !VALID_SECTIONS.includes(s.section) || !VALID_TYPES.includes(s.type)) {
      return res.status(400).json({ error: 'Invalid suggestion object in suggestions array' })
    }
    if (seenSuggestionIds.has(s.id)) {
      return res.status(400).json({ error: `Duplicate suggestion id: ${s.id}` })
    }
    seenSuggestionIds.add(s.id)
  }
  if (decisions !== undefined && (typeof decisions !== 'object' || decisions === null || Array.isArray(decisions))) {
    return res.status(400).json({ error: 'decisions must be an object' })
  }

  const VALID_PROVIDERS = ['heuristic', 'gemini', 'openrouter', 'groq']
  const safeProvider = VALID_PROVIDERS.includes(provider) ? provider : 'heuristic'

  const id = generateId()
  const draft = {
    id,
    resume_id,
    posting_id,
    company: posting.company,
    role: posting.role,
    provider: safeProvider,
    suggestions,
    decisions: decisions || {},
    created_at: new Date().toISOString().split('T')[0]
  }

  writeDraft(id, draft)
  res.json({ ok: true, draft })
})

app.get('/api/drafts/:id', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid draft ID' })
  }

  const draft = readDraft(id)
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' })
  }

  const sourceResume = readResumeVersion(draft.resume_id)
  if (!sourceResume) {
    return res.status(400).json({ error: 'Source resume for this draft no longer exists' })
  }

  const result = applyPatches(sourceResume, draft.suggestions, draft.decisions)

  const libraryIndex = readLibraryIndex()
  const sourceEntry = libraryIndex.versions.find(v => v.id === draft.resume_id)
  const source_name = sourceEntry ? sourceEntry.name : null

  res.json({
    ...draft,
    tailored_resume: result.resume,
    validation: result.validation,
    source_name
  })
})

app.post('/api/drafts/:id/save', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid draft ID' })
  }

  const draft = readDraft(id)
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' })
  }

  const sourceResume = readResumeVersion(draft.resume_id)
  if (!sourceResume) {
    return res.status(400).json({ error: 'Source resume for this draft no longer exists' })
  }

  const result = applyPatches(sourceResume, draft.suggestions, draft.decisions)
  if (!result.validation.ok) {
    return res.status(400).json({ error: 'Tailored resume failed validation', details: result.validation.errors })
  }

  const newId = generateId()
  const now = new Date().toISOString().split('T')[0]
  const name = req.body.name || `${draft.company} - ${draft.role}`

  writeResumeVersion(newId, result.resume)

  const index = readLibraryIndex()
  const entry = { id: newId, name, created_at: now, updated_at: now, source_id: draft.resume_id }
  index.versions.push(entry)
  writeLibraryIndex(index)

  deleteDraftFile(draft.id)

  res.json({ ok: true, version: entry })
})

app.delete('/api/drafts/:id', (req, res) => {
  const { id } = req.params
  if (!VALID_ID.test(id)) {
    return res.status(400).json({ error: 'Invalid draft ID' })
  }

  const draft = readDraft(id)
  if (!draft) {
    return res.status(404).json({ error: 'Draft not found' })
  }

  deleteDraftFile(id)
  res.json({ ok: true })
})

app.post('/api/generate-cover-letter', (req, res) => {
  const { job_posting_id } = req.body

  if (!job_posting_id) {
    return res.status(400).json({ error: 'job_posting_id is required' })
  }

  const postings = readJSON('job_postings.json')
  const posting = postings.find(p => p.id === job_posting_id)

  if (!posting) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  const libraryIndex = readLibraryIndex()
  let resume
  if (libraryIndex.selected_id) {
    resume = readResumeVersion(libraryIndex.selected_id)
  }
  if (!resume) {
    resume = readJSON('resume.json')
  }
  const paragraph = generateCoverLetter(resume, posting)

  res.json({ ok: true, cover_letter_paragraph: paragraph })
})

app.post('/api/analyze', async (req, res) => {
  const { job_posting_id, resume_version_id, provider: providerName = 'heuristic' } = req.body

  if (!job_posting_id) {
    return res.status(400).json({ error: 'job_posting_id is required' })
  }

  const postings = readJSON('job_postings.json')
  const posting = postings.find(p => p.id === job_posting_id)

  if (!posting) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  // Resolve resume: specific version, selected version, or legacy resume.json
  let resume
  if (resume_version_id) {
    if (!VALID_ID.test(resume_version_id)) {
      return res.status(400).json({ error: 'Invalid resume version ID' })
    }
    resume = readResumeVersion(resume_version_id)
  } else {
    const libraryIndex = readLibraryIndex()
    if (libraryIndex.selected_id) {
      resume = readResumeVersion(libraryIndex.selected_id)
    }
    if (!resume) {
      resume = readJSON('resume.json')
    }
  }

  if (!resume || (typeof resume === 'object' && Object.keys(resume).length === 0)) {
    return res.status(400).json({ error: 'No resume content found. Add content to your resume first.' })
  }

  const AI_PROVIDERS = ['gemini', 'openrouter', 'groq']

  try {
    // If AI provider selected, try with fallback chain
    if (AI_PROVIDERS.includes(providerName)) {
      let lastError
      let selectedProviderError
      const fallbackOrder = [
        providerName,
        ...AI_PROVIDERS.filter(p => p !== providerName),
      ]
      for (const aiProvider of fallbackOrder) {
        try {
          const provider = getProvider(aiProvider)
          const report = await provider.analyzeResume(resume, posting, aiProvider)
          const suggestions = await provider.generateSuggestions(resume, report, aiProvider)
          const isFallback = aiProvider !== providerName
          const reportValidation = validateMatchReport(report)
          const suggestionsValidation = validateSuggestions(suggestions, resume)
          if (!reportValidation.valid || !suggestionsValidation.valid) {
            const shapeError = new Error(`Provider ${aiProvider} returned an invalid report/suggestions shape`)
            console.error(shapeError.message, reportValidation.errors, suggestionsValidation.errors)
            lastError = shapeError
            if (aiProvider === providerName) {
              selectedProviderError = shapeError
            }
            // Do not ship an invalid shape to the client — try the next provider instead
            continue
          }
          return res.json({
            ok: true,
            report,
            suggestions,
            provider: aiProvider,
            fallback: isFallback || undefined,
            fallback_reason: isFallback ? `Provider ${providerName} failed, using ${aiProvider}` : undefined,
            validation: {
              report: reportValidation,
              suggestions: suggestionsValidation,
            },
          })
        } catch (err) {
          lastError = err
          if (aiProvider === providerName) {
            selectedProviderError = err
          }
          console.error(`AI provider ${aiProvider} failed:`, err.message)
          // Continue to next provider
        }
      }
      // All AI providers failed, fall back to heuristic
      console.error('All AI providers failed, falling back to heuristic:', lastError?.message)
      const heuristicProvider = getProvider('heuristic')
      const report = heuristicProvider.analyzeResume(resume, posting)
      const suggestions = heuristicProvider.generateSuggestions(resume, report)
      const sanitizedReason = sanitizeError(selectedProviderError || lastError || new Error('Unknown error'))
      const reportValidation = validateMatchReport(report)
      const suggestionsValidation = validateSuggestions(suggestions, resume)
      if (!reportValidation.valid || !suggestionsValidation.valid) {
        console.error('Heuristic fallback produced an invalid report/suggestions shape:', reportValidation.errors, suggestionsValidation.errors)
        return res.status(500).json({ error: 'Analysis failed. Check server logs for details.' })
      }
      return res.json({
        ok: true,
        report,
        suggestions,
        provider: 'heuristic',
        fallback: true,
        fallback_reason: sanitizedReason,
        validation: {
          report: reportValidation,
          suggestions: suggestionsValidation,
        },
      })
    }

    // Heuristic provider (synchronous)
    const provider = getProvider(providerName)
    const report = provider.analyzeResume(resume, posting)
    const suggestions = provider.generateSuggestions(resume, report)
    const reportValidation = validateMatchReport(report)
    const suggestionsValidation = validateSuggestions(suggestions, resume)
    if (!reportValidation.valid || !suggestionsValidation.valid) {
      console.error('Heuristic provider produced an invalid report/suggestions shape:', reportValidation.errors, suggestionsValidation.errors)
      return res.status(500).json({ error: 'Analysis failed. Check server logs for details.' })
    }
    res.json({
      ok: true,
      report,
      suggestions,
      provider: providerName,
      validation: {
        report: reportValidation,
        suggestions: suggestionsValidation,
      },
    })
  } catch (err) {
    console.error('Analysis error:', err)
    res.status(500).json({ error: 'Analysis failed. Check server logs for details.' })
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'))
  })
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
