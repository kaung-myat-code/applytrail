import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar.jsx'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <Navbar />
      <aside className={styles.demoWarning} role="alert">
        <strong>Hosted demo warning</strong>
        <span>
          This demo is unauthenticated, shared, writable, disposable, and for
          demonstration purposes only. Do not submit real resumes, contact
          information, credentials, secrets, or other private job-search data.
        </span>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default App
