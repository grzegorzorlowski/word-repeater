// src/lib/services/flashcardService.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardSuggestionDTO } from "../../types";
import type { TablesInsert } from "../../db/database.types";

/**
 * Interface for the parameters required to generate flashcards from text.
 */
interface GenerateFlashcardsParams {
  text: string;
  limit: number;
  userId: string;
  supabase: SupabaseClient;
}

/**
 * Interface for the result of the flashcard generation operation.
 */
interface GenerateFlashcardsResult {
  success: boolean;
  flashcards?: FlashcardSuggestionDTO[];
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Mocked AI service that generates flashcard suggestions from input text.
 *
 * This is a development-phase implementation that simulates AI flashcard generation.
 * In production, this should be replaced with actual AI API calls.
 *
 * @param text - The input text to generate flashcards from
 * @param limit - Maximum number of flashcards to generate
 * @returns Array of generated flashcard suggestions
 */
function mockAIGenerateFlashcards(text: string, limit: number): Omit<FlashcardSuggestionDTO, "id">[] {
  // Simple mock: Extract sentences and create Q&A pairs
  // In a real implementation, this would call an AI service like OpenAI

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20); // Filter out very short sentences

  const flashcards: Omit<FlashcardSuggestionDTO, "id">[] = [];
  const count = Math.min(limit, sentences.length);

  for (let i = 0; i < count; i++) {
    const sentence = sentences[i];

    // Create a simple question-answer pair
    // This is just a mock - real AI would generate meaningful Q&A
    flashcards.push({
      question: `What is the key concept in: "${sentence.substring(0, 50)}${sentence.length > 50 ? "..." : ""}"?`,
      answer: sentence,
    });
  }

  // Ensure at least one flashcard is generated if possible
  if (flashcards.length === 0 && text.length > 0) {
    flashcards.push({
      question: "What is the main topic of this text?",
      answer: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
    });
  }

  return flashcards;
}

/**
 * Generates AI flashcards from the provided text and persists them to the database.
 *
 * This function:
 * 1. Uses a mocked AI service to generate flashcard suggestions
 * 2. Transforms the Q&A pairs into the flashcard content format
 * 3. Persists the flashcards to the database
 * 4. Returns the generated flashcards with their database IDs
 *
 * @param params - Parameters including text, limit, userId, and supabase client
 * @returns Result object containing success status, flashcards, and message
 */
export async function generateFlashcardsFromText(params: GenerateFlashcardsParams): Promise<GenerateFlashcardsResult> {
  const { text, limit, userId, supabase } = params;

  try {
    // Step 1: Generate flashcard suggestions using the mocked AI service
    const suggestions = mockAIGenerateFlashcards(text, limit);

    if (suggestions.length === 0) {
      return {
        success: false,
        error: "Unable to generate flashcards from the provided text",
        statusCode: 422,
      };
    }

    // Step 2: Transform suggestions into database insert format
    // The flashcard content combines question and answer
    const flashcardsToInsert: TablesInsert<"flashcards">[] = suggestions.map((suggestion) => ({
      user_id: userId,
      content: JSON.stringify({
        question: suggestion.question,
        answer: suggestion.answer,
      }),
      metadata: {
        source: "ai_generated",
        generated_at: new Date().toISOString(),
      },
    }));

    // Step 3: Persist flashcards to the database
    const { data, error } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, content, created_at");

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error while inserting flashcards:", error);
      return {
        success: false,
        error: "Failed to save flashcards to database",
        statusCode: 500,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Failed to save flashcards to database",
        statusCode: 500,
      };
    }

    // Step 4: Transform database records back to FlashcardSuggestionDTO format
    const flashcards: FlashcardSuggestionDTO[] = data.map((record) => {
      const content = JSON.parse(record.content);
      return {
        id: record.id,
        question: content.question,
        answer: content.answer,
      };
    });

    return {
      success: true,
      flashcards,
      message: `Successfully generated ${flashcards.length} flashcard${flashcards.length > 1 ? "s" : ""}`,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in generateFlashcardsFromText:", error);
    return {
      success: false,
      error: "An unexpected error occurred during flashcard generation",
      statusCode: 500,
    };
  }
}
