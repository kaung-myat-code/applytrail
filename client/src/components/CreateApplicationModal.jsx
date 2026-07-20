import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import styles from './CreateApplicationModal.module.css'
import { STATUS_OPTIONS } from '../lib/applicationStatus'

function CreateApplicationModal({
  mode,
  company,
  role,
  postingText,
  postingId,
  resumeVersionId,
  resumeVersionName,
  onCancel,
  onSuccess,
}) {
  const [companyValue, setCompanyValue] = useState(company)
  const [roleValue, setRoleValue] = useState(role)
  const [status, setStatus] = useState('drafted')
  const [coverLetter, setCoverLetter] = useState('')
  const [coverLetterLoading, setCoverLetterLoading] = useState(true)
  const [coverLetterError, setCoverLetterError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const companyInputRef = useRef(null)

  useEffect(() => {
    async function fetchCoverLetter() {
      try {
        const res = await fetch('/api/generate-cover-letter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_posting_id: postingId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to generate cover letter')
        setCoverLetter(data.cover_letter_paragraph || '')
      } catch {
        setCoverLetterError(true)
      } finally {
        setCoverLetterLoading(false)
      }
    }

    fetchCoverLetter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    companyInputRef.current?.focus()
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConfirm() {
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: postingId,
          resume_version_id: resumeVersionId,
          company: companyValue,
          role: roleValue,
          status,
          cover_letter_paragraph: coverLetter,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Couldn't create the application. Try again.")
      onSuccess(data.application)
    } catch (err) {
      setSubmitError(`Couldn't create the application. ${err.message}. Try again.`)
    } finally {
      setSubmitting(false)
    }
  }

  const excerpt = !postingText
    ? 'No job posting text available.'
    : postingText.length > 280
      ? postingText.slice(0, 280) + '…'
      : postingText

  const title = mode === 'auto' ? 'Create application for this resume?' : 'Create Application'

  return (
    <div
      className={styles.backdrop}
      data-testid="modal-backdrop"
      onClick={onCancel}
    >
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtext}>
          Review the details below, then confirm to add this to your application tracker.
        </p>

        {submitError && <div className={styles.error}>{submitError}</div>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="create-app-company">Company</label>
          <input
            id="create-app-company"
            ref={companyInputRef}
            className={styles.input}
            type="text"
            value={companyValue}
            onChange={e => setCompanyValue(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="create-app-role">Role</label>
          <input
            id="create-app-role"
            className={styles.input}
            type="text"
            value={roleValue}
            onChange={e => setRoleValue(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="create-app-status">Status</label>
          <select
            id="create-app-status"
            className={styles.select}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Job Posting</span>
          <p className={styles.readOnlyField}>{excerpt}</p>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Resume Version</span>
          <span className={`${styles.readOnlyField} ${styles.resumeVersionName}`}>
            {resumeVersionName}
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="create-app-cover-letter">Cover Letter (editable)</label>
          <textarea
            id="create-app-cover-letter"
            className={styles.textarea}
            value={coverLetterLoading ? 'Generating cover letter...' : coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            disabled={coverLetterLoading}
          />
          {coverLetterError && (
            <p className={styles.coverLetterNote}>
              Couldn&apos;t auto-generate a cover letter. You can write one manually below, or leave it blank and add it later.
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.btn} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Confirm & Create Application'}
          </button>
        </div>
      </div>
    </div>
  )
}

CreateApplicationModal.propTypes = {
  mode: PropTypes.string,
  company: PropTypes.string,
  role: PropTypes.string,
  postingText: PropTypes.string,
  postingId: PropTypes.string,
  resumeVersionId: PropTypes.string,
  resumeVersionName: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
}

export default CreateApplicationModal
