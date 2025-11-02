// src/lib/services/flashcardService.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardSuggestionDTO, FlashcardSummaryDTO } from "../../types";
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

/**
 * Interface for the parameters required to list user flashcards.
 */
interface ListUserFlashcardsParams {
  userId: string;
  page: number;
  limit: number;
  source?: "ai" | "manual";
  status: "active" | "deleted";
  supabase: SupabaseClient;
}

/**
 * Interface for the result of the list user flashcards operation.
 */
interface ListUserFlashcardsResult {
  success: boolean;
  data?: FlashcardSummaryDTO[];
  total?: number;
  error?: string;
  statusCode?: number;
}

/**
 * Lists flashcards for a specific user with pagination and filtering.
 *
 * This function:
 * 1. Builds a database query with filters for user_id, status, and source
 * 2. Applies pagination (offset and limit)
 * 3. Retrieves the total count for pagination metadata
 * 4. Returns flashcard summaries
 *
 * @param params - Parameters including userId, pagination, filters, and supabase client
 * @returns Result object containing success status, flashcard data, total count
 */
export async function listUserFlashcards(params: ListUserFlashcardsParams): Promise<ListUserFlashcardsResult> {
  const { userId, page, limit, source, status, supabase } = params;

  try {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build base query for flashcards
    let query = supabase.from("flashcards").select("id, content, created_at", { count: "exact" }).eq("user_id", userId);

    // Apply status filter (active = deleted_at is null, deleted = deleted_at is not null)
    if (status === "active") {
      query = query.is("deleted_at", null);
    } else {
      query = query.not("deleted_at", "is", null);
    }

    // Apply source filter if provided
    // Source is stored in metadata.source as "ai_generated" or "manual"
    if (source === "ai") {
      query = query.eq("metadata->>source", "ai_generated");
    } else if (source === "manual") {
      query = query.eq("metadata->>source", "manual");
    }

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error while listing flashcards:", error);
      return {
        success: false,
        error: "Failed to retrieve flashcards from database",
        statusCode: 500,
      };
    }

    // Transform data to FlashcardSummaryDTO format
    const flashcards: FlashcardSummaryDTO[] =
      data?.map((record) => ({
        id: record.id,
        content: record.content,
        created_at: record.created_at,
      })) || [];

    return {
      success: true,
      data: flashcards,
      total: count || 0,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in listUserFlashcards:", error);
    return {
      success: false,
      error: "An unexpected error occurred while retrieving flashcards",
      statusCode: 500,
    };
  }
}
