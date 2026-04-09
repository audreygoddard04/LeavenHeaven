import { Router } from 'express'
import { requireUser } from '../middleware/requireUser.js'
import { supabase } from '../lib/supabase.js'
import { stripe } from '../lib/stripe.js'

export const billingRouter = Router()
const WEEKLY_LOAF_PRICE_ID = process.env.STRIPE_WEEKLY_LOAF_PRICE_ID ?? ''

// ── One-time cart checkout ────────────────────────────────────────────────────

interface CartLineItem {
  productId: string
  name: string
  size: string       // 'loaf' | 'mini' | 'sandwich'
  quantity: number
  unitPrice: number  // dollars, e.g. 12
}

billingRouter.post('/create-checkout', requireUser, async (req, res) => {
  const user = (req as unknown as { user: { id: string; email: string; name: string } }).user

  if (!stripe || !supabase) {
    res.status(500).json({ error: 'Billing not configured' })
    return
  }

  const { cartItems, pickupDate, includeSample } = req.body as {
    cartItems: CartLineItem[]
    pickupDate: string
    includeSample: boolean
  }

  if (!cartItems?.length || !pickupDate) {
    res.status(400).json({ error: 'Missing cart items or pickup date' })
    return
  }

  try {
    const orderId = crypto.randomUUID()
    const totalCents = cartItems.reduce(
      (sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity,
      0
    )

    const lineItems = cartItems.map((item) => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: `${item.size === 'mini' ? 'Mini ' : item.size === 'sandwich' ? 'Sandwich ' : ''}${item.name} Loaf`,
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }))

    if (includeSample) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: { name: 'Free Sample Loaf 🎁' },
          unit_amount: 0,
        },
        quantity: 1,
      })
    }

    const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: user.email || undefined,
      allow_promotion_codes: true,   // lets customers enter their EARLYBIRD code
      success_url: `${clientOrigin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/?payment=canceled`,
      metadata: {
        order_id: orderId,
        user_id: user.id,
        pickup_date: pickupDate,
        include_sample: String(!!includeSample),
        customer_email: user.email,
        customer_name: user.name,
        total_cents: String(totalCents),
      },
    })

    // Save a pending order so the webhook can update it on payment completion.
    // Gracefully skip columns that might not exist in older schema versions.
    const baseRow = {
      id: orderId,
      user_id: user.id,
      status: 'pending',
      total_cents: totalCents,
      pickup_date: pickupDate,
      items: {
        lines: cartItems.map(({ productId, name, size, quantity }) => ({ productId, name, size, quantity })),
        includeSample: !!includeSample,
      },
    }

    let { error: dbError } = await supabase.from('orders').insert({
      ...baseRow,
      stripe_checkout_session_id: session.id,
    })

    if (dbError && /stripe_checkout_session_id|schema cache/i.test(dbError.message ?? '')) {
      // Column doesn't exist yet — save without it (run migration 012 to fix)
      ;({ error: dbError } = await supabase.from('orders').insert(baseRow))
    }

    if (dbError) {
      // Log but don't block — the webhook will upsert the order on payment success
      console.error('[create-checkout] failed to save pending order:', dbError.message)
    }

    res.json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('[create-checkout] error:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

billingRouter.post('/create-subscription', requireUser, async (req, res) => {
  const user = (req as unknown as { user: { id: string } }).user

  if (!supabase || !stripe || !WEEKLY_LOAF_PRICE_ID) {
    res.status(500).json({ error: 'Billing not configured' })
    return
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: WEEKLY_LOAF_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/?subscription=success`,
      cancel_url: `${process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'}/?subscription=canceled`,
      metadata: { user_id: user.id },
    })

    res.json({ checkoutUrl: session.url })
  } catch (err) {
    console.error('Create subscription error:', err)
    res.status(500).json({ error: 'Failed to create subscription' })
  }
})

billingRouter.post('/setup-intent', requireUser, async (req, res) => {
  const user = (req as unknown as { user: { id: string } }).user

  if (!supabase || !stripe) {
    res.status(500).json({ error: 'Billing not configured' })
    return
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    })

    res.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    console.error('Setup intent error:', err)
    res.status(500).json({ error: 'Failed to create setup intent' })
  }
})

billingRouter.get('/payment-methods', requireUser, async (req, res) => {
  const user = (req as unknown as { user: { id: string } }).user

  if (!supabase || !stripe) {
    res.status(500).json({ error: 'Billing not configured' })
    return
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      res.json({ paymentMethods: [] })
      return
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    })

    res.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      })),
    })
  } catch (err) {
    console.error('List payment methods error:', err)
    res.status(500).json({ error: 'Failed to list payment methods' })
  }
})
