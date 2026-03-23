/*
  # trigger-reenrollment-reminders Edge Function

  Finds confirmed registrations where the session ended 14–35 days ago
  and no reenrollment reminder has been sent yet. Triggers an n8n webhook
  for each eligible family.

  ## Security
  - Requires X-Webhook-Key header matching REENROLLMENT_WEBHOOK_KEY secret
  - Only accessible from server-side callers (n8n cron, Supabase pg_cron, etc.)
  - No JWT required (webhook key auth is sufficient for server-to-server calls)

  ## Call modes
  POST { mode: "sweep" }    — finds all eligible registrations (cron job)
  POST { mode: "single", registrationId: string } — target one registration

  ## N8N Intent
  Sends `reenrollment_reminder` intent with:
    - familyId, childId, childName
    - programName, sessionId
    - previousAmountCents, registrationId
    - sessionEndDate
    - organizationId (for branding)
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
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") ?? "";
const REENROLLMENT_WEBHOOK_KEY = Deno.env.get("REENROLLMENT_WEBHOOK_KEY") ?? "";

interface TriggerRequest {
  mode: "sweep" | "single";
  registrationId?: string;
}

interface EligibleRegistration {
  id: string;
  family_id: string;
  child_id: string | null;
  child_name: string | null;
  session_id: string;
  amount_cents: number;
  organization_id: string | null;
  program_name: string | null;
  session_end_date: string | null;
  family_email: string | null;
  parent_name: string | null;
}

async function triggerN8nReeenrollment(reg: EligibleRegistration): Promise<boolean> {
  if (!N8N_WEBHOOK_URL) {
    console.warn("N8N_WEBHOOK_URL not set — skipping n8n trigger");
    return false;
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "reenrollment_reminder",
        registrationId: reg.id,
        familyId: reg.family_id,
        childId: reg.child_id,
        childName: reg.child_name,
        programName: reg.program_name,
        sessionId: reg.session_id,
        previousAmountCents: reg.amount_cents,
        sessionEndDate: reg.session_end_date,
        organizationId: reg.organization_id,
        familyEmail: reg.family_email,
        parentName: reg.parent_name,
        timestamp: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("N8N trigger failed:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Webhook key authentication
  const incomingKey = req.headers.get("X-Webhook-Key");
  if (REENROLLMENT_WEBHOOK_KEY && incomingKey !== REENROLLMENT_WEBHOOK_KEY) {
    return new Response(
      JSON.stringify({ error: true, message: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: TriggerRequest = await req.json();
    const { mode, registrationId } = body;

    if (!mode || (mode !== "sweep" && mode !== "single")) {
      return new Response(
        JSON.stringify({ error: true, message: "mode must be 'sweep' or 'single'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const now = new Date();
    // Window: sessions that ended 14–35 days ago
    const minEndDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const maxEndDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from("registrations")
      .select(`
        id,
        family_id,
        child_id,
        child_name,
        session_id,
        amount_cents,
        reenrollment_reminder_sent_at,
        sessions!inner (
          end_date,
          programs (
            name,
            organization_id
          )
        ),
        families (
          email,
          primary_contact_name
        )
      `)
      .eq("status", "confirmed")
      .is("reenrollment_reminder_sent_at", null)
      .gte("sessions.end_date", minEndDate)
      .lte("sessions.end_date", maxEndDate);

    if (mode === "single") {
      if (!registrationId) {
        return new Response(
          JSON.stringify({ error: true, message: "registrationId required for single mode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      query = query.eq("id", registrationId);
    } else {
      query = query.limit(50); // process up to 50 at a time per sweep
    }

    const { data: registrations, error: queryError } = await query;

    if (queryError) {
      console.error("Query error:", queryError);
      return new Response(
        JSON.stringify({ error: true, message: "Database query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!registrations || registrations.length === 0) {
      return new Response(
        JSON.stringify({ triggered: 0, message: "No eligible registrations found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let triggered = 0;

    for (const reg of registrations) {
      // Flatten the joined data
      const session = Array.isArray(reg.sessions) ? reg.sessions[0] : reg.sessions;
      const program = session ? (Array.isArray(session.programs) ? session.programs[0] : session.programs) : null;
      const family = Array.isArray(reg.families) ? reg.families[0] : reg.families;

      const flat: EligibleRegistration = {
        id: reg.id,
        family_id: reg.family_id,
        child_id: reg.child_id,
        child_name: reg.child_name,
        session_id: reg.session_id,
        amount_cents: reg.amount_cents,
        organization_id: program?.organization_id ?? null,
        program_name: program?.name ?? null,
        session_end_date: session?.end_date ?? null,
        family_email: family?.email ?? null,
        parent_name: family?.primary_contact_name ?? null,
      };

      const sent = await triggerN8nReeenrollment(flat);

      if (sent) {
        // Mark reminder as sent to prevent duplicates
        await supabase
          .from("registrations")
          .update({ reenrollment_reminder_sent_at: new Date().toISOString() })
          .eq("id", reg.id);
        triggered++;
      }
    }

    return new Response(
      JSON.stringify({
        triggered,
        total: registrations.length,
        message: `Reenrollment reminders triggered for ${triggered} of ${registrations.length} registrations`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("trigger-reenrollment-reminders error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
