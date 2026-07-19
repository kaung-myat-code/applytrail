import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './Dashboard.module.css'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchStats() {
      try {
        const [appRes, resumeRes, postingsRes] = await Promise.all([
          fetch('/api/applications'),
          fetch('/api/resume'),
          fetch('/api/job-postings'),
        ])

        if (!appRes.ok || !resumeRes.ok || !postingsRes.ok) {
          throw new Error('Failed to load dashboard data')
        }

        const [applications, resume, postings] = await Promise.all([
          appRes.json(),
          resumeRes.json(),
          postingsRes.json(),
        ])

        const stale = applications.filter(app => {
          const lastChange = new Date(app.last_status_change || app.date_applied)
          const days = Math.floor((Date.now() - lastChange) / (1000 * 60 * 60 * 24))
          return days >= 10 && app.status !== 'withdrawn' && app.status !== 'rejected'
        })

        const statusCounts = applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1
          return acc
        }, {})

        setStats({
          total: applications.length,
          stale: stale.length,
          interviewing: statusCounts.interviewing || 0,
          offered: statusCounts.offered || 0,
          postings: postings.length,
          hasResume: !!(resume.name && resume.name.trim()),
          recentApps: [...applications]
            .sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))
            .slice(0, 3),
        })
      } catch (err) {
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Your job search at a glance</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.total || 0}</span>
          <span className={styles.statLabel}>Applications</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.interviewing || 0}</span>
          <span className={styles.statLabel}>Interviewing</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{stats?.offered || 0}</span>
          <span className={styles.statLabel}>Offers</span>
        </div>
        <div className={`${styles.statCard} ${stats?.stale > 0 ? styles.statCardWarn : ''}`}>
          <span className={styles.statNumber}>{stats?.stale || 0}</span>
          <span className={styles.statLabel}>Need Follow-up</span>
        </div>
      </div>

      <div className={styles.sections}>
        {/* Quick actions */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actions}>
            <Link to="/resume" className={styles.actionCard}>
              <span className={styles.actionIcon}>{stats?.hasResume ? '✏️' : '📝'}</span>
              <span className={styles.actionLabel}>
                {stats?.hasResume ? 'Edit Resume' : 'Create Resume'}
              </span>
              <span className={styles.actionHint}>
                {stats?.hasResume ? 'Update your experience and skills' : 'Get started with your resume'}
              </span>
            </Link>
            <Link to="/new" className={styles.actionCard}>
              <span className={styles.actionIcon}>📋</span>
              <span className={styles.actionLabel}>Add Job Posting</span>
              <span className={styles.actionHint}>Paste a new job listing</span>
            </Link>
            <Link to="/cover-letter" className={styles.actionCard}>
              <span className={styles.actionIcon}>✉️</span>
              <span className={styles.actionLabel}>Generate Cover Letter</span>
              <span className={styles.actionHint}>Tailor your letter to a posting</span>
            </Link>
          </div>
        </div>

        {/* Recent applications */}
        {stats?.recentApps?.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Applications</h2>
              <Link to="/applications" className={styles.viewAll}>View all →</Link>
            </div>
            <div className={styles.recentList}>
              {stats.recentApps.map(app => (
                <div key={app.id} className={styles.recentItem}>
                  <div>
                    <span className={styles.recentCompany}>{app.company}</span>
                    <span className={styles.recentRole}>{app.role}</span>
                  </div>
                  <span className={`${styles.statusPill} ${styles[`status${app.status.charAt(0).toUpperCase()}${app.status.slice(1)}`]}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Getting started — only show if no applications yet */}
        {stats?.total === 0 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Getting Started</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <span className={styles.stepNum}>1</span>
                <div>
                  <strong>Create your resume</strong>
                  <p>Add your experience, skills, and education</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>2</span>
                <div>
                  <strong>Add job postings</strong>
                  <p>Paste job listings you&apos;re interested in</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>3</span>
                <div>
                  <strong>Generate cover letters</strong>
                  <p>Get tailored paragraphs for each application</p>
                </div>
              </div>
              <div className={styles.step}>
                <span className={styles.stepNum}>4</span>
                <div>
                  <strong>Track applications</strong>
                  <p>Monitor status and follow up on stale ones</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
