import type { APIRoute } from "astro";

import { registerBackendSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO, RegisterUserResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema (backend doesn't need confirmPassword)
    const validation = registerBackendSchema.safeParse(body);

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

    const { email, password, acceptTerms } = validation.data;

    // Verify terms acceptance (extra safety check)
    if (!acceptTerms) {
      return new Response(
        JSON.stringify({
          error: "You must accept the terms and conditions",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create Supabase server client
    const { createSupabaseServerClient } = await import("@/db/supabase.client");
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up with Supabase Auth
    // Note: signUp automatically logs in the user and sets session cookies
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          accept_terms: acceptTerms,
        },
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            error: "An account with this email already exists",
          } as ErrorResponseDTO),
          {
            status: 409,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: error.message || "Registration failed",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Registration failed",
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
    // Note: The user is now logged in and session cookies are set
    const response: RegisterUserResponseDTO = {
      message: "Registration successful",
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Registration error:", error);
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
