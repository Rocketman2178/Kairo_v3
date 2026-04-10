/*
  # trigger-waitlist-spot-available Edge Function

  Sends a "Spot Available" notification email via n8n when a waitlisted family
  is promoted to 'notified' status. Includes a decline button so the family can
  free the spot for the next person without having to log in.

  ## Security
  - JWT verification DISABLED — called by admin actions or internal cron jobs.
  - Reads all class details from DB — never trusts client-supplied data.
  - Does not expose other families' waitlist positions.

  ## Calling Conventions
  POST with JSON body:
    { "waitlistId": "<uuid>" }

  The function:
  1. Loads the waitlist entry + session + program + location.
  2. Verifies status is 'notified' (the admin has already promoted this entry).
  3. Resolves the family email from waitlist.contact_email or families.email.
  4. Posts to n8n with intent "waitlist_spot_available_email".
  5. Sets waitlist.notified_at = NOW() if not already set.

  ## N8N Payload
  {
    "intent":           "waitlist_spot_available_email",
    "waitlistId":       "<uuid>",
    "email":            "parent@example.com",
    "contactName":      "Sarah",
    "programName":      "Soccer Shots Classic",
    "dayOfWeek":        "Tuesday",
    "startTime":        "10:00 AM",
    "locationName":     "Irvine Sports Complex",
    "registrationUrl":  "https://kairo.app/?session=<uuid>",
    "declineUrl":       "https://kairo.app/api/decline-waitlist-spot?id=<uuid>",
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
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") ??
  "https://healthrocket.app.n8n.cloud/webhook/kai-conversation";
const KAIRO_APP_URL = Deno.env.get("KAIRO_APP_URL") ?? "https://kairo.app";
// Base URL of Supabase edge functions for the decline link
const FUNCTIONS_URL = Deno.env.get("SUPABASE_URL")
  ? `${Deno.env.get("SUPABASE_URL")}/functions/v1`
  : "https://tatunnfxwfsyoiqoaenb.supabase.co/functions/v1";

interface SpotAvailablePayload {
  intent: "waitlist_spot_available_email";
  waitlistId: string;
  email: string;
  contactName: string | null;
  programName: string;
  dayOfWeek: string;
  startTime: string;
  locationName: string;
  registrationUrl: string;
  declineUrl: string;
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

    // Load waitlist entry with full session context
    const { data: entry, error: fetchErr } = await supabase
      .from("waitlist")
      .select(`
        id,
        status,
        notified_at,
        contact_email,
        contact_name,
        family_id,
        session_id,
        sessions (
          id,
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

    // Only notify families whose spot is actually available (status = notified)
    if (entry.status !== "notified") {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: `Waitlist entry status is '${entry.status}', expected 'notified'`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve email
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
      id: string;
      day_of_week: number | null;
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
    const sessionId = sessionData?.id ?? entry.session_id;

    // URLs included in the email
    const registrationUrl = `${KAIRO_APP_URL}/?session=${sessionId}`;
    const declineUrl = `${FUNCTIONS_URL}/decline-waitlist-spot?id=${entry.id}`;
    const portalUrl = `${KAIRO_APP_URL}/portal?email=${encodeURIComponent(email)}`;

    const payload: SpotAvailablePayload = {
      intent: "waitlist_spot_available_email",
      waitlistId: entry.id,
      email,
      contactName,
      programName,
      dayOfWeek,
      startTime,
      locationName,
      registrationUrl,
      declineUrl,
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
      console.error("Failed to trigger n8n spot-available notification:", err);
    }

    // Stamp notified_at to prevent duplicate sends (only on success)
    if (n8nSuccess && !entry.notified_at) {
      await supabase
        .from("waitlist")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", waitlistId);
    }

    return new Response(
      JSON.stringify({
        success: n8nSuccess,
        waitlistId,
        email,
        programName,
        registrationUrl,
        declineUrl,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("trigger-waitlist-spot-available error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
