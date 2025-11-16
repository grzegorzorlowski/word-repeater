import { useState, useMemo, useCallback } from "react";
import type { GenerateAIFlashcardsRequestDTO, GenerateAIFlashcardsResponseDTO, FlashcardSuggestionDTO } from "../types";

/**
 * ViewModel for the Generate Flashcards form.
 */
interface GenerateViewModel {
  text: string;
  charCount: number;
  isGenerating: boolean;
  error: string | null;
  showTruncateDialog: boolean;
  generatedFlashcards: FlashcardSuggestionDTO[];
  successMessage: string | null;
}

/**
 * Custom hook encapsulating state, validation, and API integration for flashcard generation.
 * Provides text input management, character count, submit logic with abort controller,
 * and success/error state handling.
 */
export function useFlashcardGeneration() {
  const [viewModel, setViewModel] = useState<GenerateViewModel>({
    text: "",
    charCount: 0,
    isGenerating: false,
    error: null,
    showTruncateDialog: false,
    generatedFlashcards: [],
    successMessage: null,
  });

  // Update text and character count
  const setText = useCallback((newText: string) => {
    setViewModel((prev) => ({
      ...prev,
      text: newText,
      charCount: newText.length,
      error: null,
      successMessage: null,
    }));
  }, []);

  // Derived: can submit if chars >= 500 and not generating
  // Note: We allow > 5000 so the button is clickable to trigger truncate dialog
  const canSubmit = useMemo(() => {
    return viewModel.charCount >= 500 && !viewModel.isGenerating;
  }, [viewModel.charCount, viewModel.isGenerating]);

  // Clear error
  const clearError = useCallback(() => {
    setViewModel((prev) => ({ ...prev, error: null }));
  }, []);

  // Set truncate dialog visibility
  const setShowTruncateDialog = useCallback((show: boolean) => {
    setViewModel((prev) => ({ ...prev, showTruncateDialog: show }));
  }, []);

  // Submit flashcard generation
  const submit = useCallback(
    async (overrideText?: string) => {
      // Use override text if provided (for truncate flow), otherwise use current viewModel text
      const text = overrideText ?? viewModel.text;
      const charCount = text.length;

      // Pre-submit validation
      if (charCount < 500) {
        setViewModel((prev) => ({
          ...prev,
          error: "Text must be at least 500 characters.",
        }));
        return;
      }

      if (charCount > 5000) {
        setViewModel((prev) => ({
          ...prev,
          error: "Text must not exceed 5000 characters.",
        }));
        return;
      }

      // Set generating state (and update text if override was provided)
      setViewModel((prev) => ({
        ...prev,
        text: overrideText ?? prev.text,
        charCount: text.length,
        isGenerating: true,
        error: null,
        successMessage: null,
        generatedFlashcards: [],
      }));

      // Create abort controller with 15s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const requestBody: GenerateAIFlashcardsRequestDTO = {
          text,
          limit: 20,
        };

        const response = await fetch("/api/flashcards/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle error responses
          let errorMessage = "An unexpected error occurred. Please try again.";

          if (response.status === 400) {
            const errorData = await response.json();
            errorMessage = errorData.message || "Validation failed.";
            if (errorData.details && Array.isArray(errorData.details)) {
              const detailMessages = errorData.details
                .map((d: { field: string; message: string }) => d.message)
                .join(" ");
              errorMessage = detailMessages || errorMessage;
            }
          } else if (response.status === 422) {
            errorMessage = "Couldn't generate flashcards from this text. Try adjusting the input.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }

          setViewModel((prev) => ({
            ...prev,
            isGenerating: false,
            error: errorMessage,
          }));
          return;
        }

        // Success
        const data: GenerateAIFlashcardsResponseDTO = await response.json();

        setViewModel((prev) => ({
          ...prev,
          text: "", // Clear text after successful generation
          charCount: 0,
          isGenerating: false,
          generatedFlashcards: data.flashcards,
          successMessage: data.message || "Flashcards generated successfully!",
        }));
      } catch (err) {
        clearTimeout(timeoutId);

        let errorMessage = "An unexpected error occurred. Please try again.";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMessage = "Request timed out. Please try again or use shorter text.";
          } else {
            errorMessage = err.message || errorMessage;
          }
        }

        setViewModel((prev) => ({
          ...prev,
          isGenerating: false,
          error: errorMessage,
        }));
      }
    },
    [viewModel]
  );

  return {
    text: viewModel.text,
    setText,
    charCount: viewModel.charCount,
    isGenerating: viewModel.isGenerating,
    error: viewModel.error,
    clearError,
    showTruncateDialog: viewModel.showTruncateDialog,
    setShowTruncateDialog,
    generatedFlashcards: viewModel.generatedFlashcards,
    successMessage: viewModel.successMessage,
    canSubmit,
    submit,
  };
}
