// src/pages/api/v1/learning/today.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { FetchTodayCardsResponseDTO } from "../../../../types";
import { fetchTodaysCards } from "../../../../lib/services/learningService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating query parameters.
 * Validates the limit parameter for fetching new cards.
 * Valid range: 1-50 (minimum 1 card, maximum 50 cards)
 */
const FetchTodayQuerySchema = z.object({
  limit: z.preprocess((val) => {
    if (val === undefined || val === null || val === "") {
      return 50; // Default value
    }
    const parsed = parseInt(String(val), 10);
    return isNaN(parsed) ? 50 : parsed;
  }, z.number().int().min(1).max(50).default(50)),
});

/**
 * GET /api/v1/learning/today
 *
 * Retrieves all due flashcards (next_due ≤ now) plus up to `limit` new flashcards
 * (repetition_count = 0) for the authenticated user.
 *
 * Query Parameters:
 * - limit (optional): number of new cards to fetch. Default 50, maximum 50.
 *
 * @param context - Astro API context containing locals (supabase client) and request
 * @returns JSON response with cards and count
 */
export const GET: APIRoute = async (context) => {
  try {
    // Get the Supabase client and user from context.locals
    const supabase = context.locals.supabase;
    const user = context.locals.user;

    // Validate Supabase client availability
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "Database connection not available",
        }),
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
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      limit: url.searchParams.get("limit") || undefined,
    };

    // Validate the query parameters using Zod
    const validationResult = FetchTodayQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Invalid query parameter: limit",
          details: errors,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { limit } = validationResult.data;

    // Get authenticated user ID
    const userId = user.id;

    // Call the learning service to fetch today's cards
    const result = await fetchTodaysCards({
      userId,
      limit,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error("Error fetching today's cards:", result.error);

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to fetch today's cards",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    const response: FetchTodayCardsResponseDTO = {
      cards: result.cards || [],
      count: result.count || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors to console
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/v1/learning/today:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
