// src/pages/api/flashcards/index.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { ListUserFlashcardsResponseDTO } from "../../../types";
import { listUserFlashcards } from "../../../lib/services/flashcardService";
import { DEFAULT_USER } from "../../../db/supabase.client";
import { logFlashcardListFailure, logValidationError } from "../../../lib/services/auditLogService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating query parameters.
 * Validates pagination, filtering by source and status.
 */
const ListFlashcardsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, "Page must be at least 1"),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  source: z.enum(["ai", "manual"]).optional(),
  status: z.enum(["active", "deleted"]).optional().default("active"),
});

/**
 * GET /api/flashcards
 *
 * Retrieves a paginated list of flashcards for the authenticated user.
 * Supports filtering by source (ai/manual) and status (active/deleted).
 *
 * @param context - Astro API context containing locals (supabase client) and request
 * @returns JSON response with paginated flashcard list
 */
export const GET: APIRoute = async (context) => {
  try {
    // Get the Supabase client from context.locals
    const supabase = context.locals.supabase;

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

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      source: url.searchParams.get("source") || undefined,
      status: url.searchParams.get("status") || undefined,
    };

    // Validate the query parameters using Zod
    const validationResult = ListFlashcardsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // Log validation error to audit log
      await logValidationError(supabase, errors);

      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit, source, status } = validationResult.data;

    // Using DEFAULT_USER for development
    // This will be replaced with authenticated user ID when auth is implemented
    const userId = DEFAULT_USER;

    // Call the flashcard service to list flashcards
    const result = await listUserFlashcards({
      userId,
      page,
      limit,
      source,
      status,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // Log the failure to audit log
      await logFlashcardListFailure(supabase, userId, result.error || "Unknown error", {
        page,
        limit,
        source,
        status,
      });

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to retrieve flashcards",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    const response: ListUserFlashcardsResponseDTO = {
      data: result.data || [],
      page,
      limit,
      total: result.total || 0,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors to console and audit log
    // eslint-disable-next-line no-console
    console.error("Unexpected error in /api/flashcards:", error);

    // Try to log to audit log if supabase is available
    try {
      const supabase = context.locals.supabase;
      if (supabase) {
        await logFlashcardListFailure(supabase, null, error instanceof Error ? error.message : "Unknown error");
      }
    } catch (logError) {
      // If audit logging fails, just log to console
      // eslint-disable-next-line no-console
      console.error("Failed to log error to audit log:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while retrieving flashcards",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
