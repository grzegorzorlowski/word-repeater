/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFlashcardList } from "../useFlashcardList";
import type { FlashcardSummaryDTO } from "@/types";

// Mock flashcard data for testing
const mockFlashcards: FlashcardSummaryDTO[] = [
  {
    id: "flashcard-1",
    content: JSON.stringify({
      question: "What is React?",
      answer: "A JavaScript library for building user interfaces",
    }),
    created_at: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "flashcard-2",
    content: JSON.stringify({
      question: "What is TypeScript?",
      answer: "A typed superset of JavaScript",
    }),
    created_at: "2024-01-16T14:20:00.000Z",
  },
];

// Mock API responses
const createMockResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  clone: function () {
    return this;
  },
});

describe("useFlashcardList", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with correct default state", () => {
      // Mock successful API response
      const mockResponse = {
        data: [],
        page: 1,
        limit: 10,
        total: 0,
      };

      global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      expect(result.current.flashcards).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.limit).toBe(10);
      expect(result.current.total).toBe(0);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.filters).toEqual({
        source: "",
        status: "",
      });
    });
  });

  describe("API Integration", () => {
    it("should fetch flashcards successfully on mount", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for the API call to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcards).toEqual(mockFlashcards);
      expect(result.current.total).toBe(2);
      expect(result.current.error).toBeNull();

      // Verify API was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10");
    });

    it("should handle API errors gracefully", async () => {
      const errorMessage = "Failed to fetch flashcards";
      global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse({ error: errorMessage }, false, 500));

      const { result } = renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcards).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network error");
      global.fetch = vi.fn().mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcards).toEqual([]);
      expect(result.current.error).toBe("Network error");
    });

    it("should handle non-Error exceptions with generic message", async () => {
      // Simulate a non-Error exception (e.g., string, null, object)
      global.fetch = vi.fn().mockRejectedValueOnce("Something went wrong");

      const { result } = renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcards).toEqual([]);
      expect(result.current.error).toBe("An unexpected error occurred");
    });
  });

  describe("Filtering", () => {
    it("should apply source filter correctly", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Apply source filter
      act(() => {
        result.current.setFilters({ source: "ai_generated" });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10&source=ai_generated");
      });

      expect(result.current.filters.source).toBe("ai_generated");
      expect(result.current.page).toBe(1); // Should reset to page 1 when filters change
    });

    it("should apply status filter correctly", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Apply status filter
      act(() => {
        result.current.setFilters({ status: "active" });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10&status=active");
      });

      expect(result.current.filters.status).toBe("active");
    });

    it("should apply multiple filters correctly", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Apply multiple filters
      act(() => {
        result.current.setFilters({ source: "manual", status: "pending" });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10&source=manual&status=pending");
      });

      expect(result.current.filters).toEqual({
        source: "manual",
        status: "pending",
      });
    });

    it("should clear filters when set to empty strings", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Apply filters first
      act(() => {
        result.current.setFilters({ source: "manual", status: "active" });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10&source=manual&status=active");
      });

      // Clear filters
      act(() => {
        result.current.setFilters({ source: "", status: "" });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10");
      });

      expect(result.current.filters).toEqual({
        source: "",
        status: "",
      });
    });
  });

  describe("Pagination", () => {
    it("should change page correctly", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 25,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Change page
      act(() => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=2&limit=10");
      });

      expect(result.current.page).toBe(2);
    });

    it("should not change page to invalid values", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 25,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to set invalid page
      act(() => {
        result.current.setPage(0);
      });

      // Should not trigger API call or change page
      expect(result.current.page).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial call
    });

    it("should handle pagination with filters correctly", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 25,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Apply filter
      act(() => {
        result.current.setFilters({ source: "ai_generated" });
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=1&limit=10&source=ai_generated");
      });

      // Change page with filter active
      act(() => {
        result.current.setPage(3);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=3&limit=10&source=ai_generated");
      });
    });
  });

  describe("Refetch Functionality", () => {
    it("should refetch data when refetch is called", async () => {
      const initialResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      const updatedResponse = {
        data: [mockFlashcards[0]], // One less flashcard
        page: 1,
        limit: 10,
        total: 1,
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(createMockResponse(initialResponse))
        .mockResolvedValueOnce(createMockResponse(updatedResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcards).toHaveLength(2);

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(1);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should refetch with current filters and pagination", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      global.fetch = vi.fn().mockResolvedValue(createMockResponse(mockResponse));

      const { result } = renderHook(() => useFlashcardList());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Set up filters and pagination
      act(() => {
        result.current.setFilters({ source: "manual" });
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=2&limit=10&source=manual");
      });

      // Reset mock call count
      global.fetch.mockClear();

      // Trigger refetch
      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/flashcards?page=2&limit=10&source=manual");
      });
    });
  });

  describe("Loading States", () => {
    it("should set loading to true during API calls", async () => {
      const mockResponse = {
        data: mockFlashcards,
        page: 1,
        limit: 10,
        total: 2,
      };

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useFlashcardList());

      // Should be loading initially
      expect(result.current.loading).toBe(true);

      // Resolve the promise
      resolvePromise!(createMockResponse(mockResponse));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should reset loading state on error", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useFlashcardList());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Network error");
      });
    });
  });
});
