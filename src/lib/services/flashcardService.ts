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

/**
 * Interface for the parameters required to create a manual flashcard.
 */
interface CreateManualFlashcardParams {
  question: string;
  answer: string;
  metadata?: Record<string, unknown>;
  userId: string;
  supabase: SupabaseClient;
}

/**
 * Interface for the result of the create manual flashcard operation.
 */
interface CreateManualFlashcardResult {
  success: boolean;
  flashcard?: FlashcardSummaryDTO;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Creates a manual flashcard with provided question and answer.
 *
 * This function:
 * 1. Transforms question and answer into flashcard content format (JSON stringified)
 * 2. Sets metadata source to "manual" to distinguish from AI-generated flashcards
 * 3. Persists the flashcard to the database
 * 4. Returns the created flashcard summary
 *
 * @param params - Parameters including question, answer, metadata, userId, and supabase client
 * @returns Result object containing success status, flashcard summary, and message
 */
export async function createManualFlashcard(params: CreateManualFlashcardParams): Promise<CreateManualFlashcardResult> {
  const { question, answer, metadata, userId, supabase } = params;

  try {
    // Transform question and answer into content format
    const content = JSON.stringify({
      question,
      answer,
    });

    // Prepare metadata with source set to "manual"
    const flashcardMetadata = {
      ...metadata,
      source: "manual",
      created_at: new Date().toISOString(),
    };

    // Prepare flashcard for insertion
    const flashcardToInsert: TablesInsert<"flashcards"> = {
      user_id: userId,
      content,
      metadata: flashcardMetadata,
    };

    // Insert flashcard into database
    const { data, error } = await supabase
      .from("flashcards")
      .insert(flashcardToInsert)
      .select("id, content, created_at")
      .single();

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error while creating flashcard:", error);
      return {
        success: false,
        error: "Failed to create flashcard in database",
        statusCode: 500,
      };
    }

    if (!data) {
      return {
        success: false,
        error: "Failed to create flashcard in database",
        statusCode: 500,
      };
    }

    // Transform database record to FlashcardSummaryDTO format
    const flashcard: FlashcardSummaryDTO = {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
    };

    return {
      success: true,
      flashcard,
      message: "Flashcard created successfully",
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in createManualFlashcard:", error);
    return {
      success: false,
      error: "An unexpected error occurred while creating flashcard",
      statusCode: 500,
    };
  }
}

/**
 * Interface for the parameters required to update a flashcard.
 */
interface UpdateFlashcardParams {
  flashcardId: string;
  question: string;
  answer: string;
  userId: string;
  supabase: SupabaseClient;
}

/**
 * Interface for the result of the update flashcard operation.
 */
interface UpdateFlashcardResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Updates an existing flashcard's question and answer.
 *
 * This function:
 * 1. Verifies that the flashcard exists and belongs to the user (ownership check)
 * 2. Checks that the flashcard is not soft-deleted
 * 3. Transforms question and answer into flashcard content format (JSON stringified)
 * 4. Updates the flashcard in the database
 * 5. Returns success message or appropriate error
 *
 * @param params - Parameters including flashcardId, question, answer, userId, and supabase client
 * @returns Result object containing success status and message
 */
export async function updateFlashcard(params: UpdateFlashcardParams): Promise<UpdateFlashcardResult> {
  const { flashcardId, question, answer, userId, supabase } = params;

  try {
    // Transform question and answer into content format
    const content = JSON.stringify({
      question,
      answer,
    });

    // Update flashcard with ownership check
    // Only update if: id matches, user_id matches, and not soft-deleted
    const { data, error } = await supabase
      .from("flashcards")
      .update({ content })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id")
      .single();

    if (error) {
      // Check if it's a "not found" error (no rows matched)
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: "Flashcard not found",
          statusCode: 404,
        };
      }

      // eslint-disable-next-line no-console
      console.error("Database error while updating flashcard:", error);
      return {
        success: false,
        error: "Failed to update flashcard in database",
        statusCode: 500,
      };
    }

