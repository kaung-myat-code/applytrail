import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import styles from './Analysis.module.css'
import { displayCase } from '../lib/keywordCasing'

function ScoreDisplay({ score, summary, strengths, gaps }) {
  const scoreColor = score >= 70 ? styles.scoreGreen : score >= 40 ? styles.scoreYellow : styles.scoreRed

  return (
    <div className={styles.scoreSection}>
      <div className={styles.scoreHeader}>
        <div className={`${styles.scoreCircle} ${scoreColor}`}>
          <span className={styles.scoreNumber}>{score}</span>
          <span className={styles.scoreLabel}>/100</span>
        </div>
        <div className={styles.scoreSummary}>{summary}</div>
      </div>

      {strengths.length > 0 && (
        <div className={styles.strengths}>
          <h3 className={styles.subheading}>Strengths</h3>
          <ul>
            {strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {gaps.length > 0 && (
        <div className={styles.gaps}>
          <h3 className={styles.subheading}>Gaps to Address</h3>
          <ul>
            {gaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

ScoreDisplay.propTypes = {
  score: PropTypes.number.isRequired,
  summary: PropTypes.string,
  strengths: PropTypes.arrayOf(PropTypes.string),
  gaps: PropTypes.arrayOf(PropTypes.string),
}

function KeywordGroups({ keywords }) {
  const { matched, missing, bonus } = keywords

  return (
    <div className={styles.keywordSection}>
      <h3 className={styles.sectionTitle}>Keyword Analysis</h3>

      <div className={styles.keywordGroup}>
        <div className={styles.keywordGroupHeader}>
          <span className={styles.keywordGroupLabel}>Matched</span>
          <span className={styles.badgeCount}>{matched.length}</span>
        </div>
        <div className={styles.keywordBadges}>
          {matched.length > 0 ? matched.map((kw, i) => (
            <span key={i} className={`${styles.keywordBadge} ${styles.badgeMatched}`}>{displayCase(kw)}</span>
          )) : <span className={styles.noKeywords}>No keywords matched</span>}
        </div>
      </div>

      <div className={styles.keywordGroup}>
        <div className={styles.keywordGroupHeader}>
          <span className={styles.keywordGroupLabel}>Missing</span>
          <span className={styles.badgeCount}>{missing.length}</span>
        </div>
        <div className={styles.keywordBadges}>
          {missing.length > 0 ? missing.map((kw, i) => (
            <span key={i} className={`${styles.keywordBadge} ${styles.badgeMissing}`}>{displayCase(kw)}</span>
          )) : <span className={styles.noKeywords}>All keywords covered</span>}
        </div>
      </div>

      <div className={styles.keywordGroup}>
        <div className={styles.keywordGroupHeader}>
          <span className={styles.keywordGroupLabel}>Bonus (your extras)</span>
          <span className={styles.badgeCount}>{bonus.length}</span>
        </div>
        <div className={styles.keywordBadges}>
          {bonus.length > 0 ? bonus.map((kw, i) => (
            <span key={i} className={`${styles.keywordBadge} ${styles.badgeBonus}`}>{displayCase(kw)}</span>
          )) : <span className={styles.noKeywords}>No bonus keywords</span>}
        </div>
      </div>
    </div>
  )
}

KeywordGroups.propTypes = {
  keywords: PropTypes.shape({
    matched: PropTypes.arrayOf(PropTypes.string),
    missing: PropTypes.arrayOf(PropTypes.string),
    bonus: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
}

function SectionFindings({ sections }) {
  const sectionOrder = ['summary', 'skills', 'experience', 'projects', 'education']
  const sectionLabels = {
    summary: 'Summary',
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    education: 'Education',
  }

  return (
    <div className={styles.sectionsSection}>
      <h3 className={styles.sectionTitle}>Section Analysis</h3>

      {sectionOrder.map(key => {
        const section = sections[key]
        if (!section) return null

        const matchPercent = Math.round(section.matchRate * 100)
        const barColor = matchPercent >= 50 ? 'var(--color-success)' :
                         matchPercent >= 25 ? 'var(--color-warning)' :
                         'var(--color-danger)'

        return (
          <div key={key} className={styles.sectionCard}>
            <div className={styles.sectionCardHeader}>
              <span className={styles.sectionName}>{sectionLabels[key]}</span>
              <span className={styles.sectionPercent}>{matchPercent}%</span>
            </div>

            <div className={styles.matchRateBar}>
              <div
                className={styles.matchRateFill}
                style={{ width: `${matchPercent}%`, backgroundColor: barColor }}
              />
            </div>

            <p className={styles.sectionSummaryText}>{section.summary}</p>

            {section.matchedItems.length > 0 && (
              <div className={styles.sectionItems}>
                <span className={styles.itemsLabel}>Matched:</span>
                {section.matchedItems.map((item, i) => (
                  <span key={i} className={`${styles.keywordBadge} ${styles.badgeMatched}`}>{displayCase(item)}</span>
                ))}
              </div>
            )}

            {section.missingItems.length > 0 && (
              <div className={styles.sectionItems}>
                <span className={styles.itemsLabel}>Missing:</span>
                {section.missingItems.map((item, i) => (
                  <span key={i} className={`${styles.keywordBadge} ${styles.badgeMissing}`}>{displayCase(item)}</span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

SectionFindings.propTypes = {
  sections: PropTypes.objectOf(PropTypes.shape({
    matchRate: PropTypes.number,
    summary: PropTypes.string,
    matchedItems: PropTypes.arrayOf(PropTypes.string),
    missingItems: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
}

function Analysis() {
  const [resumeVersions, setResumeVersions] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [postings, setPostings] = useState([])
  const [selectedPostingId, setSelectedPostingId] = useState('')
  const [report, setReport] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [provider, setProvider] = useState('heuristic')
  const [fallbackInfo, setFallbackInfo] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/resume-library').then(res => res.json()),
      fetch('/api/job-postings').then(res => res.json()),
    ])
      .then(([libraryData, postingsData]) => {
        setResumeVersions(libraryData.versions || [])
        setSelectedResumeId(libraryData.selected_id || '')
        setPostings(postingsData)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setLoadError('Failed to connect to server. Is it running?')
      })
  }, [])

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!selectedPostingId) return

    setLoading(true)
    setError('')
    setReport(null)
    setFallbackInfo(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: selectedPostingId,
          resume_version_id: selectedResumeId || undefined,
          provider,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Analysis failed')
      }

      if (data.fallback) {
        setFallbackInfo({ reason: data.fallback_reason || 'AI provider unavailable' })
      }

      setReport(data.report)
      setSuggestions(data.suggestions || [])
    } catch (err) {
      setError(err.message || 'Failed to analyze. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <h1>Match Analysis</h1>
        <div className={styles.error}>{loadError}</div>
      </div>
    )
  }

  if (resumeVersions.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Match Analysis</h1>
        <div className={styles.empty}>
          <p>No resume versions found.</p>
          <p>
            <Link to="/resume-library" className={styles.link}>Create a resume</Link> to run match analysis.
          </p>
        </div>
      </div>
    )
  }

  if (postings.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Match Analysis</h1>
        <div className={styles.empty}>
          <p>No job postings found.</p>
          <p>
            <Link to="/new" className={styles.link}>Add a job posting first</Link> to run match analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1>Match Analysis</h1>
      <p className={styles.description}>
        Compare your resume against a job posting to identify strengths, gaps, and keyword alignment.
      </p>

      <form className={styles.form} onSubmit={handleAnalyze}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="resume">Resume Version</label>
          <select
            className={styles.select}
            id="resume"
            value={selectedResumeId}
            onChange={e => setSelectedResumeId(e.target.value)}
          >
            {resumeVersions.map(v => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="posting">Job Posting</label>
          <select
            className={styles.select}
            id="posting"
            value={selectedPostingId}
            onChange={e => setSelectedPostingId(e.target.value)}
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="provider">Analysis Provider</label>
          <select
            className={styles.select}
            id="provider"
            value={provider}
            onChange={e => setProvider(e.target.value)}
          >
            <option value="heuristic">Heuristic (Keyword Match) -- no setup needed</option>
            <option value="gemini">AI: Gemini -- requires GOOGLE_GENERATIVE_AI_API_KEY</option>
            <option value="openrouter">AI: OpenRouter -- requires OPENROUTER_API_KEY</option>
            <option value="groq">AI: Groq -- requires GROQ_API_KEY</option>
          </select>
        </div>

        <button
          className={styles.analyzeButton}
          type="submit"
          disabled={!selectedPostingId || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Match'}
        </button>

        {error && (
          <div className={styles.error}>{error}</div>
        )}
      </form>

      {fallbackInfo && (
        <div className={styles.fallbackBanner}>
          <strong>AI analysis unavailable</strong> -- falling back to heuristic analysis.
          <span className={styles.fallbackReason}>{fallbackInfo.reason}</span>
        </div>
      )}

      {report && (
        <div className={styles.report}>
          <ScoreDisplay
            score={report.score}
            summary={report.summary}
            strengths={report.strengths}
            gaps={report.gaps}
          />

          <KeywordGroups keywords={report.keywords} />

          <SectionFindings sections={report.sections} />
        </div>
      )}

      {report && suggestions.length > 0 && (
        <div className={styles.reviewLink}>
          <Link
            to={`/analysis/review?resume=${selectedResumeId}&posting=${selectedPostingId}&provider=${provider}`}
            state={{ suggestions, resumeId: selectedResumeId, postingId: selectedPostingId, provider }}
            className={styles.reviewButton}
          >
            Continue to Review Suggestions →
          </Link>
        </div>
      )}
    </div>
  )
}

export default Analysis
