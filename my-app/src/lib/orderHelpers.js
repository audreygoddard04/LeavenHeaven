/**
 * Orders may store `items` as either:
 * - A plain array (legacy), with optional `include_sample` column
 * - An object { lines: [...], includeSample?: boolean } when the DB has no include_sample column
 */

export function getOrderLines(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object' && Array.isArray(raw.lines)) return raw.lines
  return []
}

export function getOrderIncludeSample(include_sample, raw) {
  if (typeof include_sample === 'boolean') return include_sample
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof raw.includeSample === 'boolean') {
    return raw.includeSample
  }
  return false
}

/** Shape written to Supabase when include_sample column may not exist */
export function buildOrderItemsPayload(cartItems, includeSample) {
  return { lines: cartItems, includeSample }
}
