// WeUp — MercadoPago Webhook / IPN Handler
// Deploy: supabase functions deploy mp-webhook
//
// Required secrets:
//   MP_ACCESS_TOKEN          — MercadoPago production access token
//   SUPABASE_URL             — your project URL (auto-set by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS for trusted writes)
//
// Register this URL in your MercadoPago account under
//   Developer → My applications → Webhooks → URL notification
// Supported notification types: payments

import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MP_API = "https://api.mercadopago.com"

serve(async (req: Request) => {
  // MercadoPago sends GET for IPN (old) and POST for Webhooks (new)
  // Always respond 200 quickly to avoid MP retrying
  try {
    const paymentId = await extractPaymentId(req)

    if (!paymentId) {
      // Could be a non-payment topic (subscription, plan, etc.) — ignore gracefully
      return ok("ignored")
    }

    const payment = await fetchMPPayment(paymentId)

    if (!payment) {
      console.error("[mp-webhook] Could not fetch payment", paymentId)
      return ok("fetch-error")
    }

    // Only act on approved payments
    if (payment.status !== "approved") {
      console.log("[mp-webhook] Payment not approved", paymentId, payment.status)
      return ok("not-approved")
    }

    // external_reference = "userId|plan|billing"  (set in dynamic-endpoint)
    const ref = payment.external_reference ?? ""
    const [userId, plan, billing] = ref.split("|")

    if (!userId || !plan || !billing) {
      console.error("[mp-webhook] Bad external_reference:", ref)
      return ok("bad-ref")
    }

    // Use service-role key — this bypasses RLS and is safe server-side only
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabase.from("profiles").upsert({
      id:                  userId,
      plan,
      plan_billing:        billing,
      onboarding_completed: true,
      plan_activated_at:   new Date().toISOString(),
      plan_payment_id:     String(paymentId),
      trial_ends_at:       new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: "id" })

    if (error) {
      console.error("[mp-webhook] DB upsert error:", error)
      // Return 500 so MercadoPago retries
      return new Response("db-error", { status: 500 })
    }

    console.log(`[mp-webhook] ✅ Plan upgraded: user=${userId} plan=${plan} billing=${billing} payment=${paymentId}`)
    return ok("upgraded")

  } catch (err) {
    console.error("[mp-webhook] Unhandled error:", err)
    return new Response("error", { status: 500 })
  }
})

// ── Extract payment ID from IPN (GET) or Webhook (POST) ──────────────────────
async function extractPaymentId(req: Request): Promise<string | null> {
  const url = new URL(req.url)

  // IPN style: GET ?topic=payment&id=PAYMENT_ID
  if (req.method === "GET") {
    const topic = url.searchParams.get("topic")
    if (topic !== "payment") return null
    return url.searchParams.get("id")
  }

  // Webhook style: POST {"action":"payment.updated","data":{"id":PAYMENT_ID}}
  if (req.method === "POST") {
    const topic = url.searchParams.get("topic")
    const qId   = url.searchParams.get("id")

    // Some MP webhook formats include id in query string
    if (topic === "payment" && qId) return qId

    try {
      const body = await req.json()
      const action = body?.action ?? ""
      if (action.startsWith("payment") && body?.data?.id) {
        return String(body.data.id)
      }
    } catch {
      // Body not JSON — ignore
    }
  }

  return null
}

// ── Call MercadoPago API to verify payment ────────────────────────────────────
async function fetchMPPayment(paymentId: string): Promise<Record<string, unknown> | null> {
  const token = Deno.env.get("MP_ACCESS_TOKEN")
  if (!token) {
    console.error("[mp-webhook] MP_ACCESS_TOKEN not set")
    return null
  }

  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    console.error("[mp-webhook] MP API error:", res.status, await res.text())
    return null
  }

  return res.json()
}

function ok(msg: string) {
  return new Response(msg, { status: 200 })
}
