const express = require('express')
const fs = require('fs')
const path = require('path')

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

app.get('/api/resume', (req, res) => {
  res.json(readJSON('resume.json'))
})

app.put('/api/resume', (req, res) => {
  writeJSON('resume.json', req.body)
  res.json({ ok: true })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
