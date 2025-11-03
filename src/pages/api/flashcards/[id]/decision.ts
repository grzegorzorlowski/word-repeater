// src/pages/api/flashcards/[id]/decision.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import { acceptRejectFlashcard } from "../../../../lib/services/flashcardService";
import { DEFAULT_USER } from "../../../../db/supabase.client";
import {
  logFlashcardAcceptance,
  logFlashcardRejection,
  logFlashcardDecisionFailure,
  logValidationError,
} from "../../../../lib/services/auditLogService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating UUID format
 */
const UUIDSchema = z.string().uuid({
  message: "Invalid UUID format",
});

/**
 * Zod schema for validating the decision in the request body
 */
const AcceptRejectFlashcardSchema = z.object({
  decision: z.enum(["accept", "reject"], {
    errorMap: () => ({ message: "Decision must be either 'accept' or 'reject'" }),
  }),
});

/**
 * POST /api/flashcards/{id}/decision
 *
 * Accepts or rejects an AI-generated flashcard suggestion.
 * - Accept: Changes status from 'pending' to 'active'
 * - Reject: Soft deletes the flashcard (sets deleted_at)
 *
 * Only works with AI-generated flashcards in 'pending' status.
 *
 * @param context - Astro API context containing locals (supabase client), request, and params
 * @returns JSON response with success message or error
 */
export const POST: APIRoute = async (context) => {
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

    // Parse and validate the request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch (error) {
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

    // Validate the request body against the schema
    const validationResult = AcceptRejectFlashcardSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

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

    const { decision } = validationResult.data;

    // Using DEFAULT_USER for development
    // This will be replaced with authenticated user ID when auth is implemented
    const userId = DEFAULT_USER;

    // Call the flashcard service to accept or reject the flashcard
    const result = await acceptRejectFlashcard({
      flashcardId,
      userId,
      decision,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // Log the failure to audit log
      await logFlashcardDecisionFailure(supabase, userId, result.error || "Unknown error", flashcardId, decision);

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to process flashcard decision",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log successful decision to audit log
    if (decision === "accept") {
      await logFlashcardAcceptance(supabase, userId, flashcardId);
    } else {
      await logFlashcardRejection(supabase, userId, flashcardId);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: result.message || "Flashcard decision processed successfully",
        flashcard_id: flashcardId,
        status: result.status || (decision === "accept" ? "active" : "deleted"),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log unexpected errors to console and audit log
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/flashcards/[id]/decision:", error);

    // Try to log to audit log if supabase is available
    try {
      const supabase = context.locals.supabase;
      if (supabase) {
        await logFlashcardDecisionFailure(
          supabase,
          null,
          error instanceof Error ? error.message : "Unknown error",
          context.params.id,
          "unknown"
        );
      }
    } catch (logError) {
      // If audit logging fails, just log to console
      // eslint-disable-next-line no-console
      console.error("Failed to log error to audit log:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while processing flashcard decision",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
