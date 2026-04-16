/*
  # approve-transfer Edge Function

  Approves a pending class transfer request. When approved:
  1. Calls approve_class_transfer() RPC — atomically moves the registration,
     updates both sessions' enrolled counts, and marks the transfer approved.
  2. Applies Stripe billing adjustment if billing_adjustment_cents > 0:
       - 'credit'  → Stripe refund on the original payment_intent
       - 'charge'  → Stripe PaymentIntent (off-session) on saved card
       Stamps billing_applied_at on success.
  3. Checks the freed (from) session for waitlisted families.
  4. If a pending waitlist entry exists, promotes it to 'notified' and
     fires trigger-waitlist-spot-available.

  ## Security
  - JWT verification DISABLED — called by admin UI or internal automation.
  - Uses service role key — never trusts client-supplied data beyond transferId.

  ## Request
  POST { "transferId": "<uuid>" }

  ## Response
  {
    "success": true,
    "transferId": "<uuid>",
    "fromSessionId": "<uuid>",
    "toSessionId": "<uuid>",
    "billing": { "direction": "credit"|"charge"|"none", "amountCents": 0, "applied": bool, "stripeId": "..." },
    "waitlistNotified": "<waitlistId>" | null
  }
*/

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Webhook-Key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_API = "https://api.stripe.com/v1";
const FUNCTIONS_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1`
  : "https://tatunnfxwfsyoiqoaenb.supabase.co/functions/v1";

// ─── Stripe helpers ───────────────────────────────────────────────────────────

async function stripePost(path: string, params: Record<string, string>): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json() as Record<string, unknown>;
  return { ok: res.ok, data };
}

async function stripeGet(path: string): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const data = await res.json() as Record<string, unknown>;
  return { ok: res.ok, data };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: true, message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json() as { transferId?: string };
    const { transferId } = body;

    if (!transferId) {
      return new Response(
        JSON.stringify({ error: true, message: "transferId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Load transfer record (billing fields needed before approval)
    const { data: transfer, error: tErr } = await supabase
      .from("class_transfers")
      .select("id, from_registration_id, to_session_id, billing_adjustment_cents, billing_direction, family_id")
      .eq("id", transferId)
      .maybeSingle();

    if (tErr || !transfer) {
      return new Response(
        JSON.stringify({ error: true, message: "Transfer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Approve the transfer atomically via DB function
    const { data: approveResult, error: approveErr } = await supabase
      .rpc("approve_class_transfer", { p_transfer_id: transferId });

    if (approveErr) {
      console.error("approve_class_transfer RPC error:", approveErr);
      return new Response(
        JSON.stringify({ error: true, message: approveErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = approveResult as {
      error?: boolean;
      message?: string;
      transfer_id?: string;
      from_session_id?: string;
      to_session_id?: string;
    };

    if (result.error) {
      return new Response(
        JSON.stringify({ error: true, message: result.message }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromSessionId = result.from_session_id ?? null;
    const toSessionId = result.to_session_id ?? null;

    // 3. Apply Stripe billing adjustment if needed
    const billingInfo: {
      direction: string;
      amountCents: number;
      applied: boolean;
      stripeId: string | null;
      error: string | null;
    } = {
      direction: transfer.billing_direction ?? "none",
      amountCents: transfer.billing_adjustment_cents ?? 0,
      applied: false,
      stripeId: null,
      error: null,
    };

    const needsBilling =
      STRIPE_SECRET_KEY &&
      (transfer.billing_adjustment_cents ?? 0) > 0 &&
      transfer.billing_direction !== "none";

    if (needsBilling) {
      try {
        if (transfer.billing_direction === "credit") {
          // ── Refund on original payment intent ──────────────────────────────
          const { data: regData } = await supabase
            .from("registrations")
            .select("payment_intent_id")
            .eq("id", transfer.from_registration_id)
            .maybeSingle();

          const paymentIntentId = regData?.payment_intent_id as string | null;

          if (paymentIntentId) {
            const { ok, data: refund } = await stripePost("/refunds", {
              payment_intent: paymentIntentId,
              amount: String(transfer.billing_adjustment_cents),
              reason: "requested_by_customer",
            });

            if (ok) {
              billingInfo.applied = true;
              billingInfo.stripeId = (refund.id as string) ?? null;
              // Stamp billing_applied_at
              await supabase
                .from("class_transfers")
                .update({ billing_applied_at: new Date().toISOString() })
                .eq("id", transferId);
            } else {
              billingInfo.error = (refund.error as { message?: string })?.message ?? "Stripe refund failed";
              console.error("Stripe refund error:", refund);
            }
          } else {
            billingInfo.error = "No payment_intent_id on registration — refund skipped";
          }
        } else if (transfer.billing_direction === "charge") {
          // ── Off-session charge on saved card ───────────────────────────────
          const { data: familyData } = await supabase
            .from("families")
            .select("stripe_customer_id")
            .eq("id", transfer.family_id)
            .maybeSingle();

          const stripeCustomerId = familyData?.stripe_customer_id as string | null;

          if (stripeCustomerId) {
            // Get customer's default payment method
            const { ok: custOk, data: customer } = await stripeGet(
              `/customers/${stripeCustomerId}?expand[]=invoice_settings.default_payment_method`
            );

            const invoiceSettings = custOk
              ? (customer.invoice_settings as { default_payment_method?: { id?: string } } | null)
              : null;
            const paymentMethodId = invoiceSettings?.default_payment_method?.id ?? null;

            if (paymentMethodId) {
              const { ok, data: pi } = await stripePost("/payment_intents", {
                amount: String(transfer.billing_adjustment_cents),
                currency: "usd",
                customer: stripeCustomerId,
                payment_method: paymentMethodId,
                confirm: "true",
                off_session: "true",
                description: `Class transfer billing adjustment — transfer ${transferId}`,
                "metadata[transfer_id]": transferId,
              });

              if (ok) {
                billingInfo.applied = true;
                billingInfo.stripeId = (pi.id as string) ?? null;
                await supabase
                  .from("class_transfers")
                  .update({ billing_applied_at: new Date().toISOString() })
                  .eq("id", transferId);
              } else {
                billingInfo.error = (pi.error as { message?: string })?.message ?? "Stripe charge failed";
                console.error("Stripe charge error:", pi);
              }
            } else {
              billingInfo.error = "No default payment method on Stripe customer — charge skipped";
            }
          } else {
            billingInfo.error = "Family has no Stripe customer ID — charge skipped";
          }
        }
      } catch (stripeErr) {
        console.error("Stripe billing error:", stripeErr);
        billingInfo.error = "Stripe error — billing not applied";
      }
    }

    // 4. Check if the freed (from) session has pending waitlist entries
    let waitlistNotified: string | null = null;

    if (fromSessionId) {
      const { data: waitlistEntries } = await supabase
        .from("waitlist")
        .select("id")
        .eq("session_id", fromSessionId)
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(1);

      const firstWaitlisted = waitlistEntries?.[0];

      if (firstWaitlisted) {
        await supabase
          .from("waitlist")
          .update({ status: "notified", updated_at: new Date().toISOString() })
          .eq("id", firstWaitlisted.id);

        try {
          const notifyRes = await fetch(`${FUNCTIONS_BASE}/trigger-waitlist-spot-available`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ waitlistId: firstWaitlisted.id }),
          });
          if (notifyRes.ok) waitlistNotified = firstWaitlisted.id;
          else console.error("trigger-waitlist-spot-available returned non-OK:", notifyRes.status);
        } catch (err) {
          console.error("Failed to trigger waitlist notification:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transferId,
        fromSessionId,
        toSessionId,
        billing: billingInfo,
        waitlistNotified,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-transfer error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
