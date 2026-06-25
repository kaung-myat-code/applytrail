import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar.jsx'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.app}>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default App
