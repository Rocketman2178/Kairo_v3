/*
  # cancel-registration Edge Function

  Cancels a confirmed registration and — by default — auto-issues a makeup
  token for the child so they can book a replacement class.

  ## Flow
  1. Validates the request (registrationId required; familyId used for ownership check).
  2. Calls cancel_registration() RPC which atomically:
       - Sets registrations.status = 'cancelled' + stamps cancelled_at
       - Decrements sessions.enrolled_count (if was confirmed)
       - Issues a makeup_token for the child (level-locked, org-expiry)
  3. If a pending waitlist entry exists for the freed session, promotes it
     to 'notified' and fires trigger-waitlist-spot-available.
  4. Returns { success, tokenId, tokenIssued }.

  ## Security
  - verify_jwt = false — called from parent portal (anon key) with familyId check.
  - Uses service role internally; family ownership verified before proceeding.

  ## Request
  POST {
    "registrationId": "<uuid>",
    "familyId": "<uuid>",      // ownership check
    "issueToken": true          // optional, default true
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
    const body = await req.json() as {
      registrationId?: string;
      familyId?: string;
      issueToken?: boolean;
    };

    const { registrationId, familyId, issueToken = true } = body;

    if (!registrationId || !familyId) {
      return new Response(
        JSON.stringify({ error: true, message: "registrationId and familyId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Ownership check — ensure this registration belongs to the requesting family
    const { data: reg, error: regErr } = await supabase
      .from("registrations")
      .select("id, family_id, session_id, status")
      .eq("id", registrationId)
      .maybeSingle();

    if (regErr || !reg) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reg.family_id !== familyId) {
      return new Response(
        JSON.stringify({ error: true, message: "Not authorized to cancel this registration" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (reg.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: true, message: "Registration is already cancelled" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the atomic cancel_registration RPC
    const { data: cancelResult, error: cancelErr } = await supabase
      .rpc("cancel_registration", {
        p_registration_id: registrationId,
        p_issue_token: issueToken,
        p_notes: null,
      });

    if (cancelErr) {
      console.error("cancel_registration RPC error:", cancelErr);
      return new Response(
        JSON.stringify({ error: true, message: cancelErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = cancelResult as {
      error?: boolean;
      message?: string;
      session_id?: string;
      token_id?: string | null;
      token_issued?: boolean;
    };

    if (result.error) {
      return new Response(
        JSON.stringify({ error: true, message: result.message }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const freedSessionId = result.session_id ?? reg.session_id;

    // Promote first pending waitlist entry for the freed session
    let waitlistNotified: string | null = null;
    if (freedSessionId && reg.status === "confirmed") {
      const { data: waitlistEntries } = await supabase
        .from("waitlist")
        .select("id")
        .eq("session_id", freedSessionId)
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(1);

      const first = waitlistEntries?.[0];
      if (first) {
        await supabase
          .from("waitlist")
          .update({ status: "notified", updated_at: new Date().toISOString() })
          .eq("id", first.id);

        try {
          const notifyRes = await fetch(`${FUNCTIONS_BASE}/trigger-waitlist-spot-available`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ waitlistId: first.id }),
          });
          if (notifyRes.ok) waitlistNotified = first.id;
        } catch (err) {
          console.error("Failed to trigger waitlist notification:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        registrationId,
        sessionId: freedSessionId,
        tokenId: result.token_id ?? null,
        tokenIssued: result.token_issued ?? false,
        waitlistNotified,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cancel-registration error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
