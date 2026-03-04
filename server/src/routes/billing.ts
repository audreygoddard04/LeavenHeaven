import { Router } from 'express'
import { requireUser } from '../middleware/requireUser.js'
import { supabase } from '../lib/supabase.js'
import { stripe } from '../lib/stripe.js'

export const billingRouter = Router()
const WEEKLY_LOAF_PRICE_ID = process.env.STRIPE_WEEKLY_LOAF_PRICE_ID ?? ''

billingRouter.post('/create-subscription', requireUser, async (req, res) => {
  const user = (req as { user: { id: string } }).user

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
  const user = (req as { user: { id: string } }).user

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
  const user = (req as { user: { id: string } }).user

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
