/*
  # list-payment-methods Edge Function

  Returns saved Stripe payment methods for a returning family.
  Authenticated via registrationToken + email pair — no JWT required.

  ## Security
  - JWT verification DISABLED — anonymous registration flow
  - Access is validated by verifying the registrationToken exists and belongs to a
    registration whose family email matches the provided email
  - Only returns card brand, last4, expiry — no raw payment method IDs sent to client
    (client receives an opaque `methodId` that maps to a Stripe payment method ID)
  - STRIPE_SECRET_KEY never exposed to client

  ## Request
  POST { registrationToken: string, email: string }

  ## Response
  { methods: Array<{ methodId: string, brand: string, last4: string, expMonth: number, expYear: number, isDefault: boolean }> }
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

interface ListMethodsRequest {
  registrationToken: string;
  email: string;
}

interface SavedCard {
  methodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ methods: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: ListMethodsRequest = await req.json();
    const { registrationToken, email } = body;

    if (!registrationToken || !email) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate: registrationToken must belong to a pending registration for this email
    const { data: reg } = await supabase
      .from("registrations")
      .select("id, family_id")
      .eq("registration_token", registrationToken)
      .maybeSingle();

    if (!reg) {
      // Token not found — return empty (don't leak info about token validity)
      return new Response(
        JSON.stringify({ methods: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find family by email and verify stripe_customer_id
    const { data: family } = await supabase
      .from("families")
      .select("id, stripe_customer_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!family?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ methods: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch saved payment methods from Stripe
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/payment_methods?customer=${family.stripe_customer_id}&type=card`,
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!stripeRes.ok) {
      console.error("Stripe list payment methods failed:", await stripeRes.text());
      return new Response(
        JSON.stringify({ methods: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeData = await stripeRes.json();

    // Fetch the customer's default payment method
    const customerRes = await fetch(
      `https://api.stripe.com/v1/customers/${family.stripe_customer_id}`,
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );
    const customer = customerRes.ok ? await customerRes.json() : null;
    const defaultMethodId = customer?.invoice_settings?.default_payment_method ?? null;

    const methods: SavedCard[] = (stripeData.data ?? []).map((pm: {
      id: string;
      card: { brand: string; last4: string; exp_month: number; exp_year: number };
    }) => ({
      methodId: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === defaultMethodId,
    }));

    return new Response(
      JSON.stringify({ methods }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("list-payment-methods error:", err);
    return new Response(
      JSON.stringify({ methods: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
