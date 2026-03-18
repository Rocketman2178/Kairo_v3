/*
  # trigger-cart-recovery Edge Function

  Triggers cart recovery email sequences for abandoned registrations.
  Called by a scheduled job or directly from n8n via a webhook ping.

  ## Security
  - JWT verification DISABLED — this is called by n8n (service-to-service) using a
    shared webhook key header, not by authenticated browser clients.
  - Validates `X-Webhook-Key` header against CART_RECOVERY_WEBHOOK_KEY secret
  - Only reads from abandoned_carts where recovered=false and step is appropriate
  - Amount is read from DB — never from request body
  - Does not expose family PII in response

  ## Calling Conventions
  Two modes:
  1. **Scheduled sweep** — POST with `{ "mode": "sweep" }` — finds all unrecovered carts
     eligible for email (has email, created > 30 min ago, not already attempted)
  2. **Direct trigger** — POST with `{ "mode": "single", "cartId": "<uuid>" }` — triggers
     for a specific abandoned cart record

  ## Timing Strategy (NBC Data: 92.3% register Mon-Fri, evenings 6-8 PM)
  - First recovery: 1 hour after abandonment
  - Second recovery: 24 hours after abandonment
  - Third recovery: 72 hours after abandonment (if still not recovered)
  - No recovery emails sent after 7 days

  ## N8N Trigger
  Calls the n8n `kai-conversation` webhook with special intent `cart_recovery_email`
  so n8n can route to the email sending workflow.
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
const CART_RECOVERY_WEBHOOK_KEY = Deno.env.get("CART_RECOVERY_WEBHOOK_KEY") ?? "";
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL") ??
  "https://healthrocket.app.n8n.cloud/webhook/kai-conversation";
// Base URL for deep links in recovery emails — must be absolute for email clients
const KAIRO_APP_URL = Deno.env.get("KAIRO_APP_URL") ?? "https://kairo.app";

// Recovery timing thresholds (in milliseconds)
const FIRST_RECOVERY_MIN_MS = 30 * 60 * 1000;       // 30 minutes
const FIRST_RECOVERY_MAX_MS = 2 * 60 * 60 * 1000;    // 2 hours
const SECOND_RECOVERY_MIN_MS = 20 * 60 * 60 * 1000;  // 20 hours
const SECOND_RECOVERY_MAX_MS = 28 * 60 * 60 * 1000;  // 28 hours
const THIRD_RECOVERY_MIN_MS = 68 * 60 * 60 * 1000;   // 68 hours
const THIRD_RECOVERY_MAX_MS = 76 * 60 * 60 * 1000;   // 76 hours
const MAX_RECOVERY_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AbandonedCart {
  id: string;
  cart_data: {
    registration_token?: string;
    email?: string;
    child_name?: string;
    program_name?: string;
    amount_cents?: number;
    step_abandoned?: string;
    abandoned_at?: string;
  };
  recovery_attempts: number;
  abandoned_at_state: string;
  created_at: string;
}

interface RecoveryEmailPayload {
  intent: "cart_recovery_email";
  cartId: string;
  registrationToken: string;
  email: string;
  childName: string;
  programName: string;
  amountCents: number;
  stepAbandoned: string;
  recoveryAttempt: number; // 1, 2, or 3
  deepLinkUrl: string;
}

function getRecoveryAttemptNumber(cart: AbandonedCart): 1 | 2 | 3 | null {
  const ageMs = Date.now() - new Date(cart.created_at).getTime();

  // Don't send if cart is too old
  if (ageMs > MAX_RECOVERY_AGE_MS) return null;

  const attempts = cart.recovery_attempts;

  if (attempts === 0 && ageMs >= FIRST_RECOVERY_MIN_MS && ageMs <= FIRST_RECOVERY_MAX_MS) {
    return 1;
  }
  if (attempts === 1 && ageMs >= SECOND_RECOVERY_MIN_MS && ageMs <= SECOND_RECOVERY_MAX_MS) {
    return 2;
  }
  if (attempts === 2 && ageMs >= THIRD_RECOVERY_MIN_MS && ageMs <= THIRD_RECOVERY_MAX_MS) {
    return 3;
  }

  return null;
}

async function triggerN8nRecoveryEmail(
  payload: RecoveryEmailPayload
): Promise<boolean> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (err) {
    console.error("Failed to trigger n8n recovery email:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Validate webhook key for service-to-service calls
  if (CART_RECOVERY_WEBHOOK_KEY) {
    const requestKey = req.headers.get("X-Webhook-Key");
    if (requestKey !== CART_RECOVERY_WEBHOOK_KEY) {
      return new Response(
        JSON.stringify({ error: true, message: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  try {
    const body = await req.json() as { mode: "sweep" | "single"; cartId?: string };
    const { mode, cartId } = body;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (mode === "single" && cartId) {
      // Single cart trigger
      const { data: cart, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("id", cartId)
        .eq("recovered", false)
        .single<AbandonedCart>();

      if (error || !cart) {
        return new Response(
          JSON.stringify({ error: true, message: "Cart not found or already recovered" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const email = cart.cart_data?.email;
      if (!email) {
        return new Response(
          JSON.stringify({ error: true, message: "No email address on file for this cart" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const attempt = getRecoveryAttemptNumber(cart);
      if (!attempt) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "Cart not in valid recovery window" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = cart.cart_data.registration_token ?? "";
      const payload: RecoveryEmailPayload = {
        intent: "cart_recovery_email",
        cartId: cart.id,
        registrationToken: token,
        email,
        childName: cart.cart_data.child_name ?? "your child",
        programName: cart.cart_data.program_name ?? "the program",
        amountCents: cart.cart_data.amount_cents ?? 0,
        stepAbandoned: cart.abandoned_at_state,
        recoveryAttempt: attempt,
        deepLinkUrl: `${KAIRO_APP_URL}/register?token=${token}`,
      };

      const triggered = await triggerN8nRecoveryEmail(payload);

      if (triggered) {
        // Increment recovery_attempts counter
        await supabase
          .from("abandoned_carts")
          .update({ recovery_attempts: cart.recovery_attempts + 1 })
          .eq("id", cart.id);
      }

      return new Response(
        JSON.stringify({ success: triggered, cartId: cart.id, attempt }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "sweep") {
      // Sweep all eligible abandoned carts
      const { data: carts, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .eq("recovered", false)
        .lt("recovery_attempts", 3)
        .not("cart_data->email", "is", null)
        .lte("created_at", new Date(Date.now() - FIRST_RECOVERY_MIN_MS).toISOString())
        .gte("created_at", new Date(Date.now() - MAX_RECOVERY_AGE_MS).toISOString())
        .returns<AbandonedCart[]>();

      if (error) {
        return new Response(
          JSON.stringify({ error: true, message: "Failed to query abandoned carts" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results: Array<{ cartId: string; triggered: boolean; attempt: number | null }> = [];

      for (const cart of carts ?? []) {
        const email = cart.cart_data?.email;
        if (!email) continue;

        const attempt = getRecoveryAttemptNumber(cart);
        if (!attempt) continue;

        const token = cart.cart_data.registration_token ?? "";
        const payload: RecoveryEmailPayload = {
          intent: "cart_recovery_email",
          cartId: cart.id,
          registrationToken: token,
          email,
          childName: cart.cart_data.child_name ?? "your child",
          programName: cart.cart_data.program_name ?? "the program",
          amountCents: cart.cart_data.amount_cents ?? 0,
          stepAbandoned: cart.abandoned_at_state,
          recoveryAttempt: attempt,
          deepLinkUrl: `${KAIRO_APP_URL}/register?token=${token}`,
        };

        const triggered = await triggerN8nRecoveryEmail(payload);

        if (triggered) {
          await supabase
            .from("abandoned_carts")
            .update({ recovery_attempts: cart.recovery_attempts + 1 })
            .eq("id", cart.id);
        }

        results.push({ cartId: cart.id, triggered, attempt });
      }

      return new Response(
        JSON.stringify({
          success: true,
          processed: results.length,
          triggered: results.filter((r) => r.triggered).length,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: true, message: "Invalid mode. Use 'sweep' or 'single'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("trigger-cart-recovery error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
