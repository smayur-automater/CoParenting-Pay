import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL.includes('YOUR_PROJECT')

const MOCK_USERS = {
  'alex@gmail.com': {
    uid: 'user_alex', name: 'Alex Rivera', email: 'alex@gmail.com',
    avatar: 'AR', avatarColor: '#4A7C59',
    coParent: { name: 'Jordan Lee', email: 'jordan@gmail.com', uid: 'user_jordan' },
    defaultSplit: { self: 55, other: 45 },
    kids: [
      { id: 'k1', name: 'Mia Rivera', age: 9, grade: '3rd', avatar: 'MR', color: '#4A7C59', split: { self: 60, other: 40 } },
      { id: 'k2', name: 'Leo Rivera', age: 6, grade: '1st', avatar: 'LR', color: '#3A7CA8', split: { self: 50, other: 50 } }
    ]
  },
  'jordan@gmail.com': {
    uid: 'user_jordan', name: 'Jordan Lee', email: 'jordan@gmail.com',
    avatar: 'JL', avatarColor: '#3A7CA8',
    coParent: { name: 'Alex Rivera', email: 'alex@gmail.com', uid: 'user_alex' },
    defaultSplit: { self: 45, other: 55 },
    kids: [
      { id: 'k1', name: 'Mia Rivera', age: 9, grade: '3rd', avatar: 'MR', color: '#4A7C59', split: { self: 60, other: 40 } },
      { id: 'k2', name: 'Leo Rivera', age: 6, grade: '1st', avatar: 'LR', color: '#3A7CA8', split: { self: 50, other: 50 } }
    ]
  }
}

const DEMO_EXPENSES = [
  { id: 'e1', title: 'Soccer registration', kidId: 'k1', kidName: 'Mia', category: 'Sports', amount: 320, submittedBy: 'jordan', submittedByName: 'Jordan', date: '2026-05-05', status: 'pending', split: { self: 60, other: 40 }, note: 'Spring season + equipment fee' },
  { id: 'e2', title: 'Dental checkup', kidId: 'k2', kidName: 'Leo', category: 'Medical', amount: 95, submittedBy: 'alex', submittedByName: 'Alex', date: '2026-05-03', status: 'approved', split: { self: 50, other: 50 }, note: '6-month checkup' },
  { id: 'e3', title: 'School supplies', kidId: 'both', kidName: 'Mia + Leo', category: 'School', amount: 148, submittedBy: 'jordan', submittedByName: 'Jordan', date: '2026-04-28', status: 'approved', split: { self: 55, other: 45 }, note: 'Notebooks, pens, backpack straps' },
  { id: 'e4', title: 'Summer camp deposit', kidId: 'k2', kidName: 'Leo', category: 'Recreation', amount: 400, submittedBy: 'alex', submittedByName: 'Alex', date: '2026-04-25', status: 'pending', split: { self: 50, other: 50 }, note: '2-week STEM camp July 14–25' },
  { id: 'e5', title: 'Spring clothes', kidId: 'k1', kidName: 'Mia', category: 'Clothing', amount: 210, submittedBy: 'jordan', submittedByName: 'Jordan', date: '2026-04-20', status: 'pending', split: { self: 60, other: 40 }, note: 'Seasonal wardrobe refresh' },
  { id: 'e6', title: 'Spring trip flights', kidId: 'both', kidName: 'Mia + Leo', category: 'Trips', amount: 560, submittedBy: 'alex', submittedByName: 'Alex', date: '2026-04-10', status: 'approved', split: { self: 55, other: 45 }, note: 'Round trip Apr 18–22' },
  { id: 'e7', title: 'Gaming console', kidId: 'k2', kidName: 'Leo', category: 'Recreation', amount: 299, submittedBy: 'jordan', submittedByName: 'Jordan', date: '2026-04-08', status: 'rejected', split: { self: 50, other: 50 }, note: 'Rejected — not agreed expense' },
  { id: 'e8', title: 'Vision test + glasses', kidId: 'k1', kidName: 'Mia', category: 'Medical', amount: 178, submittedBy: 'alex', submittedByName: 'Alex', date: '2026-03-15', status: 'approved', split: { self: 60, other: 40 }, note: 'Annual vision check' },
  { id: 'e9', title: 'Easter trip hotel', kidId: 'both', kidName: 'Mia + Leo', category: 'Trips', amount: 380, submittedBy: 'jordan', submittedByName: 'Jordan', date: '2026-03-28', status: 'approved', split: { self: 55, other: 45 } },
  { id: 'e10', title: 'Piano lessons (3 months)', kidId: 'k1', kidName: 'Mia', category: 'School', amount: 270, submittedBy: 'alex', submittedByName: 'Alex', date: '2026-03-01', status: 'approved', split: { self: 60, other: 40 } },
]

