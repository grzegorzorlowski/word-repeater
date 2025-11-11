// src/hooks/useFlashcardList.ts
import { useState, useEffect, useCallback } from "react";
import type { FlashcardSummaryDTO } from "../types";

/**
 * Filter options for flashcard list
 */
interface FlashcardFilters {
  source: "ai_generated" | "manual" | "";
  status: "active" | "pending" | "";
}

/**
 * State interface for the flashcard list view
 */
interface FlashcardListState {
  flashcards: FlashcardSummaryDTO[];
  page: number;
  limit: number;
  total: number;
  loading: boolean;
  error: string | null;
  filters: FlashcardFilters;
}

/**
 * Custom hook for managing flashcard list state and API integration.
 * Handles fetching, filtering, pagination, and refetching of flashcards.
 *
 * @returns Object containing state and methods for managing flashcard list
 */
export function useFlashcardList() {
  const [state, setState] = useState<FlashcardListState>({
    flashcards: [],
    page: 1,
    limit: 10,
    total: 0,
    loading: true,
    error: null,
    filters: {
      source: "",
      status: "",
    },
  });

  /**
   * Fetches flashcards from the API based on current state
   */
  const fetchFlashcards = useCallback(async () => {
    // Set loading state
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: state.page.toString(),
        limit: state.limit.toString(),
      });

      // Add optional filters if present
      if (state.filters.source) {
        params.append("source", state.filters.source);
      }
      if (state.filters.status) {
        params.append("status", state.filters.status);
      }

      // Make API request
      const response = await fetch(`/api/flashcards?${params.toString()}`);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch flashcards");
      }

      // Parse response
      const data = await response.json();

      // Update state with fetched data
      setState((prev) => ({
        ...prev,
        flashcards: data.data || [],
        total: data.total || 0,
        loading: false,
        error: null,
      }));
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [state.page, state.limit, state.filters.source, state.filters.status]);

  /**
   * Changes the current page and triggers a refetch
   */
  const setPage = useCallback((newPage: number) => {
    if (newPage < 1) return;
    setState((prev) => ({ ...prev, page: newPage }));
  }, []);

  /**
   * Updates filter values and resets to page 1
   */
  const setFilters = useCallback((newFilters: Partial<FlashcardFilters>) => {
    setState((prev) => ({
      ...prev,
      page: 1, // Reset to first page when filters change
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  /**
   * Manually triggers a refetch of flashcards
   */
  const refetch = useCallback(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Fetch flashcards when dependencies change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  return {
    // State
    flashcards: state.flashcards,
    page: state.page,
    limit: state.limit,
    total: state.total,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    // Methods
    setPage,
    setFilters,
    refetch,
  };
}
