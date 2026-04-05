import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { stripe } from '../lib/stripe.js'
import { supabase } from '../lib/supabase.js'

export const webhookRouter = Router()
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

webhookRouter.post('/', async (req: Request, res: Response) => {
  if (!stripe || !webhookSecret) {
    res.status(500).json({ error: 'Webhook not configured' })
    return
  }

  const sig = req.headers['stripe-signature']
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature' })
    return
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      (req as Request & { body: Buffer }).body,
      sig,
      webhookSecret
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    res.status(400).json({ error: `Webhook Error: ${message}` })
    return
  }

  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' })
    return
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null
          await supabase.from('subscriptions').upsert(
            {
              user_id: profile.id,
              status: sub.status,
              current_period_end: periodEnd,
              plan: 'weekly_loaf',
              stripe_subscription_id: sub.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const meta = session.metadata ?? {}
        const orderId = meta.order_id
        const userId = meta.user_id
        const pickupDate = meta.pickup_date
        const includeSample = meta.include_sample === 'true'
        const customerEmail = meta.customer_email ?? session.customer_email ?? ''
        const customerName = meta.customer_name ?? ''
        const totalCents = parseInt(meta.total_cents ?? '0', 10)

        if (!orderId || !userId) break

        // Update the pending order to paid
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, items')
          .eq('id', orderId)
          .maybeSingle()

        if (existingOrder) {
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId)
        } else {
          // Order wasn't saved during checkout creation (schema issue) — insert now
          await supabase.from('orders').insert({
            id: orderId,
            user_id: userId,
            status: 'paid',
            total_cents: totalCents,
            pickup_date: pickupDate,
            stripe_checkout_session_id: session.id,
            items: { lines: [], includeSample },
          })
        }

        // Trigger confirmation email via Supabase Edge Function
        if (customerEmail) {
          const supabaseUrl = process.env.SUPABASE_URL ?? ''
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
          const fnUrl = `${supabaseUrl}/functions/v1/order-confirmation`

          // Reconstruct items from the saved order or session line items
          const savedItems: Array<{ name: string; size: string; quantity: number }> =
            existingOrder?.items?.lines?.map((l: { name: string; size: string; quantity: number }) => ({
              name: l.name,
              size: l.size,
              quantity: l.quantity,
            })) ?? []

          fetch(fnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              to: customerEmail,
              customerName: customerName || 'there',
              items: savedItems,
              pickupDate,
              includeSample,
              totalCents,
            }),
          })
            .then((r) => r.json())
            .then((d) => console.log('[webhook] email sent:', d?.id ?? d))
            .catch((e) => console.warn('[webhook] email failed:', e))
        }
        break
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const orderId = pi.metadata?.order_id
        if (orderId && supabase) {
          // Only update if not already paid via checkout.session.completed
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', orderId)
            .neq('status', 'paid')
        }
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_failed':
        // Optional: log or handle
        break

      default:
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})
