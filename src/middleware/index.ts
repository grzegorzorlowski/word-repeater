import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerClient } from "../db/supabase.client.ts";
import { PUBLIC_PATHS } from "../lib/constants/routes.ts";

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase server client with SSR support
  const supabase = createSupabaseServerClient({
    cookies,
    headers: request.headers,
  });

  // Always attach supabase client to locals
  locals.supabase = supabase;

  // Check if current path is public
  const isPublicPath = PUBLIC_PATHS.includes(url.pathname as (typeof PUBLIC_PATHS)[number]);

  // Get authenticated user (validates with Supabase Auth server)
  // This is more secure than getSession() as it verifies the token with the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get session after user validation
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Attach session and user to locals
  locals.session = session;
  locals.user = user;

  // If user is authenticated and trying to access login/register/home, redirect to dashboard
  if (user && (url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/")) {
    return redirect("/dashboard");
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicPath) {
    // For API routes, return 401 JSON response instead of redirecting
    if (url.pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized. Please login to access this resource.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // For page routes, redirect to login
    return redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return next();
});
