import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAcceptFlashcard } from "../useAcceptFlashcard";
import type { FlashcardSummaryDTO } from "@/types";

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

// Helper to create proper mock responses
const createMockResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  clone: function() { return this; }
});

describe("useAcceptFlashcard", () => {
  const mockFlashcard: FlashcardSummaryDTO = {
    id: "test-flashcard-id",
    content: JSON.stringify({
      question: "What is React?",
      answer: "A JavaScript library for building user interfaces"
    }),
    created_at: "2024-01-15T10:30:00.000Z"
  };

  const mockResponseData = {
    data: [mockFlashcard],
    page: 1,
    limit: 50,
    total: 1
  };

  const mockDecisionResponse = {
    message: "Flashcard accepted successfully",
    flashcard_id: "test-flashcard-id"
  };

  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with loading state", () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      expect(result.current.loading).toBe(true);
      expect(result.current.flashcard).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should fetch pending flashcards on mount", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://localhost:3000/api/flashcards?status=pending&source=ai_generated&limit=50"
        })
      );
      expect(result.current.flashcard).toEqual({
        id: "test-flashcard-id",
        question: "What is React?",
        answer: "A JavaScript library for building user interfaces"
      });
    });
  });

  describe("Data Fetching", () => {
    it("should handle successful flashcard fetch", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcard).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it("should handle fetch error with 401 status", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 401));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("You must be logged in to view flashcards.");
      expect(result.current.flashcard).toBeNull();
    });

    it("should handle fetch error with 500 status", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 500));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Server error. Please try again later.");
    });

    it("should handle network error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });

    it("should handle empty flashcard list", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({
        data: [],
        page: 1,
        limit: 50,
        total: 0
      }));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcard).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should parse flashcard content correctly", async () => {
      const contentWithMetadata = JSON.stringify({
        question: "Test question",
        answer: "Test answer"
      });

      fetchMock.mockResolvedValueOnce(createMockResponse({
        data: [{
          ...mockFlashcard,
          content: contentWithMetadata
        }],
        page: 1,
        limit: 50,
        total: 1
      }));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcard?.question).toBe("Test question");
      expect(result.current.flashcard?.answer).toBe("Test answer");
    });

    it("should handle malformed flashcard content", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({
        data: [{
          ...mockFlashcard,
          content: "invalid json"
        }],
        page: 1,
        limit: 50,
        total: 1
      }));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcard?.question).toBe("");
      expect(result.current.flashcard?.answer).toBe("");
    });
  });

  describe("Decision Processing", () => {
    it("should process accept decision successfully", async () => {
      // Setup initial flashcards
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup decision response
      fetchMock.mockResolvedValueOnce(createMockResponse(mockDecisionResponse));

      // Process decision
      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: `http://localhost:3000/api/flashcards/${mockFlashcard.id}/decision`,
          method: "POST"
        })
      );

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should process reject decision successfully", async () => {
      // Setup initial flashcards
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup decision response
      fetchMock.mockResolvedValueOnce(createMockResponse(mockDecisionResponse));

      // Process decision
      await act(async () => {
        await result.current.processDecision("reject");
      });

      expect(fetchMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          url: `http://localhost:3000/api/flashcards/${mockFlashcard.id}/decision`,
          method: "POST"
        })
      );
    });

    it("should move to next flashcard after decision", async () => {
      const secondFlashcard = {
        ...mockFlashcard,
        id: "second-flashcard-id",
        content: JSON.stringify({
          question: "Second question?",
          answer: "Second answer"
        })
      };

      fetchMock.mockResolvedValueOnce(createMockResponse({
        data: [mockFlashcard, secondFlashcard],
        page: 1,
        limit: 50,
        total: 2
      }));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.flashcard?.id).toBe("test-flashcard-id");

      // Setup decision response
      fetchMock.mockResolvedValueOnce(createMockResponse(mockDecisionResponse));

      // Process decision
      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(result.current.flashcard?.id).toBe("second-flashcard-id");
      expect(result.current.flashcard?.question).toBe("Second question?");
    });

    it("should handle decision error with 400 status", async () => {
      // Setup initial flashcards
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup error response
      fetchMock.mockResolvedValueOnce(createMockResponse({ message: "Invalid decision" }, false, 400));

      // Process decision
      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(result.current.error).toBe("Invalid decision");
      expect(result.current.loading).toBe(false);
    });

    it("should handle decision error with 404 status", async () => {
      // Setup initial flashcards
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup error response
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 404));

      // Process decision
      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(result.current.error).toBe("Flashcard not found.");
    });

    it("should handle network error during decision", async () => {
      // Setup initial flashcards
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Setup network error
      fetchMock.mockRejectedValueOnce(new Error("Network failed"));

      // Process decision
      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(result.current.error).toBe("Network failed");
    });

    it("should prevent processing decision when no flashcard is present", async () => {
      // Setup empty flashcard list
      fetchMock.mockResolvedValueOnce(createMockResponse({
        data: [],
        page: 1,
        limit: 50,
        total: 0
      }));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to process decision without flashcard
      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(fetchMock).toHaveBeenCalledTimes(1); // Only initial fetch
      expect(result.current.error).toBe("No flashcard to process.");
    });
  });

  describe("Error Management", () => {
    it("should clear error when clearError is called", async () => {
      // Setup error state
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 500));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should retry fetching flashcards", async () => {
      // Setup initial error
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 500));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Setup successful retry
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("State Management", () => {
    it("should set loading state during fetch", async () => {
      let resolveFetch: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      fetchMock.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useAcceptFlashcard());

      expect(result.current.loading).toBe(true);

      // Resolve the fetch
      resolveFetch({
        ok: true,
        json: () => Promise.resolve(mockResponseData)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should set loading state during decision processing", async () => {
      // Setup initial flashcards
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponseData));

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let resolveDecision: (value: any) => void;
      const decisionPromise = new Promise((resolve) => {
        resolveDecision = resolve;
      });

      fetchMock.mockReturnValueOnce(decisionPromise);

      // Start decision processing
      act(() => {
        result.current.processDecision("accept");
      });

      expect(result.current.loading).toBe(true);

      // Resolve decision
      resolveDecision({
        ok: true,
        json: () => Promise.resolve(mockDecisionResponse)
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("should maintain hasMore flag correctly", async () => {
      // Setup multiple flashcards
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [mockFlashcard, { ...mockFlashcard, id: "second-id" }],
          page: 1,
          limit: 50,
          total: 2
        }),
        clone: () => mockResponse // Add clone method
      };

      fetchMock.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useAcceptFlashcard());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify fetch was called
      expect(fetchMock).toHaveBeenCalled();

      expect(result.current.hasMore).toBe(true);

      // Process first decision
      fetchMock.mockResolvedValueOnce(createMockResponse(mockDecisionResponse));

      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(result.current.hasMore).toBe(true);

      // Process second decision (no more flashcards)
      fetchMock.mockResolvedValueOnce(createMockResponse(mockDecisionResponse));

      await act(async () => {
        await result.current.processDecision("accept");
      });

      expect(result.current.hasMore).toBe(false);
    });
  });
});

