/*
  # send-sms-verification Edge Function

  Generates a 6-digit OTP, stores it in phone_verification_codes, and
  triggers an n8n webhook to deliver it via SMS.

  ## Security
  - JWT verification DISABLED — called from anonymous registration flow
  - Rate limiting: one active code per phone number (unique index in DB)
  - Phone format: accepts any non-empty string, passed through to n8n for delivery
  - OTP is 6-digit numeric; TTL = 10 minutes
  - Old unverified codes for the same phone are deleted before inserting a new one

  ## Flow
  1. POST { phone, registrationToken }
  2. Validate registration token is pending/valid
  3. Delete any prior unverified codes for this phone
  4. Generate 6-digit OTP, store in phone_verification_codes (expires in 10 min)
  5. POST to n8n with intent sms_verification
  6. Return { success: true }
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
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") ?? "";
const N8N_WEBHOOK_KEY = Deno.env.get("N8N_WEBHOOK_KEY") ?? "";

function generateOtp(): string {
  const digits = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(digits, (b) => b % 10).join("");
}

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
    const body: { phone: string; registrationToken: string } = await req.json();
    const { phone, registrationToken } = body;

    const normalizedPhone = (phone ?? "").trim();
    if (!normalizedPhone) {
      return new Response(
        JSON.stringify({ error: true, message: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!registrationToken) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate the registration token is valid and pending
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, expires_at")
      .eq("registration_token", registrationToken)
      .in("status", ["pending_registration", "awaiting_payment"])
      .single();

    if (!registration || new Date(registration.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "Invalid or expired registration" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete any prior unverified codes for this phone
    await supabase
      .from("phone_verification_codes")
      .delete()
      .eq("phone", normalizedPhone)
      .is("verified_at", null);

    // Generate OTP and insert into DB
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertErr } = await supabase
      .from("phone_verification_codes")
      .insert({
        phone:      normalizedPhone,
        code:       otp,
        expires_at: expiresAt,
      });

    if (insertErr) {
      console.error("Failed to store verification code:", insertErr);
      return new Response(
        JSON.stringify({ error: true, message: "Failed to generate verification code. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Trigger n8n to send the SMS
    if (N8N_WEBHOOK_URL) {
      try {
        await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(N8N_WEBHOOK_KEY ? { "X-N8N-Webhook-Key": N8N_WEBHOOK_KEY } : {}),
          },
          body: JSON.stringify({
            intent:  "sms_verification",
            phone:   normalizedPhone,
            code:    otp,
            expires: expiresAt,
          }),
        });
      } catch (n8nErr) {
        // Log but don't fail — in demo/dev environments n8n may be unreachable
        console.warn("n8n webhook call failed (non-fatal):", n8nErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, expiresAt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-sms-verification error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
