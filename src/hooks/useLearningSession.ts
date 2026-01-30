import { useState, useEffect, useCallback } from "react";
import type {
  LearningCardDTO,
  Rating,
  FetchTodayCardsResponseDTO,
  RecordReviewRatingRequestDTO,
  ErrorResponseDTO,
} from "../types";

const TODAY_API_URL = "/api/v1/learning/today";
const REVIEW_API_URL = "/api/v1/learning/review";
const DEFAULT_LIMIT = 50;

/**
 * View model returned by useLearningSession for the Learning Session view.
 */
export interface LearningSessionViewModel {
  cards: LearningCardDTO[];
  currentCard: LearningCardDTO | null;
  currentIndex: number;
  totalCards: number;
  showAnswer: boolean;
  setShowAnswer: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  sessionStartTime: number | null;
  reviewedCount: number;
  submitting: boolean;
  cardRemovedToast: string | null;
  isSessionComplete: boolean;
  durationSeconds: number;
  durationMinutes: number;
  submitRating: (rating: Rating) => Promise<void>;
  retry: () => void;
  clearError: () => void;
}

/**
 * Custom hook for managing the Learning Session view state and API interactions.
 * Fetches today's cards on mount, handles rating submission, and tracks session progress.
 */
export function useLearningSession(): LearningSessionViewModel {
  const [cards, setCards] = useState<LearningCardDTO[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswerState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [cardRemovedToast, setCardRemovedToast] = useState<string | null>(null);

  const currentCard = cards[currentIndex] ?? null;
  const totalCards = cards.length;
  const isSessionComplete = totalCards > 0 && reviewedCount >= totalCards;
  const now = Date.now();
  const durationSeconds = sessionStartTime != null ? Math.floor((now - sessionStartTime) / 1000) : 0;
  const durationMinutes = Math.max(0, Math.floor(durationSeconds / 60));

  const setShowAnswer = useCallback((value: boolean) => {
    setShowAnswerState(value);
  }, []);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${TODAY_API_URL}?limit=${DEFAULT_LIMIT}`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok) {
        let errorMessage = "Failed to load flashcards.";

        if (response.status === 401) {
          errorMessage = "You must be logged in to review flashcards.";
        } else if (response.status === 422) {
          errorMessage = "Invalid request. Please try again.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        } else {
          const errorData: ErrorResponseDTO = await response.json().catch(() => ({}));
          errorMessage = errorData.error ?? errorMessage;
        }

        setError(errorMessage);
        setLoading(false);
        setCards([]);
        return;
      }

      const data: FetchTodayCardsResponseDTO = await response.json();
      const fetchedCards = data.cards ?? [];
      const count = data.count ?? fetchedCards.length;

      setCards(count === 0 ? [] : fetchedCards);
      setCurrentIndex(0);
      setShowAnswerState(false);
      setReviewedCount(0);

      if (count > 0) {
        setSessionStartTime((prev) => (prev == null ? Date.now() : prev));
      }

      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setCards([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const submitRating = useCallback(
    async (rating: Rating) => {
      if (!currentCard) return;

      setSubmitting(true);
      setError(null);

      const body: RecordReviewRatingRequestDTO = {
        flashcardId: currentCard.flashcardId,
        rating,
      };

      try {
        const response = await fetch(REVIEW_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (response.status === 404) {
          setCardRemovedToast("This card was removed.");
          setReviewedCount((c) => c + 1);
          setShowAnswerState(false);
          setCurrentIndex((i) => i + 1);
          setSubmitting(false);
          return;
        }

        if (!response.ok) {
          let errorMessage = "Could not save your rating. Try again.";

          if (response.status === 400 || response.status === 422) {
            const errorData: ErrorResponseDTO = await response.json().catch(() => ({}));
            errorMessage = errorData.error ?? errorMessage;
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again.";
          }

          setError(errorMessage);
          setSubmitting(false);
          return;
        }

        await response.json();

        setReviewedCount((c) => c + 1);
        setShowAnswerState(false);
        setCurrentIndex((i) => i + 1);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Could not save your rating. Try again.";
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [currentCard]
  );

  const retry = useCallback(() => {
    setError(null);
    fetchToday();
  }, [fetchToday]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear "card removed" toast after 3 seconds
  useEffect(() => {
    if (!cardRemovedToast) return;
    const timer = setTimeout(() => setCardRemovedToast(null), 3000);
    return () => clearTimeout(timer);
  }, [cardRemovedToast]);

  return {
    cards,
    currentCard,
    currentIndex,
    totalCards,
    showAnswer,
    setShowAnswer,
    loading,
    error,
    sessionStartTime,
    reviewedCount,
    submitting,
    cardRemovedToast,
    isSessionComplete,
    durationSeconds,
    durationMinutes,
    submitRating,
    retry,
    clearError,
  };
}
