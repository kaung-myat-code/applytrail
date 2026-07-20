import { useState } from 'react'
import PropTypes from 'prop-types'
import ResumeDiffViewer from './ResumeDiffViewer'
import styles from './SuggestionCard.module.css'

const typeLabels = { add: 'Add', modify: 'Modify', remove: 'Remove' }
const typeColors = {
  add: styles.typeAdd,
  modify: styles.typeModify,
  remove: styles.typeRemove,
}

function SuggestionCard({ suggestion, decision, onAccept, onReject, onEdit }) {
  const [showDiff, setShowDiff] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(suggestion.suggested)

  const statusClass = decision?.status === 'accepted' ? styles.cardAccepted :
                      decision?.status === 'rejected' ? styles.cardRejected :
                      decision?.status === 'edited' ? styles.cardEdited : ''

  return (
    <div className={`${styles.card} ${statusClass}`}>
      <div className={styles.cardHeader}>
        <span className={`${styles.typeBadge} ${typeColors[suggestion.type]}`}>
          {typeLabels[suggestion.type]}
        </span>
        <span className={styles.sectionLabel}>{suggestion.section}</span>
        {decision && (
          <span className={styles.decisionBadge}>
            {decision.status === 'accepted' ? 'Accepted' :
             decision.status === 'rejected' ? 'Rejected' : 'Edited'}
          </span>
        )}
      </div>

      <p className={styles.reason}>{suggestion.reason}</p>

      {suggestion.type === 'modify' && (
        <div className={styles.preview}>
          <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>Current:</span>
            <p className={styles.previewText}>{suggestion.current}</p>
          </div>
          <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>Suggested:</span>
            <p className={styles.previewText}>{decision?.editedContent ?? suggestion.suggested}</p>
          </div>
        </div>
      )}

      {suggestion.type === 'add' && (
        <div className={styles.preview}>
          <div className={styles.previewBlock}>
            <span className={styles.previewLabel}>Suggested addition:</span>
            <p className={styles.previewText}>{decision?.editedContent ?? suggestion.suggested}</p>
          </div>
        </div>
      )}

      {suggestion.type === 'modify' && (
        <button
          className={styles.diffToggle}
          onClick={() => setShowDiff(!showDiff)}
        >
          {showDiff ? 'Hide Diff' : 'View Diff'}
        </button>
      )}

      {showDiff && suggestion.type === 'modify' && (
        <ResumeDiffViewer
          current={suggestion.current}
          suggested={decision?.editedContent ?? suggestion.suggested}
        />
      )}

      {isEditing ? (
        <div className={styles.editArea}>
          <textarea
            className={styles.editTextarea}
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            rows={4}
          />
          <div className={styles.editActions}>
            <button
              className={styles.saveButton}
              onClick={() => { onEdit(suggestion.id, editedText); setIsEditing(false) }}
            >
              Save
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => { setEditedText(suggestion.suggested); setIsEditing(false) }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {decision?.status !== 'accepted' && (
            <button className={styles.acceptButton} onClick={() => onAccept(suggestion.id)}>
              Accept
            </button>
          )}
          {decision?.status === 'accepted' && (
            <button className={styles.undoButton} onClick={() => onAccept(suggestion.id)}>
              Undo Accept
            </button>
          )}
          {decision?.status !== 'rejected' && (
            <button className={styles.rejectButton} onClick={() => onReject(suggestion.id)}>
              Reject
            </button>
          )}
          {decision?.status === 'rejected' && (
            <button className={styles.undoButton} onClick={() => onReject(suggestion.id)}>
              Undo Reject
            </button>
          )}
          <button
            className={styles.editButton}
            onClick={() => { setIsEditing(true); setEditedText(decision?.editedContent ?? suggestion.suggested) }}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

SuggestionCard.propTypes = {
  suggestion: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.oneOf(['add', 'modify', 'remove']),
    section: PropTypes.string,
    current: PropTypes.string,
    suggested: PropTypes.string,
    reason: PropTypes.string,
  }).isRequired,
  decision: PropTypes.shape({
    status: PropTypes.oneOf(['accepted', 'rejected', 'edited']),
    editedContent: PropTypes.string,
  }),
  onAccept: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
}

export default SuggestionCard
