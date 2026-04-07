// portal-children edge function
// Provides authenticated CRUD for the children table via the unauthenticated
// Family Portal (email-based login). Verifies the caller knows both the
// family_id UUID and the registered email before performing any operation.
//
// verify_jwt=false: This function handles its own identity verification
// (familyId + email match) using the service role key.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, familyId, email } = body as {
      action: 'list' | 'add' | 'update';
      familyId: string;
      email: string;
      childId?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      skillLevel?: string;
    };

    if (!action || !familyId || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate UUID format to prevent injection
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(familyId)) {
      return new Response(JSON.stringify({ error: "Invalid familyId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the family exists with the provided email (identity check)
    const { data: family, error: familyErr } = await supabaseAdmin
      .from('families')
      .select('id')
      .eq('id', familyId)
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (familyErr || !family) {
      return new Response(JSON.stringify({ error: "Family not found or email mismatch" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Perform the requested action
    if (action === 'list') {
      const { data, error } = await supabaseAdmin
        .from('children')
        .select('id, first_name, last_name, date_of_birth, skill_level')
        .eq('family_id', familyId)
        .order('first_name');

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'add') {
      const { firstName, lastName, dateOfBirth, skillLevel } = body as {
        firstName: string;
        lastName?: string;
        dateOfBirth: string;
        skillLevel?: string;
      };

      if (!firstName?.trim() || !dateOfBirth) {
        return new Response(JSON.stringify({ error: "firstName and dateOfBirth are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from('children')
        .insert({
          family_id: familyId,
          first_name: firstName.trim(),
          last_name: lastName?.trim() || null,
          date_of_birth: dateOfBirth,
          skill_level: skillLevel?.trim() || null,
        })
        .select('id, first_name, last_name, date_of_birth, skill_level')
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'update') {
      const { childId, firstName, lastName, skillLevel } = body as {
        childId: string;
        firstName: string;
        lastName?: string;
        skillLevel?: string;
      };

      if (!childId || !uuidPattern.test(childId)) {
        return new Response(JSON.stringify({ error: "Invalid childId" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!firstName?.trim()) {
        return new Response(JSON.stringify({ error: "firstName is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Ensure the child belongs to this family (prevents cross-family updates)
      const { data, error } = await supabaseAdmin
        .from('children')
        .update({
          first_name: firstName.trim(),
          last_name: lastName?.trim() || null,
          skill_level: skillLevel?.trim() || null,
        })
        .eq('id', childId)
        .eq('family_id', familyId)
        .select('id, first_name, last_name, date_of_birth, skill_level')
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error('portal-children error:', err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
