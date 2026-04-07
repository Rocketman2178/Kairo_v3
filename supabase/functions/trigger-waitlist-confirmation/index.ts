/*
  # trigger-waitlist-confirmation Edge Function

  Sends a "Waitlist Confirmation" email via n8n when a family joins a waitlist.
  The email has a distinct subject ("Waitlist Confirmation" — not "Order Confirmation")
  and includes the waitlist position, class details, and clear next steps.

  ## Security
  - JWT verification DISABLED — called by frontend (anonymous public users) and n8n (service-to-service).
  - Validates the waitlist entry exists and has not already received a confirmation.
  - Reads session/program data from DB — never trusts client-supplied class details.
  - Does not expose other families' waitlist data in response.

  ## Calling Conventions
  POST with JSON body:
    { "waitlistId": "<uuid>" }

  The function:
  1. Loads the waitlist entry + session + program + location.
  2. Reads the contact email from waitlist.contact_email (anonymous) or
     families.email (authenticated family).
  3. If confirmation_sent_at is already set, returns { "skipped": true }.
  4. Posts to n8n with intent "waitlist_confirmation_email".
  5. Sets waitlist.confirmation_sent_at to NOW() to prevent duplicates.

  ## N8N Payload
  {
    "intent":        "waitlist_confirmation_email",
    "waitlistId":    "<uuid>",
    "email":         "parent@example.com",
    "contactName":   "Sarah",
    "position":      3,
    "programName":   "Soccer Shots Classic",
    "dayOfWeek":     "Tuesday",
    "startTime":     "10:00 AM",
    "locationName":  "Irvine Sports Complex",
    "portalUrl":     "https://kairo.app/portal?email=parent@example.com"
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
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") ??
  "https://healthrocket.app.n8n.cloud/webhook/kai-conversation";
const KAIRO_APP_URL = Deno.env.get("KAIRO_APP_URL") ?? "https://kairo.app";

interface WaitlistConfirmationPayload {
  intent: "waitlist_confirmation_email";
  waitlistId: string;
  email: string;
  contactName: string | null;
  position: number;
  programName: string;
  dayOfWeek: string;
  startTime: string;
  locationName: string;
  portalUrl: string;
}

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
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json() as { waitlistId?: string };
    const { waitlistId } = body;

    if (!waitlistId) {
      return new Response(
        JSON.stringify({ error: true, message: "waitlistId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load waitlist entry with session/program/location/family data
    const { data: entry, error: fetchErr } = await supabase
      .from("waitlist")
      .select(`
        id,
        position,
        status,
        contact_email,
        contact_name,
        confirmation_sent_at,
        family_id,
        session_id,
        sessions (
          day_of_week,
          start_time,
          programs ( name ),
          locations ( name )
        ),
        families ( email, primary_contact_name )
      `)
      .eq("id", waitlistId)
      .single();

    if (fetchErr || !entry) {
      return new Response(
        JSON.stringify({ error: true, message: "Waitlist entry not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't send duplicate confirmations
    if (entry.confirmation_sent_at) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Confirmation already sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only send for active pending/notified entries
    if (!["pending", "notified"].includes(entry.status)) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Waitlist entry is not active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve email — prefer family email, fall back to contact_email for anonymous
    const familyData = entry.families as { email: string; primary_contact_name: string } | null;
    const email = familyData?.email ?? entry.contact_email ?? null;

    if (!email) {
      return new Response(
        JSON.stringify({ error: true, message: "No email address available for this waitlist entry" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contactName = entry.contact_name ?? familyData?.primary_contact_name ?? null;
    const sessionData = entry.sessions as {
      day_of_week: number;
      start_time: string;
      programs: { name: string } | null;
      locations: { name: string } | null;
    } | null;

    const dayOfWeek = sessionData?.day_of_week != null
      ? DAY_NAMES[sessionData.day_of_week]
      : "TBD";
    const startTime = sessionData?.start_time ? formatTime(sessionData.start_time) : "TBD";
    const programName = sessionData?.programs?.name ?? "the program";
    const locationName = sessionData?.locations?.name ?? "TBD";

    const portalUrl = `${KAIRO_APP_URL}/portal?email=${encodeURIComponent(email)}`;

    const payload: WaitlistConfirmationPayload = {
      intent: "waitlist_confirmation_email",
      waitlistId: entry.id,
      email,
      contactName,
      position: entry.position ?? 1,
      programName,
      dayOfWeek,
      startTime,
      locationName,
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
      console.error("Failed to trigger n8n waitlist confirmation:", err);
    }

    // Mark confirmation sent (even if n8n call failed — prevents retry spam)
    if (n8nSuccess) {
      await supabase
        .from("waitlist")
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq("id", waitlistId);
    }

    return new Response(
      JSON.stringify({
        success: n8nSuccess,
        waitlistId,
        email,
        position: entry.position ?? 1,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("trigger-waitlist-confirmation error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
