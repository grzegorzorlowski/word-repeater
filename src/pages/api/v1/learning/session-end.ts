// src/pages/api/v1/learning/session-end.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { ErrorResponseDTO } from "../../../../types";
import { logLearningSessionEnd } from "../../../../lib/services/auditLogService";

export const prerender = false;

const SessionEndBodySchema = z.object({
  cardsReviewed: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
});

/**
 * POST /api/v1/learning/session-end
 *
 * Records the end of a learning session for internal analytics (US-018, RF-025).
 * Called by the frontend when the user completes all cards in a session.
 *
 * Request Body (JSON):
 * - cardsReviewed: number (non-negative)
 * - durationSeconds: number (non-negative)
 */
export const POST: APIRoute = async (context) => {
  try {
    const supabase = context.locals.supabase;
    const user = context.locals.user;

    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Database connection not available",
        } as ErrorResponseDTO),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
        } as ErrorResponseDTO),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const parsed = SessionEndBodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        } as ErrorResponseDTO),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { cardsReviewed, durationSeconds } = parsed.data;
    await logLearningSessionEnd(supabase, user.id, cardsReviewed, durationSeconds);

    return new Response(null, { status: 204 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("session-end error:", err);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
      } as ErrorResponseDTO),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
