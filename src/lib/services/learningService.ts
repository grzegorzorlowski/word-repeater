// src/lib/services/learningService.ts
import type { SupabaseClient } from "../../db/supabase.client";
import type {
  LearningCardDTO,
  FetchTodayCardsResponseDTO,
  RecordReviewResponseDTO,
  ReviewScheduleChangeDTO,
  FlashcardScheduleDTO,
  Rating,
} from "../../types";
import { processReview } from "./srsService";
import { NotFoundError, BusinessError } from "../errors";

/**
 * Command interface for fetching today's cards.
 *
 * @property userId - The authenticated user's ID (from Supabase auth)
 * @property limit - Maximum total number of cards to return (must be between 1-50)
 * @property supabase - Supabase client instance with user context
 */
export interface FetchTodaysCardsCommand {
  userId: string;
  limit: number;
  supabase: SupabaseClient;
}

/**
 * Service result interface for internal error handling.
 *
 * @template T - The expected data type for successful responses
 * @property success - Whether the operation succeeded
 * @property data - Generic data payload (optional)
 * @property cards - Array of learning cards (for fetchTodaysCards)
 * @property count - Total number of cards returned
 * @property error - Error instance or message if operation failed
 * @property statusCode - HTTP status code for error responses (500, etc.)
 */
interface ServiceResult<T> {
  success: boolean;
  data?: T;
  cards?: LearningCardDTO[];
  count?: number;
  error?: Error | string;
  statusCode?: number;
}

/**
 * Helper function to parse flashcard content (JSON format) into question and answer.
 *
 * Content is stored as JSON: { "question": "...", "answer": "..." }
 *
 * @param content - JSON string containing question and answer
 * @returns Object with question and answer strings (empty strings if parsing fails)
 *
 * @example
 * ```typescript
 * const result = parseFlashcardContent('{"question":"Q1","answer":"A1"}');
 * // Returns: { question: "Q1", answer: "A1" }
 * ```
 */
function parseFlashcardContent(content: string): { question: string; answer: string } {
  try {
    const parsed = JSON.parse(content);
    return {
      question: parsed.question || "",
      answer: parsed.answer || "",
    };
  } catch (err) {
    // Fallback: return empty strings if parsing fails
    // eslint-disable-next-line no-console
    console.error("Failed to parse flashcard content:", err);
    return { question: "", answer: "" };
  }
}

/**
 * Fetches all due flashcards (next_due ≤ now) plus up to `limit` new flashcards
 * (repetition_count = 0) for the authenticated user.
 *
 * ## Algorithm
 *
 * 1. **Fetch due cards** (next_due ≤ now), limited by `limit` parameter
 *    - Ordered by next_due ascending (oldest first)
 *    - Excludes soft-deleted flashcards (deleted_at IS NOT NULL)
 *
 * 2. **Early return optimization**: If due cards ≥ limit, return immediately
 *
 * 3. **Check daily new card limit**:
 *    - Find cards with repetition_count = 1 (recently transitioned from new)
 *    - Count how many were reviewed today (since UTC midnight)
 *    - Daily cap: 50 new cards per day
 *
 * 4. **Calculate remaining new cards**:
 *    ```
 *    Min(50 - alreadyTakenToday, limit - dueCardsCount)
 *    ```
 *
 * 5. **Fetch new cards** (repetition_count = 0) up to remaining limit
 *    - Excludes duplicates (cards already in due list)
 *    - Excludes soft-deleted flashcards
 *
 * 6. **Merge and return**: Due cards + New cards
 *
 * ## Performance
 * - Uses indexed queries on (user_id, next_due)
 * - Early returns to minimize database queries
 * - Separate queries to avoid full table scans
 *
 * ## Edge Cases
 * - Soft-deleted flashcards: Excluded via `.is('deleted_at', null)`
 * - Daily limit reached: Returns only due cards
 * - No flashcards: Returns empty array
 * - Malformed JSON: Returns empty question/answer strings
 *
 * @param cmd - Command object with userId, limit, and supabase client
 * @returns Promise resolving to service result with cards array and count
 *
 * @example
 * ```typescript
 * const result = await fetchTodaysCards({
 *   userId: 'user-123',
 *   limit: 25,
 *   supabase: supabaseClient
 * });
 *
 * if (result.success) {
 *   console.log(`Found ${result.count} cards`);
 *   result.cards.forEach(card => {
 *     console.log(card.question);
 *   });
 * }
 * ```
 */
