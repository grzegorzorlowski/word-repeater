// src/pages/api/flashcards/generate.ts
import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerateAIFlashcardsResponseDTO } from "../../../types";
import { generateFlashcardsFromText } from "../../../lib/services/flashcardService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Zod schema for validating the request body.
 * Validates that text is provided and is between 500 and 5000 characters.
 */
const GenerateFlashcardsRequestSchema = z.object({
  text: z
    .string()
    .min(500, "Text must be at least 500 characters")
    .max(5000, "Text must not exceed 5000 characters"),
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

    // Validate the request data using Zod
    const validationResult = GenerateFlashcardsRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      
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

    // TODO: Add authentication check here
    // For now, we'll use a placeholder user_id
    // In production, this should come from the authenticated session
    const userId = "00000000-0000-0000-0000-000000000000"; // Placeholder

    // Call the flashcard service to generate and persist flashcards
    const result = await generateFlashcardsFromText({
      text,
      limit,
      userId,
      supabase,
    });

    // Handle service-level errors
    if (!result.success) {
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
    // Log unexpected errors (in production, this should go to an audit log)
    console.error("Unexpected error in /api/flashcards/generate:", error);

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

