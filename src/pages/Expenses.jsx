import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import s from './Expenses.module.css'

const CATS = ['Medical','School','Sports','Recreation','Clothing','Trips','Other']
const CAT_COLORS = { Medical:'#B85C5C', School:'#3A7CA8', Sports:'#4A7C59', Recreation:'#C8832A', Clothing:'#7A5CA8', Trips:'#1D9E75', Other:'#888' }
const catEmoji = c => ({ Medical:'🩺', School:'📚', Sports:'⚽', Recreation:'🎡', Clothing:'👕', Trips:'✈️', Other:'📌' }[c]||'📌')
const fmtDate = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'})

export default function Expenses() {
  const { expenses, addExpense, updateExpenseStatus, user } = useAuth()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title:'', amount:'', kidName:'Mia', category:'Medical', split:55, note:'' })

  useEffect(() => {
    if (location.search.includes('add=1')) setShowAdd(true)
  }, [location])

  const filtered = expenses.filter(e => filter === 'all' || e.status === filter)

  const handleSubmit = () => {
    if (!form.title || !form.amount) return
    addExpense({
      title: form.title,
      amount: parseFloat(form.amount),
      kidName: form.kidName,
      category: form.category,
      split: { alex: form.split, jordan: 100 - form.split },
      note: form.note,
      submittedBy: user?.name?.split(' ')[0].toLowerCase() || 'alex',
      submittedByName: user?.name?.split(' ')[0] || 'Alex',
    })
    setForm({ title:'', amount:'', kidName:'Mia', category:'Medical', split:55, note:'' })
    setShowAdd(false)
  }

  return (
    <div className={s.page}>
      <div className={s.tabRow}>
        {['all','pending','approved','rejected'].map(t => (
          <button key={t} className={s.tab + (filter === t ? ' ' + s.tabActive : '')} onClick={() => setFilter(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'pending' && expenses.filter(e=>e.status==='pending').length > 0 && (
              <span className={s.tabCount}>{expenses.filter(e=>e.status==='pending').length}</span>
            )}
          </button>
        ))}
      </div>

      <div className={s.list}>
        {filtered.length === 0 && <div className={s.empty}>No {filter === 'all' ? '' : filter} expenses</div>}
        {filtered.map(exp => (
          <div key={exp.id} className={s.row} onClick={() => setSelected(exp)}>
            <div className={s.rowIcon} style={{background:(CAT_COLORS[exp.category]||'#888')+'18',color:CAT_COLORS[exp.category]||'#888'}}>
              {catEmoji(exp.category)}
            </div>
            <div className={s.rowInfo}>
              <div className={s.rowTitle}>{exp.title}</div>
              <div className={s.rowSub}>{exp.kidName} · {exp.category} · {fmtDate(exp.date)}</div>
            </div>
            <div className={s.rowRight}>
              <div className={s.rowAmount}>${exp.amount}</div>
              <span className={'badge badge-'+exp.status}>{exp.status.charAt(0).toUpperCase()+exp.status.slice(1)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className={s.sheet}>
            <div className={s.sheetHandle} />
            <div className={s.sheetHeader}>
              <div className={s.sheetIcon} style={{background:(CAT_COLORS[selected.category]||'#888')+'18',color:CAT_COLORS[selected.category]||'#888'}}>
                {catEmoji(selected.category)}
              </div>
              <div style={{flex:1}}>
                <div className={s.sheetTitle}>{selected.title}</div>
                <div className={s.sheetSub}>{selected.kidName} · {fmtDate(selected.date)}</div>
              </div>
              <button className={s.closeBtn} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className={s.sheetGrid}>
              {[['Amount',`$${selected.amount}`],['Category',selected.category],['Submitted by',selected.submittedByName],['Status',<span className={'badge badge-'+selected.status}>{selected.status}</span>]].map(([k,v]) => (
                <div key={k} className={s.sheetItem}>
                  <div className={s.sheetItemLabel}>{k}</div>
                  <div className={s.sheetItemVal}>{v}</div>
                </div>
              ))}
            </div>

            {selected.note && <div className={s.noteBox}>{selected.note}</div>}

            <div className={s.splitTitle}>Split breakdown</div>
            <div className={s.splitPair}>
              <div className={s.splitSide}>
                <div className={s.splitName}>{user?.name?.split(' ')[0] || 'Alex'}</div>
                <div className={s.splitAmt}>${(selected.amount * (selected.split.alex||50) / 100).toFixed(2)}</div>
                <div className={s.splitPct}>{selected.split.alex||50}%</div>
              </div>
              <div className={s.splitBar}>
                <div className={s.splitFill} style={{width:(selected.split.alex||50)+'%'}} />
              </div>
              <div className={s.splitSide} style={{textAlign:'right'}}>
                <div className={s.splitName}>{user?.coParent?.name?.split(' ')[0] || 'Jordan'}</div>
                <div className={s.splitAmt}>${(selected.amount * (selected.split.jordan||50) / 100).toFixed(2)}</div>
                <div className={s.splitPct}>{selected.split.jordan||50}%</div>
              </div>
            </div>

            {selected.status === 'pending' && (
              <div className={s.actionRow}>
                <button className={s.rejectBtn} onClick={() => { updateExpenseStatus(selected.id,'rejected'); setSelected(null) }}>✕ Reject</button>
                <button className={s.approveBtn} onClick={() => { updateExpenseStatus(selected.id,'approved'); setSelected(null) }}>✓ Approve</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add expense modal */}
      {showAdd && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className={s.sheet}>
            <div className={s.sheetHandle} />
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <div className={s.sheetTitle}>Add expense</div>
              <button className={s.closeBtn} onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Description</label>
              <input className={s.formInput} placeholder="e.g. Dentist visit" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
            </div>

            <div className={s.formRow}>
              <div className={s.formGroup} style={{flex:1}}>
                <label className={s.formLabel}>Amount ($)</label>
                <input className={s.formInput} type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} />
              </div>
              <div className={s.formGroup} style={{flex:1}}>
                <label className={s.formLabel}>Child</label>
                <select className={s.formInput} value={form.kidName} onChange={e => setForm(p=>({...p,kidName:e.target.value}))}>
                  <option>Mia</option><option>Leo</option><option>Both</option>
                </select>
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Category</label>
              <div className={s.catChips}>
                {CATS.map(c => (
                  <button key={c} className={s.catChip + (form.category===c ? ' ' + s.catChipActive : '')} onClick={() => setForm(p=>({...p,category:c}))}>
                    {catEmoji(c)} {c}
                  </button>
                ))}
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Split — You {form.split}% / Co-parent {100-form.split}%</label>
              <div className={s.splitBar} style={{height:8,margin:'6px 0'}}>
                <div className={s.splitFill} style={{width:form.split+'%'}} />
              </div>
              <input type="range" min="10" max="90" step="5" value={form.split} onChange={e => setForm(p=>({...p,split:+e.target.value}))} className={s.slider} />
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Note (optional)</label>
              <textarea className={s.formInput} rows={2} placeholder="Any additional context..." value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} style={{resize:'none'}} />
            </div>

            <button className={s.approveBtn} style={{width:'100%',justifyContent:'center',marginTop:4}} onClick={handleSubmit} disabled={!form.title||!form.amount}>
              Submit for approval →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
