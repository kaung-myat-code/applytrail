import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './ResumeLibrary.module.css'
import CreateApplicationModal from '../components/CreateApplicationModal.jsx'

function ResumeLibrary() {
  const navigate = useNavigate()
  const [library, setLibrary] = useState({ selected_id: null, versions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [creatingApplicationFor, setCreatingApplicationFor] = useState(null)
  const [exportingId, setExportingId] = useState(null)

  function fetchLibrary() {
    fetch('/api/resume-library')
      .then(res => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then(data => {
        setLibrary(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load resume library')
        setLoading(false)
      })
  }

  useEffect(() => { fetchLibrary() }, [])

  async function handleCreate() {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/resume-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Resume' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create resume')
      fetchLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleSelect(id) {
    setError('')
    try {
      const res = await fetch(`/api/resume-library/${id}/select`, { method: 'PUT' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to select resume')
      fetchLibrary()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRename(id) {
    setError('')
    try {
      const res = await fetch(`/api/resume-library/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to rename resume')
      setRenamingId(null)
      fetchLibrary()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this resume version?')) return
    setError('')
    setDeletingId(id)
    try {
      const res = await fetch(`/api/resume-library/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete resume')
      fetchLibrary()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCreateApplication(version) {
    setError('')
    try {
      const res = await fetch('/api/job-postings')
      const postings = await res.json()
      if (!res.ok) throw new Error('Failed to load job postings')
      if (!Array.isArray(postings) || postings.length === 0) {
        setError('No job posting found. Create a job posting first from New Application before creating an application from this resume.')
        return
      }
      const mostRecent = [...postings].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]
      setCreatingApplicationFor({ version, posting: mostRecent })
    } catch (err) {
      setError(err.message || 'Failed to load job postings')
    }
  }

  function handleExportJson(id) {
    setExportingId(id)
    const a = document.createElement('a')
    a.href = `/api/resume-library/${id}/export/json`
    a.download = 'resume.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setExportingId(null), 1000)
  }

  function handleExportPdf(id) {
    setExportingId(id)
    const a = document.createElement('a')
    a.href = `/api/resume-library/${id}/export/pdf`
    a.download = 'resume.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setExportingId(null), 1000)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <h1>Resume Library</h1>
        <div className={styles.loading}>Loading resume library...</div>
      </div>
    )
  }

  if (library.versions.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Resume Library</h1>
        <div className={styles.empty}>
          <p>No resume versions yet. Create your first resume to get started.</p>
          <button className={styles.btnPrimary} onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'New Resume'}
          </button>
        </div>
      </div>
    )
  }

  const linkedResumeVersionLabel = creatingApplicationFor
    ? `${creatingApplicationFor.version.name} (linked to posting: ${creatingApplicationFor.posting.company} - ${creatingApplicationFor.posting.role})`
    : ''

  return (
    <div className={styles.page}>
      <h1>Resume Library</h1>
      <p className={styles.description}>
        Manage multiple resume versions and select which one to use for analysis and tailoring.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.btnPrimary}
        onClick={handleCreate}
        disabled={creating}
        style={{ marginBottom: 'var(--space-4)' }}
      >
        {creating ? 'Creating...' : 'New Resume'}
      </button>

      <div className={styles.list}>
        {library.versions.map(version => (
          <div key={version.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.name}>
                {renamingId === version.id ? (
                  <div className={styles.renameForm}>
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRename(version.id)}
                      autoFocus
                    />
                    <button className={styles.btn} onClick={() => handleRename(version.id)}>Save</button>
                    <button className={styles.btn} onClick={() => setRenamingId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    {version.name || 'Untitled Resume'}
                    {version.id === library.selected_id && (
                      <span className={styles.selectedBadge}>(selected)</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className={styles.meta}>
              <span>Created: {version.created_at}</span>
              <span>Updated: {version.updated_at}</span>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.btn}
                onClick={() => handleSelect(version.id)}
                disabled={version.id === library.selected_id}
              >
                {version.id === library.selected_id ? 'Selected' : 'Select'}
              </button>
              <button
                className={styles.btn}
                onClick={() => {
                  setRenamingId(version.id)
                  setRenameValue(version.name || '')
                }}
              >
                Rename
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => handleDelete(version.id)}
                disabled={deletingId === version.id || library.versions.length === 1}
              >
                Delete
              </button>
              <Link to={`/resume/${version.id}`} className={styles.btn}>
                Edit
              </Link>
              <button
                className={styles.btn}
                onClick={() => handleExportPdf(version.id)}
                disabled={exportingId === version.id}
              >
                {exportingId === version.id ? 'Exporting...' : 'Export PDF'}
              </button>
              <button
                className={styles.btn}
                onClick={() => handleExportJson(version.id)}
                disabled={exportingId === version.id}
              >
                {exportingId === version.id ? 'Exporting...' : 'Export JSON'}
              </button>
              <button
                className={styles.btn}
                onClick={() => handleCreateApplication(version)}
              >
                Create Application
              </button>
            </div>
          </div>
        ))}
      </div>

      {creatingApplicationFor && (
        <CreateApplicationModal
          mode="manual"
          company={creatingApplicationFor.posting.company}
          role={creatingApplicationFor.posting.role}
          postingText={creatingApplicationFor.posting.posting_text}
          postingId={creatingApplicationFor.posting.id}
          resumeVersionId={creatingApplicationFor.version.id}
          resumeVersionName={linkedResumeVersionLabel}
          onCancel={() => setCreatingApplicationFor(null)}
          onSuccess={() => navigate('/applications')}
        />
      )}
    </div>
  )
}

export default ResumeLibrary
