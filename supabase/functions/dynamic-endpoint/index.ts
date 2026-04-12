// WeUp — MercadoPago Checkout Preference Creator
// Deploy: supabase functions deploy dynamic-endpoint
// Secrets: supabase secrets set MP_ACCESS_TOKEN=your_token MP_CURRENCY=COP
//
// Required secret:
//   MP_ACCESS_TOKEN   — MercadoPago production access token
//
// Optional secrets (prices in your local currency, default = COP):
//   MP_CURRENCY           — e.g. "COP", "MXN", "USD"  (default: COP)
//   PRICE_PRO_MONTHLY     — default: 19900
//   PRICE_PRO_YEARLY      — default: 155000
//   PRICE_FAMILY_MONTHLY  — default: 39900
//   PRICE_FAMILY_YEARLY   — default: 310000

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
}

function env(key: string, fallback: string): string {
  return Deno.env.get(key) || fallback
}

const PLAN_PRICES: Record<string, Record<string, number>> = {
  pro: {
    monthly: Number(env('PRICE_PRO_MONTHLY', '19900')),
    yearly:  Number(env('PRICE_PRO_YEARLY',  '155000')),
  },
  family: {
    monthly: Number(env('PRICE_FAMILY_MONTHLY', '39900')),
    yearly:  Number(env('PRICE_FAMILY_YEARLY',  '310000')),
  },
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, billing, userId, userEmail, userName, origin } = await req.json()

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Payment service not configured. Contact support.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const currency   = env('MP_CURRENCY', 'COP')
    const price      = PLAN_PRICES[plan]?.[billing] ?? PLAN_PRICES.pro.monthly
    const planName   = plan === 'family' ? 'Family' : 'Pro'
    const billingLbl = billing === 'yearly' ? 'Annual' : 'Monthly'

    const preference = {
      items: [{
        title:       `WeUp ${planName} — ${billingLbl} Plan`,
        description: `WeUp ${planName} subscription (${billingLbl.toLowerCase()})`,
        quantity:    1,
        unit_price:  price,
        currency_id: currency,
      }],
      payer: {
        email: userEmail || '',
        name:  userName  || '',
      },
      back_urls: {
        success: `${origin}/upgrade?status=approved&plan=${plan}&billing=${billing}`,
        pending: `${origin}/upgrade?status=pending&plan=${plan}&billing=${billing}`,
        failure: `${origin}/upgrade?status=failure&plan=${plan}&billing=${billing}`,
      },
      auto_return:        'approved',
      external_reference: `${userId}|${plan}|${billing}`,
      statement_descriptor: 'WEUP APP',
      binary_mode: false, // allow pending payments (PSE, Nequi, etc.)
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    })

    const mpData = await mpRes.json()

    if (!mpRes.ok) {
      console.error('[dynamic-endpoint] MercadoPago error:', mpData)
      return new Response(
        JSON.stringify({ error: mpData.message || 'Could not create payment preference' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        url:         mpData.init_point,         // production URL
        sandbox_url: mpData.sandbox_init_point, // sandbox URL for testing
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('[dynamic-endpoint] Error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
