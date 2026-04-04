// Supabase Edge Function — sends an order confirmation email via Resend.
//
// Required Supabase secrets (set via dashboard → Project Settings → Edge Functions,
// or run: supabase secrets set KEY=value):
//   RESEND_API_KEY   — from resend.com (free tier: 3,000 emails / month)
//   FROM_EMAIL       — e.g. "LeavenHeaven <orders@yourdomain.com>"
//                      (use "onboarding@resend.dev" for testing without domain setup)
//   PICKUP_ADDRESS   — your apartment address
//   PICKUP_NOTES     — optional, e.g. "Ring doorbell #3, Unit 4B"
//
// Deploy: supabase functions deploy order-confirmation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL')     ?? 'LeavenHeaven <noreply@leavenheaven.com>'
const PICKUP_ADDRESS = Deno.env.get('PICKUP_ADDRESS') ?? 'Address not configured'
const PICKUP_NOTES   = Deno.env.get('PICKUP_NOTES')   ?? ''
const REPLY_TO       = 'audreyannagoddard@gmail.com'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const {
      to,
      customerName,
      items,        // [{ name, size, quantity }]
      pickupDate,   // "YYYY-MM-DD"
      includeSample,
      totalCents,
    } = await req.json()

    const pickupFormatted = new Date(pickupDate + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })

    const itemRows = items
      .map((item: { name: string; size: string; quantity: number }) =>
        `<tr>
          <td style="padding:6px 0;font-size:14px;">${item.quantity}× ${item.name}</td>
          <td style="padding:6px 0;font-size:13px;color:#888;text-align:right;">${item.size === 'mini' ? 'Mini' : 'Full loaf'}</td>
        </tr>`
      ).join('')

    const totalLine = totalCents > 0
      ? `<tr><td colspan="2" style="border-top:1px solid #e8e0d5;padding-top:10px;font-weight:bold;font-size:15px;">Total: $${(totalCents / 100).toFixed(2)}</td></tr>`
      : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif;color:#2a2a2a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fdfaf7;border-radius:16px;overflow:hidden;max-width:100%;">

        <!-- Header -->
        <tr><td style="background:#214535;padding:32px 40px;text-align:center;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#a8c5b5;margin-bottom:6px;">Macro Friendly Bakery</div>
          <div style="font-size:26px;font-weight:700;color:#fdfaf7;letter-spacing:0.06em;">LEAVEN HEAVEN</div>
        </td></tr>

        <!-- Confirmed banner -->
        <tr><td style="padding:28px 40px 0;text-align:center;">
          <div style="display:inline-block;background:#e8f2ec;color:#214535;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 16px;border-radius:999px;">Order Confirmed</div>
          <h2 style="font-size:22px;margin:12px 0 6px;">Your loaves are on the list!</h2>
          <p style="font-size:14px;color:#666;margin:0 0 24px;">Hi ${customerName}, thanks for your pre-order. We'll bake fresh for you and let you know when it's ready.</p>
        </td></tr>

        <!-- Order summary -->
        <tr><td style="padding:0 40px 24px;">
          <div style="background:#f5f0e8;border-radius:10px;padding:20px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:14px;">Your Order</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemRows}
              ${includeSample ? `<tr><td colspan="2" style="padding:6px 0;font-size:13px;color:#214535;font-style:italic;">+ Free sample loaf</td></tr>` : ''}
              ${totalLine}
            </table>
          </div>
        </td></tr>

        <!-- Pickup details -->
        <tr><td style="padding:0 40px 32px;">
          <div style="border:1.5px solid #214535;border-radius:10px;padding:20px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#214535;margin-bottom:14px;">Pickup Details</div>
            <div style="font-size:15px;font-weight:600;margin-bottom:8px;">📅 ${pickupFormatted}</div>
            <div style="font-size:14px;margin-bottom:${PICKUP_NOTES ? '6px' : '0'};">📍 ${PICKUP_ADDRESS}</div>
            ${PICKUP_NOTES ? `<div style="font-size:13px;color:#666;margin-top:4px;">${PICKUP_NOTES}</div>` : ''}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f0e8;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
          <p style="font-size:13px;color:#888;margin:0 0 6px;">Questions? Reply to this email or reach out directly.</p>
          <a href="mailto:${REPLY_TO}" style="font-size:13px;color:#214535;">${REPLY_TO}</a>
          <p style="font-size:11px;color:#aaa;margin:16px 0 0;">LeavenHeaven · Baked with love 🌱</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        reply_to: REPLY_TO,
        subject: `Your LeavenHeaven order is confirmed — pickup ${pickupFormatted}`,
        html,
      }),
    })

    const result = await resendRes.json()
    return new Response(JSON.stringify(result), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: resendRes.ok ? 200 : 400,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
