import type { APIRoute } from "astro";

import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Logout failed. Please try again.",
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
        message: "Logout successful",
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
    console.error("Logout error:", error);
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