    if (!data) {
      // No rows were updated (flashcard doesn't exist or doesn't belong to user)
      return {
        success: false,
        error: "Flashcard not found",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Flashcard updated successfully",
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in updateFlashcard:", error);
    return {
      success: false,
      error: "An unexpected error occurred while updating flashcard",
      statusCode: 500,
    };
  }
}

/**
 * Interface for the parameters required to delete a flashcard.
 */
interface DeleteFlashcardParams {
  flashcardId: string;
  userId: string;
  supabase: SupabaseClient;
}

/**
 * Interface for the result of the delete flashcard operation.
 */
interface DeleteFlashcardResult {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Soft deletes an existing flashcard by setting the deleted_at timestamp.
 *
 * This function:
 * 1. Verifies that the flashcard exists and belongs to the user (ownership check)
 * 2. Checks that the flashcard is not already soft-deleted (idempotency)
 * 3. Sets the deleted_at timestamp to current time
 * 4. Returns success message or appropriate error
 *
 * @param params - Parameters including flashcardId, userId, and supabase client
 * @returns Result object containing success status and message
 */
export async function deleteFlashcard(params: DeleteFlashcardParams): Promise<DeleteFlashcardResult> {
  const { flashcardId, userId, supabase } = params;

  try {
    // Soft delete flashcard with ownership check
    // Only delete if: id matches, user_id matches, and not already deleted
    const { data, error } = await supabase
      .from("flashcards")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id")
      .single();

    if (error) {
      // Check if it's a "not found" error (no rows matched)
      if (error.code === "PGRST116") {
        return {
          success: false,
          error: "Flashcard not found",
          statusCode: 404,
        };
      }

      // eslint-disable-next-line no-console
      console.error("Database error while deleting flashcard:", error);
      return {
        success: false,
        error: "Failed to delete flashcard in database",
        statusCode: 500,
      };
    }

    if (!data) {
      // No rows were updated (flashcard doesn't exist, doesn't belong to user, or already deleted)
      return {
        success: false,
        error: "Flashcard not found",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Flashcard deleted successfully",
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in deleteFlashcard:", error);
    return {
      success: false,
      error: "An unexpected error occurred while deleting flashcard",
      statusCode: 500,
    };
  }
}

/**
 * Interface for the parameters required to accept or reject an AI-generated flashcard.
 */
interface AcceptRejectFlashcardParams {
  flashcardId: string;
  userId: string;
  decision: "accept" | "reject";
  supabase: SupabaseClient;
}

/**
 * Interface for the result of the accept/reject flashcard operation.
 */
interface AcceptRejectFlashcardResult {
  success: boolean;
  message?: string;
  status?: "active" | "deleted";
  error?: string;
  statusCode?: number;
}

/**
 * Accepts or rejects an AI-generated flashcard suggestion.
 *
 * This function:
 * 1. Verifies that the flashcard exists and belongs to the user (ownership check)
 * 2. Validates that the flashcard is AI-generated (source = 'ai_generated')
 * 3. Validates that the flashcard is in pending status (status = 'pending')
 * 4. If accept: Updates status from 'pending' to 'active'
 * 5. If reject: Sets deleted_at timestamp (soft delete)
 *
 * @param params - Parameters including flashcardId, userId, decision, and supabase client
 * @returns Result object containing success status, message, and new status
 */
export async function acceptRejectFlashcard(params: AcceptRejectFlashcardParams): Promise<AcceptRejectFlashcardResult> {
  const { flashcardId, userId, decision, supabase } = params;

  try {
    // First, fetch the flashcard to validate it
    const { data: flashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("id, user_id, source, status, deleted_at")
      .eq("id", flashcardId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (fetchError) {
      // Check if it's a "not found" error (no rows matched)
      if (fetchError.code === "PGRST116") {
        return {
          success: false,
          error: "Flashcard not found",
          statusCode: 404,
        };
      }

      // eslint-disable-next-line no-console
      console.error("Database error while fetching flashcard:", fetchError);
      return {
        success: false,
        error: "Failed to fetch flashcard from database",
        statusCode: 500,
      };
    }

    if (!flashcard) {
      return {
        success: false,
        error: "Flashcard not found",
        statusCode: 404,
      };
    }

    // Validate that the flashcard is AI-generated
    if (flashcard.source !== "ai_generated") {
      return {
        success: false,
        error: "Only AI-generated flashcards can be accepted or rejected",
        statusCode: 400,
      };
    }

    // Validate that the flashcard is in pending status
    if (flashcard.status !== "pending") {
      return {
        success: false,
        error: "Only pending flashcards can be accepted or rejected",
        statusCode: 400,
      };
    }

    // Process the decision
    if (decision === "accept") {
      // Accept: Update status to 'active'
      const { error: updateError } = await supabase
        .from("flashcards")
        .update({ status: "active" })
        .eq("id", flashcardId)
        .eq("user_id", userId);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error("Database error while accepting flashcard:", updateError);
        return {
          success: false,
          error: "Failed to accept flashcard in database",
          statusCode: 500,
        };
      }

      return {
        success: true,
        message: "Flashcard accepted successfully",
        status: "active",
      };
    } else {
      // Reject: Soft delete by setting deleted_at
      const { error: deleteError } = await supabase
        .from("flashcards")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", flashcardId)
        .eq("user_id", userId);

      if (deleteError) {
        // eslint-disable-next-line no-console
        console.error("Database error while rejecting flashcard:", deleteError);
        return {
          success: false,
          error: "Failed to reject flashcard in database",
          statusCode: 500,
        };
      }

      return {
        success: true,
        message: "Flashcard rejected successfully",
        status: "deleted",
      };
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in acceptRejectFlashcard:", error);
    return {
      success: false,
      error: "An unexpected error occurred while processing flashcard decision",
      statusCode: 500,
    };
  }
}
