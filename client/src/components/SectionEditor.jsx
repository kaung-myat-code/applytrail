import styles from './SectionEditor.module.css'

function SectionEditor({ title, children }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </div>
  )
}

export default SectionEditor
