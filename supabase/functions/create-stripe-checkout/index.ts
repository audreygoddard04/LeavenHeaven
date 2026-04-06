import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  // 1. Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  console.log(`[create-stripe-checkout] Request received: ${req.method}`)

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    
    // Initialize Stripe
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not set")
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" })

    // 2. Authenticate User
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      console.error("[create-stripe-checkout] Missing Authorization header")
      return new Response(JSON.stringify({ error: "No authorization header provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace("Bearer ", "")
    
    // We use service role to verify the token sent by the user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error("[create-stripe-checkout] Auth verification failed:", userError?.message || "User not found")
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    console.log(`[create-stripe-checkout] Authenticated user: ${user.id} (${user.email})`)

    // 3. Parse request body
    const body = await req.json()
    const { cartItems, pickupDate, includeSample } = body
    if (!cartItems || !Array.isArray(cartItems)) throw new Error("cartItems is required")

    // 4. Create Stripe Checkout Session
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          metadata: { productId: item.productId, size: item.size },
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }))

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?payment=success`,
      cancel_url: `${req.headers.get("origin")}/?payment=canceled`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        pickup_date: pickupDate,
        include_sample: String(includeSample),
        customer_email: user.email ?? "",
        customer_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? "Customer",
      },
    })

    console.log(`[create-stripe-checkout] Stripe session created: ${session.id}`)

    // 5. Save order
    const totalCents = cartItems.reduce((sum: number, item: any) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0)
    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      user_id: user.id,
      status: "pending_payment",
      total_cents: totalCents,
      pickup_date: pickupDate,
      items: { lines: cartItems, includeSample },
      stripe_checkout_session_id: session.id,
      include_sample: includeSample,
    })

    if (insertError) {
      console.warn("[create-stripe-checkout] Order record not created:", insertError.message)
      // We still proceed since the webhook can backfill it if metadata is present
    }

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    console.error("[create-stripe-checkout] Server error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
