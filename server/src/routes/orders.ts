import { Router } from 'express'
import { requireUser } from '../middleware/requireUser.js'
import { supabase } from '../lib/supabase.js'
import { stripe } from '../lib/stripe.js'

export const ordersRouter = Router()

ordersRouter.post('/create', requireUser, async (req, res) => {
  const user = (req as { user: { id: string } }).user
  const { cart, deliveryOption = 'pickup' } = req.body as {
    cart: { listingId: string; qty: number }[]
    deliveryOption?: 'pickup' | 'delivery'
  }

  if (!cart?.length || !Array.isArray(cart)) {
    res.status(400).json({ error: 'Cart is required and must be a non-empty array' })
    return
  }

  if (!supabase || !stripe) {
    res.status(500).json({ error: 'Server not configured' })
    return
  }

  try {
    const listingIds = [...new Set(cart.map((c) => c.listingId))]
    const { data: listings, error: listErr } = await supabase
      .from('listings')
      .select('id, price_cents')
      .in('id', listingIds)
      .eq('is_active', true)

    if (listErr || !listings?.length) {
      res.status(400).json({ error: 'Invalid or inactive listings' })
      return
    }

    const priceMap = new Map(listings.map((l) => [l.id, l.price_cents]))
    const orderItems: { listing_id: string; qty: number; unit_price_cents: number }[] = []
    let subtotalCents = 0

    for (const item of cart) {
      const price = priceMap.get(item.listingId)
      if (price == null || item.qty < 1) {
        res.status(400).json({ error: `Invalid item: ${item.listingId}` })
        return
      }
      orderItems.push({ listing_id: item.listingId, qty: item.qty, unit_price_cents: price })
      subtotalCents += price * item.qty
    }

    const deliveryCents = deliveryOption === 'delivery' ? 500 : 0
    const totalCents = subtotalCents + deliveryCents

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        subtotal_cents: subtotalCents,
        delivery_cents: deliveryCents,
        total_cents: totalCents,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      console.error('Order insert error:', orderErr)
      res.status(500).json({ error: 'Failed to create order' })
      return
    }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      orderItems.map((o) => ({
        order_id: order.id,
        listing_id: o.listing_id,
        qty: o.qty,
        unit_price_cents: o.unit_price_cents,
      }))
    )

    if (itemsErr) {
      console.error('Order items insert error:', itemsErr)
      await supabase.from('orders').delete().eq('id', order.id)
      res.status(500).json({ error: 'Failed to create order items' })
      return
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      metadata: { order_id: order.id },
      automatic_payment_methods: { enabled: true },
    })

    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id)

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (err) {
    console.error('Order create error:', err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

ordersRouter.get('/list', requireUser, async (req, res) => {
  const user = (req as { user: { id: string } }).user

  if (!supabase) {
    res.status(500).json({ error: 'Server not configured' })
    return
  }

  const { data: orders, error: ordErr } = await supabase
    .from('orders')
    .select('id, status, subtotal_cents, delivery_cents, total_cents, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (ordErr) {
    res.status(500).json({ error: 'Failed to list orders' })
    return
  }

  const ordersWithItems = await Promise.all(
    (orders ?? []).map(async (o) => {
      const { data: items } = await supabase
        .from('order_items')
        .select('listing_id, qty, unit_price_cents')
        .eq('order_id', o.id)
      return { ...o, items: items ?? [] }
    })
  )

  res.json({ orders: ordersWithItems })
})
