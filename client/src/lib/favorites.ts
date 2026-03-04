import { supabase } from './supabaseClient'

export async function addFavorite(listingId: string) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'Not authenticated' } }
  const { error } = await supabase.from('favorites').upsert(
    { user_id: user.id, listing_id: listingId },
    { onConflict: 'user_id,listing_id' }
  )
  return { error }
}

export async function removeFavorite(listingId: string) {
  if (!supabase) return { error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'Not authenticated' } }
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
  return { error }
}

export async function listFavorites() {
  if (!supabase) return { data: [], error: { message: 'Supabase not configured' } }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: { message: 'Not authenticated' } }
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', user.id)
  return {
    data: (data ?? []).map((r) => r.listing_id),
    error,
  }
}
