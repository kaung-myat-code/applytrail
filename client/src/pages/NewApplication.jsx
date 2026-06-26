import { useState } from 'react'
import styles from './NewApplication.module.css'

function NewApplication() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [postingText, setPostingText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/job-postings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, posting_text: postingText })
      })

      if (!res.ok) throw new Error('Request failed')

      setCompany('')
      setRole('')
      setPostingText('')
      setMessage('Job posting saved!')
      setMessageType('success')

      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('Failed to save. Please try again.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1>New Application</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="company">Company Name</label>
          <input
            className={styles.input}
            id="company"
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="role">Role Title</label>
          <input
            className={styles.input}
            id="role"
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="postingText">Job Posting Text</label>
          <textarea
            className={styles.textarea}
            id="postingText"
            rows={12}
            placeholder="Paste the job posting text here..."
            value={postingText}
            onChange={e => setPostingText(e.target.value)}
            required
          />
        </div>

        <button className={styles.submitButton} type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Job Posting'}
        </button>

        {message && (
          <div className={`${styles.message} ${styles[messageType]}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}

export default NewApplication
