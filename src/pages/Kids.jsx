import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import s from './Kids.module.css'

const CAT_COLORS = { Medical:'#B85C5C', School:'#3A7CA8', Sports:'#4A7C59', Recreation:'#C8832A', Clothing:'#7A5CA8', Trips:'#1D9E75' }
const KID_COLORS = ['#4A7C59', '#3A7CA8', '#C8832A', '#B85C5C', '#7A5CA8', '#1D9E75']
const GRADES = ['Pre-K','K','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th']

const BLANK_FORM = { name: '', age: '', grade: '', splitSelf: 50, splitOther: 50, color: KID_COLORS[0] }

export default function Kids() {
  const { user, expenses, addKid, updateKid, deleteKid } = useAuth()
  const kids = user?.kids || []
  const myFirstName = user?.name?.split(' ')[0] || 'You'
  const coFirstName = user?.coParent?.name?.split(' ')[0] || 'Co-parent'

  const [modal, setModal] = useState(null)   // null | 'add' | 'edit'
  const [editKid, setEditKid] = useState(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const openAdd = () => {
    setForm({ ...BLANK_FORM, color: KID_COLORS[kids.length % KID_COLORS.length] })
    setError('')
    setModal('add')
  }

  const openEdit = (kid) => {
    setEditKid(kid)
    setForm({
      name: kid.name,
      age: kid.age || '',
      grade: kid.grade || '',
      splitSelf: kid.split?.self ?? 50,
      splitOther: kid.split?.other ?? 50,
      color: kid.color || KID_COLORS[0]
    })
    setError('')
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setEditKid(null); setError('') }

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSplitSlider = (val) => {
    setForm(p => ({ ...p, splitSelf: +val, splitOther: 100 - +val }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setLoading(true); setError('')
    try {
      if (modal === 'add') {
        await addKid({ ...form, name: form.name.trim() })
      } else if (modal === 'edit' && editKid) {
        await updateKid(editKid.id, {
          name: form.name.trim(),
          age: parseInt(form.age) || 0,
          grade: form.grade,
          color: form.color,
          split: { self: form.splitSelf, other: form.splitOther }
        })
      }
      closeModal()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDelete = async (kidId) => {
    setLoading(true)
    try { await deleteKid(kidId); setConfirmDelete(null) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerTitle}>Child profiles</div>
        <button className={s.addBtn} onClick={openAdd}>+ Add child</button>
      </div>

      {kids.length === 0 && (
        <div className={s.empty}>
          <div style={{fontSize:32,marginBottom:10}}>👶</div>
          <div style={{fontWeight:500,marginBottom:6}}>No children added yet</div>
          <div style={{fontSize:13,color:'var(--ink-soft)'}}>Tap "+ Add child" to create a profile.</div>
        </div>
      )}

      {kids.map(kid => {
        const kidExps = expenses.filter(e => e.kidId === kid.id || e.kidId === 'both')
        const monthExps = kidExps.filter(e => e.status !== 'rejected' && e.date >= '2026-05-01')
        const ytdExps = kidExps.filter(e => e.status !== 'rejected')
        const monthTotal = monthExps.reduce((sum, e) => sum + e.amount, 0)
        const ytdTotal = ytdExps.reduce((sum, e) => sum + e.amount, 0)
        const pending = kidExps.filter(e => e.status === 'pending').length

        const catTotals = {}
        ytdExps.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount })
        const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 3)
        const maxCat = topCats[0]?.[1] || 1

        const myPct = kid.split?.self ?? 50
        const coPct = 100 - myPct

        return (
          <div key={kid.id} className={s.kidCard}>
            <div className={s.kidHeader}>
              <div className={s.kidAvatar} style={{ background: kid.color + '22', color: kid.color }}>
                {kid.avatar}
              </div>
              <div className={s.kidInfo}>
                <div className={s.kidName}>{kid.name}</div>
                <div className={s.kidMeta}>
                  {kid.age ? `Age ${kid.age}` : ''}
                  {kid.age && kid.grade ? ' · ' : ''}
                  {kid.grade ? `${kid.grade} Grade` : ''}
                  {!kid.age && !kid.grade ? 'No details yet' : ''}
                </div>
              </div>
              <div className={s.kidActions}>
                {pending > 0 && <span className={'badge badge-pending'}>{pending} pending</span>}
                <button className={s.editBtn} onClick={() => openEdit(kid)} aria-label="Edit">✏️</button>
              </div>
            </div>

            <div className={s.metrics}>
              <div className={s.metricBox}>
                <div className={s.metricLabel}>May spend</div>
                <div className={s.metricVal}>${monthTotal.toLocaleString()}</div>
              </div>
              <div className={s.metricBox}>
                <div className={s.metricLabel}>YTD total</div>
                <div className={s.metricVal}>${ytdTotal.toLocaleString()}</div>
              </div>
              <div className={s.metricBox}>
                <div className={s.metricLabel}>Expenses</div>
                <div className={s.metricVal}>{ytdExps.length}</div>
              </div>
            </div>

            <div className={s.splitSection}>
              <div className={s.splitLabels}>
                <span>{myFirstName} {myPct}%</span>
                <span style={{ fontSize: 10, color: 'var(--ink-ghost)' }}>split</span>
                <span>{coFirstName} {coPct}%</span>
              </div>
              <div className={s.splitBar}>
                <div className={s.splitFill} style={{ width: myPct + '%', background: kid.color }} />
              </div>
            </div>

            {topCats.length > 0 && (
              <div className={s.catSection}>
                <div className={s.catLabel}>Top categories</div>
                {topCats.map(([cat, amt]) => (
                  <div key={cat} className={s.catRow}>
                    <div className={s.catName}>{cat}</div>
                    <div className={s.catTrack}>
                      <div className={s.catFill} style={{ width: Math.round(amt / maxCat * 100) + '%', background: CAT_COLORS[cat] || '#888' }} />
                    </div>
                    <div className={s.catAmt}>${amt}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      {modal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={s.sheet}>
            <div className={s.sheetHandle} />
            <div className={s.sheetTop}>
              <div className={s.sheetTitle}>{modal === 'add' ? 'Add child' : `Edit ${editKid?.name}`}</div>
              <button className={s.closeBtn} onClick={closeModal}>✕</button>
            </div>

            {/* Color picker */}
            <div className={s.colorRow}>
              {KID_COLORS.map(c => (
                <button key={c} className={s.colorDot + (form.color === c ? ' ' + s.colorDotActive : '')}
                  style={{ background: c + '33', borderColor: form.color === c ? c : 'transparent' }}
                  onClick={() => setField('color', c)} aria-label={c}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
                </button>
              ))}
              {/* Live avatar preview */}
              <div className={s.avatarPreview} style={{ background: form.color + '22', color: form.color }}>
                {form.name ? form.name.slice(0, 2).toUpperCase() : '?'}
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>Child's name *</label>
              <input className={s.formInput} type="text" placeholder="e.g. Mia" autoFocus
                value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>

            <div className={s.formRow}>
              <div className={s.formGroup} style={{ flex: 1 }}>
                <label className={s.formLabel}>Age</label>
                <input className={s.formInput} type="number" min="0" max="25" placeholder="e.g. 8"
                  value={form.age} onChange={e => setField('age', e.target.value)} />
              </div>
              <div className={s.formGroup} style={{ flex: 1.5 }}>
                <label className={s.formLabel}>Grade</label>
                <select className={s.formInput} value={form.grade} onChange={e => setField('grade', e.target.value)}>
                  <option value="">— select —</option>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className={s.formGroup}>
              <label className={s.formLabel}>
                Expense split — {myFirstName} {form.splitSelf}% / {coFirstName} {form.splitOther}%
              </label>
              <div className={s.splitBar} style={{ height: 8, margin: '6px 0' }}>
                <div className={s.splitFill} style={{ width: form.splitSelf + '%', background: form.color }} />
              </div>
              <input type="range" min="10" max="90" step="5" value={form.splitSelf}
                onChange={e => handleSplitSlider(e.target.value)} className={s.slider} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-ghost)', marginTop: 2 }}>
                <span>{myFirstName} pays more</span>
                <span>Equal</span>
                <span>{coFirstName} pays more</span>
              </div>
            </div>

            {error && <div className={s.errorMsg}>{error}</div>}

            <div className={s.sheetBtns}>
              {modal === 'edit' && (
                <button className={s.deleteChildBtn} onClick={() => setConfirmDelete(editKid)}>
                  🗑 Delete
                </button>
              )}
              <button className={s.cancelBtn} onClick={closeModal}>Cancel</button>
              <button className={s.saveBtn} onClick={handleSave} disabled={loading || !form.name.trim()}>
                {loading
                  ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
                  : modal === 'add' ? 'Add child ✓' : 'Save changes ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className={s.overlay} onClick={() => setConfirmDelete(null)}>
          <div className={s.sheet} onClick={e => e.stopPropagation()} style={{ paddingBottom: 32 }}>
            <div className={s.sheetHandle} />
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>Remove {confirmDelete.name}?</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                This will delete the child profile. Existing expenses linked to this child will remain.
              </div>
            </div>
            <div className={s.sheetBtns}>
              <button className={s.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className={s.deleteChildBtn} style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => handleDelete(confirmDelete.id)} disabled={loading}>
                {loading ? '...' : 'Yes, remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
