import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './ResumeLibrary.module.css'

function ResumeLibrary() {
  const [library, setLibrary] = useState({ selected_id: null, versions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingId, setDeletingId] = useState(null)

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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ResumeLibrary
