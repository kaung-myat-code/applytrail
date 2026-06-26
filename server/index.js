const express = require('express')
const fs = require('fs')
const path = require('path')
const { generateCoverLetter } = require('./lib/cover-letter')

const app = express()
const DATA_DIR = path.join(__dirname, '..')

app.use(express.json())

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

migrateApplications()

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
  res.json(readJSON('resume.json'))
})

app.put('/api/resume', (req, res) => {
  writeJSON('resume.json', req.body)
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

  const resume = readJSON('resume.json')
  const paragraph = generateCoverLetter(resume, posting)

  res.json({ ok: true, cover_letter_paragraph: paragraph })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