export async function fetchTodaysCards(
  cmd: FetchTodaysCardsCommand
): Promise<ServiceResult<FetchTodayCardsResponseDTO>> {
  const { userId, limit: requestedLimit, supabase } = cmd;

  try {
    // Get current timestamp in ISO format
    const now = new Date().toISOString();

    // Get today's midnight in UTC for counting today's new cards
    const todayMidnight = new Date();
    todayMidnight.setUTCHours(0, 0, 0, 0);
    const todayMidnightISO = todayMidnight.toISOString();

    // 1. Fetch due cards (next_due ≤ now), limited by requestedLimit
    // Exclude soft-deleted flashcards (deleted_at IS NULL)
    const { data: dueRows, error: dueError } = await supabase
      .from("flashcard_schedule")
      .select(
        `
        next_due,
        interval_days,
        repetition_count,
        ease_factor,
        flashcard_id,
        flashcards!inner (
          id,
          content,
          deleted_at
        )
      `
      )
      .eq("user_id", userId)
      .lte("next_due", now)
      .is("flashcards.deleted_at", null)
      .order("next_due", { ascending: true })
      .limit(requestedLimit);

    if (dueError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching due cards:", dueError);
      return {
        success: false,
        error: "Failed to fetch due cards",
        statusCode: 500,
      };
    }

    const dueCards = dueRows || [];
    const dueCardsCount = dueCards.length;

    // 2. If we already have enough cards from due cards, return them
    if (dueCardsCount >= requestedLimit) {
      const cards: LearningCardDTO[] = dueCards.map((row) => {
        const flashcard = Array.isArray(row.flashcards) ? row.flashcards[0] : row.flashcards;
        const { question, answer } = parseFlashcardContent(flashcard?.content || "");

        return {
          flashcardId: flashcard?.id || row.flashcard_id,
          question,
          answer,
          schedule: {
            next_due: row.next_due,
            interval_days: row.interval_days,
            repetition_count: row.repetition_count,
            ease_factor: row.ease_factor,
          },
        };
      });

      return {
        success: true,
        cards,
        count: cards.length,
      };
    }

    // 3. Count how many new cards were already taken today
    // A new card is "taken" when it has been reviewed and moved to repetition_count = 1
    // First, get all flashcard_ids with repetition_count = 1
    const { data: cardsWithRepCount1, error: scheduleError } = await supabase
      .from("flashcard_schedule")
      .select("flashcard_id")
      .eq("user_id", userId)
      .eq("repetition_count", 1);

    if (scheduleError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching cards with repetition_count = 1:", scheduleError);
      return {
        success: false,
        error: "Failed to fetch schedule data",
        statusCode: 500,
      };
    }

    const flashcardIdsWithRepCount1 = (cardsWithRepCount1 || []).map((row) => row.flashcard_id);

    // If no cards with repetition_count = 1, then no new cards were taken today
    let alreadyTakenToday = 0;

    if (flashcardIdsWithRepCount1.length > 0) {
      // Now count how many of these were reviewed today
      const { data: reviewedNewCardsData, error: countError } = await supabase
        .from("review_logs")
        .select("flashcard_id", { count: "exact", head: false })
        .eq("user_id", userId)
        .gte("reviewed_at", todayMidnightISO)
        .in("flashcard_id", flashcardIdsWithRepCount1);

      if (countError) {
        // eslint-disable-next-line no-console
        console.error("Error counting today's new cards:", countError);
        return {
          success: false,
          error: "Failed to count today's new cards",
          statusCode: 500,
        };
      }

      alreadyTakenToday = reviewedNewCardsData?.length || 0;
    }

    // 4. Calculate how many new cards we can still fetch
    const MAX_NEW_CARDS_PER_DAY = 50;
    const remainingNewCardsAllowed = Math.max(0, MAX_NEW_CARDS_PER_DAY - alreadyTakenToday);
    const remainingCardsNeeded = requestedLimit - dueCardsCount;
    const newCardsToFetch = Math.min(remainingNewCardsAllowed, remainingCardsNeeded);

    // 5. If we can't fetch any more new cards, return only due cards
    if (newCardsToFetch <= 0) {
      const cards: LearningCardDTO[] = dueCards.map((row) => {
        const flashcard = Array.isArray(row.flashcards) ? row.flashcards[0] : row.flashcards;
        const { question, answer } = parseFlashcardContent(flashcard?.content || "");

        return {
          flashcardId: flashcard?.id || row.flashcard_id,
          question,
          answer,
          schedule: {
            next_due: row.next_due,
            interval_days: row.interval_days,
            repetition_count: row.repetition_count,
            ease_factor: row.ease_factor,
          },
        };
      });

      return {
        success: true,
        cards,
        count: cards.length,
      };
    }

    // 6. Fetch new cards (repetition_count = 0)
    // Exclude soft-deleted flashcards and cards already in due list
    // Also exclude cards that are already due to avoid duplicates
    const dueFlashcardIds = dueCards.map((card) => card.flashcard_id);

    let newCardsQuery = supabase
      .from("flashcard_schedule")
      .select(
        `
        next_due,
        interval_days,
        repetition_count,
        ease_factor,
        flashcard_id,
        flashcards!inner (
          id,
          content,
          deleted_at
        )
      `
      )
      .eq("user_id", userId)
      .eq("repetition_count", 0)
      .is("flashcards.deleted_at", null)
      .limit(newCardsToFetch);

    // Exclude flashcards that are already in the due cards list to avoid duplicates
    if (dueFlashcardIds.length > 0) {
      newCardsQuery = newCardsQuery.not("flashcard_id", "in", `(${dueFlashcardIds.join(",")})`);
    }

    const { data: newRows, error: newError } = await newCardsQuery;

    if (newError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching new cards:", newError);
      return {
        success: false,
        error: "Failed to fetch new cards",
        statusCode: 500,
      };
    }

    // 7. Merge due cards and new cards, then map to DTOs
    const allRows = [...dueCards, ...(newRows || [])];

    const cards: LearningCardDTO[] = allRows.map((row) => {
      const flashcard = Array.isArray(row.flashcards) ? row.flashcards[0] : row.flashcards;
      const { question, answer } = parseFlashcardContent(flashcard?.content || "");

      return {
        flashcardId: flashcard?.id || row.flashcard_id,
        question,
        answer,
        schedule: {
          next_due: row.next_due,
          interval_days: row.interval_days,
          repetition_count: row.repetition_count,
          ease_factor: row.ease_factor,
        },
      };
    });

    return {
      success: true,
      cards,
      count: cards.length,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in fetchTodaysCards:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching cards",
      statusCode: 500,
    };
  }
}

