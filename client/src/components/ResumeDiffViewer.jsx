import ReactDiffViewer from 'react-diff-viewer-continued'
import styles from './ResumeDiffViewer.module.css'

function ResumeDiffViewer({ current, suggested }) {
  return (
    <div className={styles.diffContainer}>
      <ReactDiffViewer
        oldValue={current || ''}
        newValue={suggested || ''}
        splitView={true}
        useDarkTheme={false}
        leftTitle="Current"
        rightTitle="Suggested"
        styles={{
          variables: {
            dark: { diffViewerBackground: '#1a1a2e', addedBackground: '#0d3320', removedBackground: '#3d1014' },
            light: { diffViewerBackground: '#fff', addedBackground: '#e6ffec', removedBackground: '#ffebe9' }
          }
        }}
      />
    </div>
  )
}

export default ResumeDiffViewer
