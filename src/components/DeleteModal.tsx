// src/components/DeleteModal.tsx
import { useState } from "react";
import type { FlashcardSummaryDTO } from "../types";
import { Button } from "@/components/ui/button";
import { parseFlashcardContent } from "@/lib/utils/flashcardUtils";

/**
 * Props for DeleteModal component
 */
interface DeleteModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Flashcard to delete (null if modal is closed)
   */
  flashcard: FlashcardSummaryDTO | null;
  /**
   * Callback when modal should close
   */
  onClose: () => void;
  /**
   * Callback when flashcard is successfully deleted
   */
  onSuccess: () => void;
}

/**
 * DeleteModal component for confirming flashcard deletion.
 * Implements soft deletion via API integration.
 *
 * @param props - Component props
 * @returns Rendered delete confirmation modal
 */
export function DeleteModal({ isOpen, flashcard, onClose, onSuccess }: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render if not open
  if (!isOpen || !flashcard) {
    return null;
  }

  const { question } = parseFlashcardContent(flashcard.content);

  /**
   * Handles flashcard deletion
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // Make API request
      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete flashcard");
      }

      // Success - call callbacks
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Handles modal close
   */
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          handleClose();
        }
      }}
    >
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id="delete-modal-title" className="text-xl font-semibold text-foreground">
            Delete Flashcard
          </h2>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Error message */}
          {error && (
            <div
              className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Warning icon and message */}
          <div className="flex items-start mb-4">
            <svg
              className="w-6 h-6 text-destructive mr-3 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-foreground font-medium mb-2">Are you sure you want to delete this flashcard?</p>
              <div className="bg-muted/50 rounded-md px-3 py-2 mb-2">
                <p className="text-sm text-foreground font-medium">Question:</p>
                <p className="text-sm text-muted-foreground">{question}</p>
              </div>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
