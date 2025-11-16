import { Button } from "./ui/button";
import ErrorToast from "./ErrorToast";
import InlineLoader from "./InlineLoader";
import { useFlashcardForm } from "../hooks/useFlashcardForm";
import type { FlashcardSummaryDTO } from "../types";

interface ManualFlashcardFormProps {
  onSuccess?: (flashcard: FlashcardSummaryDTO) => void;
}

/**
 * Form component for manually creating flashcards.
 * Provides input fields for question and answer with real-time character counting and validation.
 */
export default function ManualFlashcardForm({ onSuccess }: ManualFlashcardFormProps) {
  const {
    question,
    setQuestion,
    answer,
    setAnswer,
    isLoading,
    error,
    clearError,
    successMessage,
    validationErrors,
    canSubmit,
    submit,
  } = useFlashcardForm({ onSuccess });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleRetry = () => {
    clearError();
    submit();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Create Flashcard</h1>
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
          <p className="text-muted-foreground">
            Enter a question and answer to create a new flashcard for your learning deck.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Field */}
          <div className="space-y-2">
            <label htmlFor="question" className="block text-sm font-medium">
              Question
              <span className="ml-1 text-muted-foreground">({question.length}/300)</span>
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question here..."
              disabled={isLoading}
              maxLength={300}
              rows={3}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                validationErrors.question
                  ? "border-destructive focus-visible:ring-destructive/20"
                  : "border-input bg-background"
              }`}
              aria-invalid={!!validationErrors.question}
              aria-describedby={validationErrors.question ? "question-error" : undefined}
            />
            {validationErrors.question && (
              <p id="question-error" className="text-sm text-destructive" role="alert">
                {validationErrors.question}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Write a clear and concise question for your flashcard.</p>
          </div>

          {/* Answer Field */}
          <div className="space-y-2">
            <label htmlFor="answer" className="block text-sm font-medium">
              Answer
              <span className="ml-1 text-muted-foreground">({answer.length}/500)</span>
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer here..."
              disabled={isLoading}
              maxLength={500}
              rows={5}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                validationErrors.answer
                  ? "border-destructive focus-visible:ring-destructive/20"
                  : "border-input bg-background"
              }`}
              aria-invalid={!!validationErrors.answer}
              aria-describedby={validationErrors.answer ? "answer-error" : undefined}
            />
            {validationErrors.answer && (
              <p id="answer-error" className="text-sm text-destructive" role="alert">
                {validationErrors.answer}
              </p>
            )}
            <p className="text-xs text-muted-foreground">Provide a detailed and accurate answer to help you learn.</p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={!canSubmit || isLoading} className="min-w-[140px]">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <InlineLoader visible={true} />
                  Saving...
                </span>
              ) : (
                "Save Flashcard"
              )}
            </Button>

            <Button type="button" variant="outline" asChild disabled={isLoading}>
              <a href="/dashboard">Cancel</a>
            </Button>

            {isLoading && <span className="text-sm text-muted-foreground">Saving your flashcard...</span>}
          </div>
        </form>

        {/* Success Message */}
        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="font-medium text-green-900 dark:text-green-100">{successMessage}</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your flashcard has been created and is ready for learning.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild>
                <a href="/dashboard">Back to Dashboard</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/flashcards">View All Flashcards</a>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Create Another
              </Button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && <ErrorToast message={error} onDismiss={clearError} onRetry={handleRetry} showRetry={true} />}
      </div>
    </div>
  );
}
