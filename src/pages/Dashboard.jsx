import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import s from './Dashboard.module.css'

const CAT_COLORS = {
  Medical: '#B85C5C', School: '#3A7CA8', Sports: '#4A7C59',
  Recreation: '#C8832A', Clothing: '#7A5CA8', Trips: '#1D9E75', Other: '#888'
}

export default function Dashboard() {
  const { user, expenses } = useAuth()
  const navigate = useNavigate()

  const myName = user?.name?.split(' ')[0] || 'Alex'
  const coName = user?.coParent?.name?.split(' ')[0] || 'Jordan'

  // Compute balance
  const approved = expenses.filter(e => e.status === 'approved')
  let myPaid = 0, coParentPaid = 0
  const myKey = myName.toLowerCase()
  approved.forEach(e => {
    const myPct = e.split?.[myKey] || 50
    const coPct = 100 - myPct
    if (e.submittedBy === 'alex') { myPaid += e.amount; coParentPaid += 0 }
    else { coParentPaid += e.amount }
  })

  // Simplified balance: who submitted more vs their agreed share
  const totalApproved = approved.reduce((s, e) => s + e.amount, 0)
  const myShare = Math.round(totalApproved * (user?.defaultSplit?.self || 55) / 100)
  const alexPaid = approved.filter(e => e.submittedBy === 'alex').reduce((s,e) => s+e.amount,0)
  const balance = alexPaid - myShare
  const owesText = balance >= 0 ? `${coName} owes you $${Math.abs(balance).toFixed(0)}` : `You owe ${coName} $${Math.abs(balance).toFixed(0)}`
  const balancePositive = balance >= 0

  const pendingItems = expenses.filter(e => e.status === 'pending')
  const monthTotal = expenses.filter(e => e.status !== 'rejected' && e.date >= '2026-05-01').reduce((s, e) => s+e.amount, 0)
  const yearTotal = expenses.filter(e => e.status !== 'rejected').reduce((s, e) => s+e.amount, 0)
  const recent = expenses.slice(0, 5)

  return (
    <div className={s.page}>
      {/* Greeting */}
      <div className={s.greeting}>
        <span>Good morning, {myName} 👋</span>
      </div>

      {/* Balance strip */}
      <div className={s.balanceStrip + (balancePositive ? '' : ' ' + s.balanceOwes)}>
        <div className={s.balanceLeft}>
          <div className={s.balanceLabel}>Balance</div>
          <div className={s.balanceText}>{owesText}</div>
        </div>
        <button className={s.settleBtn}>Settle up</button>
      </div>

      {/* Metrics */}
      <div className={s.metricsRow}>
        <div className={s.metric}>
          <div className={s.metricLabel}>This month</div>
          <div className={s.metricValue}>${monthTotal.toLocaleString()}</div>
        </div>
        <div className={s.metric}>
          <div className={s.metricLabel}>This year</div>
          <div className={s.metricValue}>${yearTotal.toLocaleString()}</div>
        </div>
        <div className={s.metric}>
          <div className={s.metricLabel}>Pending</div>
          <div className={s.metricValue + ' ' + s.metricPending}>{pendingItems.length}</div>
        </div>
      </div>

      {/* Pending alert */}
      {pendingItems.length > 0 && (
        <div className={s.alertBanner} onClick={() => navigate('/expenses')}>
          <span className={s.alertDot} />
          <span className={s.alertText}>
            {pendingItems.length} expense{pendingItems.length > 1 ? 's' : ''} awaiting approval
            {pendingItems.some(e => e.date <= '2026-04-28') ? ' — oldest is 8 days old' : ''}
          </span>
          <span className={s.alertArrow}>→</span>
        </div>
      )}

      {/* Co-parent split */}
      <div className={s.sectionTitle}>This month's split</div>
      <div className={s.splitCard}>
        <div className={s.splitRow}>
          <div className={s.splitPerson}>
            <div className={s.splitAvatar} style={{background: user?.avatarColor + '20', color: user?.avatarColor}}>{user?.avatar}</div>
            <span>{myName}</span>
          </div>
          <div className={s.splitAmounts}>
            <span style={{color: 'var(--sage)', fontWeight:500}}>${alexPaid.toLocaleString()}</span>
            <span style={{color:'var(--ink-ghost)'}}>·</span>
            <span style={{color:'var(--ink-soft)'}}>${(monthTotal - alexPaid).toLocaleString()}</span>
          </div>
          <div className={s.splitPerson} style={{justifyContent:'flex-end'}}>
            <span>{coName}</span>
            <div className={s.splitAvatar} style={{background:'#3A7CA822',color:'#3A7CA8'}}>JL</div>
          </div>
        </div>
        <div className={s.splitBar}>
          <div className={s.splitFill} style={{width: monthTotal ? Math.round(alexPaid/monthTotal*100)+'%' : '50%'}} />
        </div>
        <div className={s.splitPcts}>
          <span>{monthTotal ? Math.round(alexPaid/monthTotal*100) : 50}%</span>
          <span>{user?.defaultSplit?.self || 55}% target</span>
          <span>{monthTotal ? Math.round((monthTotal-alexPaid)/monthTotal*100) : 50}%</span>
        </div>
      </div>

      {/* Recent expenses */}
      <div className={s.sectionTitle}>Recent expenses</div>
      <div className={s.expCard}>
        {recent.map(exp => (
          <div key={exp.id} className={s.expRow} onClick={() => navigate('/expenses')}>
            <div className={s.expIcon} style={{background: (CAT_COLORS[exp.category]||'#888') + '18', color: CAT_COLORS[exp.category]||'#888'}}>
              {catEmoji(exp.category)}
            </div>
            <div className={s.expInfo}>
              <div className={s.expTitle}>{exp.title}</div>
              <div className={s.expSub}>{exp.category} · {exp.submittedByName} · {fmtDate(exp.date)}</div>
            </div>
            <div className={s.expRight}>
              <div className={s.expAmount}>${exp.amount}</div>
              <StatusBadge status={exp.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: [s2.pending, 'Pending'], approved: [s2.approved, 'Approved'], rejected: [s2.rejected, 'Rejected'] }
  const [cls, label] = map[status] || [s2.pending, status]
  return <span className={s2.badge + ' ' + cls}>{label}</span>
}

const s2 = {
  badge: 'badge',
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

function catEmoji(cat) {
  return { Medical:'🩺', School:'📚', Sports:'⚽', Recreation:'🎡', Clothing:'👕', Trips:'✈️', Other:'📌' }[cat] || '📌'
}
function fmtDate(d) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
