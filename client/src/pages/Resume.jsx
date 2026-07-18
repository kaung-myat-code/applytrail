import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import styles from './Resume.module.css'
import modalStyles from '../components/CreateApplicationModal.module.css'
import SectionEditor from '../components/SectionEditor'

function Resume() {
  const { id } = useParams()
  const [resumeData, setResumeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [dirty, setDirty] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const previewButtonRef = useRef(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    loadResume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!showPreview) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [showPreview])

  useEffect(() => {
    if (!showPreview) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        closePreview()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showPreview])

  useEffect(() => {
    if (showPreview) {
      closeButtonRef.current?.focus()
    }
  }, [showPreview])

  function closePreview() {
    setShowPreview(false)
    previewButtonRef.current?.focus()
  }

  function loadResume() {
    setLoading(true)
    setLoadError('')
    const request = id ? fetch(`/api/resume-library/${id}`) : fetch('/api/resume')
    request
      .then((res) => {
        if (!res.ok) throw new Error(`Server error (${res.status})`)
        return res.json()
      })
      .then((data) => {
        setResumeData(data)
        setSkillsText((data.skills || []).join(', '))
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load resume:', err)
        setLoadError('Failed to load resume. Please check your connection and try again.')
        setLoading(false)
      })
  }

  function handleFieldChange(field, value) {
    setDirty(true)
    setResumeData((prev) => ({ ...prev, [field]: value }))
  }

  function handleContactChange(field, value) {
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }))
  }

  // --- Experience handlers ---
  function handleExperienceChange(index, field, value) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.experience]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, experience: updated }
    })
  }

  function handleExperienceBulletChange(expIndex, bulletIndex, value) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.experience]
      const bullets = [...updated[expIndex].bullets]
      bullets[bulletIndex] = value
      updated[expIndex] = { ...updated[expIndex], bullets }
      return { ...prev, experience: updated }
    })
  }

  function addExperienceBullet(expIndex) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.experience]
      updated[expIndex] = {
        ...updated[expIndex],
        bullets: [...updated[expIndex].bullets, ''],
      }
      return { ...prev, experience: updated }
    })
  }

  function removeExperienceBullet(expIndex, bulletIndex) {
    if (!window.confirm('Remove this bullet point?')) return
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.experience]
      const bullets = updated[expIndex].bullets.filter((_, i) => i !== bulletIndex)
      updated[expIndex] = { ...updated[expIndex], bullets }
      return { ...prev, experience: updated }
    })
  }

  function addExperience() {
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', role: '', period: '', bullets: [''] },
      ],
    }))
  }

  function removeExperience(index) {
    if (!window.confirm("Remove this experience entry? This can't be undone until you save.")) return
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }

  // --- Projects handlers ---
  function handleProjectChange(index, field, value) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.projects]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, projects: updated }
    })
  }

  function handleProjectBulletChange(projIndex, bulletIndex, value) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.projects]
      const bullets = [...updated[projIndex].bullets]
      bullets[bulletIndex] = value
      updated[projIndex] = { ...updated[projIndex], bullets }
      return { ...prev, projects: updated }
    })
  }

  function addProjectBullet(projIndex) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.projects]
      updated[projIndex] = {
        ...updated[projIndex],
        bullets: [...updated[projIndex].bullets, ''],
      }
      return { ...prev, projects: updated }
    })
  }

  function removeProjectBullet(projIndex, bulletIndex) {
    if (!window.confirm('Remove this bullet point?')) return
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.projects]
      const bullets = updated[projIndex].bullets.filter((_, i) => i !== bulletIndex)
      updated[projIndex] = { ...updated[projIndex], bullets }
      return { ...prev, projects: updated }
    })
  }

  function addProject() {
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { name: '', description: '', bullets: [''] },
      ],
    }))
  }

  function removeProject(index) {
    if (!window.confirm("Remove this project entry? This can't be undone until you save.")) return
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }))
  }

  // --- Education handlers ---
  function handleEducationChange(index, field, value) {
    setDirty(true)
    setResumeData((prev) => {
      const updated = [...prev.education]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, education: updated }
    })
  }

  function addEducation() {
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', school: '', year: '' },
      ],
    }))
  }

  function removeEducation(index) {
    if (!window.confirm("Remove this education entry? This can't be undone until you save.")) return
    setDirty(true)
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  // --- Save ---
  function handleSave() {
    if (!resumeData) return
    setSaving(true)
    setSavedMessage('')
    setSaveError('')

    // Split skills text into array before saving
    const dataToSave = {
      ...resumeData,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    }

    const saveRequest = id
      ? fetch(`/api/resume-library/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_data: dataToSave }),
        })
      : fetch('/api/resume', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        })

    saveRequest
      .then((res) => {
        if (!res.ok) throw new Error(`Server error (${res.status})`)
        return res.json()
      })
      .then(() => {
        // Sync local state with what was saved
        setResumeData(dataToSave)
        setSaving(false)
        setSavedMessage('Saved!')
        setDirty(false)
      })
      .catch((err) => {
        console.error('Failed to save resume:', err)
        setSaving(false)
        setSaveError('Failed to save. Please try again.')
      })
  }

  if (loading) {
    return <div className={styles.loading}>Loading resume...</div>
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <h1>Resume</h1>
        <div className={styles.errorBox}>
          <p>{loadError}</p>
          <button className={styles.retryButton} onClick={loadResume}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const previewSkills = skillsText
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  return (
    <div className={styles.page}>
      <h1>Resume</h1>
      <div className={styles.form}>
        {/* Name & Contact */}
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

        {/* Summary */}
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

        {/* Experience */}
        <SectionEditor title="Experience">
          {(resumeData.experience || []).map((exp, expIndex) => (
            <div key={expIndex} className={styles.entryCard}>
              <div className={styles.entryHeader}>
                <div className={styles.entryRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(expIndex, 'company', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Role"
                    value={exp.role}
                    onChange={(e) => handleExperienceChange(expIndex, 'role', e.target.value)}
                  />
                </div>
                <div className={styles.entryRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Period (e.g. Jan 2024 - Present)"
                    value={exp.period}
                    onChange={(e) => handleExperienceChange(expIndex, 'period', e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.bulletList}>
                {exp.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className={styles.bulletRow}>
                    <textarea
                      className={styles.textarea}
                      placeholder="Bullet point"
                      value={bullet}
                      onChange={(e) =>
                        handleExperienceBulletChange(expIndex, bulletIndex, e.target.value)
                      }
                    />
                    <button
                      className={styles.removeButton}
                      disabled={exp.bullets.length === 1}
                      onClick={() => removeExperienceBullet(expIndex, bulletIndex)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={styles.addButton}
                onClick={() => addExperienceBullet(expIndex)}
              >
                Add Bullet
              </button>
              <button
                className={styles.removeEntryButton}
                onClick={() => removeExperience(expIndex)}
              >
                Remove Experience
              </button>
            </div>
          ))}
          <button className={styles.addButton} onClick={addExperience}>
            Add Experience
          </button>
        </SectionEditor>

        {/* Projects */}
        <SectionEditor title="Projects">
          {(resumeData.projects || []).map((proj, projIndex) => (
            <div key={projIndex} className={styles.entryCard}>
              <div className={styles.entryHeader}>
                <div className={styles.entryRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Project name"
                    value={proj.name}
                    onChange={(e) => handleProjectChange(projIndex, 'name', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Description"
                    value={proj.description}
                    onChange={(e) =>
                      handleProjectChange(projIndex, 'description', e.target.value)
                    }
                  />
                </div>
              </div>
              <div className={styles.bulletList}>
                {proj.bullets.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className={styles.bulletRow}>
                    <textarea
                      className={styles.textarea}
                      placeholder="Bullet point"
                      value={bullet}
                      onChange={(e) =>
                        handleProjectBulletChange(projIndex, bulletIndex, e.target.value)
                      }
                    />
                    <button
                      className={styles.removeButton}
                      disabled={proj.bullets.length === 1}
                      onClick={() => removeProjectBullet(projIndex, bulletIndex)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                className={styles.addButton}
                onClick={() => addProjectBullet(projIndex)}
              >
                Add Bullet
              </button>
              <button
                className={styles.removeEntryButton}
                onClick={() => removeProject(projIndex)}
              >
                Remove Project
              </button>
            </div>
          ))}
          <button className={styles.addButton} onClick={addProject}>
            Add Project
          </button>
        </SectionEditor>

        {/* Skills */}
        <SectionEditor title="Skills">
          <input
            className={styles.skillsInput}
            type="text"
            placeholder="JavaScript, React, Node.js, ..."
            value={skillsText}
            onChange={(e) => {
              setDirty(true)
              setSkillsText(e.target.value)
            }}
          />
          <p className={styles.skillsHint}>Separate skills with commas</p>
        </SectionEditor>

        {/* Education */}
        <SectionEditor title="Education">
          {(resumeData.education || []).map((edu, eduIndex) => (
            <div key={eduIndex} className={styles.entryCard}>
              <div className={styles.entryHeader}>
                <div className={styles.entryRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(eduIndex, 'degree', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="School"
                    value={edu.school}
                    onChange={(e) => handleEducationChange(eduIndex, 'school', e.target.value)}
                  />
                </div>
                <div className={styles.entryRow}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Year (e.g. Graduated 2022)"
                    value={edu.year}
                    onChange={(e) => handleEducationChange(eduIndex, 'year', e.target.value)}
                  />
                </div>
              </div>
              <button
                className={styles.removeEntryButton}
                onClick={() => removeEducation(eduIndex)}
              >
                Remove Education
              </button>
            </div>
          ))}
          <button className={styles.addButton} onClick={addEducation}>
            Add Education
          </button>
        </SectionEditor>

        {/* Save */}
        <div className={styles.saveRow}>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            ref={previewButtonRef}
            className={styles.addButton}
            onClick={() => setShowPreview(true)}
          >
            Preview Resume
          </button>
          {dirty && (
            <span className={styles.unsavedIndicator}>● Unsaved changes</span>
          )}
          {!dirty && savedMessage && (
            <span className={styles.savedMessage}>✓ Saved</span>
          )}
          {saveError && (
            <span className={styles.saveError}>{saveError}</span>
          )}
        </div>
      </div>

      {showPreview && (
        <div
          className={modalStyles.backdrop}
          data-testid="resume-preview-backdrop"
          onClick={closePreview}
        >
          <div
            className={modalStyles.dialog}
            data-testid="resume-preview-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={modalStyles.title}>Resume Preview</h2>
            <p className={modalStyles.subtext}>
              This is how your resume data is structured. Close this to keep editing.
            </p>

            <div className={modalStyles.field}>
              <strong>{resumeData.name}</strong>
              {resumeData.contact?.email && <span> · {resumeData.contact.email}</span>}
              {resumeData.contact?.github && <span> · {resumeData.contact.github}</span>}
              {resumeData.contact?.location && <span> · {resumeData.contact.location}</span>}
            </div>

            {resumeData.summary && (
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Summary</span>
                <p>{resumeData.summary}</p>
              </div>
            )}

            {previewSkills.length > 0 && (
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Skills</span>
                <p>{previewSkills.join(', ')}</p>
              </div>
            )}

            {(resumeData.experience || []).length > 0 && (
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Experience</span>
                {(resumeData.experience || []).map((exp, i) => (
                  <div key={i}>
                    <strong>{exp.company}</strong>
                    <span> — {exp.role} · {exp.period}</span>
                    <ul>
                      {(exp.bullets || []).map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {(resumeData.projects || []).length > 0 && (
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Projects</span>
                {(resumeData.projects || []).map((proj, i) => (
                  <div key={i}>
                    <strong>{proj.name}</strong>
                    {proj.description && <p>{proj.description}</p>}
                    <ul>
                      {(proj.bullets || []).map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {(resumeData.education || []).length > 0 && (
              <div className={modalStyles.field}>
                <span className={modalStyles.label}>Education</span>
                {(resumeData.education || []).map((edu, i) => (
                  <div key={i}>
                    <strong>{edu.degree}</strong>
                    <span> — {edu.school} · {edu.year}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={modalStyles.footer}>
              <button
                type="button"
                ref={closeButtonRef}
                className={modalStyles.btn}
                onClick={closePreview}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Resume
