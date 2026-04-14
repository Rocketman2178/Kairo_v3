/*
  # approve-transfer Edge Function

  Approves a pending class transfer request. When approved:
  1. Calls approve_class_transfer() RPC — atomically moves the registration,
     updates both sessions' enrolled counts, and marks the transfer approved.
  2. Checks the freed (from) session for waitlisted families.
  3. If a pending waitlist entry exists, promotes it to 'notified' and
     fires trigger-waitlist-spot-available so the family gets an email.

  ## Security
  - JWT verification DISABLED — called by admin UI or internal automation.
  - Uses service role key — never trusts client-supplied data beyond transferId.

  ## Request
  POST { "transferId": "<uuid>" }

  ## Response
  {
    "success": true,
    "transferId": "<uuid>",
    "fromSessionId": "<uuid>",
    "toSessionId": "<uuid>",
    "waitlistNotified": "<waitlistId>" | null
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
// Internal functions base URL
const FUNCTIONS_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1`
  : "https://tatunnfxwfsyoiqoaenb.supabase.co/functions/v1";

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
    const body = await req.json() as { transferId?: string };
    const { transferId } = body;

    if (!transferId) {
      return new Response(
        JSON.stringify({ error: true, message: "transferId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Approve the transfer atomically via DB function
    const { data: approveResult, error: approveErr } = await supabase
      .rpc("approve_class_transfer", { p_transfer_id: transferId });

    if (approveErr) {
      console.error("approve_class_transfer RPC error:", approveErr);
      return new Response(
        JSON.stringify({ error: true, message: approveErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = approveResult as {
      error?: boolean;
      message?: string;
      transfer_id?: string;
      from_session_id?: string;
      to_session_id?: string;
    };

    if (result.error) {
      return new Response(
        JSON.stringify({ error: true, message: result.message }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fromSessionId = result.from_session_id ?? null;
    const toSessionId = result.to_session_id ?? null;

    // 2. Check if the freed (from) session has pending waitlist entries
    let waitlistNotified: string | null = null;

    if (fromSessionId) {
      const { data: waitlistEntries } = await supabase
        .from("waitlist")
        .select("id")
        .eq("session_id", fromSessionId)
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(1);

      const firstWaitlisted = waitlistEntries?.[0];

      if (firstWaitlisted) {
        // 3. Promote the first pending waitlisted entry to 'notified'
        await supabase
          .from("waitlist")
          .update({
            status: "notified",
            updated_at: new Date().toISOString(),
          })
          .eq("id", firstWaitlisted.id);

        // 4. Trigger the spot-available email via the existing edge function
        try {
          const notifyRes = await fetch(
            `${FUNCTIONS_BASE}/trigger-waitlist-spot-available`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ waitlistId: firstWaitlisted.id }),
            }
          );
          if (notifyRes.ok) {
            waitlistNotified = firstWaitlisted.id;
          } else {
            console.error(
              "trigger-waitlist-spot-available returned non-OK:",
              notifyRes.status
            );
          }
        } catch (err) {
          console.error("Failed to trigger waitlist notification:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transferId,
        fromSessionId,
        toSessionId,
        waitlistNotified,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-transfer error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
