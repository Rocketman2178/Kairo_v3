/*
  # decline-waitlist-spot Edge Function

  Handles a family declining an available waitlist spot. Called when the parent
  clicks the "Decline this spot" link in the slot-available notification email.

  ## Security
  - JWT verification DISABLED — called anonymously via a link in an email.
  - Validates the waitlist entry ID and that it is currently in 'notified' status.
  - Does not expose other families' data.
  - Idempotent: calling with an already-declined entry returns success.

  ## Calling Conventions
  GET  /decline-waitlist-spot?id=<waitlistId>
  POST /decline-waitlist-spot  { "waitlistId": "<uuid>" }

  On success, returns an HTML confirmation page so that clicking the email link
  opens a simple, styled "Spot declined" message in the browser.

  ## Behavior
  1. Load the waitlist entry.
  2. Verify it exists and is 'notified' (or already 'declined' — idempotent).
  3. Set status = 'declined', declined_at = NOW().
  4. Return HTML confirmation page.
*/

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Webhook-Key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const KAIRO_APP_URL = Deno.env.get("KAIRO_APP_URL") ?? "https://kairo.app";

function htmlResponse(title: string, heading: string, body: string, isError = false): Response {
  const color = isError ? "#dc2626" : "#16a34a";
  const bgColor = isError ? "#fef2f2" : "#f0fdf4";
  const borderColor = isError ? "#fca5a5" : "#86efac";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f8fafc; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
    .card { background: white; border-radius: 16px; border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,.08); max-width: 400px; width: 100%; padding: 2rem; text-align: center; }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: ${bgColor};
            border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 1.5rem; font-size: 2rem; }
    h1 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0 0 .5rem; }
    p { font-size: .9rem; color: #64748b; margin: 0 0 1.5rem; line-height: 1.5; }
    a { display: inline-block; padding: .625rem 1.25rem; background: #4f46e5;
        color: white; text-decoration: none; border-radius: 10px; font-size: .875rem; font-weight: 600; }
    a:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? "⚠️" : "✓"}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <a href="${KAIRO_APP_URL}/portal">View My Account</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Support both GET (email link click) and POST (programmatic call)
  let waitlistId: string | null = null;

  if (req.method === "GET") {
    const url = new URL(req.url);
    waitlistId = url.searchParams.get("id");
  } else if (req.method === "POST") {
    try {
      const body = await req.json() as { waitlistId?: string };
      waitlistId = body.waitlistId ?? null;
    } catch {
      return new Response(
        JSON.stringify({ error: true, message: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } else {
    return new Response(
      JSON.stringify({ error: true, message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!waitlistId) {
    if (req.method === "GET") {
      return htmlResponse(
        "Invalid Link",
        "Invalid decline link",
        "This link appears to be incomplete or expired. Please check your email and try again.",
        true
      );
    }
    return new Response(
      JSON.stringify({ error: true, message: "waitlistId is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: entry, error: fetchErr } = await supabase
    .from("waitlist")
    .select(`
      id,
      status,
      session_id,
      family_id,
      contact_email,
      sessions (
        programs ( name ),
        locations ( name ),
        day_of_week,
        start_time
      ),
      families ( email )
    `)
    .eq("id", waitlistId)
    .single();

  if (fetchErr || !entry) {
    if (req.method === "GET") {
      return htmlResponse(
        "Not Found",
        "Waitlist entry not found",
        "We couldn't find this waitlist entry. It may have already been processed.",
        true
      );
    }
    return new Response(
      JSON.stringify({ error: true, message: "Waitlist entry not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Already declined — idempotent success
  if (entry.status === "declined") {
    const msg = "You've already declined this spot. If this was a mistake, please contact your program organizer.";
    if (req.method === "GET") {
      return htmlResponse("Already Declined", "Spot already declined", msg);
    }
    return new Response(
      JSON.stringify({ success: true, alreadyDeclined: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Only allow declining notified entries
  if (entry.status !== "notified") {
    const msg = `This waitlist spot is no longer available to decline (current status: ${entry.status}).`;
    if (req.method === "GET") {
      return htmlResponse("Cannot Decline", "Spot no longer available", msg, true);
    }
    return new Response(
      JSON.stringify({ error: true, message: msg }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Set status to declined
  const { error: updateErr } = await supabase
    .from("waitlist")
    .update({ status: "declined", declined_at: new Date().toISOString() })
    .eq("id", waitlistId);

  if (updateErr) {
    console.error("Failed to decline waitlist spot:", updateErr);
    if (req.method === "GET") {
      return htmlResponse("Error", "Something went wrong", "We couldn't process your request. Please try again or contact support.", true);
    }
    return new Response(
      JSON.stringify({ error: true, message: "Failed to update waitlist status" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sessionData = entry.sessions as {
    programs: { name: string } | null;
    locations: { name: string } | null;
    day_of_week: number | null;
    start_time: string | null;
  } | null;
  const programName = sessionData?.programs?.name ?? "the class";

  if (req.method === "GET") {
    return htmlResponse(
      "Spot Declined",
      "Spot successfully declined",
      `You've declined the available spot in ${programName}. The next family on the waitlist will be notified. ` +
      `You can still view your account and other registrations below.`
    );
  }

  return new Response(
    JSON.stringify({ success: true, waitlistId, programName }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
