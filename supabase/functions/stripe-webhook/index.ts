import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno"

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? ""
const stripe = new Stripe(stripeSecret, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing signature", { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    console.log(`[webhook] event type: ${event.type}`)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}

      const userId = metadata.user_id
      const pickupDate = metadata.pickup_date
      const includeSample = metadata.include_sample === "true"
      const customerEmail = metadata.customer_email || session.customer_email || ""
      const customerName = metadata.customer_name || "Customer"

      // Initialize Supabase with service role to bypass RLS
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      )

      // 1. Update order status to 'paid'
      const { data: order, error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("stripe_checkout_session_id", session.id)
        .select()
        .maybeSingle()

      if (updateError) {
        console.error("[webhook] error updating order:", updateError)
      }

      let items = order?.items?.lines || []

      // If order wasn't found by session.id, it might not have been saved in create-checkout
      if (!order) {
        console.warn("[webhook] order not found for session:", session.id)
        // Optionally backfill order here if needed, but we prefer finding the existing one.
        // For now, let's at least try to trigger the email if we have metadata.
      }

      // 2. Trigger confirmation email
      if (customerEmail) {
        const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/order-confirmation`
        
        // If we don't have order items from DB, we can try to reconstruct them from session line items
        if (items.length === 0) {
           const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
             expand: ['line_items']
           })
           items = expandedSession.line_items?.data.map((li: any) => ({
             name: li.description,
             quantity: li.quantity,
             size: 'loaf' // Default or extracted from metadata if we had it per item
           })) || []
        }

        console.log(`[webhook] triggering email for ${customerEmail}`)
        
        fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            to: customerEmail,
            customerName: customerName,
            items: items,
            pickupDate: pickupDate,
            includeSample: includeSample,
            totalCents: session.amount_total,
          }),
        })
        .then(async r => {
          const resJson = await r.json()
          console.log("[webhook] email function response:", resJson)
        })
        .catch(e => console.error("[webhook] email trigger error:", e))
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    console.error(`[webhook] error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
