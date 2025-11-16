/**
 * AcceptFlashcardView Component
 * Main container component for the Accept Flashcard view.
 * Orchestrates state management, API integration, and renders child components.
 */
import * as React from "react";
import { useAcceptFlashcard } from "@/hooks/useAcceptFlashcard";
import { FullscreenCard } from "./FullscreenCard";
import { ActionButtons } from "./ActionButtons";
import InlineLoader from "./InlineLoader";
import ErrorToast from "./ErrorToast";

export function AcceptFlashcardView() {
  const { flashcard, loading, error, processDecision, clearError, retry } = useAcceptFlashcard();

  // State for success feedback
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  // Ref for action buttons container for focus management
  const actionButtonsRef = React.useRef<HTMLDivElement>(null);

  // Focus on action buttons when flashcard loads
  React.useEffect(() => {
    if (flashcard && !loading && actionButtonsRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const firstButton = actionButtonsRef.current?.querySelector("button");
        firstButton?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [flashcard, loading]);

  // Handle decision callback with success feedback
  const handleDecision = React.useCallback(
    async (decision: "accept" | "reject") => {
      // Show transition effect
      setIsTransitioning(true);

      // Process the decision
      await processDecision(decision);

      // Show success feedback
      const message = decision === "accept" ? "Flashcard accepted! ✓" : "Flashcard rejected";
      setSuccessMessage(message);

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setIsTransitioning(false);
      }, 2000);
    },
    [processDecision]
  );

  // Show loader during initial load
  if (loading && !flashcard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <InlineLoader visible={true} />
        <p className="mt-4 text-muted-foreground">Loading flashcards...</p>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !flashcard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-4">
          <p className="text-destructive font-medium mb-4">{error}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show "no flashcards" message
  if (!flashcard && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
        <div className="bg-muted/50 border border-border rounded-lg p-8">
          <h2 className="text-2xl font-semibold mb-3">All Done! 🎉</h2>
          <p className="text-muted-foreground mb-4">You&apos;ve reviewed all pending flashcards. Great work!</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Main view with flashcard
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-bold">Review Flashcard</h1>
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </a>
        </div>
        <p className="text-muted-foreground text-center">
          Review the question and answer, then decide whether to accept or reject this flashcard.
        </p>
      </div>

      {/* Flashcard Display with transition */}
      <div
        className={`transition-all duration-300 ${isTransitioning ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
        role="region"
        aria-live="polite"
        aria-label="Current flashcard"
      >
        {flashcard && <FullscreenCard flashcard={flashcard} />}
      </div>

      {/* Action Buttons with ref for focus management */}
      <div ref={actionButtonsRef}>
        <ActionButtons onDecision={handleDecision} disabled={loading || isTransitioning} />
      </div>

      {/* Success Feedback Toast */}
      {successMessage && (
        <div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300"
          role="status"
          aria-live="polite"
        >
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-medium">{successMessage}</div>
        </div>
      )}

      {/* Loading indicator during decision processing */}
      {loading && flashcard && (
        <div className="flex justify-center">
          <InlineLoader visible={true} />
        </div>
      )}

      {/* Error Toast */}
      {error && <ErrorToast message={error} onDismiss={clearError} />}
    </div>
  );
}
