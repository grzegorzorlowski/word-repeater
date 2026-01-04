import type { APIRoute } from "astro";

import { loginSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO, LoginUserResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validation = loginSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Create Supabase server client
    const { createSupabaseServerClient } = await import("@/db/supabase.client");
    const supabase = createSupabaseServerClient({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid email or password",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "Authentication failed",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success response
    const response: LoginUserResponseDTO = {
      message: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
      },
      redirectTo: "/dashboard",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login error:", error);
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
