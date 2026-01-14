import type { APIRoute } from "astro";

import { passwordSchema } from "@/lib/validation/authSchemas";
import { z } from "zod";
import type { ErrorResponseDTO } from "@/types";
import { requireFeatureEnabled } from "@/features";

export const prerender = false;

// Backend schema for reset password (no confirmPassword needed - validated on frontend)
const resetPasswordBackendSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check if resetPassword feature is enabled
  const featureCheck = requireFeatureEnabled("resetPassword", "Password Reset");
  if (featureCheck) return featureCheck;

  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = resetPasswordBackendSchema.safeParse(body);

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

    const { password } = validation.data;

    // Create Supabase server client
    const { createSupabaseServerClient } = await import("@/db/supabase.client");
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Verify the token and update password
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("token")) {
        return new Response(
          JSON.stringify({
            error: "Invalid or expired reset token. Please request a new password reset.",
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message || "Failed to reset password",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        message: "Password has been successfully reset",
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
    console.error("Reset password error:", error);
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
