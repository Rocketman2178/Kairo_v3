/*
  # verify-phone-code Edge Function

  Validates an OTP previously sent via send-sms-verification.
  On success, marks the code as verified and optionally updates
  families.phone_verified_at if the family already exists.

  ## Security
  - JWT verification DISABLED — anonymous registration flow
  - Code validated against DB (server-side), not client-supplied
  - Expired codes are rejected regardless of value
  - Code deleted on successful verification (single-use)

  ## Flow
  1. POST { phone, code, registrationToken }
  2. Look up active, unverified code for the phone
  3. Validate code matches and is not expired
  4. Mark verified_at in phone_verification_codes
  5. If family exists with that registration token, set phone_verified_at
  6. Return { success: true, verified: true }
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
    const body: { phone: string; code: string; registrationToken: string } = await req.json();
    const { phone, code, registrationToken } = body;

    const normalizedPhone = (phone ?? "").trim();
    const normalizedCode  = (code  ?? "").trim();

    if (!normalizedPhone || !normalizedCode || !registrationToken) {
      return new Response(
        JSON.stringify({ error: true, message: "phone, code, and registrationToken are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up the verification code record
    const { data: record, error: lookupErr } = await supabase
      .from("phone_verification_codes")
      .select("id, code, expires_at, verified_at")
      .eq("phone", normalizedPhone)
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lookupErr || !record) {
      return new Response(
        JSON.stringify({ error: true, message: "No pending verification code found for this phone number" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "Verification code has expired. Please request a new one." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate the code
    if (record.code !== normalizedCode) {
      return new Response(
        JSON.stringify({ error: true, message: "Incorrect verification code. Please try again." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark code as verified
    await supabase
      .from("phone_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", record.id);

    // If a family already exists for this registration, stamp phone_verified_at
    const { data: reg } = await supabase
      .from("registrations")
      .select("family_id")
      .eq("registration_token", registrationToken)
      .single();

    if (reg?.family_id) {
      await supabase
        .from("families")
        .update({ phone_verified_at: new Date().toISOString() })
        .eq("id", reg.family_id);
    }

    return new Response(
      JSON.stringify({ success: true, verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-phone-code error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
