import type { Database } from "./db/database.types";

// Convenience aliases for database row types
export type FlashcardRow = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardScheduleRow = Database["public"]["Tables"]["flashcard_schedule"]["Row"];

// Extract rating enum from the database model
export type Rating = Database["public"]["Enums"]["rating"];

/**
 * DTO for Generate AI Flashcards request.
 */
export interface GenerateAIFlashcardsRequestDTO {
  text: string; // User input text up to 5000 characters.
  limit: number; // Maximum text length or number of flashcards to generate.
}

/**
 * DTO representing an AI-generated flashcard suggestion.
 */
export interface FlashcardSuggestionDTO {
  id?: string | null; // Temporary id or null if not persisted yet.
  question: string;
  answer: string;
}

/**
 * DTO for Generate AI Flashcards response.
 */
export interface GenerateAIFlashcardsResponseDTO {
  flashcards: FlashcardSuggestionDTO[];
  message: string;
}

/**
 * DTO for List User Flashcards request (query parameters).
 */
export interface ListUserFlashcardsRequestDTO {
  page?: number;
  limit?: number;
  source?: FlashcardRow["source"]; // "ai" | "manual"
  status?: FlashcardRow["status"]; // e.g. "active" | "deleted"
}

/**
 * DTO summarizing a flashcard for listings.
 * Derived from the FlashcardRow type.
 */
export type FlashcardSummaryDTO = Pick<FlashcardRow, "id" | "content" | "created_at">;

/**
 * DTO for List User Flashcards response.
 */
export interface ListUserFlashcardsResponseDTO {
  data: FlashcardSummaryDTO[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Command Model for creating a manual flashcard.
 * Captures raw inputs; will be transformed into FlashcardRow.Insert for persistence.
 */
export interface CreateManualFlashcardCommand {
  question: string;
  answer: string;
  metadata?: Record<string, unknown>;
}

/**
 * DTO for Create Manual Flashcard response.
 */
export interface CreateManualFlashcardResponseDTO {
  message: string;
  flashcard: FlashcardSummaryDTO;
}

/**
 * Command Model for updating an existing flashcard.
 */
export interface UpdateFlashcardCommand {
  question: string;
  answer: string;
}

/**
 * DTO for Update Flashcard response.
 */
export interface UpdateFlashcardResponseDTO {
  message: string;
  flashcard: FlashcardSummaryDTO;
}

/**
 * DTO for Delete Flashcard response.
 * Returns the id and updated status of the flashcard.
 */
export interface DeleteFlashcardResponseDTO {
  message: string;
  flashcardId: string;
  status: FlashcardRow["status"]; // e.g. "deleted"
}

/**
 * Command Model for processing a decision on an AI-generated flashcard.
 */
export interface AcceptRejectAIFlashcardCommand {
  decision: "accept" | "reject";
}

/**
 * DTO for Accept/Reject Flashcard response.
 */
export interface AcceptRejectFlashcardResponseDTO {
  message: string;
  flashcard_id: string;
  status: "active" | "deleted";
}

// ============================================================================
// Learning (SRS) Types
// ============================================================================

/**
 * DTO for Fetch Today's Cards request (query parameters).
 */
export interface FetchTodayCardsRequestDTO {
  limit?: number; // Max cards to return (≤ 50)
}

/**
 * DTO representing the schedule state of a flashcard.
 * Derived from the FlashcardScheduleRow type.
 */
export type FlashcardScheduleDTO = Pick<
  FlashcardScheduleRow,
  "next_due" | "interval_days" | "repetition_count" | "ease_factor"
>;

/**
 * DTO representing a card due for review, including content split into question/answer.
 */
export interface LearningCardDTO {
  flashcardId: FlashcardRow["id"];
  question: string;
  answer: string;
  schedule: FlashcardScheduleDTO;
}

/**
 * DTO for Fetch Today's Cards response.
 */
export interface FetchTodayCardsResponseDTO {
  cards: LearningCardDTO[];
  count: number;
}

/**
 * DTO for Record Review Rating request.
 */
export interface RecordReviewRatingRequestDTO {
  flashcardId: string;
  rating: Rating; // "again" | "hard" | "good" | "easy"
}

/**
 * DTO describing the schedule change for a review.
 */
export interface ReviewScheduleChangeDTO {
  flashcardId: string;
  previous_schedule: FlashcardScheduleDTO;
  new_schedule: FlashcardScheduleDTO;
}

/**
 * DTO for Record Review Rating response.
 */
export interface RecordReviewResponseDTO {
  reviewed: ReviewScheduleChangeDTO;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface RegisterUserRequestDTO {
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface RegisterUserResponseDTO {
  message: string;
  user: { id: string; email: string };
}

export interface LoginUserRequestDTO {
  email: string;
  password: string;
}

export interface LoginUserResponseDTO {
  message: string;
  user: { id: string; email: string };
  redirectTo: string;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface ForgotPasswordResponseDTO {
  message: string;
}

export interface ResetPasswordRequestDTO {
  token: string;
  password: string;
}

export interface ResetPasswordResponseDTO {
  message: string;
}

export interface DeleteAccountRequestDTO {
  confirmationText: string;
}

export interface DeleteAccountResponseDTO {
  message: string;
}

export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string[] | string>;
}

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}
