/*
  # create-payment-intent Edge Function

  Creates a Stripe PaymentIntent for a pending registration.
  Handles Stripe Customer creation/reuse for saved payment methods.
  Called from the Register.tsx payment step.

  ## Security
  - JWT verification is DISABLED because this runs during the anonymous registration flow
    (user may not be authenticated yet when completing payment)
  - Registration token validation ensures only valid pending registrations can create intents
  - Amount is read from the database — never trusted from the client
  - STRIPE_SECRET_KEY is stored in Supabase secrets only

  ## Flow
  1. Client sends { registrationToken, paymentPlanType, email, familyId? }
  2. Function validates token and fetches registration from DB
  3. Creates or reuses Stripe Customer for the family (enables saved payment methods)
  4. Creates Stripe PaymentIntent with setup_future_usage to save method after payment
  5. Saves stripe_customer_id back to families table
  6. Returns { clientSecret, stripeCustomerId }
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
  familyId?: string;
}

interface RegistrationRecord {
  id: string;
  amount_cents: number;
  status: string;
  expires_at: string;
  child_name: string;
  session_id: string;
}

interface FamilyRecord {
  id: string;
  stripe_customer_id: string | null;
  primary_contact_name: string;
}

function calculatePlanAmount(baseCents: number, planType: PlanType): number {
  switch (planType) {
    case "two_payment":
      return Math.ceil(baseCents / 2);
    case "divided":
      return Math.ceil(baseCents / 3);
    case "subscription":
      return Math.ceil(baseCents / 2);
    case "full":
    default:
      return baseCents;
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
      JSON.stringify({ demo: true, message: "Stripe not configured" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: PaymentIntentRequest = await req.json();
    const { registrationToken, paymentPlanType = "full", email, familyId } = body;

    if (!registrationToken) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing registration token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    if (new Date(registration.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration has expired. Please start a new registration." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chargeAmountCents = calculatePlanAmount(registration.amount_cents, paymentPlanType);

    // ── Stripe Customer management ───────────────────────────────────────────
    // Look up existing family to check for stripe_customer_id
    let stripeCustomerId: string | null = null;
    let familyRecord: FamilyRecord | null = null;

    if (familyId) {
      const { data: family } = await supabase
        .from("families")
        .select("id, stripe_customer_id, primary_contact_name")
        .eq("id", familyId)
        .single<FamilyRecord>();
      familyRecord = family;
      stripeCustomerId = family?.stripe_customer_id ?? null;
    } else if (email) {
      const { data: family } = await supabase
        .from("families")
        .select("id, stripe_customer_id, primary_contact_name")
        .eq("email", email)
        .maybeSingle<FamilyRecord>();
      familyRecord = family ?? null;
      stripeCustomerId = family?.stripe_customer_id ?? null;
    }

    // Create Stripe Customer if we have an email but no customer yet
    if (!stripeCustomerId && email) {
      const customerParams: Record<string, string> = { email };
      if (familyRecord?.primary_contact_name) {
        customerParams.name = familyRecord.primary_contact_name;
      }
      customerParams["metadata[registration_id]"] = registration.id;

      const customerRes = await stripePost("/customers", customerParams);
      if (customerRes.ok) {
        const customer = await customerRes.json();
        stripeCustomerId = customer.id;

        // Save stripe_customer_id back to the family record
        if (familyRecord?.id) {
          await supabase
            .from("families")
            .update({ stripe_customer_id: stripeCustomerId })
            .eq("id", familyRecord.id);
        }
      }
    }

    // ── Create PaymentIntent ─────────────────────────────────────────────────
    const paymentIntentParams: Record<string, string> = {
      amount: chargeAmountCents.toString(),
      currency: "usd",
      "payment_method_types[]": "card",
      "metadata[registration_id]": registration.id,
      "metadata[registration_token]": registrationToken,
      "metadata[plan_type]": paymentPlanType,
      "metadata[full_amount_cents]": registration.amount_cents.toString(),
      // Save payment method after successful payment (enables quick checkout next time)
      setup_future_usage: "off_session",
    };

    if (email) {
      paymentIntentParams.receipt_email = email;
    }
    if (stripeCustomerId) {
      paymentIntentParams.customer = stripeCustomerId;
    }

    const stripeResponse = await stripePost("/payment_intents", paymentIntentParams);

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
        stripeCustomerId: stripeCustomerId ?? null,
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