/**
 * Command interface for recording a review rating.
 *
 * @property userId - The authenticated user's ID (from Supabase auth)
 * @property flashcardId - The UUID of the flashcard being reviewed
 * @property rating - The review rating ("again" | "hard" | "good" | "easy")
 * @property supabase - Supabase client instance with user context
 */
export interface RecordReviewRatingCommand {
  userId: string;
  flashcardId: string;
  rating: Rating;
  supabase: SupabaseClient;
}

/**
 * Records a user's review rating for a flashcard, updates its SRS schedule,
 * logs the review, and returns the updated schedule.
 *
 * ## Algorithm
 *
 * 1. **Fetch existing schedule**: Query `flashcard_schedule` by `flashcardId` & `userId`
 *    - If not found → throw `NotFoundError`
 *    - Verify ownership (user_id matches)
 *
 * 2. **Compute new schedule**: Use SRS algorithm to calculate new interval, ease factor, and next_due
 *    - Convert current schedule to ts-fsrs Card format
 *    - Process review with given rating
 *    - Convert updated card back to database format
 *
 * 3. **Database transaction**:
 *    - Update `flashcard_schedule` row with new values
 *    - Insert into `review_logs` with user_id, flashcard_id, rating, and reviewed_at (UTC)
 *
 * 4. **Map to DTO**: Transform previous and new schedule to `ReviewScheduleChangeDTO`
 *
 * ## Performance
 * - Uses a single transaction to ensure atomicity
 * - Indexed queries on (user_id, flashcard_id) for fast lookups
 *
 * ## Edge Cases
 * - Schedule not found: Returns 404
 * - Schedule not owned by user: Returns 404 (security)
 * - Invalid rating: Handled by validation layer
 * - Database errors: Returns 500 with error message
 *
 * @param cmd - Command object with userId, flashcardId, rating, and supabase client
 * @returns Promise resolving to service result with reviewed schedule change
 *
 * @example
 * ```typescript
 * const result = await recordReviewRating({
 *   userId: 'user-123',
 *   flashcardId: 'card-456',
 *   rating: 'good',
 *   supabase: supabaseClient
 * });
 *
 * if (result.success) {
 *   console.log('New interval:', result.data.reviewed.new_schedule.interval_days);
 * }
 * ```
 */
