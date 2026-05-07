import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import s from './Settings.module.css'

export default function Settings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [split, setSplit] = useState(user?.defaultSplit?.self || 55)
  const [notifs, setNotifs] = useState({ newExpense: true, reminder: true, monthly: false, settlement: true })
  const [showConfirmLogout, setShowConfirmLogout] = useState(false)

  const toggle = key => setNotifs(p => ({ ...p, [key]: !p[key] }))

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerTitle}>Settings</div>
      </div>

      {/* Profile */}
      <div className={s.profileCard}>
        <div className={s.profileAvatar} style={{background: user?.avatarColor+'22', color: user?.avatarColor}}>
          {user?.avatar}
        </div>
        <div className={s.profileInfo}>
          <div className={s.profileName}>{user?.name}</div>
          <div className={s.profileEmail}>{user?.email}</div>
        </div>
        <div className={s.googleBadge}><GoogleIcon /><span>Google</span></div>
      </div>

      {/* Co-parent */}
      <div className={s.sectionTitle}>Co-parent</div>
      <div className={s.card}>
        {user?.coParent ? (
          <div className={s.coParentRow}>
            <div className={s.coAvatar} style={{background:'#3A7CA822',color:'#3A7CA8'}}>
              {user.coParent.name?.slice(0,2).toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div className={s.coName}>{user.coParent.name}</div>
              <div className={s.coEmail}>{user.coParent.email}</div>
            </div>
            <span className={'badge badge-approved'}>Active</span>
          </div>
        ) : (
          <div className={s.inviteCTA}>
            <div className={s.inviteText}>No co-parent connected yet</div>
            <button className={s.inviteBtn}>Send invitation →</button>
          </div>
        )}
      </div>

      {/* Default split */}
      <div className={s.sectionTitle}>Default split</div>
      <div className={s.card}>
        <div className={s.splitInfo}>
          <span>{user?.name?.split(' ')[0]} <strong>{split}%</strong></span>
          <span style={{color:'var(--ink-ghost)', fontSize:11}}>Applies without per-child override</span>
          <span>{user?.coParent?.name?.split(' ')[0]} <strong>{100-split}%</strong></span>
        </div>
        <div className={s.splitBar}><div className={s.splitFill} style={{width:split+'%'}} /></div>
        <input type="range" min="10" max="90" step="5" value={split} onChange={e => setSplit(+e.target.value)} className={s.slider} />
      </div>

      {/* Notifications */}
      <div className={s.sectionTitle}>Notifications</div>
      <div className={s.card}>
        {[
          ['newExpense', 'New expense submitted', 'Alert when co-parent adds an expense'],
          ['reminder', 'Approval reminder', 'After 3 days without action'],
          ['monthly', 'Monthly summary email', 'End-of-month report'],
          ['settlement', 'Settlement alert', 'When balance exceeds $200'],
        ].map(([key, label, sub]) => (
          <div key={key} className={s.settingsRow}>
            <div>
              <div className={s.rowLabel}>{label}</div>
              <div className={s.rowSub}>{sub}</div>
            </div>
            <button
              className={s.toggle + (notifs[key] ? ' ' + s.toggleOn : '')}
              onClick={() => toggle(key)}
              aria-label={`Toggle ${label}`}
            />
          </div>
        ))}
      </div>

      {/* Data */}
      <div className={s.sectionTitle}>Data & privacy</div>
      <div className={s.card}>
        {[
          ['↓', 'Export all data', 'Download as CSV or PDF'],
          ['⟲', 'Archive expenses', 'Move expenses older than 1 year'],
          ['🔒', 'Privacy settings', 'Manage data visibility'],
        ].map(([icon, label, sub]) => (
          <div key={label} className={s.settingsRow} style={{cursor:'pointer'}}>
            <div>
              <div className={s.rowLabel}>{label}</div>
              <div className={s.rowSub}>{sub}</div>
            </div>
            <span style={{color:'var(--ink-ghost)'}}>{icon}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button className={s.signOutBtn} onClick={() => setShowConfirmLogout(true)}>
        Sign out
      </button>
      <button className={s.deleteBtn}>Delete account</button>

      {/* Confirm logout */}
      {showConfirmLogout && (
        <div className={s.overlay} onClick={() => setShowConfirmLogout(false)}>
          <div className={s.confirmSheet} onClick={e => e.stopPropagation()}>
            <div className={s.confirmTitle}>Sign out?</div>
            <div className={s.confirmText}>You'll need to sign in with Google again to access your account.</div>
            <div className={s.confirmBtns}>
              <button className={s.cancelBtn} onClick={() => setShowConfirmLogout(false)}>Cancel</button>
              <button className={s.confirmSignOut} onClick={handleSignOut}>Sign out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
