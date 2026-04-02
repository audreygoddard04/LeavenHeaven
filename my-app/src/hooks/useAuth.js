import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

async function ensureProfile(user) {
  if (!user) return
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName }, { onConflict: 'id' })
  if (error) console.error('[useAuth] profile upsert failed:', error.message)
}

export function useAuth() {
  // undefined = still loading, null = loaded but no session
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
      if (newSession?.user) ensureProfile(newSession.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  return {
    session: session ?? null,
    user: session?.user ?? null,
    loading: session === undefined,
  }
}
