import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.25.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    
    // 2. Initialize Stripe
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")
    if (!stripeSecret) throw new Error("STRIPE_SECRET_KEY is not set")
    const stripe = new Stripe(stripeSecret, { apiVersion: "2023-10-16" })

    // 3. Authenticate User
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("No authorization header")

    // We use the Service Role client to verify the token and get the user
    // This is more robust in Edge Functions where the gateway might have already verified the token
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Extract token from "Bearer <token>"
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error("[create-stripe-checkout] auth error:", userError)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      })
    }

    // 4. Parse request body
    const { cartItems, pickupDate, includeSample } = await req.json()
    if (!cartItems || !Array.isArray(cartItems)) throw new Error("cartItems is required")

    console.log(`[create-stripe-checkout] session for user=${user.id} email=${user.email}`)

    // 5. Create Stripe Checkout Session
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

    // 6. Save order
    const totalCents = cartItems.reduce((sum: number, item: any) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0)
    await supabaseAdmin.from("orders").insert({
      user_id: user.id,
      status: "pending_payment",
      total_cents: totalCents,
      pickup_date: pickupDate,
      items: { lines: cartItems, includeSample },
      stripe_checkout_session_id: session.id,
      include_sample: includeSample,
    })

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) {
    console.error("[create-stripe-checkout] exception:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
