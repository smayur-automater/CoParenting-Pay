import { useAuth } from '../contexts/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import s from './Reports.module.css'

const CAT_COLORS = { Medical:'#B85C5C', School:'#3A7CA8', Sports:'#4A7C59', Recreation:'#C8832A', Clothing:'#7A5CA8', Trips:'#1D9E75', Other:'#888' }

const AUDIT = [
  { who: 'Jordan', action: 'approved', what: 'Dental checkup', date: 'May 4, 2:31 PM' },
  { who: 'Alex', action: 'rejected', what: 'Gaming console', date: 'Apr 9, 8:14 AM' },
  { who: 'Jordan', action: 'approved', what: 'School supplies', date: 'Apr 29, 11:55 AM' },
  { who: 'Alex', action: 'approved', what: 'Spring trip flights', date: 'Apr 11, 9:02 AM' },
]

export default function Reports() {
  const { expenses, user } = useAuth()

  const nonRejected = expenses.filter(e => e.status !== 'rejected')
  const catTotals = {}
  nonRejected.forEach(e => { catTotals[e.category] = (catTotals[e.category]||0) + e.amount })
  const chartData = Object.entries(catTotals).map(([name, total]) => ({ name, total })).sort((a,b) => b.total-a.total)

  const totalSpend = nonRejected.reduce((s,e) => s+e.amount, 0)
  const myName = user?.name?.split(' ')[0] || 'Alex'
  const coName = user?.coParent?.name?.split(' ')[0] || 'Jordan'

  const alexTotal = nonRejected.filter(e => e.submittedBy==='alex').reduce((s,e) => s+e.amount,0)
  const jordanTotal = nonRejected.filter(e => e.submittedBy==='jordan').reduce((s,e) => s+e.amount,0)

  const alexPct = totalSpend ? Math.round(alexTotal/totalSpend*100) : 0
  const jordanPct = 100 - alexPct

  const topCat = chartData[0]
  const approved = expenses.filter(e => e.status==='approved').length
  const pending = expenses.filter(e => e.status==='pending').length

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerTitle}>Reports</div>
        <div className={s.headerSub}>All time · {expenses.length} expenses</div>
      </div>

      <div className={s.metricsRow}>
        <div className={s.metric}><div className={s.ml}>Total</div><div className={s.mv}>${totalSpend.toLocaleString()}</div></div>
        <div className={s.metric}><div className={s.ml}>Approved</div><div className={s.mv} style={{color:'var(--sage)'}}>{approved}</div></div>
        <div className={s.metric}><div className={s.ml}>Pending</div><div className={s.mv} style={{color:'var(--amber)'}}>{pending}</div></div>
      </div>

      <div className={s.sectionTitle}>Spending by category</div>
      <div className={s.chartCard}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{top:4,right:4,bottom:4,left:-20}}>
            <XAxis dataKey="name" tick={{fontSize:10, fill:'#7A7A74'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize:10, fill:'#7A7A74'}} axisLine={false} tickLine={false} tickFormatter={v=>'$'+v} />
            <Tooltip formatter={v => ['$'+v, 'Total']} contentStyle={{fontSize:12,borderRadius:8,border:'0.5px solid #E0DDD6'}} />
            <Bar dataKey="total" radius={[4,4,0,0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={CAT_COLORS[entry.name]||'#888'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className={s.legend}>
          {chartData.map(d => (
            <div key={d.name} className={s.legendItem}>
              <div className={s.legendDot} style={{background:CAT_COLORS[d.name]||'#888'}} />
              <span>{d.name}</span>
              <span className={s.legendAmt}>${d.total}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={s.sectionTitle}>Co-parent contributions</div>
      <div className={s.contribRow}>
        <div className={s.contribCard}>
          <div className={s.contribAvatar} style={{background: user?.avatarColor+'22', color: user?.avatarColor}}>{user?.avatar}</div>
          <div className={s.contribName}>{myName}</div>
          <div className={s.contribAmt}>${alexTotal.toLocaleString()}</div>
          <div className={s.contribPct}>{alexPct}% of total</div>
          <div className={s.contribBar}><div className={s.contribFill} style={{width:alexPct+'%', background: user?.avatarColor||'var(--sage)'}} /></div>
        </div>
        <div className={s.contribCard}>
          <div className={s.contribAvatar} style={{background:'#3A7CA822',color:'#3A7CA8'}}>JL</div>
          <div className={s.contribName}>{coName}</div>
          <div className={s.contribAmt}>${jordanTotal.toLocaleString()}</div>
          <div className={s.contribPct}>{jordanPct}% of total</div>
          <div className={s.contribBar}><div className={s.contribFill} style={{width:jordanPct+'%', background:'#3A7CA8'}} /></div>
        </div>
      </div>

      <div className={s.sectionTitle}>✨ AI insights</div>
      <div className={s.insightCard}>
        <div className={s.insightLabel}>Spending pattern</div>
        <div className={s.insightText}>
          {topCat ? `${topCat.name} is your highest category at $${topCat.total.toLocaleString()}.` : ''} Education-related costs (school + sports) make up {Math.round(((catTotals.School||0)+(catTotals.Sports||0))/totalSpend*100)}% of total spending.
        </div>
      </div>
      <div className={s.insightCard}>
        <div className={s.insightLabel}>Balance analysis</div>
        <div className={s.insightText}>
          {myName} has submitted {alexPct}% of total expenses. Based on the agreed {user?.defaultSplit?.self||55}% split, {alexPct > (user?.defaultSplit?.self||55) ? `${coName} owes ${myName} $${Math.abs(alexTotal - Math.round(totalSpend*(user?.defaultSplit?.self||55)/100)).toLocaleString()} to rebalance.` : `${myName} is ${100-alexPct-((user?.defaultSplit?.other||45))}% below target contribution.`}
        </div>
      </div>
      <div className={s.insightCard}>
        <div className={s.insightLabel}>Forecast</div>
        <div className={s.insightText}>Based on prior patterns, expect higher spending in June (summer activities). Budget approximately 15–20% above this month's pace for summer camps, sports, and recreation.</div>
      </div>

      <div className={s.sectionTitle}>Audit trail</div>
      <div className={s.auditList}>
        {AUDIT.map((a, i) => (
          <div key={i} className={s.auditRow}>
            <div className={s.auditDot + ' ' + (a.action==='approved' ? s.auditGreen : s.auditRed)} />
            <div className={s.auditInfo}>
              <div className={s.auditText}><strong>{a.who}</strong> {a.action} <em>{a.what}</em></div>
              <div className={s.auditDate}>{a.date}</div>
            </div>
            <span className={'badge badge-' + (a.action === 'approved' ? 'approved' : 'rejected')}>{a.action}</span>
          </div>
        ))}
      </div>

      <button className={s.exportBtn}>
        ↓ Export report (CSV / PDF)
      </button>
    </div>
  )
}
