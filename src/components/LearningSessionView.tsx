import { useEffect, useRef } from "react";
import { useLearningSession } from "@/hooks/useLearningSession";
import InlineLoader from "./InlineLoader";
import ErrorToast from "./ErrorToast";
import EmptyLearningState from "./EmptyLearningState";
import LearningCardDisplay from "./LearningCardDisplay";
import RatingButtons from "./RatingButtons";
import ProgressIndicator from "./ProgressIndicator";
import SessionSummary from "./SessionSummary";

/**
 * Root container for the Learning Session page. Fetches today's cards on mount,
 * holds state via useLearningSession, and renders loading, error, empty,
 * active card, or session summary.
 */
export default function LearningSessionView() {
  const {
    currentCard,
    totalCards,
    currentIndex,
    showAnswer,
    setShowAnswer,
    loading,
    error,
    isSessionComplete,
    durationMinutes,
    durationSeconds,
    reviewedCount,
    submitRating,
    retry,
    clearError,
    submitting,
    cardRemovedToast,
  } = useLearningSession();

  const UNAUTHORIZED_MESSAGE = "You must be logged in to review flashcards.";
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const sessionEndSentRef = useRef(false);

  // Analytics: record learning session end when session completes (US-018, RF-025)
  useEffect(() => {
    if (!isSessionComplete || sessionEndSentRef.current) return;
    sessionEndSentRef.current = true;
    fetch("/api/v1/learning/session-end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        cardsReviewed: reviewedCount,
        durationSeconds,
      }),
    }).catch(() => {
      // Fire-and-forget; do not block UI
    });
  }, [isSessionComplete, reviewedCount, durationSeconds]);

  // Focus: after advance, focus next card's "Show Answer" or summary heading when complete
  useEffect(() => {
    if (loading) return;

    if (isSessionComplete) {
      const summaryHeading = document.getElementById("session-summary-heading");
      (summaryHeading as HTMLElement)?.focus();
      return;
    }

    if (currentCard && cardContainerRef.current) {
      const showAnswerBtn = cardContainerRef.current.querySelector<HTMLButtonElement>(
        '[data-testid="show-answer-button"]'
      );
      showAnswerBtn?.focus();
    }
  }, [currentIndex, currentCard, isSessionComplete, loading]);

  // Loading: initial fetch
  if (loading && totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]" data-testid="learning-loading">
        <InlineLoader visible={true} data-testid="inline-loader" />
        <p className="mt-4 text-muted-foreground">Loading flashcards...</p>
      </div>
    );
  }

  // Fetch error: no cards loaded
  if (error && totalCards === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-4"
        data-testid="learning-fetch-error"
        role="alert"
        aria-live="polite"
      >
        <ErrorToast message={error} onDismiss={clearError} onRetry={retry} showRetry={true} />
        {error === UNAUTHORIZED_MESSAGE && (
          <a
            href="/login"
            className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
            data-testid="login-link"
          >
            Log in
          </a>
        )}
      </div>
    );
  }

  // Empty: no cards today
  if (totalCards === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="learning-empty">
        <EmptyLearningState />
      </div>
    );
  }

  // Session complete: all cards reviewed
  if (isSessionComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto" data-testid="learning-summary">
        <SessionSummary cardsReviewed={reviewedCount} durationMinutes={durationMinutes} />
      </div>
    );
  }

  // Active session: show current card
  if (!currentCard) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto" data-testid="learning-active">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Learning Session</h1>
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            aria-label="Back to Dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12l7.5 7.5M20.25 4.5v15m0-15h-15"
              />
            </svg>
            Dashboard
          </a>
        </div>
        <ProgressIndicator current={currentIndex + 1} total={totalCards} />
      </header>

      <div
        ref={cardContainerRef}
        role="region"
        aria-live="polite"
        aria-label="Current flashcard"
        key={currentCard.flashcardId}
        className="animate-in fade-in duration-300"
      >
        <LearningCardDisplay
          question={currentCard.question}
          answer={currentCard.answer}
          answerVisible={showAnswer}
          onShowAnswer={() => setShowAnswer(true)}
          cardId={currentCard.flashcardId}
        />
      </div>

      {showAnswer && <RatingButtons onRate={submitRating} disabled={submitting} answerVisible={showAnswer} />}

      {loading && currentCard && (
        <div className="flex justify-center">
          <InlineLoader visible={true} data-testid="submit-loader" />
        </div>
      )}

      {error && currentCard && <ErrorToast message={error} onDismiss={clearError} />}

      {cardRemovedToast && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-muted bg-muted/50 px-4 py-2 text-sm text-muted-foreground"
          data-testid="card-removed-toast"
        >
          {cardRemovedToast}
        </div>
      )}
    </div>
  );
}
