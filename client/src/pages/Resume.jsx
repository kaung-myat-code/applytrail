import { useState, useEffect } from 'react'
import styles from './Resume.module.css'

function Resume() {
  const [resumeData, setResumeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    fetch('/api/resume')
      .then((res) => res.json())
      .then((data) => {
        setResumeData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load resume:', err)
        setLoading(false)
      })
  }, [])

  function handleFieldChange(field, value) {
    setResumeData((prev) => ({ ...prev, [field]: value }))
  }

  function handleContactChange(field, value) {
    setResumeData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }))
  }

  function handleSave() {
    setSaving(true)
    setSavedMessage('')

    fetch('/api/resume', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resumeData),
    })
      .then((res) => res.json())
      .then(() => {
        setSaving(false)
        setSavedMessage('Saved!')
        setTimeout(() => setSavedMessage(''), 2000)
      })
      .catch((err) => {
        console.error('Failed to save resume:', err)
        setSaving(false)
      })
  }

  if (loading) {
    return <div className={styles.loading}>Loading resume...</div>
  }

  return (
    <div className={styles.page}>
      <h1>Resume</h1>
      <div className={styles.form}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Name & Contact</h2>
          <div className={styles.field}>
            <label className={styles.label}>Name</label>
            <input
              className={styles.input}
              type="text"
              value={resumeData.name || ''}
              onChange={(e) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="text"
              value={resumeData.contact?.email || ''}
              onChange={(e) => handleContactChange('email', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>GitHub</label>
            <input
              className={styles.input}
              type="text"
              value={resumeData.contact?.github || ''}
              onChange={(e) => handleContactChange('github', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Location</label>
            <input
              className={styles.input}
              type="text"
              value={resumeData.contact?.location || ''}
              onChange={(e) => handleContactChange('location', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Summary</h2>
          <div className={styles.field}>
            <textarea
              className={styles.textarea}
              rows={4}
              value={resumeData.summary || ''}
              onChange={(e) => handleFieldChange('summary', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.saveRow}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {savedMessage && (
            <span className={styles.savedMessage}>{savedMessage}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Resume
