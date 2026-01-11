import type { APIRoute } from "astro";

import { forgotPasswordSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO } from "@/types";
import { requireFeatureEnabled } from "@/features";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if resetPassword feature is enabled
  const featureCheck = requireFeatureEnabled("resetPassword", "Password Reset");
  if (featureCheck) return featureCheck;

  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email } = validation.data;

    // Create Supabase server client
    const { createSupabaseServerClient } = await import("@/db/supabase.client");
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Request password reset from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    // Security best practice: Always return success message
    // This prevents email enumeration attacks
    // Even if the email doesn't exist, we return a success message
    if (error) {
      // Log the error server-side for debugging
      // eslint-disable-next-line no-console
      console.error("Password reset request error:", error);
    }

    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({
        message: "If an account exists with this email, you will receive reset instructions",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Forgot password error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
