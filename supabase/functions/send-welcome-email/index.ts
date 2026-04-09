const REPLY_TO = 'audreyannagoddard@gmail.com'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  const RESEND_API_KEY  = Deno.env.get('RESEND_API_KEY')  ?? ''
  const FROM_EMAIL      = Deno.env.get('FROM_EMAIL')      ?? 'LeavenHeaven <orders@leavenheaven.shop>'
  const PROMO_CODE      = Deno.env.get('WELCOME_PROMO_CODE') ?? 'EARLYBIRD'
  const SITE_URL        = Deno.env.get('SITE_URL')        ?? 'https://leavenheaven.shop'

  try {
    const { to, customerName } = await req.json()

    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing `to` field' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const name = customerName || 'there'

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

        <!-- Welcome banner -->
        <tr><td style="padding:32px 40px 0;text-align:center;">
          <div style="display:inline-block;background:#e8f2ec;color:#214535;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 16px;border-radius:999px;">Welcome to the family 🌾</div>
          <h2 style="font-size:24px;margin:16px 0 8px;color:#214535;">Hi ${name}, you're in!</h2>
          <p style="font-size:15px;color:#555;margin:0 0 28px;line-height:1.6;">Thanks for joining Leaven Heaven — a small-batch, macro-friendly sourdough bakery baking with purpose, passion, and a serious love of good bread.</p>
        </td></tr>

        <!-- About section -->
        <tr><td style="padding:0 40px 24px;">
          <div style="background:#f5f0e8;border-radius:10px;padding:24px;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin-bottom:14px;">What we're about</div>
            <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 12px;">Every loaf is made with high-quality, whole-grain ingredients and packed with protein — so you can enjoy real, delicious bread without compromising your goals.</p>
            <p style="font-size:14px;color:#444;line-height:1.7;margin:0;">We do <strong>weekly pre-orders</strong>, baked fresh and ready for Sunday pickup at <strong>1083 Western Road</strong> at 2:00 PM. Orders close every Thursday at midnight.</p>
          </div>
        </td></tr>

        <!-- Promo code -->
        <tr><td style="padding:0 40px 32px;">
          <div style="border:2px solid #214535;border-radius:10px;padding:24px;text-align:center;">
            <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#214535;margin-bottom:12px;">🎁 Early Member Gift</div>
            <p style="font-size:14px;color:#555;margin:0 0 16px;line-height:1.5;">As one of our first members, you get a special discount on your order. Use this code at checkout:</p>
            <div style="display:inline-block;background:#214535;color:#fdfaf7;font-size:22px;font-weight:700;letter-spacing:0.18em;padding:12px 28px;border-radius:8px;font-family:monospace;">${PROMO_CODE}</div>
            <p style="font-size:12px;color:#999;margin:12px 0 0;">Apply at checkout — thank you for being here from the beginning 🙏</p>
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:0 40px 32px;text-align:center;">
          <a href="${SITE_URL}" style="display:inline-block;background:#214535;color:#fdfaf7;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:14px 32px;border-radius:999px;text-decoration:none;">Browse This Week's Loaves</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f5f0e8;padding:20px 40px;text-align:center;border-top:1px solid #e8e0d5;">
          <p style="font-size:13px;color:#888;margin:0 0 6px;">Questions? Just reply to this email.</p>
          <a href="mailto:${REPLY_TO}" style="font-size:13px;color:#214535;">${REPLY_TO}</a>
          <p style="font-size:11px;color:#aaa;margin:16px 0 0;">LeavenHeaven · Baked with love 🌱</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    if (!RESEND_API_KEY) {
      console.error('[send-welcome-email] RESEND_API_KEY not set')
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log(`[send-welcome-email] sending to=${to}`)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        reply_to: REPLY_TO,
        subject: `Welcome to Leaven Heaven 🌾 — your early member code inside`,
        html,
      }),
    })

    const result = await resendRes.json()
    if (!resendRes.ok) {
      console.error('[send-welcome-email] Resend error:', JSON.stringify(result))
    } else {
      console.log('[send-welcome-email] sent, id:', result.id)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: resendRes.ok ? 200 : 400,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[send-welcome-email] exception:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
