import { supabase } from './supabaseClient'

export async function signUpEmail(email: string, password: string) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signInEmail(email: string, password: string) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  })
  return { data, error }
}

export async function signOut() {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  return { error }
}

export async function updatePassword(newPassword: string) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error }
}

export function onAuthStateChange(
  callback: (event: string, session: { access_token: string; user: { id: string } } | null) => void
) {
  if (!supabase) return () => {}
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
  return () => subscription.unsubscribe()
}
