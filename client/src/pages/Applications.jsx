import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './Applications.module.css'
import { isStale, daysSinceLastChange, STATUS_OPTIONS } from '../lib/applicationStatus'

const STATUS_CLASSES = {
  drafted: styles.statusDrafted,
  applied: styles.statusApplied,
  interviewing: styles.statusInterviewing,
  offered: styles.statusOffered,
  rejected: styles.statusRejected,
  withdrawn: styles.statusWithdrawn,
}

function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [successId, setSuccessId] = useState(null)

  useEffect(() => {
    fetch('/api/applications')
      .then(res => {
        if (!res.ok) throw new Error('Server error')
        return res.json()
      })
      .then(data => {
        setApplications(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load applications')
        setLoading(false)
      })
  }, [])

  async function handleStatusChange(appId, newStatus) {
    setUpdatingId(appId)
    setError('')
    setSuccessId(null)

    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      setApplications(prev =>
        prev.map(app => app.id === appId ? data.application : app)
      )
      setSuccessId(appId)
      setTimeout(() => setSuccessId(null), 2000)
    } catch (err) {
      setError(err.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <h1>Applications</h1>
        <div className={styles.loading}>Loading applications...</div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Applications</h1>
        <div className={styles.empty}>
          <p>No applications yet. Generate a cover letter first to save an application.</p>
          <p>
            <Link to="/cover-letter">Go to Cover Letter Generator</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1>Applications</h1>
      <p className={styles.description}>
        Track your job applications and follow up on stale ones.
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.list}>
        {applications.map(app => {
          const days = daysSinceLastChange(app)
          return (
            <div key={app.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.company}>{app.company}</div>
                  <div className={styles.role}>{app.role}</div>
                </div>
                <span className={`${styles.statusBadge} ${STATUS_CLASSES[app.status] || ''}`}>
                  {app.status}
                </span>
              </div>

              <div className={styles.meta}>
                <span>Applied on {app.date_applied}</span>
                <span>Last status change: {days} day{days === 1 ? '' : 's'} ago</span>
              </div>

              {isStale(app) && (
                <div className={styles.stale}>
                  <span>&#9888;</span> Needs follow-up — no status change in {days} days
                </div>
              )}

              <div className={styles.statusRow}>
                <select
                  className={styles.statusSelect}
                  value={app.status}
                  onChange={e => handleStatusChange(app.id, e.target.value)}
                  disabled={updatingId === app.id}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {successId === app.id && (
                  <span className={styles.success}>Updated</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Applications
