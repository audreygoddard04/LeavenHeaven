import { supabase } from './supabaseClient'

export async function getCurrentUserAndProfile() {
  // Use getSession() - reads from storage immediately, no network call.
  // More reliable after OAuth redirect when Supabase may still be processing.
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, profile }
}
