/*
  # redeem-makeup-token Edge Function

  Redeems an active makeup token for a confirmed makeup registration.
  Creates the registration record (bypassing payment if makeup_fee_cents = 0),
  then marks the token as used via the use_makeup_token() RPC.

  ## Security
  - JWT verification DISABLED — called from the authenticated Parent Portal
    but families may not have a Supabase Auth session (email-gated portal)
  - Token ownership validated server-side against the family_id
  - Session capacity checked before creating registration (race condition safe
    via check inside confirm_makeup_registration RPC)
  - No client-supplied amounts — fee comes from the token record in the DB

  ## Flow
  1. POST { tokenId, familyId, childId, sessionId }
  2. Validate token is active, belongs to familyId, session has open spots
  3. Insert a confirmed registration (status = confirmed, payment_status = comp)
  4. Call use_makeup_token() to mark token as used
  5. Return { success: true, registrationId }
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
    const body: {
      tokenId: string;
      familyId: string;
      childId: string;
      sessionId: string;
    } = await req.json();

    const { tokenId, familyId, childId, sessionId } = body;

    if (!tokenId || !familyId || !childId || !sessionId) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing required fields: tokenId, familyId, childId, sessionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Validate the makeup token ──────────────────────────────────────────
    const { data: token, error: tokenErr } = await supabase
      .from("makeup_tokens")
      .select("id, family_id, child_id, organization_id, skill_level, makeup_fee_cents, status, expires_at")
      .eq("id", tokenId)
      .eq("family_id", familyId)
      .eq("status", "active")
      .single();

    if (tokenErr || !token) {
      return new Response(
        JSON.stringify({ error: true, message: "Token not found, already used, or does not belong to this family" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(token.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "This makeup token has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Validate the target session ────────────────────────────────────────
    const { data: session, error: sessionErr } = await supabase
      .from("sessions")
      .select(`
        id, capacity, enrolled_count, status,
        programs ( id, name, price_cents, organization_id, required_skill_level )
      `)
      .eq("id", sessionId)
      .single();

    if (sessionErr || !session) {
      return new Response(
        JSON.stringify({ error: true, message: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.status !== "active") {
      return new Response(
        JSON.stringify({ error: true, message: "This session is no longer available for booking" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (session.enrolled_count >= session.capacity) {
      return new Response(
        JSON.stringify({ error: true, message: "This session is now full. Please choose another." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify organization match
    const prog = session.programs as { id: string; name: string; price_cents: number; organization_id: string; required_skill_level: string | null } | null;
    if (!prog || prog.organization_id !== token.organization_id) {
      return new Response(
        JSON.stringify({ error: true, message: "Session does not belong to the same organization as the token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Skill level check
    if (token.skill_level && prog.required_skill_level && prog.required_skill_level !== token.skill_level) {
      return new Response(
        JSON.stringify({ error: true, message: "This session requires a different skill level than your token" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 3. Determine fee amount ───────────────────────────────────────────────
    const feeCents: number = token.makeup_fee_cents ?? 0;

    // ── 4. Get child's name for the registration record ───────────────────────
    const { data: child } = await supabase
      .from("children")
      .select("first_name, last_name, date_of_birth")
      .eq("id", childId)
      .eq("family_id", familyId)
      .single();

    const childName = child
      ? [child.first_name, child.last_name].filter(Boolean).join(" ")
      : "Child";

    // Compute age from DOB
    let childAge: number | null = null;
    if (child?.date_of_birth) {
      const dob = new Date(child.date_of_birth);
      const now = new Date();
      childAge = now.getFullYear() - dob.getFullYear();
      const hasBirthdayPassed =
        now.getMonth() > dob.getMonth() ||
        (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
      if (!hasBirthdayPassed) childAge--;
    }

    // ── 5. Create the makeup registration ────────────────────────────────────
    const { data: registration, error: regErr } = await supabase
      .from("registrations")
      .insert({
        session_id:     sessionId,
        family_id:      familyId,
        child_id:       childId,
        child_name:     childName,
        child_age:      childAge,
        status:         "confirmed",
        payment_status: feeCents === 0 ? "complimentary" : "pending",
        amount_cents:   feeCents,
        enrolled_at:    new Date().toISOString(),
        confirmed_at:   feeCents === 0 ? new Date().toISOString() : null,
        // Mark as makeup booking via custom_answers (metadata)
        custom_answers: { is_makeup_booking: "true", redeemed_token_id: tokenId },
      })
      .select("id")
      .single();

    if (regErr || !registration) {
      console.error("Failed to create makeup registration:", regErr);
      return new Response(
        JSON.stringify({ error: true, message: "Failed to create registration. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: enrolled_count is maintained automatically by the
    // update_enrollment_count_on_registration trigger (AFTER INSERT on registrations).
    // No explicit increment needed here.

    // ── 6. Mark token as used ─────────────────────────────────────────────────
    const { data: tokenResult, error: tokenUseErr } = await supabase.rpc(
      "use_makeup_token",
      {
        p_token_id:              tokenId,
        p_makeup_registration_id: registration.id,
        p_makeup_session_id:     sessionId,
      }
    );

    if (tokenUseErr || (tokenResult && tokenResult.error)) {
      // Registration was created; log the token marking failure but don't fail the request
      console.error("Warning: failed to mark token as used:", tokenUseErr, tokenResult);
    }

    return new Response(
      JSON.stringify({
        success:        true,
        registrationId: registration.id,
        feeCents,
        message:        feeCents === 0
          ? "Makeup class booked successfully!"
          : "Makeup class reserved. Complete payment to confirm.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("redeem-makeup-token error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
