const express = require('express')
const fs = require('fs')
const path = require('path')
const { generateCoverLetter } = require('./lib/cover-letter')

const app = express()
const DATA_DIR = path.join(__dirname, '..')

app.use(express.json())

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

app.get('/api/applications', (req, res) => {
  res.json(readJSON('applications.json'))
})

app.get('/api/job-postings', (req, res) => {
  res.json(readJSON('job_postings.json'))
})

app.post('/api/job-postings', (req, res) => {
  const postings = readJSON('job_postings.json')
  const newPosting = {
    id: Date.now().toString(),
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
