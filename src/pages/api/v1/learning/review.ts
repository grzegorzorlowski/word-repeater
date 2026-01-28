// src/pages/api/v1/learning/review.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { RecordReviewResponseDTO, ErrorResponseDTO } from "../../../../types";
import { recordReviewRating } from "../../../../lib/services/learningService";
import { NotFoundError, ValidationError, BusinessError } from "../../../../lib/errors";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating the request body.
 * Validates flashcardId (UUID) and rating (enum: "again" | "hard" | "good" | "easy").
 */
const RecordReviewRatingSchema = z.object({
  flashcardId: z.string().uuid("flashcardId must be a valid UUID"),
  rating: z.enum(["again", "hard", "good", "easy"], {
    errorMap: () => ({ message: 'rating must be one of: "again", "hard", "good", "easy"' }),
  }),
});

/**
 * POST /api/v1/learning/review
 *
 * Records a user's review rating for a flashcard, updates its SRS schedule,
 * logs the review, and returns the updated schedule for the reviewed card.
 *
 * Request Body (JSON):
 * - flashcardId (string, UUID): The ID of the flashcard being reviewed
 * - rating (string, enum): The review rating - one of "again", "hard", "good", "easy"
 *
 * @param context - Astro API context containing locals (supabase client, user session) and request
 * @returns JSON response with reviewed card schedule change (previous and new schedule)
 */
export const POST: APIRoute = async (context) => {
  try {
    // Get the Supabase client and user from context.locals
    const supabase = context.locals.supabase;
    const user = context.locals.user;

    // Validate Supabase client availability
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

    // Validate user authentication
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

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: { body: "Request body must be valid JSON" },
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate the request body using Zod
    const validationResult = RecordReviewRatingSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(err.message);
      });

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        } as ErrorResponseDTO),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { flashcardId, rating } = validationResult.data;

    // Get authenticated user ID
    const userId = user.id;

    // Call the learning service to record the review rating
    const result = await recordReviewRating({
      userId,
      flashcardId,
      rating,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error("Error recording review rating:", result.error);

      // Map service errors to appropriate HTTP status codes
      if (result.error instanceof NotFoundError) {
        return new Response(
          JSON.stringify({
            error: "Not Found",
          } as ErrorResponseDTO),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (result.error instanceof ValidationError) {
        return new Response(
          JSON.stringify({
            error: result.error.message,
            details: result.error.details,
          } as ErrorResponseDTO),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (result.error instanceof BusinessError) {
        return new Response(
          JSON.stringify({
            error: "Unprocessable Entity",
          } as ErrorResponseDTO),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic error response
      const errorMessage =
        result.error instanceof Error ? result.error.message : String(result.error || "Failed to record review rating");

      return new Response(
        JSON.stringify({
          error: errorMessage,
        } as ErrorResponseDTO),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    if (!result.data) {
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

    const response: RecordReviewResponseDTO = result.data;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors to console
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/v1/learning/review:", error);

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
