import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or publishable key is missing. Check your environment variables.')
}

// createClient will still work if the strings are empty but will fail on actual requests
// This prevents the whole app from crashing on load if env vars are missing
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : {
      auth: {
        signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
        signUp: async () => ({ error: { message: 'Supabase not configured' } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        upsert: async () => ({ error: { message: 'Supabase not configured' } }),
        select: () => ({
          eq: () => ({
            single: async () => ({ error: { message: 'Supabase not configured' } }),
          }),
        }),
      }),
    }

