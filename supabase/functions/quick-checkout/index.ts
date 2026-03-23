/*
  # quick-checkout Edge Function

  Confirms payment using a saved Stripe payment method for returning families.
  Enables "Quick Pay" without re-entering card details.

  ## Security
  - JWT verification DISABLED — anonymous registration flow
  - Validates registrationToken exists (unexpired, pending)
  - Verifies email matches the family who owns the paymentMethodId via Stripe Customer
  - Amount ALWAYS read from DB — never trusted from client
  - STRIPE_SECRET_KEY server-side only

  ## Request
  POST { registrationToken, email, paymentMethodId, planType?, familyId?, childId? }

  ## Response
  Success: { success: true, requiresAction: false }
  3DS needed: { success: false, requiresAction: true, clientSecret: string }
  Error: { error: true, message: string }
*/

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

type PlanType = "full" | "divided" | "subscription" | "two_payment";

interface QuickCheckoutRequest {
  registrationToken: string;
  email: string;
  paymentMethodId: string;
  planType?: PlanType;
  familyId?: string;
  childId?: string;
}

function calculatePlanAmount(baseCents: number, planType: PlanType): number {
  switch (planType) {
    case "two_payment": return Math.ceil(baseCents / 2);
    case "divided": return Math.ceil(baseCents / 3);
    case "subscription": return Math.ceil(baseCents / 2);
    default: return baseCents;
  }
}

async function stripePost(path: string, params: Record<string, string>): Promise<Response> {
  return fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: true, message: "Stripe not configured" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: QuickCheckoutRequest = await req.json();
    const { registrationToken, email, paymentMethodId, planType = "full", familyId, childId } = body;

    if (!registrationToken || !email || !paymentMethodId) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch pending registration
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, amount_cents, status, expires_at, child_name")
      .eq("registration_token", registrationToken)
      .in("status", ["pending_registration", "awaiting_payment"])
      .maybeSingle();

    if (!registration) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration not found or expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(registration.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the family owns this payment method via Stripe Customer
    const { data: family } = await supabase
      .from("families")
      .select("id, stripe_customer_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!family?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: true, message: "No saved payment methods found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify paymentMethodId belongs to this customer
    const pmRes = await fetch(
      `https://api.stripe.com/v1/payment_methods/${paymentMethodId}`,
      { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
    );
    if (!pmRes.ok) {
      return new Response(
        JSON.stringify({ error: true, message: "Payment method not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const pm = await pmRes.json();
    if (pm.customer !== family.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: true, message: "Payment method does not belong to this family" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chargeAmountCents = calculatePlanAmount(registration.amount_cents, planType);

    // Create and confirm a PaymentIntent with the saved payment method
    const piParams: Record<string, string> = {
      amount: chargeAmountCents.toString(),
      currency: "usd",
      customer: family.stripe_customer_id,
      payment_method: paymentMethodId,
      confirm: "true",
      "automatic_payment_methods[enabled]": "true",
      "automatic_payment_methods[allow_redirects]": "never",
      "metadata[registration_id]": registration.id,
      "metadata[registration_token]": registrationToken,
      "metadata[plan_type]": planType,
      receipt_email: email,
    };

    const piRes = await stripePost("/payment_intents", piParams);
    const paymentIntent = await piRes.json();

    if (!piRes.ok) {
      console.error("Stripe PI error:", paymentIntent);
      const declineCode = paymentIntent?.error?.decline_code ?? paymentIntent?.error?.code;
      return new Response(
        JSON.stringify({
          error: true,
          message: "Payment failed",
          declineCode: declineCode ?? "unknown",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle 3DS / additional authentication required
    if (paymentIntent.status === "requires_action" || paymentIntent.status === "requires_confirmation") {
      return new Response(
        JSON.stringify({
          success: false,
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ error: true, message: "Payment did not complete" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment succeeded — confirm the registration
    const resolvedFamilyId = familyId ?? family.id;
    if (resolvedFamilyId && childId) {
      await supabase.rpc("confirm_registration", {
        p_registration_token: registrationToken,
        p_family_id: resolvedFamilyId,
        p_child_id: childId,
        p_payment_intent_id: paymentIntent.id,
      });
    } else {
      // Update status directly if we don't have family/child IDs yet
      await supabase
        .from("registrations")
        .update({
          status: "confirmed",
          payment_intent_id: paymentIntent.id,
        })
        .eq("registration_token", registrationToken);
    }

    return new Response(
      JSON.stringify({ success: true, requiresAction: false, paymentIntentId: paymentIntent.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("quick-checkout error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