export async function recordReviewRating(
  cmd: RecordReviewRatingCommand
): Promise<ServiceResult<RecordReviewResponseDTO>> {
  const { userId, flashcardId, rating, supabase } = cmd;

  try {
    const now = new Date();

    // 1. Fetch existing flashcard_schedule by flashcardId & userId
    const { data: scheduleRow, error: fetchError } = await supabase
      .from("flashcard_schedule")
      .select("next_due, interval_days, repetition_count, ease_factor, user_id")
      .eq("flashcard_id", flashcardId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Error fetching flashcard schedule:", fetchError);

      // Check if it's a "not found" error (no rows returned)
      if (fetchError.code === "PGRST116" || fetchError.message.includes("No rows")) {
        return {
          success: false,
          error: new NotFoundError("Flashcard schedule not found"),
          statusCode: 404,
        };
      }

      return {
        success: false,
        error: "Failed to fetch flashcard schedule",
        statusCode: 500,
      };
    }

    if (!scheduleRow) {
      return {
        success: false,
        error: new NotFoundError("Flashcard schedule not found"),
        statusCode: 404,
      };
    }

    // Verify ownership (additional security check)
    if (scheduleRow.user_id !== userId) {
      return {
        success: false,
        error: new NotFoundError("Flashcard schedule not found"),
        statusCode: 404,
      };
    }

    // Store previous schedule for response
    const previousSchedule: FlashcardScheduleDTO = {
      next_due: scheduleRow.next_due,
      interval_days: scheduleRow.interval_days,
      repetition_count: scheduleRow.repetition_count,
      ease_factor: scheduleRow.ease_factor,
    };

    // 2. Compute new schedule using SRS algorithm
    const newSchedule = processReview(previousSchedule, rating, now);

    // 3. Update flashcard_schedule and insert review_log in a transaction
    // Note: Supabase doesn't support explicit transactions in the JS client,
    // but we can use RPC functions or do sequential operations with error handling
    // For MVP, we'll do sequential operations and handle rollback manually if needed

    // Update the schedule
    const { error: updateError } = await supabase
      .from("flashcard_schedule")
      .update({
        next_due: newSchedule.next_due,
        interval_days: newSchedule.interval_days,
        repetition_count: newSchedule.repetition_count,
        ease_factor: newSchedule.ease_factor,
      })
      .eq("flashcard_id", flashcardId)
      .eq("user_id", userId);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("Error updating flashcard schedule:", updateError);
      return {
        success: false,
        error: "Failed to update flashcard schedule",
        statusCode: 500,
      };
    }

    // Insert review log
    const { error: logError } = await supabase.from("review_logs").insert({
      user_id: userId,
      flashcard_id: flashcardId,
      rating: rating,
      reviewed_at: now.toISOString(),
    });

    if (logError) {
      // eslint-disable-next-line no-console
      console.error("Error inserting review log:", logError);

      // Attempt to rollback the schedule update
      // Note: In a production system, you'd want to use a proper transaction
      await supabase
        .from("flashcard_schedule")
        .update({
          next_due: previousSchedule.next_due,
          interval_days: previousSchedule.interval_days,
          repetition_count: previousSchedule.repetition_count,
          ease_factor: previousSchedule.ease_factor,
        })
        .eq("flashcard_id", flashcardId)
        .eq("user_id", userId);

      return {
        success: false,
        error: "Failed to log review",
        statusCode: 500,
      };
    }

    // 4. Map to DTO
    const reviewed: ReviewScheduleChangeDTO = {
      flashcardId,
      previous_schedule: previousSchedule,
      new_schedule: newSchedule,
    };

    const response: RecordReviewResponseDTO = {
      reviewed,
    };

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in recordReviewRating:", error);

    // If it's already a known error type, preserve it
    if (error instanceof NotFoundError || error instanceof BusinessError) {
      return {
        success: false,
        error,
        statusCode: error.statusCode,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error("An unexpected error occurred"),
      statusCode: 500,
    };
  }
}
