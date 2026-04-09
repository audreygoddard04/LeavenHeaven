import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not set")
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" })

    // Authenticate user
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    const body = await req.json()
    const { cartItems, pickupDate, includeSample } = body

    if (!cartItems?.length || !pickupDate) {
      return new Response(JSON.stringify({ error: "Missing cart items or pickup date" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      })
    }

    const orderId = crypto.randomUUID()
    const totalCents = cartItems.reduce(
      (sum: number, item: any) => sum + Math.round(item.unitPrice * 100) * item.quantity,
      0
    )

    // Build Stripe line items
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "cad",
        product_data: {
          name: `${item.size === "mini" ? "Mini " : item.size === "sandwich" ? "Sandwich " : ""}${item.name} Loaf`,
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }))

    if (includeSample) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { name: "Free Sample Loaf 🎁" },
          unit_amount: 0,
        },
        quantity: 1,
      })
    }

    const clientOrigin = req.headers.get("origin") || "http://localhost:5173"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      allow_promotion_codes: true,
      customer_email: user.email,
      success_url: `${clientOrigin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/?payment=canceled`,
      metadata: {
        order_id: orderId,
        user_id: user.id,
        pickup_date: pickupDate,
        include_sample: String(!!includeSample),
        customer_email: user.email ?? "",
        customer_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Customer",
        total_cents: String(totalCents),
      },
    })

    // Save as pending so it appears in admin immediately
    const baseRow = {
      id: orderId,
      user_id: user.id,
      status: "pending",
      total_cents: totalCents,
      pickup_date: pickupDate,
      items: {
        lines: cartItems.map(({ productId, name, size, quantity }: any) => ({
          productId, name, size, quantity,
        })),
        includeSample: !!includeSample,
      },
      include_sample: !!includeSample,
    }

    let { error: dbError } = await supabaseAdmin.from("orders").insert({
      ...baseRow,
      stripe_checkout_session_id: session.id,
    })

    if (dbError && /stripe_checkout_session_id|schema cache/i.test(dbError.message ?? "")) {
      ;({ error: dbError } = await supabaseAdmin.from("orders").insert(baseRow))
    }

    if (dbError) {
      console.error("[create-stripe-checkout] failed to save order:", dbError.message)
    }

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    console.error("[create-stripe-checkout] Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
