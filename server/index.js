const express = require('express')
const fs = require('fs')
const path = require('path')
const helmet = require('helmet')
const compression = require('compression')
const { generateCoverLetter } = require('./lib/cover-letter')
const { getProvider } = require('./lib/analysis/engine')

const app = express()
const DATA_DIR = path.join(__dirname, '..')
const DEMO_DIR = path.join(__dirname, 'demo-data')

app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  app.use(helmet({ contentSecurityPolicy: false }))
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

app.get('/api/applications', (req, res) => {
  const applications = readJSON('applications.json')
  applications.sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))
  res.json(applications)
})

app.post('/api/applications', (req, res) => {
  const { job_posting_id, cover_letter_paragraph, status } = req.body

  if (!job_posting_id) {
    return res.status(400).json({ error: 'job_posting_id is required' })
  }

  const postings = readJSON('job_postings.json')
  const posting = postings.find(p => p.id === job_posting_id)

  if (!posting) {
    return res.status(404).json({ error: 'Job posting not found' })
  }

  const applications = readJSON('applications.json')
  const now = new Date().toISOString().split('T')[0]

  const newApplication = {
    id: generateId(),
    job_posting_id,
    company: posting.company,
    role: posting.role,
    cover_letter_paragraph: cover_letter_paragraph || '',
    status: status || 'drafted',
    date_applied: now,
    last_status_change: now
  }

  applications.push(newApplication)
  writeJSON('applications.json', applications)
  res.json({ ok: true, application: newApplication })
})

const VALID_STATUSES = ['drafted', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn']

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
  const resumeData = req.body.resume_data || {
    contact: {}, summary: '', experience: [], projects: [], education: [], skills: []
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
      for (const aiProvider of AI_PROVIDERS) {
        try {
          const provider = getProvider(aiProvider)
          const report = await provider.analyzeResume(resume, posting, aiProvider)
          const suggestions = await provider.generateSuggestions(resume, report, aiProvider)
          const isFallback = aiProvider !== providerName
          return res.json({
            ok: true,
            report,
            suggestions,
            provider: aiProvider,
            fallback: isFallback || undefined,
            fallback_reason: isFallback ? `Provider ${providerName} failed, using ${aiProvider}` : undefined,
          })
        } catch (err) {
          lastError = err
          console.error(`AI provider ${aiProvider} failed:`, err.message)
          // Continue to next provider
        }
      }
      // All AI providers failed, fall back to heuristic
      console.error('All AI providers failed, falling back to heuristic:', lastError?.message)
      const heuristicProvider = getProvider('heuristic')
      const report = heuristicProvider.analyzeResume(resume, posting)
      const suggestions = heuristicProvider.generateSuggestions(resume, report)
      const sanitizedReason = (lastError?.message || 'Unknown error')
        .replace(/AIza[A-Za-z0-9_-]{30,}/g, '[redacted]')
        .replace(/sk-[A-Za-z0-9]{20,}/g, '[redacted]')
      return res.json({
        ok: true,
        report,
        suggestions,
        provider: 'heuristic',
        fallback: true,
        fallback_reason: sanitizedReason,
      })
    }

    // Heuristic provider (synchronous)
    const provider = getProvider(providerName)
    const report = provider.analyzeResume(resume, posting)
    const suggestions = provider.generateSuggestions(resume, report)
    res.json({ ok: true, report, suggestions, provider: providerName })
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
