import type { APIRoute } from "astro";
import { PUBLIC_ENV_NAME, SUPABASE_URL, SUPABASE_KEY, OPENROUTER_API_KEY } from "astro:env/server";

/**
 * Health check endpoint to verify environment variables are configured
 * This helps debug deployment issues
 */
export const GET: APIRoute = async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: PUBLIC_ENV_NAME || "not set",
    supabaseUrl: SUPABASE_URL ? "✓ configured" : "✗ missing",
    supabaseKey: SUPABASE_KEY ? "✓ configured" : "✗ missing",
    openRouterKey: OPENROUTER_API_KEY ? "✓ configured" : "✗ missing",
    runtime: "cloudflare-pages",
    nodeVersion: typeof process !== "undefined" ? process.version : "n/a",
  };

  return new Response(JSON.stringify(checks, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
