// src/components/EditModal.tsx
import { useState, useEffect } from "react";
import type { FlashcardSummaryDTO } from "../types";
import { Button } from "@/components/ui/button";
import { parseFlashcardContent } from "@/lib/utils/flashcardUtils";

/**
 * Props for EditModal component
 */
interface EditModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Flashcard to edit (null if modal is closed)
   */
  flashcard: FlashcardSummaryDTO | null;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Callback when flashcard is successfully updated
   */
  onSuccess: () => void;
}

/**
 * EditModal component for editing flashcard question and answer.
 * Implements client-side validation and API integration.
 *
 * @param props - Component props
 * @returns Rendered edit modal
 */
export function EditModal({ isOpen, flashcard, onClose, onSuccess }: EditModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);

  // Update form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      const parsed = parseFlashcardContent(flashcard.content);
      setQuestion(parsed.question);
      setAnswer(parsed.answer);
      setError(null);
      setQuestionError(null);
      setAnswerError(null);
    }
  }, [flashcard]);

  // Don't render if not open
  if (!isOpen || !flashcard) {
    return null;
  }

  /**
   * Validates form fields
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Validate question
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length === 0) {
      setQuestionError("Question is required");
      isValid = false;
    } else if (trimmedQuestion.length > 300) {
      setQuestionError("Question must not exceed 300 characters");
      isValid = false;
    } else {
      setQuestionError(null);
    }

    // Validate answer
    const trimmedAnswer = answer.trim();
    if (trimmedAnswer.length === 0) {
      setAnswerError("Answer is required");
      isValid = false;
    } else if (trimmedAnswer.length > 500) {
      setAnswerError("Answer must not exceed 500 characters");
      isValid = false;
    } else {
      setAnswerError(null);
    }

    return isValid;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Make API request
      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update flashcard");
      }

      // Success - call callbacks
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles modal close
   */
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="edit-modal-title" className="text-xl font-semibold text-foreground">
            Edit Flashcard
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {/* Error message */}
          {error && (
            <div
              className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Question field */}
          <div className="mb-4">
            <label htmlFor="edit-question" className="block text-sm font-medium text-foreground mb-2">
              Question
            </label>
            <textarea
              id="edit-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
                questionError ? "border-destructive" : "border-input"
              }`}
              rows={3}
              maxLength={300}
              aria-invalid={!!questionError}
              aria-describedby={questionError ? "question-error" : undefined}
            />
            <div className="flex justify-between mt-1">
              <div>
                {questionError && (
                  <p id="question-error" className="text-sm text-destructive">
                    {questionError}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{question.length}/300</p>
            </div>
          </div>

          {/* Answer field */}
          <div className="mb-6">
            <label htmlFor="edit-answer" className="block text-sm font-medium text-foreground mb-2">
              Answer
            </label>
            <textarea
              id="edit-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring ${
                answerError ? "border-destructive" : "border-input"
              }`}
              rows={4}
              maxLength={500}
              aria-invalid={!!answerError}
              aria-describedby={answerError ? "answer-error" : undefined}
            />
            <div className="flex justify-between mt-1">
              <div>
                {answerError && (
                  <p id="answer-error" className="text-sm text-destructive">
                    {answerError}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{answer.length}/500</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
