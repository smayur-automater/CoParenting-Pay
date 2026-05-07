import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import s from './AppShell.module.css'

const NAV = [
  { path: '/dashboard', icon: '⌂', label: 'Home' },
  { path: '/kids', icon: '👧', label: 'Kids' },
  { path: '/expenses', icon: '📋', label: 'Expenses' },
  { path: '/reports', icon: '📊', label: 'Reports' },
  { path: '/settings', icon: '⚙', label: 'Settings' },
]

export default function AppShell({ children }) {
  const { user, expenses } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [showAdd, setShowAdd] = useState(false)

  const pendingCount = expenses.filter(e => e.status === 'pending').length
  const currentTitle = { '/dashboard': 'Home', '/kids': 'Kids', '/expenses': 'Expenses', '/reports': 'Reports', '/settings': 'Settings' }[pathname] || ''

  return (
    <div className={s.shell}>
      {/* Top bar */}
      <header className={s.topbar}>
        <div className={s.topbarLeft}>
          <div className={s.topbarLogo}>SF</div>
          <div>
            <div className={s.topbarTitle}>SplitFamily</div>
            <div className={s.topbarSub}>May 2026</div>
          </div>
        </div>
        <div className={s.topbarRight}>
          {pendingCount > 0 && (
            <button className={s.pendingBadge} onClick={() => navigate('/expenses')}>
              {pendingCount} pending
            </button>
          )}
          <div className={s.avatar} style={{ background: user?.avatarColor + '22', color: user?.avatarColor }}>
            {user?.avatar}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className={s.main}>
        {children}
      </main>

      {/* FAB */}
      <button className={s.fab} onClick={() => navigate('/expenses?add=1')} aria-label="Add expense">
        <span style={{fontSize:22}}>+</span>
      </button>

      {/* Bottom nav */}
      <nav className={s.navbar}>
        {NAV.map(item => {
          const active = pathname === item.path
          return (
            <button
              key={item.path}
              className={s.navItem + (active ? ' ' + s.navActive : '')}
              onClick={() => navigate(item.path)}
            >
              <span className={s.navIcon}>{item.icon}</span>
              <span className={s.navLabel}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
