import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/resume', label: 'Resume' },
  { to: '/resume-library', label: 'Resume Library' },
  { to: '/new', label: 'New Application' },
  { to: '/cover-letter', label: 'Cover Letter' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/applications', label: 'Applications' },
]

function Navbar() {
  return (
    <nav className={styles.navbar}>
      <NavLink to="/" className={styles.brand}>
        ApplyTrail
      </NavLink>
      <div className={styles.links}>
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
