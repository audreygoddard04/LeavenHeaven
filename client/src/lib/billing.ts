const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function getAuthHeaders(): Promise<HeadersInit> {
  const { supabase } = await import('./supabaseClient')
  if (!supabase) return {}
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

export async function createSubscription(): Promise<{ checkoutUrl?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/billing/create-subscription`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok) {
    return { error: json.error ?? 'Failed to create subscription' }
  }
  return { checkoutUrl: json.checkoutUrl }
}

export async function createSetupIntent(): Promise<{ clientSecret?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/billing/setup-intent`, {
    method: 'POST',
    headers: await getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok) {
    return { error: json.error ?? 'Failed to create setup intent' }
  }
  return { clientSecret: json.clientSecret }
}

export async function listPaymentMethods(): Promise<{
  paymentMethods: { id: string; brand?: string; last4?: string }[]
  error?: string
}> {
  const res = await fetch(`${API_BASE}/api/billing/payment-methods`, {
    headers: await getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok) {
    return { paymentMethods: [], error: json.error ?? 'Failed to list payment methods' }
  }
  return { paymentMethods: json.paymentMethods ?? [] }
}
