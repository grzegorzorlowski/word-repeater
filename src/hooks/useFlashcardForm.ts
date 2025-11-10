import { useState, useMemo, useCallback } from "react";
import type { CreateManualFlashcardCommand, CreateManualFlashcardResponseDTO, FlashcardSummaryDTO } from "../types";

/**
 * ViewModel for the Manual Flashcard form.
 * Manages form state for both creation and editing modes.
 */
interface FlashcardFormViewModel {
  id?: string;
  question: string;
  answer: string;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  validationErrors: {
    question?: string;
    answer?: string;
  };
}

/**
 * Options for initializing the form hook
 */
interface UseFlashcardFormOptions {
  mode: "create" | "edit";
  initialData?: {
    id: string;
    question: string;
    answer: string;
  };
  onSuccess?: (flashcard: FlashcardSummaryDTO) => void;
}

/**
 * Custom hook encapsulating state, validation, and API integration for manual flashcard creation/editing.
 * Provides form field management, client-side validation, submit logic, and success/error state handling.
 */
export function useFlashcardForm(options: UseFlashcardFormOptions) {
  const { mode, initialData, onSuccess } = options;

  const [viewModel, setViewModel] = useState<FlashcardFormViewModel>({
    id: initialData?.id,
    question: initialData?.question || "",
    answer: initialData?.answer || "",
    isLoading: false,
    error: null,
    successMessage: null,
    validationErrors: {},
  });

  // Update question field
  const setQuestion = useCallback((newQuestion: string) => {
    setViewModel((prev) => ({
      ...prev,
      question: newQuestion,
      error: null,
      successMessage: null,
      validationErrors: {
        ...prev.validationErrors,
        question: undefined,
      },
    }));
  }, []);

  // Update answer field
  const setAnswer = useCallback((newAnswer: string) => {
    setViewModel((prev) => ({
      ...prev,
      answer: newAnswer,
      error: null,
      successMessage: null,
      validationErrors: {
        ...prev.validationErrors,
        answer: undefined,
      },
    }));
  }, []);

  // Validate form fields
  const validate = useCallback((): boolean => {
    const errors: { question?: string; answer?: string } = {};

    // Validate question
    const trimmedQuestion = viewModel.question.trim();
    if (!trimmedQuestion) {
      errors.question = "Question is required";
    } else if (trimmedQuestion.length > 300) {
      errors.question = "Question must not exceed 300 characters";
    }

    // Validate answer
    const trimmedAnswer = viewModel.answer.trim();
    if (!trimmedAnswer) {
      errors.answer = "Answer is required";
    } else if (trimmedAnswer.length > 500) {
      errors.answer = "Answer must not exceed 500 characters";
    }

    if (Object.keys(errors).length > 0) {
      setViewModel((prev) => ({
        ...prev,
        validationErrors: errors,
      }));
      return false;
    }

    return true;
  }, [viewModel.question, viewModel.answer]);

  // Derived: can submit if fields are non-empty and not currently loading
  const canSubmit = useMemo(() => {
    return viewModel.question.trim().length > 0 && viewModel.answer.trim().length > 0 && !viewModel.isLoading;
  }, [viewModel.question, viewModel.answer, viewModel.isLoading]);

  // Clear error
  const clearError = useCallback(() => {
    setViewModel((prev) => ({ ...prev, error: null }));
  }, []);

  // Submit flashcard creation/update
  const submit = useCallback(async () => {
    // Pre-submit validation
    if (!validate()) {
      return;
    }

    // Set loading state
    setViewModel((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      successMessage: null,
      validationErrors: {},
    }));

    try {
      const requestBody: CreateManualFlashcardCommand = {
        question: viewModel.question.trim(),
        answer: viewModel.answer.trim(),
      };

      // Determine endpoint and method based on mode
      const endpoint = mode === "create" ? "/api/flashcards" : `/api/flashcards/${viewModel.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Handle error responses
        let errorMessage = "An unexpected error occurred. Please try again.";

        if (response.status === 400) {
          const errorData = await response.json();
          errorMessage = errorData.error || "Validation failed.";
          if (errorData.details && Array.isArray(errorData.details)) {
            const detailMessages = errorData.details
              .map((d: { field: string; message: string }) => d.message)
              .join(" ");
            errorMessage = detailMessages || errorMessage;
          }
        } else if (response.status === 404 && mode === "edit") {
          errorMessage = "Flashcard not found.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        setViewModel((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        return;
      }

      // Success
      const data: CreateManualFlashcardResponseDTO = await response.json();

      setViewModel((prev) => ({
        ...prev,
        // Clear fields only in create mode to prevent duplicate submissions
        question: mode === "create" ? "" : prev.question,
        answer: mode === "create" ? "" : prev.answer,
        isLoading: false,
        successMessage:
          data.message || (mode === "create" ? "Flashcard created successfully!" : "Flashcard updated successfully!"),
      }));

      // Call onSuccess callback if provided
      if (onSuccess && data.flashcard) {
        onSuccess(data.flashcard);
      }
    } catch (err) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      }

      setViewModel((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [viewModel, validate, mode, onSuccess]);

  return {
    question: viewModel.question,
    setQuestion,
    answer: viewModel.answer,
    setAnswer,
    isLoading: viewModel.isLoading,
    error: viewModel.error,
    clearError,
    successMessage: viewModel.successMessage,
    validationErrors: viewModel.validationErrors,
    canSubmit,
    submit,
    mode,
  };
}
