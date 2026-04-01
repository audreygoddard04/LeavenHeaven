import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const hasValidConfig = supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')

function getSupabase(): SupabaseClient {
  if (typeof window !== 'undefined') {
    const hadAuthInHash = window.location.hash.includes('access_token')
    if (hadAuthInHash) (window as unknown as { __authJustLanded?: boolean }).__authJustLanded = true

    if (window.location.search.includes('code=') && !hadAuthInHash) {
      window.history.replaceState(null, '', `${window.location.origin}/?next=account`)
    }
  }

  if (typeof window !== 'undefined' && (window as unknown as { __supabase?: SupabaseClient }).__supabase) {
    return (window as unknown as { __supabase: SupabaseClient }).__supabase
  }

  if (!hasValidConfig) {
    console.warn(
      'Supabase env vars missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then redeploy.',
    )
  }

  const client = createClient(
    hasValidConfig ? supabaseUrl : 'https://placeholder.supabase.co',
    hasValidConfig ? supabaseAnonKey : 'placeholder-key',
    {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  })

  if (typeof window !== 'undefined') {
    (window as unknown as { __supabase: SupabaseClient }).__supabase = client

    const hash = window.location.hash?.slice(1)
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const expires_at = params.get('expires_at')
      if (access_token && refresh_token) {
        const exp = expires_at ? parseInt(expires_at, 10) * 1000 : 0
        const isExpired = exp > 0 && exp < Date.now()
        if (isExpired) {
          window.history.replaceState(null, '', `${window.location.origin}/?next=account`)
        } else {
          client.auth
            .setSession({ access_token, refresh_token })
            .then(() => {
              window.history.replaceState(null, '', `${window.location.origin}/?next=account`)
            })
            .catch(() => {
              window.history.replaceState(null, '', `${window.location.origin}/?next=account`)
            })
        }
      }
    }
  }

  return client
}

export const supabase = getSupabase()
