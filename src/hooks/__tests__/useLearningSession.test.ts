/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLearningSession } from "../useLearningSession";
import type { LearningCardDTO } from "@/types";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

const createMockResponse = (data: any, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  clone: function () {
    return this;
  },
});

const mockSchedule = {
  next_due: "2025-01-28T12:00:00.000Z",
  interval_days: 1,
  repetition_count: 1,
  ease_factor: 2.5,
};

const mockCard: LearningCardDTO = {
  flashcardId: "card-1",
  question: "What is React?",
  answer: "A JavaScript library for building UIs",
  schedule: mockSchedule,
};

const mockTodayResponse = {
  cards: [mockCard],
  count: 1,
};

const mockReviewResponse = {
  reviewed: {
    flashcardId: "card-1",
    previous_schedule: mockSchedule,
    new_schedule: { ...mockSchedule, interval_days: 2 },
  },
};

/** Normalize fetch call: env may pass (url, options) or a single Request. */
function getFetchCall(call: unknown[]): { url: string; options?: RequestInit } {
  const first = call[0];
  if (first instanceof Request) {
    return { url: first.url, options: { method: first.method, credentials: first.credentials } };
  }
  return { url: String(first), options: (call[1] as RequestInit) ?? {} };
}

describe("useLearningSession", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial fetch", () => {
    it("should start with loading state", () => {
      fetchMock.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves to keep loading */
          })
      );

      const { result } = renderHook(() => useLearningSession());

      expect(result.current.loading).toBe(true);
      expect(result.current.cards).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it("should fetch today's cards on mount", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockTodayResponse));

      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(fetchMock).toHaveBeenCalled();
      const { url, options } = getFetchCall(fetchMock.mock.calls[0]);
      expect(url).toContain("/api/v1/learning/today");
      expect(options?.credentials).toBe("include");
      expect(result.current.cards).toHaveLength(1);
      expect(result.current.currentCard).toEqual(mockCard);
      expect(result.current.totalCards).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it("should handle fetch 401 with message", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 401));

      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("You must be logged in to review flashcards.");
      expect(result.current.cards).toEqual([]);
    });

    it("should handle fetch 500", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 500));

      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Server error. Please try again later.");
      expect(result.current.cards).toEqual([]);
    });

    it("should handle network error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.cards).toEqual([]);
    });

    it("should handle empty list (count 0)", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ cards: [], count: 0 }));

      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cards).toEqual([]);
      expect(result.current.totalCards).toBe(0);
      expect(result.current.currentCard).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("submitRating", () => {
    it("should submit rating and advance on 200", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockTodayResponse));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      fetchMock.mockResolvedValueOnce(createMockResponse(mockReviewResponse));

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const firstArg = lastCall[0];
      if (firstArg instanceof Request) {
        expect(firstArg.url).toContain("/api/v1/learning/review");
        expect(firstArg.method).toBe("POST");
        const body = await firstArg.clone().json();
        expect(body).toEqual({ flashcardId: "card-1", rating: "good" });
      } else {
        expect(firstArg).toContain("/api/v1/learning/review");
        expect(lastCall[1]).toMatchObject({
          method: "POST",
          body: JSON.stringify({ flashcardId: "card-1", rating: "good" }),
        });
      }
      expect(result.current.reviewedCount).toBe(1);
      expect(result.current.showAnswer).toBe(false);
      expect(result.current.currentIndex).toBe(1);
    });

    it("should skip card and set toast on 404", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockTodayResponse));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 404));

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.reviewedCount).toBe(1);
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.cardRemovedToast).toBe("This card was removed.");
    });

    it("should set error and not advance on 400", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockTodayResponse));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      fetchMock.mockResolvedValueOnce(createMockResponse({ error: "Invalid rating" }, false, 400));

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.error).toBe("Invalid rating");
      expect(result.current.reviewedCount).toBe(0);
      expect(result.current.currentIndex).toBe(0);
    });

    it("should do nothing when no currentCard", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ cards: [], count: 0 }));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("retry and clearError", () => {
    it("should retry fetch on retry()", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 500));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();

      fetchMock.mockResolvedValueOnce(createMockResponse(mockTodayResponse));

      await act(async () => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.cards).toHaveLength(1);
      });
    });

    it("should clear error on clearError()", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(null, false, 500));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("isSessionComplete and duration", () => {
    it("should set isSessionComplete when all cards reviewed", async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(mockTodayResponse));
      const { result } = renderHook(() => useLearningSession());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isSessionComplete).toBe(false);

      fetchMock.mockResolvedValueOnce(createMockResponse(mockReviewResponse));

      await act(async () => {
        await result.current.submitRating("good");
      });

      expect(result.current.isSessionComplete).toBe(true);
      expect(result.current.reviewedCount).toBe(1);
      expect(result.current.totalCards).toBe(1);
    });
  });
});
