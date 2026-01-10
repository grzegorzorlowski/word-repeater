import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side Supabase client (for non-authenticated operations)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the SupabaseClient type for use in other parts of the application
export type SupabaseClient = typeof supabaseClient;

/**
 * Parses the Cookie header string into an array of cookie objects
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server client for SSR with cookie-based session management
 * Use this in Astro pages, API routes, and middleware for authenticated operations
 */
export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Explicitly set security options for authentication cookies
          const cookieOptions = {
            ...options,
            httpOnly: true, // Prevent XSS attacks - JavaScript cannot access cookie
            sameSite: "lax" as const, // Prevent CSRF attacks while allowing normal navigation
            secure: import.meta.env.PROD, // Only secure in production (HTTPS)
          };
          context.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  return supabase;
};
