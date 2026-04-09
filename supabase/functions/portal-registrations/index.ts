/*
  # portal-registrations Edge Function

  Returns registrations for a family via the unauthenticated Parent Portal
  (email-based login). Verifies the caller knows both the family_id UUID and
  the registered email before returning any data.

  ## Security
  - JWT verification is DISABLED — called from the anonymous Parent Portal flow
  - Identity verification: familyId + email must both match a real family record
  - Uses service role key server-side to bypass RLS (which requires Supabase Auth)
  - Child data is scoped strictly to the verified family
  - PII (names, emails, medical info) is NOT logged

  ## Flow
  1. Client sends { familyId, email }
  2. Function verifies family exists with id AND email matching
  3. Returns full registration list with session/program/location/child details
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

interface PortalRegistrationsRequest {
  familyId: string;
  email: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: PortalRegistrationsRequest = await req.json();
    const { familyId, email } = body;

    if (!familyId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format to prevent injection
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(familyId)) {
      return new Response(
        JSON.stringify({ error: "Invalid familyId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the family exists with the provided email (identity check)
    const { data: family, error: familyErr } = await supabase
      .from("families")
      .select("id")
      .eq("id", familyId)
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (familyErr || !family) {
      return new Response(
        JSON.stringify({ error: "Family not found or email mismatch" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch registrations with full nested details
    const { data, error: regError } = await supabase
      .from("registrations")
      .select(`
        id,
        status,
        payment_status,
        amount_cents,
        enrolled_at,
        confirmed_at,
        created_at,
        child_name,
        child_age,
        registration_token,
        children (
          id,
          first_name,
          last_name,
          date_of_birth,
          skill_level
        ),
        sessions!inner (
          id,
          day_of_week,
          start_time,
          start_date,
          end_date,
          capacity,
          enrolled_count,
          programs!inner (
            name,
            description
          ),
          locations (
            name,
            address
          )
        )
      `)
      .eq("family_id", familyId)
      .neq("status", "pending_registration")
      .order("created_at", { ascending: false });

    if (regError) {
      console.error("Failed to fetch registrations:", regError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch registrations" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ data: data ?? [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("portal-registrations error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
