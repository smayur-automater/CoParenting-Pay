import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// ── Auth ──────────────────────────────────────────────
export const signUp   = (email, password) => supabase.auth.signUp({ email, password });
export const signIn   = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut  = ()               => supabase.auth.signOut();
export const resetPw  = (email)          => supabase.auth.resetPasswordForEmail(email,
  { redirectTo: `${window.location.origin}/reset-password` });

// ── API calls to backend ──────────────────────────────
const API = import.meta.env.VITE_API_URL || '/_/backend';

async function authFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error(err.error || 'Error'), { status: res.status, code: err.code });
  }
  return res.json();
}

export const api = {
  saveCalculation: (body)  => authFetch('/calculations', { method: 'POST', body: JSON.stringify(body) }),
  getCalculations: ()      => authFetch('/calculations'),
  deleteCalculation: (id)  => authFetch(`/calculations/${id}`, { method: 'DELETE' }),
  getShare:    (token)     => fetch(`${API}/share/${token}`).then(r => r.json()),
  checkout:    (calculationId) => authFetch('/checkout', { method: 'POST', body: JSON.stringify({ calculationId }) }),
  isUnlocked:  ()          => authFetch('/me/unlocked'),
  getPdfUrl:   (id)        => `${API}/calculations/${id}/pdf`,
};
