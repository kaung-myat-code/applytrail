import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import styles from './PreviewTailored.module.css'

function PreviewTailored() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')

  const [draft, setDraft] = useState(null)
  const [tailoredResume, setTailoredResume] = useState(null)
  const [validation, setValidation] = useState(null)
  const [sourceName, setSourceName] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!draftId) {
      setError('No draft specified. Start a new analysis.')
      setLoading(false)
      return
    }

    async function fetchDraft() {
      try {
        const res = await fetch(`/api/drafts/${draftId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Draft not found')
        setDraft(data)
        setTailoredResume(data.tailored_resume)
        setValidation(data.validation)
        setSourceName(data.source_name || '')
        const company = data.company || location.state?.company || ''
        const role = data.role || location.state?.role || ''
        setName(`${company} - ${role}`)
      } catch (err) {
        setError(err.message || 'Failed to load draft.')
      } finally {
        setLoading(false)
      }
    }

    fetchDraft()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId])

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/drafts/${draftId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save resume')
      navigate('/resume-library')
    } catch (err) {
      setSaveError(err.message || 'Failed to save tailored resume.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className={styles.page}><p>Loading tailored resume...</p></div>
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1>Preview Tailored Resume</h1>
        <div className={styles.error}>{error}</div>
        <Link to="/analysis" className={styles.backButton}>Back to Analysis</Link>
      </div>
    )
  }

  const resume = tailoredResume || {}
  const contact = resume.contact || {}
  const experience = resume.experience || []
  const projects = resume.projects || []
  const education = resume.education || []
  const skills = resume.skills || []
  const validationFailed = validation && validation.ok === false

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <input
          className={styles.nameField}
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Resume name"
        />
        {sourceName && (
          <p className={styles.sourceInfo}>Based on: {sourceName}</p>
        )}
      </div>

      {validationFailed && (
        <div className={styles.validationErrors}>
          <strong>This tailored resume failed validation:</strong>
          <ul>
            {(validation.errors || []).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p>Go back to suggestions and adjust your decisions before saving.</p>
        </div>
      )}

      <div className={styles.contactInfo}>
        <strong>{resume.name}</strong>
        {contact.email && <span> · {contact.email}</span>}
        {contact.github && <span> · {contact.github}</span>}
        {contact.location && <span> · {contact.location}</span>}
      </div>

      {resume.summary && (
        <div className={styles.resumeSection}>
          <h2 className={styles.sectionTitle}>Summary</h2>
          <p>{resume.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className={styles.resumeSection}>
          <h2 className={styles.sectionTitle}>Skills</h2>
          <div className={styles.skillList}>
            {skills.map((s, i) => (
              <span key={i} className={styles.skillBadge}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div className={styles.resumeSection}>
          <h2 className={styles.sectionTitle}>Experience</h2>
          {experience.map((e, i) => (
            <div key={i} className={styles.entry}>
              <div className={styles.entryHeader}>
                <strong>{e.company}</strong>
                <span className={styles.entryMeta}>{e.role} · {e.period}</span>
              </div>
              <ul className={styles.bulletList}>
                {(e.bullets || []).map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className={styles.resumeSection}>
          <h2 className={styles.sectionTitle}>Projects</h2>
          {projects.map((p, i) => (
            <div key={i} className={styles.entry}>
              <div className={styles.entryHeader}>
                <strong>{p.name}</strong>
              </div>
              {p.description && <p className={styles.entryDescription}>{p.description}</p>}
              <ul className={styles.bulletList}>
                {(p.bullets || []).map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className={styles.resumeSection}>
          <h2 className={styles.sectionTitle}>Education</h2>
          {education.map((e, i) => (
            <div key={i} className={styles.entry}>
              <div className={styles.entryHeader}>
                <strong>{e.degree}</strong>
                <span className={styles.entryMeta}>{e.school} · {e.year}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {saveError && (
        <div className={styles.error}>{saveError}</div>
      )}

      <div className={styles.footer}>
        <Link to={`/analysis/review?draft=${draftId}`} className={styles.backButton}>
          Back to Suggestions
        </Link>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving || validationFailed}
        >
          {saving ? 'Saving...' : 'Save to Library'}
        </button>
      </div>
    </div>
  )
}

export default PreviewTailored
