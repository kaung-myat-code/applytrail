import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styles from './CoverLetter.module.css'

function CoverLetter() {
  const location = useLocation()
  const [postings, setPostings] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedApplication, setSavedApplication] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showSavedBanner, setShowSavedBanner] = useState(!!location.state?.justSavedPosting)

  useEffect(() => {
    fetch('/api/job-postings')
      .then(res => res.json())
      .then(data => setPostings(data))
      .catch(err => console.error('Failed to load postings:', err))
  }, [])

  useEffect(() => {
    if (showSavedBanner) {
      const timer = setTimeout(() => setShowSavedBanner(false), 3000)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleGenerate(e) {
    e.preventDefault()
    if (!selectedId) return

    setLoading(true)
    setError('')
    setCoverLetter('')
    setCopied(false)
    setSavedApplication(null)

    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_posting_id: selectedId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setCoverLetter(data.cover_letter_paragraph)
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(coverLetter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: selectedId,
          cover_letter_paragraph: coverLetter,
          status: 'drafted'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save application')
      }
      setSavedApplication(data.application)
    } catch {
      setError('Failed to save application')
    } finally {
      setSaving(false)
    }
  }

  function countSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  }

  if (postings.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Cover Letter Generator</h1>
        <div className={styles.empty}>
          <p>No job postings found.</p>
          <p>
            <Link to="/new" className={styles.link}>Add a job posting first</Link> to generate a cover letter.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1>Cover Letter Generator</h1>
      {showSavedBanner && <div className={styles.savedBanner}>Job posting saved. Select it below to generate a cover letter.</div>}
      <p className={styles.description}>
        Select a job posting and generate a tailored cover letter paragraph based on your resume.
      </p>

      <form className={styles.form} onSubmit={handleGenerate}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="posting">Job Posting</label>
          <select
            className={styles.select}
            id="posting"
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setSavedApplication(null) }}
            required
          >
            <option value="">Select a job posting...</option>
            {postings.map(p => (
              <option key={p.id} value={p.id}>
                {p.company} — {p.role}
              </option>
            ))}
          </select>
        </div>

        <button
          className={styles.generateButton}
          type="submit"
          disabled={!selectedId || loading}
        >
          {loading ? 'Generating...' : 'Generate Cover Letter'}
        </button>

        {error && (
          <div className={styles.error}>{error}</div>
        )}
      </form>

      {coverLetter && (
        <div className={styles.result}>
          <div className={styles.paragraph}>{coverLetter}</div>
          <div className={styles.resultActions}>
            <button className={styles.copyButton} onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <span className={styles.meta}>
              {coverLetter.length} characters · {countSentences(coverLetter)} sentences
            </span>
          </div>

          {!savedApplication ? (
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Application'}
            </button>
          ) : (
            <div className={styles.saved}>
              Application saved — <Link to="/applications">View in Applications</Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CoverLetter
