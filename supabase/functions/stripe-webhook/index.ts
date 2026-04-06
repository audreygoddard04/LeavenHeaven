import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0"

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing signature", { status: 400 })
  }

  try {
    const body = await req.text()
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") ?? ""
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2023-10-16",
    })

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )

    console.log(`[webhook] event type: ${event.type}`)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}

      const customerEmail = metadata.customer_email || session.customer_email || ""
      const customerName = metadata.customer_name || "Customer"

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      )

      // 1. Update order status to 'paid'
      const { data: order } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("stripe_checkout_session_id", session.id)
        .select()
        .maybeSingle()

      // 2. Trigger confirmation email
      if (customerEmail) {
        const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/order-confirmation`
        
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
            items: order?.items?.lines || [],
            pickupDate: metadata.pickup_date,
            includeSample: metadata.include_sample === "true",
            totalCents: session.amount_total,
          }),
        })
        .then(async r => {
          console.log("[webhook] email function triggered")
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
