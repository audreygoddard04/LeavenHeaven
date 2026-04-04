/**
 * If orders.pickup_window_id is NOT NULL, we need a UUID.
 * 1) VITE_PICKUP_WINDOW_ID — paste one row id from Table Editor → pickup_windows (quick fix)
 * 2) Else look up pickup_windows where pickup_date matches the order Sunday
 */
export async function resolvePickupWindowId(supabase, pickupIso) {
  const fromEnv = import.meta.env.VITE_PICKUP_WINDOW_ID?.trim()
  if (fromEnv) return fromEnv

  let { data, error } = await supabase
    .from('pickup_windows')
    .select('id')
    .eq('pickup_date', pickupIso)
    .maybeSingle()

  if (error && !/relation|does not exist|schema cache|column/i.test(error.message ?? '')) {
    console.warn('[pickup_windows] lookup:', error.message)
  }
  if (data?.id) return data.id

  // Some schemas use `date` instead of `pickup_date`
  const second = await supabase
    .from('pickup_windows')
    .select('id')
    .eq('date', pickupIso)
    .maybeSingle()
  if (second.error && !/relation|does not exist|schema cache|column/i.test(second.error.message ?? '')) {
    console.warn('[pickup_windows] lookup date:', second.error.message)
  }
  return second.data?.id ?? null
}