function normalizeExpense(e) {
  return {
    id: e.id, title: e.title,
    amount: parseFloat(e.amount),
    category: e.category,
    kidId: e.kid_id || 'both',
    kidName: e.kid_name || '',
    submittedBy: (e.submitted_by_name || '').toLowerCase(),
    submittedByName: e.submitted_by_name || '',
    date: e.expense_date || e.created_at?.slice(0, 10),
    status: e.status,
    split: { self: e.split_self ?? 50, other: e.split_other ?? 50 },
    note: e.note || '',
  }
}

function buildProfile(supabaseUser, profile, kids) {
  const name = profile?.full_name || supabaseUser?.user_metadata?.full_name || supabaseUser.email.split('@')[0]
  return {
    uid: supabaseUser.id,
    name,
    email: supabaseUser.email,
    avatar: (profile?.avatar_initials || name.slice(0, 2)).toUpperCase(),
    avatarColor: profile?.avatar_color || '#4A7C59',
    coParent: profile?.co_parent_id ? {
      uid: profile.co_parent_id,
      name: profile.co_parent?.full_name || '',
      email: profile.co_parent_email || '',
    } : null,
    defaultSplit: { self: profile?.default_split_self ?? 50, other: profile?.default_split_other ?? 50 },
    kids: (kids || []).map(k => ({
      id: k.id, name: k.name, age: k.age, grade: k.grade,
      avatar: k.avatar || k.name.slice(0, 2).toUpperCase(),
      color: k.color || '#4A7C59',
      split: { self: k.split_self ?? 50, other: k.split_other ?? 50 }
    }))
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms))

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])

  // ─── Bootstrap session ────────────────────────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) {
      const saved = sessionStorage.getItem('sf_demo_user')
      if (saved) { setUser(JSON.parse(saved)); setExpenses(DEMO_EXPENSES) }
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUserData(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        await loadUserData(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setExpenses([]); setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (sbUser) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, co_parent:co_parent_id(id,full_name,avatar_initials,avatar_color)')
        .eq('id', sbUser.id).single()

      const { data: kids } = await supabase
        .from('kids').select('*').eq('family_id', sbUser.id).order('created_at')

      const coId = profile?.co_parent_id
      const expQuery = supabase.from('expenses').select('*').order('expense_date', { ascending: false })
      const { data: expData } = coId
        ? await expQuery.or(`family_id.eq.${sbUser.id},family_id.eq.${coId}`)
        : await expQuery.eq('family_id', sbUser.id)

      setUser(buildProfile(sbUser, profile, kids))
      setExpenses((expData || []).map(normalizeExpense))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ─── Auth actions ─────────────────────────────────────────────────────────

  const signInWithGoogle = async (demoEmail) => {
    if (DEMO_MODE) {
      await delay(900)
      const u = MOCK_USERS[demoEmail || 'alex@gmail.com']
      setUser(u); setExpenses(DEMO_EXPENSES)
      sessionStorage.setItem('sf_demo_user', JSON.stringify(u))
      return { status: 'existing' }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) throw error
    return { status: 'redirecting' }
  }

  const signUpWithEmail = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) throw error
    return data
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  // Sends a real password-reset email via Supabase → user clicks link → lands on /reset-password
  const sendPasswordReset = async (email) => {
    if (DEMO_MODE) { await delay(800); return { sent: true } }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
    return { sent: true }
  }

  // Called on /reset-password page after user arrives from the email link
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }

  const signOut = async () => {
    if (DEMO_MODE) {
      sessionStorage.removeItem('sf_demo_user')
      setUser(null); setExpenses([])
      return
    }
    await supabase.auth.signOut()
  }

  const completeSignup = async (coParentEmail, kidsToAdd) => {
    if (DEMO_MODE || !user) return
    if (coParentEmail) {
      await supabase.from('profiles').update({ co_parent_email: coParentEmail }).eq('id', user.uid)
      await supabase.from('invitations').insert({
        inviter_id: user.uid, inviter_name: user.name, invitee_email: coParentEmail
      })
    }
    for (const k of kidsToAdd) {
      await supabase.from('kids').insert({
        family_id: user.uid, name: k.name, age: k.age || null,
        grade: k.grade || null, avatar: k.name.slice(0, 2).toUpperCase(),
        color: k.color, split_self: 50, split_other: 50, created_by: user.uid
      })
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await loadUserData(session.user)
  }

  // ─── Kids CRUD ────────────────────────────────────────────────────────────

  const addKid = async (kidData) => {
    const colors = ['#4A7C59', '#3A7CA8', '#C8832A', '#B85C5C', '#7A5CA8', '#1D9E75']
    const color = kidData.color || colors[(user?.kids?.length || 0) % colors.length]
    const newKid = {
      id: 'k' + Date.now(),
      name: kidData.name.trim(),
      age: parseInt(kidData.age) || 0,
      grade: kidData.grade || '',
      avatar: kidData.name.trim().slice(0, 2).toUpperCase(),
      color,
      split: { self: parseInt(kidData.splitSelf) || 50, other: parseInt(kidData.splitOther) || 50 }
    }

    if (DEMO_MODE) {
      const updated = { ...user, kids: [...(user.kids || []), newKid] }
      setUser(updated)
      sessionStorage.setItem('sf_demo_user', JSON.stringify(updated))
      return newKid
    }

    const { data, error } = await supabase.from('kids').insert({
      family_id: user.uid, name: newKid.name, age: newKid.age || null,
      grade: newKid.grade || null, avatar: newKid.avatar, color: newKid.color,
      split_self: newKid.split.self, split_other: newKid.split.other, created_by: user.uid
    }).select().single()
    if (error) throw error

    const saved = { ...newKid, id: data.id }
    setUser(prev => ({ ...prev, kids: [...(prev.kids || []), saved] }))
    return saved
  }

  const updateKid = async (kidId, updates) => {
    const merge = k => k.id === kidId ? { ...k, ...updates } : k
    setUser(prev => ({ ...prev, kids: prev.kids.map(merge) }))
    if (DEMO_MODE) {
      sessionStorage.setItem('sf_demo_user', JSON.stringify({ ...user, kids: user.kids.map(merge) }))
      return
    }
    await supabase.from('kids').update({
      name: updates.name, age: updates.age, grade: updates.grade,
      split_self: updates.split?.self, split_other: updates.split?.other
    }).eq('id', kidId)
  }

  const deleteKid = async (kidId) => {
    setUser(prev => ({ ...prev, kids: prev.kids.filter(k => k.id !== kidId) }))
    if (!DEMO_MODE) await supabase.from('kids').delete().eq('id', kidId)
  }

  // ─── Expenses ─────────────────────────────────────────────────────────────

  const addExpense = async (exp) => {
    const optimistic = {
      ...exp, id: 'tmp_' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      status: 'pending',
      submittedBy: user?.name?.split(' ')[0]?.toLowerCase() || '',
      submittedByName: user?.name?.split(' ')[0] || '',
    }
    setExpenses(prev => [optimistic, ...prev])
    if (DEMO_MODE) return optimistic

    const { data, error } = await supabase.from('expenses').insert({
      family_id: user.uid, title: exp.title, amount: exp.amount,
      category: exp.category, kid_id: exp.kidId === 'both' ? null : exp.kidId,
      kid_name: exp.kidName, submitted_by: user.uid,
      submitted_by_name: user.name?.split(' ')[0] || '',
      split_self: exp.split?.self ?? 50, split_other: exp.split?.other ?? 50,
      note: exp.note || null, expense_date: new Date().toISOString().slice(0, 10), status: 'pending'
    }).select().single()

    if (error) { setExpenses(prev => prev.filter(e => e.id !== optimistic.id)); throw error }
    setExpenses(prev => prev.map(e => e.id === optimistic.id ? normalizeExpense(data) : e))
  }

  const updateExpenseStatus = async (id, status) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    if (DEMO_MODE) return
    const { error } = await supabase.from('expenses').update({ status }).eq('id', id)
    if (error) {
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: 'pending' } : e))
      throw error
    }
  }

  const updateProfile = async (updates) => {
    const merged = { ...user, ...updates }
    setUser(merged)
    if (DEMO_MODE) { sessionStorage.setItem('sf_demo_user', JSON.stringify(merged)); return }
    await supabase.from('profiles').update({
      full_name: updates.name, avatar_color: updates.avatarColor,
      default_split_self: updates.defaultSplit?.self, default_split_other: updates.defaultSplit?.other,
    }).eq('id', user.uid)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, expenses, isDemoMode: DEMO_MODE,
      signInWithGoogle, signUpWithEmail, signInWithEmail,
      sendPasswordReset, updatePassword,
      signOut, completeSignup,
      addKid, updateKid, deleteKid,
      addExpense, updateExpenseStatus, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
