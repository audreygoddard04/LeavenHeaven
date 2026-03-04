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

export interface CartItem {
  listingId: string
  qty: number
}

export interface CreateOrderInput {
  cart: CartItem[]
  deliveryOption?: 'pickup' | 'delivery'
}

export interface CreateOrderResponse {
  clientSecret?: string
  checkoutUrl?: string
  orderId?: string
  error?: string
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  const res = await fetch(`${API_BASE}/api/orders/create`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (!res.ok) {
    return { error: json.error ?? 'Failed to create order' }
  }
  return json
}

export interface PastOrder {
  id: string
  status: string
  subtotal_cents: number
  delivery_cents: number
  total_cents: number
  created_at: string
  items: { listing_id: string; qty: number; unit_price_cents: number }[]
}

export async function listPastOrders(): Promise<{ data: PastOrder[]; error?: string }> {
  const res = await fetch(`${API_BASE}/api/orders/list`, {
    headers: await getAuthHeaders(),
  })
  const json = await res.json()
  if (!res.ok) {
    return { data: [], error: json.error ?? 'Failed to list orders' }
  }
  return { data: json.orders ?? [] }
}
