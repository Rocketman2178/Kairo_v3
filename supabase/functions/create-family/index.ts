/*
  # create-family Edge Function

  Creates or looks up a family record and creates a child record during
  the anonymous registration flow.

  ## Security
  - JWT verification is DISABLED — called from the anonymous registration flow
    before any Supabase Auth session exists
  - Registration token is validated against the database to ensure only
    callers with a valid pending registration can create families
  - Uses service role key server-side; anon key is never used for writes
  - Child medical info (sensitive) is stored via service role, never exposed
  - Family email lookup prevents duplicate family records

  ## Flow
  1. Client sends { registrationToken, familyData, childData }
  2. Function validates the registration token is pending and unexpired
  3. Looks up existing family by email — if found, reuses it
  4. Creates family record if new (using service role to bypass RLS)
  5. Creates child record linked to the family
  6. Returns { familyId, childId }
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

interface CreateFamilyRequest {
  registrationToken: string;
  familyData: {
    primaryContactName: string;
    email: string;
    phone: string;
    emailOptIn: boolean;
    smsOptIn: boolean;
  };
  childData: {
    firstName: string;
    dateOfBirth: string;
    medicalInfo?: Record<string, string>;
  };
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
    const body: CreateFamilyRequest = await req.json();
    const { registrationToken, familyData, childData } = body;

    // Validate required fields
    if (!registrationToken) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing registration token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!familyData?.email || !familyData?.primaryContactName || !familyData?.phone) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing required family fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!childData?.firstName) {
      return new Response(
        JSON.stringify({ error: true, message: "Missing required child fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(familyData.email)) {
      return new Response(
        JSON.stringify({ error: true, message: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Validate the registration token is pending and unexpired
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("id, status, expires_at")
      .eq("registration_token", registrationToken)
      .in("status", ["pending_registration", "awaiting_payment"])
      .single();

    if (regError || !registration) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration not found or expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(registration.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: true, message: "Registration has expired. Please start a new registration." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up existing family by email (case-insensitive)
    const normalizedEmail = familyData.email.trim().toLowerCase();
    let familyId: string;

    const { data: existingFamily } = await supabase
      .from("families")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingFamily) {
      familyId = existingFamily.id;
    } else {
      // Create new family record
      const { data: newFamily, error: familyError } = await supabase
        .from("families")
        .insert({
          primary_contact_name: familyData.primaryContactName.trim(),
          email: normalizedEmail,
          phone: familyData.phone.trim(),
          email_opt_in: familyData.emailOptIn ?? true,
          sms_opt_in: familyData.smsOptIn ?? false,
        })
        .select("id")
        .single();

      if (familyError || !newFamily) {
        console.error("Failed to create family:", familyError);
        return new Response(
          JSON.stringify({ error: true, message: "Failed to save family information" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      familyId = newFamily.id;
    }

    // Create child record
    const { data: child, error: childError } = await supabase
      .from("children")
      .insert({
        family_id: familyId,
        first_name: childData.firstName.trim(),
        date_of_birth: childData.dateOfBirth || new Date().toISOString().split("T")[0],
        medical_info: childData.medicalInfo ?? {},
      })
      .select("id")
      .single();

    if (childError || !child) {
      console.error("Failed to create child:", childError);
      return new Response(
        JSON.stringify({ error: true, message: "Failed to save child information" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ familyId, childId: child.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-family error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
