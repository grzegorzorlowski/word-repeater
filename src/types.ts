// src/types.ts

// Import the Database type from the database models
import type { Database } from "./db/database.types";

// Alias to the flashcard row type from the DB model for convenience.
export type FlashcardRow = Database["public"]["Tables"]["flashcards"]["Row"];

/**
 * DTO for Generate AI Flashcards request.
 */
export interface GenerateAIFlashcardsRequestDTO {
  // User input text up to 5000 characters.
  text: string;
  // Limit for processing, may be used for character or flashcard generation limits.
  limit: number;
}

/**
 * DTO representing an AI-generated flashcard suggestion.
 */
export interface FlashcardSuggestionDTO {
  // Temporary id from the suggestion, can be null if not yet persisted.
  id?: string | null;
  // Generated question.
  question: string;
  // Generated answer.
  answer: string;
}

/**
 * DTO for Generate AI Flashcards response.
 */
export interface GenerateAIFlashcardsResponseDTO {
  // List of AI-generated flashcard suggestions.
  flashcards: FlashcardSuggestionDTO[];
  // Status message.
  message: string;
}

/**
 * DTO summarizing a flashcard.
 * This is connected to the underlying database entity using Pick.
 */
export type FlashcardSummaryDTO = Pick<FlashcardRow, "id" | "content" | "created_at">;

/**
 * DTO for List User Flashcards response.
 */
export interface ListUserFlashcardsResponseDTO {
  // Array of flashcard summaries.
  data: FlashcardSummaryDTO[];
  // Current page number.
  page: number;
  // Limit, i.e. number of items per page.
  limit: number;
  // Total number of flashcards.
  total: number;
}

/**
 * Command Model for creating a manual flashcard.
 * The command model captures the raw inputs from the API,
 * which will then be transformed (e.g. concatenating question and answer into content)
 * before storing in the database.
 */
export interface CreateManualFlashcardCommand {
  // The question part of the flashcard.
  question: string;
  // The answer part of the flashcard.
  answer: string;
  // Optional metadata; may include tags or additional details.
  metadata?: Record<string, unknown>;
}

/**
 * DTO for Create Manual Flashcard response.
 */
export interface CreateManualFlashcardResponseDTO {
  // Status message indicating the flashcard was created.
  message: string;
  // The created flashcard summary.
  flashcard: FlashcardSummaryDTO;
}

/**
 * Command Model for updating an existing flashcard.
 * Represents the fields that can be modified by the user.
 */
export interface UpdateFlashcardCommand {
  // Updated question.
  question: string;
  // Updated answer.
  answer: string;
}

/**
 * Command Model for processing a decision on an AI-generated flashcard.
 * 'decision' must be either "accept" or "reject".
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

/**
 * ViewModel for Dashboard view state management.
 * Used for managing loading and error states.
 */
export interface DashboardViewModel {
  // True if any API call is in progress.
  loading: boolean;
  // Error message if applicable.
  error: string | null;
}

// ============================================================================
// Authentication Types
// ============================================================================

/**
 * DTO for user registration request
 */
export interface RegisterUserRequestDTO {
  email: string;
  password: string;
  acceptTerms: boolean;
}

/**
 * DTO for user registration response
 */
export interface RegisterUserResponseDTO {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * DTO for user login request
 */
export interface LoginUserRequestDTO {
  email: string;
  password: string;
}

/**
 * DTO for user login response
 */
export interface LoginUserResponseDTO {
  message: string;
  user: {
    id: string;
    email: string;
  };
  redirectTo: string;
}

/**
 * DTO for password reset request
 */
export interface ForgotPasswordRequestDTO {
  email: string;
}

/**
 * DTO for password reset response
 */
export interface ForgotPasswordResponseDTO {
  message: string;
}

/**
 * DTO for password reset confirmation request
 */
export interface ResetPasswordRequestDTO {
  token: string;
  password: string;
}

/**
 * DTO for password reset confirmation response
 */
export interface ResetPasswordResponseDTO {
  message: string;
}

/**
 * DTO for account deletion request
 */
export interface DeleteAccountRequestDTO {
  confirmationText: string;
}

/**
 * DTO for account deletion response
 */
export interface DeleteAccountResponseDTO {
  message: string;
}

/**
 * Generic error response DTO
 */
export interface ErrorResponseDTO {
  error: string;
  details?: Record<string, string[] | string>;
}

/**
 * User info extracted from session
 */
export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

// Additional DTOs for other API endpoints (e.g. delete) can be added as needed.
