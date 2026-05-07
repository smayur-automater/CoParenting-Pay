import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import s from './Auth.module.css'

const DEMO_ACCOUNTS = [
  { email: 'alex@gmail.com', name: 'Alex Rivera', role: 'Co-parent A', initials: 'AR', color: '#4A7C59' },
  { email: 'jordan@gmail.com', name: 'Jordan Lee', role: 'Co-parent B', initials: 'JL', color: '#3A7CA8' },
]
const KID_COLORS = ['#4A7C59', '#3A7CA8', '#C8832A', '#B85C5C', '#7A5CA8', '#1D9E75']

export default function AuthPage() {
  const { signInWithGoogle, signUpWithEmail, signInWithEmail, sendPasswordReset, completeSignup, isDemoMode } = useAuth()
  const navigate = useNavigate()

  // Which "screen" to show
  const [screen, setScreen] = useState('landing') 
  // landing | signin | signup | forgot | forgot_sent | verify_email | onboard

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedDemo, setSelectedDemo] = useState(null)

  // Sign-in / sign-up form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPw, setShowPw] = useState(false)

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')

  // Onboarding
  const [coParentEmail, setCoParentEmail] = useState('')
  const [kids, setKids] = useState([])
  const [kidName, setKidName] = useState('')
  const [kidAge, setKidAge] = useState('')
  const [kidGrade, setKidGrade] = useState('')
  const [editingKidId, setEditingKidId] = useState(null)

  const err = (msg) => { setError(msg); setLoading(false) }
  const clearErr = () => setError('')

  // ── Demo / Google login ──────────────────────────────────────────────────
  const handleGoogleLogin = async (demoEmail) => {
    clearErr(); setLoading(true); setSelectedDemo(demoEmail || '__google__')
    try {
      const result = await signInWithGoogle(demoEmail)
      if (result.status === 'redirecting') return // Google redirect happening
      navigate('/dashboard')
    } catch (e) { err(e.message) }
    finally { setLoading(false); setSelectedDemo(null) }
  }

  // ── Email sign-in ────────────────────────────────────────────────────────
  const handleSignIn = async (e) => {
    e.preventDefault(); clearErr(); setLoading(true)
    try {
      await signInWithEmail(email, password)
      navigate('/dashboard')
    } catch (e) {
      err(e.message === 'Invalid login credentials' ? 'Incorrect email or password.' : e.message)
    }
  }

  // ── Email sign-up ────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault(); clearErr()
    if (password.length < 8) return err('Password must be at least 8 characters.')
    if (!fullName.trim()) return err('Please enter your full name.')
    setLoading(true)
    try {
      await signUpWithEmail(email, password, fullName)
      setScreen('verify_email')
    } catch (e) { err(e.message) }
    finally { setLoading(false) }
  }

  // ── Forgot password ──────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault(); clearErr(); setLoading(true)
    try {
      await sendPasswordReset(forgotEmail || email)
      setScreen('forgot_sent')
    } catch (e) { err(e.message) }
    finally { setLoading(false) }
  }

  // ── Add kid to onboarding list ────────────────────────────────────────────
  const handleAddKid = () => {
    if (!kidName.trim()) return
    const newKid = {
      id: 'new_' + Date.now(),
      name: kidName.trim(),
      age: parseInt(kidAge) || 0,
      grade: kidGrade.trim(),
      avatar: kidName.trim().slice(0, 2).toUpperCase(),
      color: KID_COLORS[kids.length % KID_COLORS.length]
    }
    setKids(prev => [...prev, newKid])
    setKidName(''); setKidAge(''); setKidGrade('')
  }

  const handleRemoveKid = (id) => setKids(prev => prev.filter(k => k.id !== id))

  // ── Finish onboarding ─────────────────────────────────────────────────────
  const handleFinishOnboard = async () => {
    setLoading(true)
    try {
      await completeSignup(coParentEmail, kids)
      navigate('/dashboard')
    } catch (e) { err(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className={s.root}>
      <div className={s.bg}>
        <div className={s.bgCircle1} /><div className={s.bgCircle2} /><div className={s.bgCircle3} />
      </div>
      <div className={s.container}>

        {/* Brand */}
        <div className={s.brand} onClick={() => setScreen('landing')} style={{cursor:'pointer'}}>
          <div className={s.logo}>SF</div>
          <div>
            <div className={s.logoName}>SplitFamily</div>
            <div className={s.logoTagline}>Co-parent expense management</div>
          </div>
        </div>

        {/* ── LANDING ─────────────────────────────────────────────────── */}
        {screen === 'landing' && (
          <div className={s.card + ' ' + s.fadeUp} key="landing">
            <h1 className={s.heading}>Track expenses,<br /><em>not conflict.</em></h1>
            <p className={s.subtext}>Shared kids, transparent costs. Submit, approve, and settle expenses with your co-parent — all in one place.</p>

            <div className={s.features}>
              {[['📊','Real-time split tracking'],['✅','One-tap approval flow'],['🤖','AI spending insights'],['🔒','Private & secure']].map(([ic,tx]) => (
                <div key={tx} className={s.feature}><span>{ic}</span><span>{tx}</span></div>
              ))}
            </div>

            {isDemoMode && (
              <>
                <div className={s.divider}><span>Demo accounts</span></div>
                <div className={s.demoSection}>
                  {DEMO_ACCOUNTS.map(acc => (
                    <button key={acc.email} className={s.demoBtn + (selectedDemo === acc.email ? ' ' + s.demoBtnActive : '')}
                      onClick={() => handleGoogleLogin(acc.email)} disabled={loading}>
                      <div className={s.demoBtnAvatar} style={{background:acc.color+'22',color:acc.color}}>{acc.initials}</div>
                      <div className={s.demoBtnText}>
                        <div className={s.demoBtnName}>{acc.name}</div>
                        <div className={s.demoBtnEmail}>{acc.email} · {acc.role}</div>
                      </div>
                      {loading && selectedDemo === acc.email ? <Spin /> : <GoogleIcon />}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className={s.divider}><span>{isDemoMode ? 'or continue with' : 'Sign in'}</span></div>

            {!isDemoMode && (
              <button className={s.googleBtn} onClick={() => handleGoogleLogin()} disabled={loading}>
                {loading && selectedDemo === '__google__' ? <Spin /> : <GoogleIcon />}
                Continue with Google
              </button>
            )}

            <div className={s.authBtnRow}>
              <button className={s.outlineBtn} onClick={() => { clearErr(); setScreen('signin') }}>Sign in</button>
              <button className={s.primaryBtn} onClick={() => { clearErr(); setScreen('signup') }}>Create account →</button>
            </div>

            <p className={s.terms}>By continuing you agree to our Terms and Privacy Policy.</p>
          </div>
        )}

        {/* ── SIGN IN ──────────────────────────────────────────────────── */}
        {screen === 'signin' && (
          <div className={s.card + ' ' + s.fadeUp} key="signin">
            <button className={s.backBtn} onClick={() => { clearErr(); setScreen('landing') }}>← Back</button>
            <h2 className={s.stepHeading}>Welcome back</h2>
            <p className={s.stepText}>Sign in to your SplitFamily account.</p>

            {!isDemoMode && (
              <>
                <button className={s.googleBtn} onClick={() => handleGoogleLogin()} disabled={loading} style={{marginBottom:16}}>
                  {loading && selectedDemo === '__google__' ? <Spin /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <div className={s.divider}><span>or with email</span></div>
              </>
            )}

            <form onSubmit={handleSignIn} className={s.form}>
              <div className={s.inputGroup}>
                <label className={s.inputLabel}>Email</label>
                <input className={s.textInput} type="email" placeholder="you@email.com" value={email}
                  onChange={e => { setEmail(e.target.value); clearErr() }} autoFocus required />
              </div>
              <div className={s.inputGroup}>
                <div className={s.labelRow}>
                  <label className={s.inputLabel}>Password</label>
                  <button type="button" className={s.forgotLink}
                    onClick={() => { setForgotEmail(email); clearErr(); setScreen('forgot') }}>
                    Forgot password?
                  </button>
                </div>
                <div className={s.pwWrap}>
                  <input className={s.textInput} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                    value={password} onChange={e => { setPassword(e.target.value); clearErr() }} required />
                  <button type="button" className={s.pwToggle} onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁'}</button>
                </div>
              </div>
              {error && <div className={s.errorMsg}>{error}</div>}
              <button className={s.primaryBtn} type="submit" disabled={loading} style={{width:'100%'}}>
                {loading ? <Spin white /> : 'Sign in →'}
              </button>
            </form>

            <p className={s.switchLink}>
              Don't have an account? <button className={s.linkBtn} onClick={() => { clearErr(); setScreen('signup') }}>Create one</button>
            </p>
          </div>
        )}

        {/* ── SIGN UP ──────────────────────────────────────────────────── */}
        {screen === 'signup' && (
          <div className={s.card + ' ' + s.fadeUp} key="signup">
            <button className={s.backBtn} onClick={() => { clearErr(); setScreen('landing') }}>← Back</button>
            <h2 className={s.stepHeading}>Create your account</h2>
            <p className={s.stepText}>You'll receive a confirmation email to verify your address.</p>

            {!isDemoMode && (
              <>
                <button className={s.googleBtn} onClick={() => handleGoogleLogin()} disabled={loading} style={{marginBottom:16}}>
                  <GoogleIcon /> Continue with Google (no password needed)
                </button>
                <div className={s.divider}><span>or with email + password</span></div>
              </>
            )}

            <form onSubmit={handleSignUp} className={s.form}>
              <div className={s.inputGroup}>
                <label className={s.inputLabel}>Full name</label>
                <input className={s.textInput} type="text" placeholder="Alex Rivera"
                  value={fullName} onChange={e => { setFullName(e.target.value); clearErr() }} autoFocus required />
              </div>
              <div className={s.inputGroup}>
                <label className={s.inputLabel}>Email</label>
                <input className={s.textInput} type="email" placeholder="you@email.com"
                  value={email} onChange={e => { setEmail(e.target.value); clearErr() }} required />
              </div>
              <div className={s.inputGroup}>
                <label className={s.inputLabel}>Password</label>
                <div className={s.pwWrap}>
                  <input className={s.textInput} type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={password} onChange={e => { setPassword(e.target.value); clearErr() }} required />
                  <button type="button" className={s.pwToggle} onClick={() => setShowPw(p => !p)}>{showPw ? '🙈' : '👁'}</button>
                </div>
                <div className={s.pwStrength}>
                  {password.length === 0 ? null : (
                    <div className={s.strengthBar}>
                      <div className={s.strengthFill} style={{
                        width: Math.min(100, password.length / 12 * 100) + '%',
                        background: password.length < 8 ? '#B85C5C' : password.length < 12 ? '#C8832A' : '#4A7C59'
                      }} />
                    </div>
                  )}
                </div>
              </div>
              {error && <div className={s.errorMsg}>{error}</div>}
              <button className={s.primaryBtn} type="submit" disabled={loading} style={{width:'100%'}}>
                {loading ? <Spin white /> : 'Create account & send confirmation →'}
              </button>
            </form>
            <p className={s.switchLink}>
              Already have an account? <button className={s.linkBtn} onClick={() => { clearErr(); setScreen('signin') }}>Sign in</button>
            </p>
          </div>
        )}

        {/* ── VERIFY EMAIL (after signup) ───────────────────────────────── */}
        {screen === 'verify_email' && (
          <div className={s.card + ' ' + s.fadeUp} key="verify">
            <div className={s.stepIcon}>✉️</div>
            <h2 className={s.stepHeading}>Check your inbox</h2>
            <p className={s.stepText}>
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click the link in the email to verify your account — then come back and sign in.
            </p>
            <div className={s.infoBox}>
              <strong>📬 Didn't get it?</strong> Check your spam folder, or{' '}
              <button className={s.linkBtn} onClick={() => handleSignUp({ preventDefault: () => {} })}>resend</button>.
            </div>
            <button className={s.primaryBtn} style={{width:'100%',marginTop:16}} onClick={() => setScreen('signin')}>
              Go to sign in →
            </button>
          </div>
        )}

        {/* ── FORGOT PASSWORD ───────────────────────────────────────────── */}
        {screen === 'forgot' && (
          <div className={s.card + ' ' + s.fadeUp} key="forgot">
            <button className={s.backBtn} onClick={() => { clearErr(); setScreen('signin') }}>← Back to sign in</button>
            <div className={s.stepIcon}>🔑</div>
            <h2 className={s.stepHeading}>Reset your password</h2>
            <p className={s.stepText}>
              Enter your email and we'll send you a secure link to create a new password.
              {isDemoMode && <span className={s.demoNote}> (Demo mode: click the button to simulate a sent email.)</span>}
            </p>
            <form onSubmit={handleForgotPassword} className={s.form}>
              <div className={s.inputGroup}>
                <label className={s.inputLabel}>Email address</label>
                <input className={s.textInput} type="email" placeholder="you@email.com" autoFocus
                  value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); clearErr() }} required />
              </div>
              {error && <div className={s.errorMsg}>{error}</div>}
              <button className={s.primaryBtn} type="submit" disabled={loading || !forgotEmail} style={{width:'100%'}}>
                {loading ? <Spin white /> : 'Send reset link →'}
              </button>
            </form>
          </div>
        )}

        {/* ── FORGOT SENT confirmation ──────────────────────────────────── */}
        {screen === 'forgot_sent' && (
          <div className={s.card + ' ' + s.fadeUp} key="forgot_sent">
            <div className={s.stepIcon}>📬</div>
            <h2 className={s.stepHeading}>Reset link sent!</h2>
            <p className={s.stepText}>
              We sent a password reset link to <strong>{forgotEmail || email}</strong>.<br />
              Click the link in the email — it will take you directly to a page where you can set a new password.
            </p>
            <div className={s.infoBox}>
              The link expires in <strong>1 hour</strong>. Check your spam folder if you don't see it.
            </div>
            {isDemoMode && (
              <div className={s.demoBox}>
                <strong>Demo mode:</strong> No real email is sent. In production, Supabase sends this automatically once your email provider is configured.
                <br /><br />
                To test the full reset flow: visit <code>/reset-password</code> directly.
              </div>
            )}
            <button className={s.primaryBtn} style={{width:'100%',marginTop:16}} onClick={() => setScreen('signin')}>
              Back to sign in
            </button>
            <button className={s.textBtn} onClick={() => handleForgotPassword({ preventDefault: () => {} })}>
              Resend reset link
            </button>
          </div>
        )}

        {/* ── ONBOARDING (shown after Google sign-in if new user) ────────── */}
        {screen === 'onboard' && (
          <div className={s.card + ' ' + s.fadeUp} key="onboard">
            <div className={s.stepIndicator}>
              <StepDot done /><StepLine done /><StepDot active />
            </div>
            <div className={s.stepIcon}>👨‍👩‍👧‍👦</div>
            <h2 className={s.stepHeading}>Set up your family</h2>
            <p className={s.stepText}>Invite your co-parent and add your children. You can always do this later.</p>

            <div className={s.inputGroup}>
              <label className={s.inputLabel}>Co-parent's email</label>
              <input className={s.textInput} type="email" placeholder="coparent@email.com"
                value={coParentEmail} onChange={e => setCoParentEmail(e.target.value)} />
            </div>

            <div className={s.kidsSection}>
              <div className={s.sectionLabel}>Children</div>
              <div className={s.kidAddGrid}>
                <input className={s.textInput} placeholder="Child's name" value={kidName}
                  onChange={e => setKidName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddKid())} />
                <input className={s.textInput} placeholder="Age" type="number" min="0" max="25"
                  value={kidAge} onChange={e => setKidAge(e.target.value)} style={{maxWidth:72}} />
                <input className={s.textInput} placeholder="Grade (opt.)" value={kidGrade}
                  onChange={e => setKidGrade(e.target.value)} style={{maxWidth:110}} />
                <button type="button" className={s.addKidBtn} onClick={handleAddKid} disabled={!kidName.trim()}>
                  + Add
                </button>
              </div>

              {kids.length > 0 && (
                <div className={s.kidList}>
                  {kids.map(k => (
                    <div key={k.id} className={s.kidPill}>
                      <div className={s.kidPillAvatar} style={{background:k.color+'22',color:k.color}}>{k.avatar}</div>
                      <span>{k.name}{k.age ? `, ${k.age}` : ''}{k.grade ? ` · ${k.grade}` : ''}</span>
                      <button className={s.kidRemove} onClick={() => handleRemoveKid(k.id)} aria-label="Remove">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {coParentEmail && (
              <div className={s.inviteNote}>
                <span>📬</span>
                <span>An invitation will be sent to <strong>{coParentEmail}</strong> to join your family account.</span>
              </div>
            )}

            {error && <div className={s.errorMsg}>{error}</div>}
            <button className={s.primaryBtn} style={{width:'100%'}} onClick={handleFinishOnboard} disabled={loading}>
              {loading ? <Spin white /> : coParentEmail ? 'Send invitation & go to dashboard →' : 'Skip & go to dashboard →'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
function Spin({ white }) {
  return <div style={{width:16,height:16,border:`2px solid ${white?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.1)'}`,borderTopColor:white?'#fff':'#4A7C59',borderRadius:'50%',animation:'spin 0.7s linear infinite',flexShrink:0}} />
}
function StepDot({ active, done }) {
  return <div style={{width:24,height:24,borderRadius:'50%',background:done?'#4A7C59':active?'#E8F2EB':'transparent',border:`2px solid ${done||active?'#4A7C59':'#B0AFA8'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:done?'#fff':'#4A7C59',fontWeight:600,flexShrink:0}}>{done?'✓':''}</div>
}
function StepLine({ done }) {
  return <div style={{flex:1,height:2,background:done?'#4A7C59':'#D5D3CB',borderRadius:2}} />
}
