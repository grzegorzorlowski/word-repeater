// src/pages/api/flashcards/generate.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerateAIFlashcardsResponseDTO } from "../../../types";
import { generateFlashcardsFromText } from "../../../lib/services/flashcardService";
import { DEFAULT_USER } from "../../../db/supabase.client";
import {
  logFlashcardGeneration,
  logFlashcardGenerationFailure,
  logValidationError,
} from "../../../lib/services/auditLogService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating the request body.
 * Validates that text is provided and is between 500 and 5000 characters.
 */
const GenerateFlashcardsRequestSchema = z.object({
  text: z.string().min(500, "Text must be at least 500 characters").max(5000, "Text must not exceed 5000 characters"),
  limit: z.number().int().positive().optional().default(5),
});

/**
 * POST /api/flashcards/generate
 *
 * Generates AI flashcards from user-provided text.
 * The endpoint validates the input, generates flashcard suggestions using a mocked AI service,
 * persists them to the database, and returns the generated flashcards.
 *
 * @param context - Astro API context containing locals (supabase client) and request
 * @returns JSON response with generated flashcards or error message
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

    // Validate the request data using Zod
    const validationResult = GenerateFlashcardsRequestSchema.safeParse(requestBody);

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

    const { text, limit } = validationResult.data;

    // Using DEFAULT_USER for development
    // This will be replaced with authenticated user ID when auth is implemented
    const userId = DEFAULT_USER;

    // Call the flashcard service to generate and persist flashcards
    const result = await generateFlashcardsFromText({
      text,
      limit,
      userId,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
      // Log the failure to audit log
      await logFlashcardGenerationFailure(supabase, userId, result.error || "Unknown error", text.length);

      return new Response(
        JSON.stringify({
          error: result.error || "Failed to generate flashcards",
        }),
        {
          status: result.statusCode || 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log successful generation to audit log
    await logFlashcardGeneration(supabase, userId, result.flashcards?.length || 0, text.length);

    // Return success response
    const response: GenerateAIFlashcardsResponseDTO = {
      flashcards: result.flashcards || [],
      message: result.message || "Flashcards generated successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors to console and audit log
    // eslint-disable-next-line no-console
    console.error("Unexpected error in /api/flashcards/generate:", error);

    // Try to log to audit log if supabase is available
    try {
      const supabase = context.locals.supabase;
      if (supabase) {
        await logFlashcardGenerationFailure(supabase, null, error instanceof Error ? error.message : "Unknown error");
      }
    } catch (logError) {
      // If audit logging fails, just log to console
      // eslint-disable-next-line no-console
      console.error("Failed to log error to audit log:", logError);
    }

    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
