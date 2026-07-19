import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

const navItems = [
  { type: 'link', to: '/', label: 'Dashboard' },
  {
    type: 'group',
    label: 'Resume',
    children: [
      { to: '/resume', label: 'Resume' },
      { to: '/resume-library', label: 'Resume Library' },
    ],
  },
  { type: 'link', to: '/new', label: 'New Application' },
  {
    type: 'group',
    label: 'Tailor',
    children: [
      { to: '/analysis', label: 'Analysis' },
      { to: '/cover-letter', label: 'Cover Letter' },
    ],
  },
  { type: 'link', to: '/applications', label: 'Applications' },
]

const groupLabels = navItems.filter(item => item.type === 'group').map(item => item.label)
const lastGroupLabel = groupLabels[groupLabels.length - 1]

function Navbar() {
  const [openGroup, setOpenGroup] = useState(null)
  const navRef = useRef(null)
  const location = useLocation()

  useEffect(() => {
    if (openGroup === null) return

    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenGroup(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openGroup])

  useEffect(() => {
    if (openGroup === null) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpenGroup(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openGroup])

  return (
    <nav className={styles.navbar} ref={navRef}>
      <NavLink to="/" className={styles.brand}>
        ApplyTrail
      </NavLink>
      <div className={styles.links}>
        {navItems.map(item => {
          if (item.type === 'link') {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.active : ''}`
                }
              >
                {item.label}
              </NavLink>
            )
          }

          const isActiveGroup = item.children.some(child => location.pathname === child.to)
          const isOpen = openGroup === item.label
          const isLastGroup = item.label === lastGroupLabel

          return (
            <div key={item.label} className={styles.groupWrapper}>
              <button
                type="button"
                className={`${styles.groupTrigger} ${isActiveGroup ? styles.active : ''}`}
                onClick={() => setOpenGroup(isOpen ? null : item.label)}
              >
                {item.label} <span aria-hidden="true">▾</span>
              </button>
              {isOpen && (
                <div
                  className={`${styles.dropdownPanel} ${isLastGroup ? styles.dropdownPanelRight : ''}`}
                >
                  {item.children.map(child => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        `${styles.link} ${isActive ? styles.active : ''}`
                      }
                      onClick={() => setOpenGroup(null)}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}

export default Navbar
