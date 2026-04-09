import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

async function ensureProfile(user) {
  if (!user) return
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  // Check whether a welcome email has already been sent before upserting,
  // so we don't fire it on every sign-in — only on the very first one.
  const { data: existing } = await supabase
    .from('profiles')
    .select('welcome_sent')
    .eq('id', user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, display_name: displayName }, { onConflict: 'id' })
  if (error) console.error('[useAuth] profile upsert failed:', error.message)

  // Send a one-time welcome email (works for both Google OAuth and email sign-up)
  if (!existing?.welcome_sent && user.email) {
    console.log('[useAuth] new user — sending welcome email to', user.email)
    supabase.functions
      .invoke('send-welcome-email', {
        body: { to: user.email, customerName: displayName },
      })
      .then(({ error: fnError }) => {
        if (fnError) {
          console.warn('[useAuth] welcome email error:', fnError)
          return
        }
        // Mark as welcomed so we never send it again
        supabase
          .from('profiles')
          .update({ welcome_sent: true })
          .eq('id', user.id)
          .then(({ error: updateError }) => {
            if (updateError) console.warn('[useAuth] welcome_sent update failed:', updateError.message)
          })
      })
      .catch((err) => console.warn('[useAuth] welcome email exception:', err))
  }
}

function urlHasAuthTokens() {
  if (typeof window === 'undefined') return false
  // Implicit flow: tokens in URL hash
  if (window.location.hash.includes('access_token=')) return true
  // PKCE flow: code in query string
  if (new URLSearchParams(window.location.search).get('code')) return true
  return false
}

function logAuthEvent(event, session) {
  const email = session?.user?.email ?? '—'
  console.log(`[auth] ${event}${email !== '—' ? ` (${email})` : ''}`)
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
      logAuthEvent(event, newSession)
      // Skip the INITIAL_SESSION null result while we're expecting URL tokens;
      // wait for the SIGNED_IN event that follows token processing.
      if (waitingForTokens && event === 'INITIAL_SESSION' && !newSession) {
        console.log('[auth] waiting for token exchange, holding loading state…')
        return
      }

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
