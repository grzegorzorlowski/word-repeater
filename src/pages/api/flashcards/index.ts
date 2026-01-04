// src/pages/api/flashcards/index.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { ListUserFlashcardsResponseDTO, CreateManualFlashcardResponseDTO } from "../../../types";
import { listUserFlashcards, createManualFlashcard } from "../../../lib/services/flashcardService";
import {
  logFlashcardListFailure,
  logFlashcardCreationFailure,
  logValidationError,
} from "../../../lib/services/auditLogService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating query parameters.
 * Validates pagination, filtering by source and status.
 *
 * Status filter (optional):
 * - "active": Returns only active flashcards (excludes pending AI suggestions and archived)
 * - "pending": Returns only pending AI-generated flashcards awaiting review
 * - If not provided: Returns all flashcards regardless of status
 *
 * Source filter (optional):
 * - "ai_generated": Returns only AI-generated flashcards
 * - "manual": Returns only manually created flashcards
 * - If not provided: Returns all flashcards regardless of source
 *
 * Note: Only non-deleted flashcards (deleted_at IS NULL) are returned.
 * Soft-deleted flashcards are excluded from all queries.
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
  source: z.enum(["ai_generated", "manual"]).optional(),
  status: z.enum(["active", "pending"]).optional(),
});

/**
 * Zod schema for validating create flashcard request body.
 * Validates question, answer, and optional metadata.
 */
const CreateFlashcardBodySchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(300, "Question must not exceed 300 characters")
    .transform((val) => val.trim()),
  answer: z
    .string()
    .min(1, "Answer is required")
    .max(500, "Answer must not exceed 500 characters")
    .transform((val) => val.trim()),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/flashcards
 *
 * Retrieves a paginated list of flashcards for the authenticated user.
 * Only returns non-deleted flashcards (deleted_at IS NULL).
 *
 * Optional filters:
 * - source: "ai_generated" or "manual" (returns all if not specified)
 * - status: "active" or "pending" (returns all if not specified)
 *
 * @param context - Astro API context containing locals (supabase client) and request
 * @returns JSON response with paginated flashcard list
 */
export const GET: APIRoute = async (context) => {
  try {
    // Get the Supabase client and user from context.locals
    const supabase = context.locals.supabase;
    const user = context.locals.user;

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

    // Get authenticated user ID
    const userId = user.id;

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

/**
 * POST /api/flashcards
 *
 * Creates a new manual flashcard with provided question and answer.
 *
 * @param context - Astro API context containing locals (supabase client) and request
 * @returns JSON response with created flashcard
 */
export const POST: APIRoute = async (context) => {
  try {
    // Get the Supabase client and user from context.locals
    const supabase = context.locals.supabase;
    const user = context.locals.user;

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

    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate the request body using Zod
    const validationResult = CreateFlashcardBodySchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      // Log validation error to audit log
      await logValidationError(supabase, errors);

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { question, answer, metadata } = validationResult.data;

    // Get authenticated user ID
    const userId = user.id;

    // Call the flashcard service to create the flashcard
    const result = await createManualFlashcard({
      question,
      answer,
      metadata,
      userId,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // Log the failure to audit log
      await logFlashcardCreationFailure(supabase, userId, result.error || "Unknown error");

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to create flashcard",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    if (!result.flashcard) {
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve created flashcard",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response: CreateManualFlashcardResponseDTO = {
      message: result.message || "Flashcard created successfully",
      flashcard: result.flashcard,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors to console and audit log
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/flashcards:", error);

    // Try to log to audit log if supabase is available
    try {
      const supabase = context.locals.supabase;
      if (supabase) {
        await logFlashcardCreationFailure(supabase, null, error instanceof Error ? error.message : "Unknown error");
      }
    } catch (logError) {
      // If audit logging fails, just log to console
      // eslint-disable-next-line no-console
      console.error("Failed to log error to audit log:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while creating flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
