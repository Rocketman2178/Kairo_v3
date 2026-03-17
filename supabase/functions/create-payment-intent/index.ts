/*
  # create-payment-intent Edge Function

  Creates a Stripe PaymentIntent for a pending registration.
  Called from the Register.tsx payment step.

  ## Security
  - JWT verification is DISABLED because this runs during the anonymous registration flow
    (user may not be authenticated yet when completing payment)
  - Registration token validation ensures only valid pending registrations can create intents
  - Amount is read from the database — never trusted from the client
  - STRIPE_SECRET_KEY is stored in Supabase secrets only

  ## Flow
  1. Client sends { registrationToken, paymentPlanType, email }
  2. Function validates token and fetches registration from DB
  3. Calculates final amount based on plan type and discounts
  4. Creates Stripe PaymentIntent
  5. Updates registration status to 'awaiting_payment'
  6. Returns { clientSecret }
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

interface PaymentIntentRequest {
  registrationToken: string;
  paymentPlanType?: PlanType;
  email?: string;
}

interface RegistrationRecord {
  id: string;
  amount_cents: number;
  status: string;
  expires_at: string;
  child_name: string;
  session_id: string;
}

function calculatePlanAmount(baseCents: number, planType: PlanType): number {
  switch (planType) {
    case "two_payment":
      // First payment is 50%
      return Math.ceil(baseCents / 2);
    case "divided":
      // First of 3 payments
      return Math.ceil(baseCents / 3);
    case "subscription": {
      // Approximate first monthly payment (base / 2 for 8-week season)
      return Math.ceil(baseCents / 2);
    }
    case "full":
    default:
      return baseCents;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // If Stripe is not configured, return demo mode
  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ demo: true, message: "Stripe not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: PaymentIntentRequest = await req.json();
    const { registrationToken, paymentPlanType = "full", email } = body;

    if (!registrationToken) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing registration token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to read registration data (no auth required for anonymous flow)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch pending registration — amount comes from DB, not client
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("id, amount_cents, status, expires_at, child_name, session_id")
      .eq("registration_token", registrationToken)
      .in("status", ["pending_registration", "awaiting_payment"])
      .single<RegistrationRecord>();

    if (regError || !registration) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration not found or expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(registration.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration has expired. Please start a new registration." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate the amount for this payment based on plan type
    const chargeAmountCents = calculatePlanAmount(registration.amount_cents, paymentPlanType);

    // Create Stripe PaymentIntent
    const stripeBody = new URLSearchParams({
      amount: chargeAmountCents.toString(),
      currency: "usd",
      "payment_method_types[]": "card",
      "metadata[registration_id]": registration.id,
      "metadata[registration_token]": registrationToken,
      "metadata[plan_type]": paymentPlanType,
      "metadata[full_amount_cents]": registration.amount_cents.toString(),
    });

    if (email) {
      stripeBody.append("receipt_email", email);
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody.toString(),
    });

    if (!stripeResponse.ok) {
      const stripeError = await stripeResponse.json();
      console.error("Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ error: true, message: "Failed to initialize payment" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentIntent = await stripeResponse.json();

    // Update registration status to awaiting_payment
    await supabase
      .from("registrations")
      .update({
        status: "awaiting_payment",
        payment_intent_id: paymentIntent.id,
      })
      .eq("id", registration.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amountCents: chargeAmountCents,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-payment-intent error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
