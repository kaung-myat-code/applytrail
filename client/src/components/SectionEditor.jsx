import PropTypes from 'prop-types'
import styles from './SectionEditor.module.css'

function SectionEditor({ title, children }) {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </div>
  )
}

SectionEditor.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
}

export default SectionEditor
