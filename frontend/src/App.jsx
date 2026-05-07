import { useState, useEffect, useCallback } from 'react';
import { supabase, signIn, signUp, signOut, resetPw, api } from './lib/supabase.js';

// ── Constants ─────────────────────────────────────────
const CATEGORIES = ['Medical','Dental','Education','School fees','Sports','Activities','Clothing','Clothing','Travel','Other'];
const PRESETS     = [{ label:'50 / 50', a:50 }, { label:'60 / 40', a:60 }, { label:'70 / 30', a:70 }, { label:'80 / 20', a:80 }];

function fmt(n) { return new Intl.NumberFormat('en-AU',{ style:'currency', currency:'AUD' }).format(n||0); }
function pct(n) { return `${n}%`; }

// ── Root ──────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [screen,  setScreen]  = useState('calc');   // calc | history | share | auth
  const [shareToken, setShareToken] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_, s) => setSession(s));
    // Check for share token in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('share')) { setShareToken(params.get('share')); setScreen('share'); }
  }, []);

  useEffect(() => {
    if (session) api.isUnlocked().then(d => setUnlocked(d.unlocked)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlocked') === '1') { setUnlocked(true); setScreen('history'); }
  }, [session]);

  return (
    <div style={styles.root}>
      <Header session={session} screen={screen} setScreen={setScreen} onSignOut={() => { signOut(); setSession(null); }} />
      <main style={styles.main}>
        {screen === 'auth'    && <AuthScreen onDone={() => setScreen('calc')} />}
        {screen === 'calc'    && <CalcScreen session={session} unlocked={unlocked} setScreen={setScreen} setShareToken={setShareToken} />}
        {screen === 'history' && <HistoryScreen session={session} unlocked={unlocked} setScreen={setScreen} />}
        {screen === 'share'   && <ShareScreen token={shareToken} />}
      </main>
      <footer style={styles.footer}>
        <span style={{color:'#94a3b8'}}>CoParenting Pay © {new Date().getFullYear()}</span>
        <span style={{color:'#cbd5e1',margin:'0 8px'}}>·</span>
        <span style={{color:'#94a3b8'}}>Records kept 7 years</span>
      </footer>
    </div>
  );
}

// ── Header ────────────────────────────────────────────
function Header({ session, screen, setScreen, onSignOut }) {
  return (
    <header style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.logo} onClick={() => setScreen('calc')}>
          <div style={styles.logoMark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoName}>CoParenting Pay</div>
            <div style={styles.logoTag}>child cost calculator</div>
          </div>
        </div>
        <nav style={styles.nav}>
          <NavBtn active={screen==='calc'}    onClick={() => setScreen('calc')}>Calculator</NavBtn>
          {session && <NavBtn active={screen==='history'} onClick={() => setScreen('history')}>History</NavBtn>}
          {session
            ? <button style={{...styles.navBtn,...styles.navBtnOut}} onClick={onSignOut}>Sign out</button>
            : <button style={{...styles.navBtn,...styles.navBtnLogin}} onClick={() => setScreen('auth')}>Sign in</button>
          }
        </nav>
      </div>
    </header>
  );
}

function NavBtn({ children, active, onClick }) {
  return (
    <button style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }} onClick={onClick}>
      {children}
    </button>
  );
}

// ── Auth Screen ───────────────────────────────────────
function AuthScreen({ onDone }) {
  const [mode,  setMode]  = useState('login');
  const [email, setEmail] = useState('');
  const [pw,    setPw]    = useState('');
  const [err,   setErr]   = useState('');
  const [msg,   setMsg]   = useState('');
  const [busy,  setBusy]  = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'forgot') {
        await resetPw(email);
        setMsg('Check your email for a reset link.');
      } else if (mode === 'login') {
        const { error } = await signIn(email, pw);
        if (error) throw error;
        onDone();
      } else {
        const { error } = await signUp(email, pw);
        if (error) throw error;
        setMsg('Check your email to confirm your account, then sign in.');
        setMode('login');
      }
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <h2 style={styles.authTitle}>{mode==='login'?'Sign in':mode==='signup'?'Create account':'Reset password'}</h2>
        <p style={styles.authSub}>Save calculations &amp; access history</p>
        {err && <div style={styles.errorBox}>{err}</div>}
        {msg && <div style={styles.successBox}>{msg}</div>}
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:12}}>
          <input style={styles.input} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required />
          {mode !== 'forgot' && <input style={styles.input} type="password" placeholder="Password (min 6 chars)" value={pw} onChange={e=>setPw(e.target.value)} required minLength={6} />}
          <button style={{...styles.btnPrimary, opacity: busy?0.7:1}} disabled={busy} type="submit">
            {busy ? '…' : mode==='login'?'Sign in':mode==='signup'?'Create account':'Send reset link'}
          </button>
        </form>
        <div style={styles.authLinks}>
          {mode==='login'  && <><button style={styles.link} onClick={()=>setMode('signup')}>Create account</button><span style={{color:'#cbd5e1'}}> · </span><button style={styles.link} onClick={()=>setMode('forgot')}>Forgot password?</button></>}
          {mode!=='login'  && <button style={styles.link} onClick={()=>setMode('login')}>Back to sign in</button>}
        </div>
      </div>
    </div>
  );
}

