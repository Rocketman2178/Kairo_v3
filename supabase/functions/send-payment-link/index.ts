/*
  # send-payment-link Edge Function

  Sends a payment reminder email via n8n when a family has an `awaiting_payment`
  registration and requests a new payment link from the Parent Portal.

  ## Security
  - JWT verification DISABLED — called by anonymous portal users (pre-auth email lookup).
  - Validates the registration exists, matches the provided email, and is awaiting_payment.
  - The registration token is NOT returned in the response — only the email/redirect URL.
  - Rate-limiting is handled by the `payment_link_sent_at` cooldown (5 minutes).

  ## Calling Conventions
  POST with JSON body:
    { "registrationId": "<uuid>", "familyEmail": "<email>" }

  The function:
  1. Loads the registration + family + session data.
  2. Validates family email matches the request.
  3. Checks 5-minute cooldown on payment_link_sent_at.
  4. Posts `payment_link_reminder` intent to n8n with registration URL.
  5. Updates registrations.payment_link_sent_at to NOW().

  ## N8N Payload
  {
    "intent":           "payment_link_reminder",
    "registrationId":   "<uuid>",
    "email":            "parent@example.com",
    "contactName":      "Sarah",
    "childName":        "Emma",
    "programName":      "Soccer Shots Classic",
    "amountCents":      18900,
    "registrationUrl":  "https://kairo.app/register?token=<token>",
    "portalUrl":        "https://kairo.app/portal?email=parent@example.com"
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
const N8N_WEBHOOK_URL =
  Deno.env.get("N8N_WEBHOOK_URL") ?? "https://healthrocket.app.n8n.cloud/webhook/kai-conversation";
const KAIRO_APP_URL = Deno.env.get("KAIRO_APP_URL") ?? "https://kairo.app";

// Cooldown in milliseconds — prevent spamming the same link (5 minutes)
const COOLDOWN_MS = 5 * 60 * 1000;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time24: string): string {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: true, message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json() as { registrationId?: string; familyEmail?: string };
    const { registrationId, familyEmail } = body;

    if (!registrationId || !familyEmail) {
      return new Response(
        JSON.stringify({ error: true, message: "registrationId and familyEmail are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load registration with family + session data
    const { data: reg, error: fetchErr } = await supabase
      .from("registrations")
      .select(`
        id,
        status,
        payment_status,
        amount_cents,
        registration_token,
        payment_link_sent_at,
        child_name,
        families (
          id,
          email,
          primary_contact_name
        ),
        sessions (
          day_of_week,
          start_time,
          programs ( name ),
          locations ( name )
        )
      `)
      .eq("id", registrationId)
      .single();

    if (fetchErr || !reg) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate family email matches
    const familyData = reg.families as { id: string; email: string; primary_contact_name: string } | null;
    const registrationEmail = familyData?.email ?? "";

    if (registrationEmail.toLowerCase() !== familyEmail.trim().toLowerCase()) {
      return new Response(
        JSON.stringify({ error: true, message: "Email does not match registration" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Only send for awaiting_payment registrations
    if (reg.payment_status !== "unpaid" && reg.status !== "awaiting_payment") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Registration is not awaiting payment" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Enforce 5-minute cooldown
    if (reg.payment_link_sent_at) {
      const sentAt = new Date(reg.payment_link_sent_at).getTime();
      if (Date.now() - sentAt < COOLDOWN_MS) {
        const waitSec = Math.ceil((COOLDOWN_MS - (Date.now() - sentAt)) / 1000);
        return new Response(
          JSON.stringify({
            skipped: true,
            reason: `Please wait ${waitSec}s before requesting another link`,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const sessionData = reg.sessions as {
      day_of_week: number;
      start_time: string;
      programs: { name: string } | null;
      locations: { name: string } | null;
    } | null;

    const contactName = familyData?.primary_contact_name ?? null;
    const programName = sessionData?.programs?.name ?? "your class";
    const dayOfWeek = sessionData?.day_of_week != null ? DAY_NAMES[sessionData.day_of_week] : "";
    const startTime = sessionData?.start_time ? formatTime(sessionData.start_time) : "";
    const registrationUrl = reg.registration_token
      ? `${KAIRO_APP_URL}/register?token=${reg.registration_token}`
      : `${KAIRO_APP_URL}/`;
    const portalUrl = `${KAIRO_APP_URL}/portal?email=${encodeURIComponent(registrationEmail)}`;

    const payload = {
      intent: "payment_link_reminder",
      registrationId: reg.id,
      email: registrationEmail,
      contactName,
      childName: reg.child_name ?? "",
      programName,
      dayOfWeek,
      startTime,
      amountCents: reg.amount_cents ?? 0,
      registrationUrl,
      portalUrl,
    };

    // Fire n8n
    let n8nSuccess = false;
    try {
      const n8nRes = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      n8nSuccess = n8nRes.ok;
    } catch (err) {
      console.error("Failed to trigger n8n payment link reminder:", err);
    }

    // Update cooldown timestamp
    if (n8nSuccess) {
      await supabase
        .from("registrations")
        .update({ payment_link_sent_at: new Date().toISOString() })
        .eq("id", registrationId);
    }

    return new Response(
      JSON.stringify({
        success: n8nSuccess,
        registrationId,
        email: registrationEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-payment-link error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
