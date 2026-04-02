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

function urlHasAuthTokens() {
  if (typeof window === 'undefined') return false
  // Implicit flow: tokens in URL hash
  if (window.location.hash.includes('access_token=')) return true
  // PKCE flow: code in query string (email confirmation)
  if (new URLSearchParams(window.location.search).get('code')) return true
  return false
}

export function useAuth() {
  // undefined = still loading, null = loaded but no session
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // If the URL has auth tokens (from email confirmation or OAuth redirect),
    // hold the loading state until SIGNED_IN fires — never show the logged-out
    // UI while Supabase is still processing the incoming tokens.
    const waitingForTokens = urlHasAuthTokens()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Skip the INITIAL_SESSION null result while we're expecting URL tokens;
      // wait for the SIGNED_IN event that follows token processing.
      if (waitingForTokens && event === 'INITIAL_SESSION' && !newSession) return

      setSession(newSession ?? null)
      if (newSession?.user) ensureProfile(newSession.user)
    })

    // Safety valve: if SIGNED_IN never fires within 6 s (e.g. expired token),
    // stop the infinite loading spinner and show the sign-in form.
    let fallback
    if (waitingForTokens) {
      fallback = setTimeout(() => setSession(prev => prev === undefined ? null : prev), 6000)
    }

    return () => {
      subscription.unsubscribe()
      if (fallback) clearTimeout(fallback)
    }
  }, [])

  return {
    session: session ?? null,
    user: session?.user ?? null,
    loading: session === undefined,
  }
}
