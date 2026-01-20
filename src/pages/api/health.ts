import type { APIRoute } from "astro";

/**
 * Health check endpoint to verify environment variables are configured
 * This helps debug deployment issues
 */
export const GET: APIRoute = async () => {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.PUBLIC_ENV_NAME || "not set",
    supabaseUrl: import.meta.env.SUPABASE_URL ? "✓ configured" : "✗ missing",
    supabaseKey: import.meta.env.SUPABASE_KEY ? "✓ configured" : "✗ missing",
    openRouterKey: import.meta.env.OPENROUTER_API_KEY ? "✓ configured" : "✗ missing",
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
