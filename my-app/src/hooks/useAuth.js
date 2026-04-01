import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

async function ensureProfile(user) {
  if (!user) return
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  const { error } = await supabase.from('profiles').upsert(
    { id: user.id, display_name: displayName },
    { onConflict: 'id' },
  )
  if (error) console.error('[useAuth] Profile upsert failed:', error.message)
}

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      let s = (await supabase.auth.getSession()).data.session

      if (!s && typeof window !== 'undefined') {
        const hadAuthJustLanded = window.__authJustLanded === true
        if (hadAuthJustLanded) {
          window.__authJustLanded = false
          await new Promise((r) => setTimeout(r, 100))
          s = (await supabase.auth.getSession()).data.session
        }
        if (!s && /[#?](code|access_token)=/.test(window.location.href)) {
          for (let i = 0; i < 25; i++) {
            await new Promise((r) => setTimeout(r, 150))
            s = (await supabase.auth.getSession()).data.session
            if (s) break
          }
        }
      }

      setSession(s ?? null)
      if (s?.user) ensureProfile(s.user)
      setLoading(false)
    }

    initAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
      if (newSession?.user) ensureProfile(newSession.user)
    })

    return () => sub.subscription?.unsubscribe()
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading,
  }
}