// ── Calculator Screen ─────────────────────────────────
function CalcScreen({ session, unlocked, setScreen, setShareToken }) {
  const [expenses, setExpenses] = useState([newExpense()]);
  const [title,    setTitle]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(null);  // { id, shareToken }
  const [error,    setError]    = useState('');

  function newExpense() {
    return { id: Date.now(), description:'', amount:'', category:'Other', paidBy:'Parent A', splitA:50 };
  }

  const addExpense    = () => setExpenses(ex => [...ex, newExpense()]);
  const removeExpense = (id) => setExpenses(ex => ex.filter(e => e.id !== id));
  const updateExpense = (id, field, val) => setExpenses(ex => ex.map(e => e.id===id ? {...e,[field]:val} : e));

  // Live calculation
  const totals = expenses.reduce((acc, e) => {
    const amt = parseFloat(e.amount) || 0;
    if (!amt) return acc;
    const owedByB = e.paidBy==='Parent A' ? amt*(100-e.splitA)/100 : 0;
    const owedByA = e.paidBy==='Parent B' ? amt*e.splitA/100       : 0;
    acc.owedByA  += owedByA;
    acc.owedByB  += owedByB;
    acc.totalAmt += amt;
    return acc;
  }, { owedByA:0, owedByB:0, totalAmt:0 });

  const balance = totals.owedByA - totals.owedByB;

  async function handleSave() {
    if (!session) { setScreen('auth'); return; }
    const valid = expenses.filter(e => e.description && parseFloat(e.amount) > 0);
    if (!valid.length) { setError('Add at least one expense with an amount.'); return; }
    setSaving(true); setError('');
    try {
      const result = await api.saveCalculation({ title: title||'Expense Split', expenses: valid });
      setSaved(result);
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleShare() {
    if (!saved) return;
    const url = `${window.location.origin}?share=${saved.shareToken}`;
    navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!'));
  }

  async function handlePDF() {
    if (!session) { setScreen('auth'); return; }
    if (!unlocked) {
      const { url } = await api.checkout(saved?.id).catch(() => ({ url: null }));
      if (url) window.location.href = url;
      return;
    }
    window.open(api.getPdfUrl(saved.id), '_blank');
  }

  return (
    <div style={styles.page}>
      {/* Title */}
      <div style={styles.section}>
        <input style={{...styles.input,...styles.titleInput}} placeholder="Calculation title (optional)" value={title} onChange={e=>setTitle(e.target.value)} />
      </div>

      {/* Expense rows */}
      <div style={styles.section}>
        <div style={styles.sectionLabel}>Expenses</div>
        {expenses.map((exp, i) => (
          <ExpenseRow key={exp.id} exp={exp} index={i} onChange={updateExpense} onRemove={removeExpense} canRemove={expenses.length>1} />
        ))}
        <button style={styles.btnAdd} onClick={addExpense}>+ Add expense</button>
      </div>

      {/* Summary */}
      {totals.totalAmt > 0 && (
        <div style={styles.summaryCard}>
          <div style={styles.summaryTitle}>Split summary</div>
          <div style={styles.summaryGrid}>
            <SummaryItem label="Total expenses"   value={fmt(totals.totalAmt)} />
            <SummaryItem label="Parent A owes"    value={fmt(totals.owedByA)} highlight={totals.owedByA > 0} />
            <SummaryItem label="Parent B owes"    value={fmt(totals.owedByB)} highlight={totals.owedByB > 0} />
          </div>
          <div style={styles.balanceLine}>
            {Math.abs(balance) < 0.01
              ? <span style={{color:'#22c55e',fontWeight:600}}>✓ Balanced — no payment needed</span>
              : balance > 0
              ? <span><strong style={{color:'#e11d48'}}>Parent B pays Parent A</strong>{' '}<strong style={{fontSize:22}}>{fmt(balance)}</strong></span>
              : <span><strong style={{color:'#e11d48'}}>Parent A pays Parent B</strong>{' '}<strong style={{fontSize:22}}>{fmt(Math.abs(balance))}</strong></span>
            }
          </div>
        </div>
      )}

      {/* Per-expense breakdown */}
      {totals.totalAmt > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Breakdown</div>
          <div style={styles.breakdownTable}>
            <div style={styles.breakdownHead}>
              <span>Description</span><span>Amount</span><span>Split</span><span>Owed</span>
            </div>
            {expenses.filter(e=>parseFloat(e.amount)>0).map(e => {
              const amt  = parseFloat(e.amount)||0;
              const owed = e.paidBy==='Parent A' ? `B owes ${fmt(amt*(100-e.splitA)/100)}` : `A owes ${fmt(amt*e.splitA/100)}`;
              return (
                <div key={e.id} style={styles.breakdownRow}>
                  <span style={{color:'#334155'}}>{e.description||'—'}</span>
                  <span style={{color:'#64748b'}}>{fmt(amt)}</span>
                  <span style={{color:'#94a3b8'}}>{e.splitA}/{100-e.splitA}</span>
                  <span style={{color:'#e11d48',fontWeight:500}}>{owed}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {error && <div style={styles.errorBox}>{error}</div>}
      <div style={styles.actions}>
        <button style={{...styles.btnPrimary, flex:1}} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : session ? 'Save calculation' : 'Sign in to save'}
        </button>
        {saved && (
          <>
            <button style={{...styles.btnSecondary}} onClick={handleShare} title="Copy share link">
              🔗 Share
            </button>
            <button style={{...styles.btnSecondary, ...(unlocked?{}:{background:'#fef3c7',borderColor:'#fbbf24',color:'#92400e'})}} onClick={handlePDF}>
              {unlocked ? '📄 PDF' : '🔒 PDF $4.99'}
            </button>
          </>
        )}
      </div>
      {!session && (
        <p style={styles.saveNote}>
          <button style={styles.link} onClick={() => setScreen('auth')}>Sign in free</button> to save calculations and access history for 7 years.
        </p>
      )}
    </div>
  );
}

// ── Expense Row ───────────────────────────────────────
function ExpenseRow({ exp, index, onChange, onRemove, canRemove }) {
  return (
    <div style={styles.expenseRow}>
      <div style={styles.expenseRowTop}>
        <span style={styles.expenseIndex}>{index+1}</span>
        <input style={{...styles.input,flex:2,minWidth:0}}
          placeholder="Description (e.g. dentist)" value={exp.description}
          onChange={e=>onChange(exp.id,'description',e.target.value)} />
        <input style={{...styles.input,...styles.amountInput}}
          type="number" placeholder="Amount" value={exp.amount} min="0" step="0.01"
          onChange={e=>onChange(exp.id,'amount',e.target.value)} />
        {canRemove && <button style={styles.btnRemove} onClick={()=>onRemove(exp.id)}>×</button>}
      </div>
      <div style={styles.expenseRowBottom}>
        <select style={{...styles.input,...styles.selectSm}} value={exp.category} onChange={e=>onChange(exp.id,'category',e.target.value)}>
          {CATEGORIES.map(c=><option key={c}>{c}</option>)}
        </select>
        <select style={{...styles.input,...styles.selectSm}} value={exp.paidBy} onChange={e=>onChange(exp.id,'paidBy',e.target.value)}>
          <option>Parent A</option><option>Parent B</option>
        </select>
        <div style={styles.splitGroup}>
          {PRESETS.map(p=>(
            <button key={p.label} style={{...styles.splitPreset,...(exp.splitA===p.a?styles.splitPresetActive:{})}}
              onClick={()=>onChange(exp.id,'splitA',p.a)}>{p.label}</button>
          ))}
          <div style={styles.splitSliderWrap}>
            <input type="range" min={0} max={100} step={5} value={exp.splitA}
              onChange={e=>onChange(exp.id,'splitA',parseInt(e.target.value))}
              style={styles.slider} />
            <span style={styles.splitLabel}>A {exp.splitA}% / B {100-exp.splitA}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary items ─────────────────────────────────────
function SummaryItem({ label, value, highlight }) {
  return (
    <div style={styles.summaryItem}>
      <div style={styles.summaryItemLabel}>{label}</div>
      <div style={{...styles.summaryItemValue,...(highlight?{color:'#e11d48'}:{})}}>{value}</div>
    </div>
  );
}

// ── History Screen ────────────────────────────────────
function HistoryScreen({ session, unlocked, setScreen }) {
  const [calcs,   setCalcs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting,setDeleting]= useState(null);

  useEffect(() => {
    if (!session) { setScreen('auth'); return; }
    api.getCalculations()
      .then(setCalcs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  async function handleDelete(id) {
    if (!confirm('Delete this calculation? This cannot be undone.')) return;
    setDeleting(id);
    await api.deleteCalculation(id).catch(console.error);
    setCalcs(c => c.filter(x => x.id !== id));
    setDeleting(null);
  }

  async function handleUnlock() {
    const { url } = await api.checkout().catch(() => ({ url: null }));
    if (url) window.location.href = url;
  }

  if (loading) return <div style={styles.centered}>Loading…</div>;

  return (
    <div style={styles.page}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={styles.pageTitle}>Saved calculations</h2>
        {!unlocked && (
          <button style={{...styles.btnPrimary,...styles.btnSmall,background:'#f59e0b',borderColor:'#f59e0b'}} onClick={handleUnlock}>
            🔒 Unlock PDF — $4.99
          </button>
        )}
      </div>

      {calcs.length === 0
        ? <div style={styles.emptyState}>No saved calculations yet. Go to the Calculator and save one.</div>
        : calcs.map(calc => <HistoryCard key={calc.id} calc={calc} unlocked={unlocked} onDelete={handleDelete} deleting={deleting===calc.id} />)
      }
    </div>
  );
}

function HistoryCard({ calc, unlocked, onDelete, deleting }) {
  const expenses = calc.expenses || [];
  const total = expenses.reduce((s,e) => s + parseFloat(e.amount||0), 0);
  const shareUrl = `${window.location.origin}?share=${calc.share_token}`;

  function copyShare() {
    navigator.clipboard.writeText(shareUrl);
    alert('Share link copied!');
  }

  return (
    <div style={styles.historyCard}>
      <div style={styles.historyCardHead}>
        <div>
          <div style={styles.historyCardTitle}>{calc.title}</div>
          <div style={styles.historyCardMeta}>{new Date(calc.created_at).toLocaleDateString('en-AU')} · {expenses.length} expense{expenses.length!==1?'s':''} · {fmt(total)}</div>
        </div>
        <div style={{display:'flex',gap:8,flexShrink:0}}>
          <button style={styles.btnIconSm} onClick={copyShare} title="Copy share link">🔗</button>
          {unlocked && (
            <a href={`/api/calculations/${calc.id}/pdf`} target="_blank" style={{...styles.btnIconSm,textDecoration:'none'}} title="Download PDF">📄</a>
          )}
          <button style={{...styles.btnIconSm,color:'#ef4444'}} onClick={()=>onDelete(calc.id)} disabled={deleting}>
            {deleting?'…':'🗑'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Share Screen ──────────────────────────────────────
function ShareScreen({ token }) {
  const [calc,    setCalc]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!token) return;
    api.getShare(token)
      .then(setCalc)
      .catch(() => setError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={styles.centered}>Loading…</div>;
  if (error)   return <div style={{...styles.centered,...styles.errorBox}}>{error}</div>;
  if (!calc)   return null;

  const expenses = calc.expenses || [];
  const totals = expenses.reduce((acc, e) => {
    const amt  = parseFloat(e.amount)||0;
    acc.owedByA += e.paid_by==='Parent B' ? amt*e.split_a/100 : 0;
    acc.owedByB += e.paid_by==='Parent A' ? amt*(100-e.split_a)/100 : 0;
    acc.total   += amt;
    return acc;
  }, { owedByA:0, owedByB:0, total:0 });

  const balance = totals.owedByA - totals.owedByB;

  return (
    <div style={styles.page}>
      <div style={styles.shareHeader}>
        <div style={styles.shareBadge}>Shared calculation</div>
        <h2 style={styles.pageTitle}>{calc.title}</h2>
        <p style={styles.shareMeta}>Created {new Date(calc.created_at).toLocaleDateString('en-AU')}</p>
      </div>

      <div style={styles.summaryCard}>
        <div style={styles.summaryTitle}>Split result</div>
        <div style={styles.summaryGrid}>
          <SummaryItem label="Total"        value={fmt(totals.total)} />
          <SummaryItem label="Parent A owes" value={fmt(totals.owedByA)} highlight={totals.owedByA>0} />
          <SummaryItem label="Parent B owes" value={fmt(totals.owedByB)} highlight={totals.owedByB>0} />
        </div>
        <div style={styles.balanceLine}>
          {Math.abs(balance)<0.01
            ? <span style={{color:'#22c55e',fontWeight:600}}>✓ Balanced</span>
            : balance>0
            ? <><strong style={{color:'#e11d48'}}>Parent B pays Parent A</strong>{' '}<strong style={{fontSize:22}}>{fmt(balance)}</strong></>
            : <><strong style={{color:'#e11d48'}}>Parent A pays Parent B</strong>{' '}<strong style={{fontSize:22}}>{fmt(Math.abs(balance))}</strong></>
          }
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Expenses</div>
        <div style={styles.breakdownTable}>
          <div style={styles.breakdownHead}>
            <span>Description</span><span>Category</span><span>Amount</span><span>Split</span>
          </div>
          {expenses.map(e => (
            <div key={e.id} style={styles.breakdownRow}>
              <span style={{color:'#334155'}}>{e.description}</span>
              <span style={{color:'#94a3b8'}}>{e.category}</span>
              <span style={{color:'#64748b'}}>{fmt(e.amount)}</span>
              <span style={{color:'#94a3b8'}}>{e.split_a}/{100-e.split_a}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{textAlign:'center',marginTop:24}}>
        <a href="/" style={{...styles.btnPrimary,display:'inline-block',textDecoration:'none'}}>
          Try CoParenting Pay free →
        </a>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────
const C = {
  bg:      '#f8fafc',
  card:    '#ffffff',
  border:  '#e2e8f0',
  text:    '#0f172a',
  muted:   '#64748b',
  primary: '#1e40af',
  danger:  '#e11d48',
  green:   '#16a34a',
};

const styles = {
  root:          { minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif', color:C.text, display:'flex', flexDirection:'column' },
  header:        { background:C.card, borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, zIndex:100 },
  headerInner:   { maxWidth:860, margin:'0 auto', padding:'0 20px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:          { display:'flex', alignItems:'center', gap:10, cursor:'pointer', userSelect:'none' },
  logoMark:      { width:34, height:34, background:C.primary, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 },
  logoName:      { fontWeight:700, fontSize:15, letterSpacing:'-0.02em', lineHeight:1.2 },
  logoTag:       { fontSize:10, color:C.muted, letterSpacing:'0.04em', textTransform:'uppercase' },
  nav:           { display:'flex', alignItems:'center', gap:4 },
  navBtn:        { background:'none', border:'none', cursor:'pointer', padding:'6px 12px', borderRadius:7, fontSize:13, color:C.muted, fontWeight:500, transition:'all .15s' },
  navBtnActive:  { color:C.primary, background:'#eff6ff' },
  navBtnLogin:   { background:C.primary, color:'#fff', padding:'7px 16px' },
  navBtnOut:     { color:C.muted },
  main:          { flex:1, maxWidth:860, width:'100%', margin:'0 auto', padding:'28px 20px 40px' },
  footer:        { textAlign:'center', padding:'16px 20px', borderTop:`1px solid ${C.border}`, fontSize:12 },

  page:          { maxWidth:680, margin:'0 auto' },
  pageTitle:     { fontSize:22, fontWeight:700, letterSpacing:'-0.02em', margin:'0 0 4px' },
  section:       { marginBottom:24 },
  sectionLabel:  { fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 },

  input:         { padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:14, color:C.text, background:'#fff', outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit', transition:'border .15s' },
  titleInput:    { fontSize:18, fontWeight:600, border:'none', borderBottom:`2px solid ${C.border}`, borderRadius:0, padding:'6px 0', marginBottom:8 },
  amountInput:   { width:120, flexShrink:0 },
  selectSm:      { width:'auto', flexShrink:0 },

  expenseRow:    { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 },
  expenseRowTop: { display:'flex', alignItems:'center', gap:8, marginBottom:10 },
  expenseRowBottom:{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8 },
  expenseIndex:  { width:22, height:22, borderRadius:'50%', background:'#eff6ff', color:C.primary, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  btnRemove:     { background:'none', border:'none', color:'#cbd5e1', fontSize:20, cursor:'pointer', padding:'0 4px', lineHeight:1, flexShrink:0 },

  splitGroup:    { display:'flex', flexWrap:'wrap', alignItems:'center', gap:6, width:'100%', marginTop:2 },
  splitPreset:   { padding:'4px 10px', border:`1px solid ${C.border}`, borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', background:'#f8fafc', color:C.muted, transition:'all .15s' },
  splitPresetActive:{ background:C.primary, borderColor:C.primary, color:'#fff' },
  splitSliderWrap:{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:160 },
  slider:        { flex:1, accentColor:C.primary, cursor:'pointer' },
  splitLabel:    { fontSize:12, color:C.muted, whiteSpace:'nowrap', minWidth:110 },

  btnAdd:        { width:'100%', padding:'10px', border:`1.5px dashed ${C.border}`, borderRadius:10, background:'none', color:C.muted, fontSize:13, fontWeight:500, cursor:'pointer', transition:'all .15s' },
  btnPrimary:    { padding:'11px 20px', background:C.primary, color:'#fff', border:`1px solid ${C.primary}`, borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .15s', textAlign:'center' },
  btnSecondary:  { padding:'11px 16px', background:'#fff', color:C.text, border:`1px solid ${C.border}`, borderRadius:9, fontSize:14, fontWeight:500, cursor:'pointer', transition:'all .15s' },
  btnSmall:      { padding:'7px 14px', fontSize:12 },
  btnIconSm:     { padding:'6px 10px', background:'#f8fafc', border:`1px solid ${C.border}`, borderRadius:7, fontSize:14, cursor:'pointer' },

  actions:       { display:'flex', gap:10, marginTop:8, flexWrap:'wrap' },
  saveNote:      { marginTop:12, fontSize:13, color:C.muted, textAlign:'center' },

  summaryCard:   { background:'#0f172a', borderRadius:14, padding:22, marginBottom:24, color:'#f1f5f9' },
  summaryTitle:  { fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 },
  summaryGrid:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 },
  summaryItem:   { background:'#1e293b', borderRadius:10, padding:12 },
  summaryItemLabel:{ fontSize:11, color:'#64748b', marginBottom:4 },
  summaryItemValue:{ fontSize:18, fontWeight:700, color:'#f1f5f9' },
  balanceLine:   { borderTop:'1px solid #1e293b', paddingTop:14, fontSize:15, color:'#f1f5f9', textAlign:'center' },

  breakdownTable:{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' },
  breakdownHead: { display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', padding:'10px 14px', background:'#f8fafc', fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.05em', gap:8 },
  breakdownRow:  { display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr', padding:'10px 14px', borderTop:`1px solid ${C.border}`, fontSize:13, gap:8, alignItems:'center' },

  historyCard:   { background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, marginBottom:10 },
  historyCardHead:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 },
  historyCardTitle:{ fontWeight:600, fontSize:15, marginBottom:3 },
  historyCardMeta: { fontSize:12, color:C.muted },

  authWrap:      { display:'flex', justifyContent:'center', padding:'40px 20px' },
  authCard:      { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:32, width:'100%', maxWidth:380 },
  authTitle:     { fontSize:20, fontWeight:700, marginBottom:4 },
  authSub:       { fontSize:13, color:C.muted, marginBottom:20 },
  authLinks:     { marginTop:16, textAlign:'center', fontSize:13, color:C.muted },

  shareHeader:   { marginBottom:20 },
  shareBadge:    { display:'inline-block', background:'#dbeafe', color:'#1e40af', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, letterSpacing:'0.04em', marginBottom:8 },
  shareMeta:     { fontSize:13, color:C.muted, marginTop:2 },

  errorBox:      { background:'#fff1f2', border:'1px solid #fecdd3', color:'#be123c', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  successBox:    { background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#15803d', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12 },
  link:          { background:'none', border:'none', color:C.primary, cursor:'pointer', fontSize:'inherit', padding:0, textDecoration:'underline' },
  centered:      { textAlign:'center', padding:60, color:C.muted },
  emptyState:    { textAlign:'center', padding:'40px 20px', color:C.muted, fontSize:14 },
};
