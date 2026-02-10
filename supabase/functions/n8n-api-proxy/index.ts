import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const N8N_BASE_URL = Deno.env.get("N8N_BASE_URL") || "https://n8n.rockethub.ai";
const N8N_API_KEY = Deno.env.get("N8N_API_KEY") || "";

interface ProxyRequest {
  endpoint: string;
  method?: string;
  body?: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!N8N_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "N8N_API_KEY is not configured. Set it as a Supabase secret.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { endpoint, method = "GET", body }: ProxyRequest = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'endpoint' in request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedPrefixes = [
      "/api/v1/workflows",
      "/api/v1/executions",
      "/api/v1/credentials",
    ];

    const isAllowed = allowedPrefixes.some((prefix) => endpoint.startsWith(prefix));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Endpoint not allowed. Must start with: ${allowedPrefixes.join(", ")}`,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `${N8N_BASE_URL}${endpoint}`;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-Key": N8N_API_KEY,
      },
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const n8nResponse = await fetch(url, fetchOptions);
    const responseData = await n8nResponse.text();

    let parsed;
    try {
      parsed = JSON.parse(responseData);
    } catch {
      parsed = responseData;
    }

    return new Response(
      JSON.stringify({ success: n8nResponse.ok, data: parsed, status: n8nResponse.status }),
      {
        status: n8nResponse.ok ? 200 : n8nResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
