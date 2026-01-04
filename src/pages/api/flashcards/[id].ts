// src/pages/api/flashcards/[id].ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { updateFlashcard, deleteFlashcard } from "../../../lib/services/flashcardService";
import {
  logFlashcardUpdateFailure,
  logFlashcardDeletion,
  logFlashcardDeleteFailure,
  logValidationError,
} from "../../../lib/services/auditLogService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating UUID format.
 */
const UUIDSchema = z.string().uuid("Invalid flashcard ID format");

/**
 * Zod schema for validating update flashcard request body.
 * Validates question and answer with same rules as create.
 */
const UpdateFlashcardBodySchema = z.object({
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
});

/**
 * PUT /api/flashcards/{id}
 *
 * Updates an existing flashcard's question and answer.
 * Only the owner can update their flashcard.
 *
 * @param context - Astro API context containing locals (supabase client), request, and params
 * @returns JSON response with success message or error
 */
export const PUT: APIRoute = async (context) => {
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

    // Extract and validate the flashcard ID from path parameters
    const flashcardId = context.params.id;

    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: "Flashcard ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format
    const idValidationResult = UUIDSchema.safeParse(flashcardId);

    if (!idValidationResult.success) {
      const errors = idValidationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      await logValidationError(supabase, errors);

      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID format",
          details: errors,
        }),
        {
          status: 400,
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
    const validationResult = UpdateFlashcardBodySchema.safeParse(requestBody);

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

    const { question, answer } = validationResult.data;

    // Get authenticated user ID
    const userId = user.id;

    // Call the flashcard service to update the flashcard
    const result = await updateFlashcard({
      flashcardId,
      question,
      answer,
      userId,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // Log the failure to audit log
      await logFlashcardUpdateFailure(supabase, userId, result.error || "Unknown error", flashcardId);

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to update flashcard",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: result.message || "Flashcard updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log unexpected errors to console and audit log
    // eslint-disable-next-line no-console
    console.error("Unexpected error in PUT /api/flashcards/[id]:", error);

    // Try to log to audit log if supabase is available
    try {
      const supabase = context.locals.supabase;
      if (supabase) {
        await logFlashcardUpdateFailure(
          supabase,
          null,
          error instanceof Error ? error.message : "Unknown error",
          context.params.id
        );
      }
    } catch (logError) {
      // If audit logging fails, just log to console
      // eslint-disable-next-line no-console
      console.error("Failed to log error to audit log:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while updating flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/flashcards/{id}
 *
 * Soft deletes an existing flashcard.
 * Only the owner can delete their flashcard.
 *
 * @param context - Astro API context containing locals (supabase client), request, and params
 * @returns JSON response with success message or error
 */
export const DELETE: APIRoute = async (context) => {
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

    // Extract and validate the flashcard ID from path parameters
    const flashcardId = context.params.id;

    if (!flashcardId) {
      return new Response(
        JSON.stringify({
          error: "Flashcard ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate UUID format
    const idValidationResult = UUIDSchema.safeParse(flashcardId);

    if (!idValidationResult.success) {
      const errors = idValidationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      await logValidationError(supabase, errors);

      return new Response(
        JSON.stringify({
          error: "Invalid flashcard ID format",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get authenticated user ID
    const userId = user.id;

    // Call the flashcard service to delete the flashcard
    const result = await deleteFlashcard({
      flashcardId,
      userId,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // Log the failure to audit log
      await logFlashcardDeleteFailure(supabase, userId, result.error || "Unknown error", flashcardId);

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to delete flashcard",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log successful deletion to audit log
    await logFlashcardDeletion(supabase, userId, flashcardId);

    // Return success response
    return new Response(
      JSON.stringify({
        message: result.message || "Flashcard deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log unexpected errors to console and audit log
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/flashcards/[id]:", error);

    // Try to log to audit log if supabase is available
    try {
      const supabase = context.locals.supabase;
      if (supabase) {
        await logFlashcardDeleteFailure(
          supabase,
          null,
          error instanceof Error ? error.message : "Unknown error",
          context.params.id
        );
      }
    } catch (logError) {
      // If audit logging fails, just log to console
      // eslint-disable-next-line no-console
      console.error("Failed to log error to audit log:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while deleting flashcard",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
