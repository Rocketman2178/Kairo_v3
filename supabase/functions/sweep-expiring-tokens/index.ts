/*
  # sweep-expiring-tokens Edge Function

  Sweeps active makeup tokens that are approaching expiration and sends
  warning emails via n8n. Designed to be called daily via cron or manually.

  ## Warning Windows
  - 30-day warning: tokens expiring within 30 days, warning_30d_sent_at IS NULL
  - 7-day warning:  tokens expiring within 7 days,  warning_7d_sent_at IS NULL

  ## Security
  - JWT verification DISABLED — called by scheduled cron or internal admin.
  - Uses service role key to read token data.
  - Never exposes other families' data.

  ## N8N Payload (per token)
  {
    "intent":       "token_expiration_warning",
    "tokenId":      "<uuid>",
    "email":        "parent@example.com",
    "contactName":  "Sarah",
    "childName":    "Emma",
    "skillLevel":   "Level 2",
    "expiresAt":    "2026-05-14T00:00:00Z",
    "daysUntilExpiry": 7,
    "warningType":  "7d",
    "portalUrl":    "https://kairo.app/portal?email=..."
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
  "https://n8n.rockethub.ai/webhook/kai-conversation";
const KAIRO_APP_URL = Deno.env.get("KAIRO_APP_URL") ?? "https://kairo.app";

interface TokenWarningPayload {
  intent: "token_expiration_warning";
  tokenId: string;
  email: string;
  contactName: string | null;
  childName: string;
  skillLevel: string | null;
  expiresAt: string;
  daysUntilExpiry: number;
  warningType: "30d" | "7d";
  portalUrl: string;
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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all active tokens expiring within 30 days (covers both 7d and 30d warnings)
    const { data: tokens, error: fetchErr } = await supabase
      .from("makeup_tokens")
      .select(`
        id,
        skill_level,
        expires_at,
        warning_30d_sent_at,
        warning_7d_sent_at,
        children (
          first_name,
          last_name
        ),
        families (
          email,
          primary_contact_name
        )
      `)
      .eq("status", "active")
      .gt("expires_at", now.toISOString())
      .lte("expires_at", in30Days)
      .order("expires_at", { ascending: true });

    if (fetchErr) {
      console.error("Failed to fetch expiring tokens:", fetchErr);
      return new Response(
        JSON.stringify({ error: true, message: "Failed to fetch tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { tokenId: string; warningType: string; sent: boolean; email: string }[] = [];

    for (const token of tokens ?? []) {
      const family = token.families as { email: string; primary_contact_name: string } | null;
      const child = token.children as { first_name: string; last_name: string | null } | null;

      if (!family?.email) continue; // No email to send to

      const childName = child
        ? `${child.first_name}${child.last_name ? " " + child.last_name : ""}`
        : "your child";

      const expiresAt = new Date(token.expires_at);
      const msUntilExpiry = expiresAt.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(msUntilExpiry / (24 * 60 * 60 * 1000));

      const portalUrl = `${KAIRO_APP_URL}/portal?email=${encodeURIComponent(family.email)}`;

      // Determine which warnings need to be sent for this token
      const warningsToSend: ("30d" | "7d")[] = [];

      // 7-day warning: expires within 7 days and 7d warning not yet sent
      if (token.expires_at <= in7Days && !token.warning_7d_sent_at) {
        warningsToSend.push("7d");
      }
      // 30-day warning: only for tokens still outside the 7-day window (prevents sending
      // a factually wrong "30d" email for tokens already within 7 days of expiry)
      else if (!token.warning_30d_sent_at && token.expires_at > in7Days) {
        warningsToSend.push("30d");
      }

      for (const warningType of warningsToSend) {
        const payload: TokenWarningPayload = {
          intent: "token_expiration_warning",
          tokenId: token.id,
          email: family.email,
          contactName: family.primary_contact_name,
          childName,
          skillLevel: token.skill_level,
          expiresAt: token.expires_at,
          daysUntilExpiry,
          warningType,
          portalUrl,
        };

        let sent = false;
        try {
          const n8nRes = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          sent = n8nRes.ok;
        } catch (err) {
          console.error(`Failed to send ${warningType} warning for token ${token.id}:`, err);
        }

        if (sent) {
          // Stamp the appropriate column to prevent duplicate sends
          const updateField = warningType === "7d"
            ? { warning_7d_sent_at: new Date().toISOString() }
            : { warning_30d_sent_at: new Date().toISOString() };

          await supabase
            .from("makeup_tokens")
            .update(updateField)
            .eq("id", token.id);
        }

        results.push({ tokenId: token.id, warningType, sent, email: family.email });
      }
    }

    const sent30d = results.filter((r) => r.warningType === "30d" && r.sent).length;
    const sent7d = results.filter((r) => r.warningType === "7d" && r.sent).length;
    const failed = results.filter((r) => !r.sent).length;

    console.log(
      `sweep-expiring-tokens: scanned ${tokens?.length ?? 0} tokens, ` +
      `sent ${sent30d} 30d warnings, ${sent7d} 7d warnings, ${failed} failed`
    );

    return new Response(
      JSON.stringify({
        success: true,
        scanned: tokens?.length ?? 0,
        sent30d,
        sent7d,
        failed,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sweep-expiring-tokens error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
