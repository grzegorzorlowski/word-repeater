import { useState, useEffect, useCallback } from "react";
import type { AcceptRejectAIFlashcardCommand, ListUserFlashcardsResponseDTO, FlashcardSummaryDTO } from "../types";

/**
 * Represents a flashcard with question and answer extracted from content.
 */
interface FlashcardDisplay {
  id: string;
  question: string;
  answer: string;
}

/**
 * ViewModel for the Accept Flashcard view.
 */
interface AcceptFlashcardViewModel {
  flashcard: FlashcardDisplay | null;
  pendingFlashcards: FlashcardDisplay[];
  loading: boolean;
  error: string | null;
}

/**
 * Parses flashcard content from the database format.
 * Expected format: JSON string with question and answer properties
 * Example: { "question": "What is...", "answer": "It is..." }
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
 * Converts FlashcardSummaryDTO to FlashcardDisplay.
 */
function convertToDisplay(flashcard: FlashcardSummaryDTO): FlashcardDisplay {
  const { question, answer } = parseFlashcardContent(flashcard.content);
  return {
    id: flashcard.id,
    question,
    answer,
  };
}

/**
 * Custom hook for managing the Accept Flashcard view state and API interactions.
 * Handles fetching pending flashcards and processing accept/reject decisions.
 */
export function useAcceptFlashcard() {
  const [viewModel, setViewModel] = useState<AcceptFlashcardViewModel>({
    flashcard: null,
    pendingFlashcards: [],
    loading: true,
    error: null,
  });

  /**
   * Fetches pending flashcards from the API.
   */
  const fetchPendingFlashcards = useCallback(async () => {
    setViewModel((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/flashcards?status=pending&source=ai_generated&limit=50");

      if (!response.ok) {
        let errorMessage = "Failed to fetch pending flashcards.";

        if (response.status === 401) {
          errorMessage = "You must be logged in to view flashcards.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        setViewModel((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return;
      }

      const data: ListUserFlashcardsResponseDTO = await response.json();

      // Convert flashcards to display format
      const displayFlashcards = data.data.map(convertToDisplay);

      setViewModel((prev) => ({
        ...prev,
        loading: false,
        flashcard: displayFlashcards[0] || null,
        pendingFlashcards: displayFlashcards.slice(1),
      }));
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      setViewModel((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Load pending flashcards on mount.
   */
  useEffect(() => {
    fetchPendingFlashcards();
  }, [fetchPendingFlashcards]);

  /**
   * Processes a decision (accept or reject) for the current flashcard.
   */
  const processDecision = useCallback(
    async (decision: "accept" | "reject") => {
      // Guard: ensure we have a current flashcard
      if (!viewModel.flashcard) {
        setViewModel((prev) => ({
          ...prev,
          error: "No flashcard to process.",
        }));
        return;
      }

      const flashcardId = viewModel.flashcard.id;

      setViewModel((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const requestBody: AcceptRejectAIFlashcardCommand = { decision };

        const response = await fetch(`/api/flashcards/${flashcardId}/decision`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          let errorMessage = `Failed to ${decision} flashcard.`;

          if (response.status === 400) {
            const errorData = await response.json();
            errorMessage = errorData.message || "Invalid request.";
          } else if (response.status === 404) {
            errorMessage = "Flashcard not found.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }

          setViewModel((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
          return;
        }

        // Successfully processed - response could contain additional info if needed
        await response.json();

        // Move to the next flashcard
        setViewModel((prev) => {
          const nextFlashcard = prev.pendingFlashcards[0] || null;
          const remainingFlashcards = prev.pendingFlashcards.slice(1);

          return {
            ...prev,
            loading: false,
            flashcard: nextFlashcard,
            pendingFlashcards: remainingFlashcards,
          };
        });
      } catch (err) {
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (err instanceof Error) {
          errorMessage = err.message || errorMessage;
        }

        setViewModel((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [viewModel.flashcard]
  );

  /**
   * Clears the error state.
   */
  const clearError = useCallback(() => {
    setViewModel((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Retries fetching pending flashcards.
   */
  const retry = useCallback(() => {
    fetchPendingFlashcards();
  }, [fetchPendingFlashcards]);

  return {
    flashcard: viewModel.flashcard,
    loading: viewModel.loading,
    error: viewModel.error,
    hasMore: viewModel.pendingFlashcards.length > 0 || viewModel.flashcard !== null,
    processDecision,
    clearError,
    retry,
  };
}
