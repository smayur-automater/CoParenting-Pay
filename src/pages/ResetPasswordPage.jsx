import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import s from './Auth.module.css'

export default function ResetPasswordPage() {
  const { updatePassword, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Supabase appends #access_token=... to the URL on redirect.
  // The supabase-js client picks this up automatically via detectSessionInUrl: true.
  // We just need to call updateUser({ password }) while that session is active.

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.root}>
      <div className={s.bg}>
        <div className={s.bgCircle1} /><div className={s.bgCircle2} /><div className={s.bgCircle3} />
      </div>
      <div className={s.container}>
        <div className={s.brand}>
          <div className={s.logo}>SF</div>
          <div>
            <div className={s.logoName}>SplitFamily</div>
            <div className={s.logoTagline}>Co-parent expense management</div>
          </div>
        </div>

        <div className={s.card + ' ' + s.fadeUp}>
          {done ? (
            <>
              <div className={s.stepIcon}>✅</div>
              <h2 className={s.stepHeading}>Password updated!</h2>
              <p className={s.stepText}>Your password has been changed. Redirecting you to the dashboard...</p>
            </>
          ) : (
            <>
              <div className={s.stepIcon}>🔐</div>
              <h2 className={s.stepHeading}>Set a new password</h2>
              <p className={s.stepText}>Choose a strong password for your SplitFamily account.</p>

              {isDemoMode && (
                <div className={s.demoBox}>
                  <strong>Demo mode:</strong> In production, you arrive here via a secure link in your reset email. The Supabase session from that link allows the password update.
                </div>
              )}

              <form onSubmit={handleSubmit} className={s.form} style={{marginTop:16}}>
                <div className={s.inputGroup}>
                  <label className={s.inputLabel}>New password</label>
                  <div className={s.pwWrap}>
                    <input
                      className={s.textInput}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError('') }}
                      autoFocus required
                    />
                    <button type="button" className={s.pwToggle} onClick={() => setShowPw(p => !p)}>
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className={s.pwStrength}>
                      <div className={s.strengthBar}>
                        <div className={s.strengthFill} style={{
                          width: Math.min(100, password.length / 12 * 100) + '%',
                          background: password.length < 8 ? '#B85C5C' : password.length < 12 ? '#C8832A' : '#4A7C59'
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className={s.inputGroup}>
                  <label className={s.inputLabel}>Confirm new password</label>
                  <input
                    className={s.textInput}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    required
                  />
                  {confirm && password && confirm !== password && (
                    <div style={{fontSize:11,color:'#B85C5C',marginTop:4}}>Passwords don't match yet</div>
                  )}
                  {confirm && password && confirm === password && (
                    <div style={{fontSize:11,color:'#4A7C59',marginTop:4}}>✓ Passwords match</div>
                  )}
                </div>

                {error && <div className={s.errorMsg}>{error}</div>}

                <button className={s.primaryBtn} type="submit"
                  disabled={loading || password.length < 8 || password !== confirm}
                  style={{width:'100%',marginTop:4}}>
                  {loading
                    ? <div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto'}} />
                    : 'Update password →'}
                </button>
              </form>

              <p className={s.switchLink} style={{marginTop:16}}>
                Remember your password? <button className={s.linkBtn} onClick={() => navigate('/')}>Sign in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
