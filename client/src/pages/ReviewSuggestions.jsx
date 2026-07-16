import { useState, useEffect } from 'react'
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import SuggestionCard from '../components/SuggestionCard'
import styles from './ReviewSuggestions.module.css'

const sectionOrder = ['summary', 'skills', 'experience', 'projects', 'education']
const sectionLabels = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
}

function ReviewSuggestions() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const draftId = searchParams.get('draft')
  const initialStateSuggestions = location.state?.suggestions

  const [resumeId, setResumeId] = useState(location.state?.resumeId || searchParams.get('resume'))
  const [postingId, setPostingId] = useState(location.state?.postingId || searchParams.get('posting'))
  const [provider, setProvider] = useState(location.state?.provider || searchParams.get('provider') || 'heuristic')

  const [suggestions, setSuggestions] = useState(initialStateSuggestions || [])
  const [decisions, setDecisions] = useState({})
  const [loading, setLoading] = useState(!initialStateSuggestions && !draftId)
  const [hydrating, setHydrating] = useState(!!draftId && !initialStateSuggestions)
  const [error, setError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')

  useEffect(() => {
    // Draft hydration (TAILOR-05 fix): restore suggestions + decisions from a
    // server-side draft when returning via ?draft=<id> (e.g. "Back to Suggestions").
    if (draftId && !initialStateSuggestions) {
      // Reset dependent state before the fetch begins so a direct navigation
      // between two different drafts (component reused, not remounted) never
      // renders/uses the previous draft's postingId/resumeId/provider while
      // the new draft is loading (WR-04).
      setHydrating(true)
      setResumeId(null)
      setPostingId(null)
      setProvider('heuristic')
      setSuggestions([])
      setDecisions({})

      async function fetchDraft() {
        try {
          const res = await fetch(`/api/drafts/${draftId}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Failed to load draft')
          setSuggestions(data.suggestions || [])
          setDecisions(data.decisions || {})
          setResumeId(data.resume_id)
          setPostingId(data.posting_id)
          setProvider(data.provider || 'heuristic')
        } catch (err) {
          setError(err.message || 'Failed to load draft.')
        } finally {
          setHydrating(false)
        }
      }
      fetchDraft()
      return
    }

    // Skip API call if we already have suggestions from navigation state
    if (initialStateSuggestions) {
      setLoading(false)
      return
    }

    if (!postingId) {
      setError('No job posting selected. Run an analysis first.')
      setLoading(false)
      return
    }

    async function fetchAnalysis() {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_posting_id: postingId,
            resume_version_id: resumeId || undefined,
            provider,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Analysis failed')
        setSuggestions(data.suggestions || [])
      } catch (err) {
        setError(err.message || 'Failed to load suggestions.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId])

  function handleAccept(id) {
    setDecisions(prev => {
      if (prev[id]?.status === 'accepted') {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { status: 'accepted' } }
    })
  }

  function handleReject(id) {
    setDecisions(prev => {
      if (prev[id]?.status === 'rejected') {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { status: 'rejected' } }
    })
  }

  function handleEdit(id, editedContent) {
    setDecisions(prev => ({ ...prev, [id]: { status: 'edited', editedContent } }))
  }

  function handleAcceptAll() {
    const newDecisions = { ...decisions }
    for (const s of suggestions) {
      if (!newDecisions[s.id] || newDecisions[s.id].status !== 'accepted') {
        newDecisions[s.id] = { status: 'accepted' }
      }
    }
    setDecisions(newDecisions)
  }

  function handleRejectAll() {
    const newDecisions = { ...decisions }
    for (const s of suggestions) {
      if (!newDecisions[s.id] || newDecisions[s.id].status !== 'rejected') {
        newDecisions[s.id] = { status: 'rejected' }
      }
    }
    setDecisions(newDecisions)
  }

  async function handleGenerate() {
    if (generating) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: resumeId,
          posting_id: postingId,
          suggestions,
          decisions,
          provider,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create draft')
      navigate(`/analysis/preview?draft=${data.draft.id}`, {
        state: { company: data.draft.company, role: data.draft.role },
      })
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate tailored resume.')
    } finally {
      setGenerating(false)
    }
  }

  if (hydrating) return <div className={styles.page}><p>Loading draft...</p></div>

  if (loading) return <div className={styles.page}><p>Loading suggestions...</p></div>

  if (error) {
    return (
      <div className={styles.page}>
        <h1>Review Suggestions</h1>
        <div className={styles.error}>{error}</div>
        <Link to="/analysis" className={styles.backLink}>Back to Analysis</Link>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className={styles.page}>
        <h1>Review Suggestions</h1>
        <div className={styles.empty}>
          <p>Your resume already covers the key requirements well. No suggestions at this time.</p>
          <Link to="/analysis" className={styles.backLink}>Back to Analysis</Link>
        </div>
      </div>
    )
  }

  // Group suggestions by section
  const grouped = {}
  for (const s of suggestions) {
    if (!grouped[s.section]) grouped[s.section] = []
    grouped[s.section].push(s)
  }

  const acceptedCount = Object.values(decisions).filter(d => d.status === 'accepted' || d.status === 'edited').length
  const totalCount = suggestions.length
  const hasAccepted = acceptedCount > 0

  return (
    <div className={styles.page}>
      <h1>Review Suggestions</h1>
      <p className={styles.description}>
        Review each suggestion and decide whether to accept, reject, or edit it.
        Accepted suggestions will be applied when you generate a tailored resume.
      </p>

      <div className={styles.bulkActions}>
        <div className={styles.bulkInfo}>
          <span className={styles.bulkCount}>{acceptedCount} of {totalCount} accepted</span>
        </div>
        <div className={styles.bulkButtons}>
          <button className={styles.acceptAllButton} onClick={handleAcceptAll}>
            Accept All
          </button>
          <button className={styles.rejectAllButton} onClick={handleRejectAll}>
            Reject All
          </button>
        </div>
      </div>

      {sectionOrder.map(section => {
        const sectionSuggestions = grouped[section]
        if (!sectionSuggestions) return null

        return (
          <div key={section} className={styles.sectionGroup}>
            <h2 className={styles.sectionGroupHeader}>
              {sectionLabels[section]}
              <span className={styles.sectionCount}>{sectionSuggestions.length}</span>
            </h2>
            {sectionSuggestions.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                decision={decisions[s.id] || null}
                onAccept={handleAccept}
                onReject={handleReject}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )
      })}

      {generateError && (
        <div className={styles.error}>{generateError}</div>
      )}

      <div className={styles.footer}>
        <Link to={`/analysis?resume=${resumeId || ''}&posting=${postingId || ''}`} className={styles.backLink}>
          Back to Analysis
        </Link>
        <button
          className={styles.generateButton}
          disabled={generating || !hasAccepted}
          onClick={handleGenerate}
        >
          {generating ? 'Generating...' : 'Generate Tailored Resume'}
        </button>
      </div>
    </div>
  )
}

export default ReviewSuggestions
