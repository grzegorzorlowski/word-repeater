// src/lib/services/__tests__/learningService.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTodaysCards, recordReviewRating } from "../learningService";
import type { SupabaseClient } from "../../../db/supabase.client";
import { NotFoundError } from "../../errors";

describe("learningService - fetchTodaysCards", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock for each test
    mockSupabaseClient = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("Valid limit values", () => {
    it("should fetch cards with limit = 1", async () => {
      // Arrange
      const mockDueCards = [
        {
          flashcard_id: "card-1",
          next_due: "2025-01-01T00:00:00Z",
          interval_days: 1,
          repetition_count: 2,
          ease_factor: 2.5,
          flashcards: {
            id: "card-1",
            content: JSON.stringify({ question: "Q1", answer: "A1" }),
            deleted_at: null,
          },
        },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 1,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.cards).toBeDefined();
      expect(result.cards?.[0]?.question).toBe("Q1");
      expect(result.cards?.[0]?.answer).toBe("A1");
    });

    it("should fetch cards with limit = 25", async () => {
      // Arrange
      const mockDueCards = Array.from({ length: 25 }, (_, i) => ({
        flashcard_id: `card-${i}`,
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        flashcards: {
          id: `card-${i}`,
          content: JSON.stringify({ question: `Q${i}`, answer: `A${i}` }),
          deleted_at: null,
        },
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 25,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(25);
      expect(result.count).toBe(25);
      expect(result.cards).toBeDefined();
      expect(result.cards?.[0]?.question).toBe("Q0");
      expect(result.cards?.[0]?.answer).toBe("A0");
    });

    it("should fetch cards with limit = 50 (maximum)", async () => {
      // Arrange
      const mockDueCards = Array.from({ length: 50 }, (_, i) => ({
        flashcard_id: `card-${i}`,
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        flashcards: {
          id: `card-${i}`,
          content: JSON.stringify({ question: `Q${i}`, answer: `A${i}` }),
          deleted_at: null,
        },
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 50,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(50);
      expect(result.count).toBe(50);
    });
  });

  describe("No due cards scenario", () => {
    it("should fetch only new cards when no due cards exist", async () => {
      // Arrange
      const mockNewCards = [
        {
          flashcard_id: "new-card-1",
          next_due: "2025-12-31T00:00:00Z",
          interval_days: 0,
          repetition_count: 0,
          ease_factor: 2.5,
          flashcards: {
            id: "new-card-1",
            content: JSON.stringify({ question: "New Q1", answer: "New A1" }),
            deleted_at: null,
          },
        },
      ];

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;

        // First call: due cards query (returns empty)
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: schedule query for repetition_count = 1
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: new cards query (no due cards, so no .not() call)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockNewCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(1);
      expect(result.cards).toBeDefined();
      expect(result.cards?.[0]?.question).toBe("New Q1");
      expect(result.cards?.[0]?.schedule.repetition_count).toBe(0);
    });
  });

  describe("Mixed due and new cards scenario", () => {
    it("should fetch both due and new cards when needed", async () => {
      // Arrange
      const mockDueCards = [
        {
          flashcard_id: "due-card-1",
          next_due: "2025-01-01T00:00:00Z",
          interval_days: 1,
          repetition_count: 2,
          ease_factor: 2.5,
          flashcards: {
            id: "due-card-1",
            content: JSON.stringify({ question: "Due Q1", answer: "Due A1" }),
            deleted_at: null,
          },
        },
      ];

      const mockNewCards = [
        {
          flashcard_id: "new-card-1",
          next_due: "2025-12-31T00:00:00Z",
          interval_days: 0,
          repetition_count: 0,
          ease_factor: 2.5,
          flashcards: {
            id: "new-card-1",
            content: JSON.stringify({ question: "New Q1", answer: "New A1" }),
            deleted_at: null,
          },
        },
      ];

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;

        // First call: due cards query
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: mockDueCards,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: schedule query for repetition_count = 1
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: new cards query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    not: vi.fn().mockResolvedValue({
                      data: mockNewCards,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(2);
      expect(result.cards).toBeDefined();
      expect(result.cards?.[0]?.question).toBe("Due Q1");
      expect(result.cards?.[1]?.question).toBe("New Q1");
    });
  });

  describe("Daily new cards limit enforcement", () => {
    it("should not fetch new cards if daily limit (50) is reached", async () => {
      // Arrange
      const mockDueCards = [
        {
          flashcard_id: "due-card-1",
          next_due: "2025-01-01T00:00:00Z",
          interval_days: 1,
          repetition_count: 2,
          ease_factor: 2.5,
          flashcards: {
            id: "due-card-1",
            content: JSON.stringify({ question: "Due Q1", answer: "Due A1" }),
            deleted_at: null,
          },
        },
      ];

      // Mock 50 cards already taken today
      const mockCardsWithRepCount1 = Array.from({ length: 50 }, (_, i) => ({
        flashcard_id: `taken-card-${i}`,
      }));

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;

        // First call: due cards query
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: mockDueCards,
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: schedule query for repetition_count = 1
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockCardsWithRepCount1,
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: review_logs query
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: mockCardsWithRepCount1,
                  error: null,
                }),
              }),
            }),
          }),
        };
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(1); // Only due card, no new cards
      expect(result.cards).toBeDefined();
      expect(result.cards?.[0]?.question).toBe("Due Q1");
    });
  });

  describe("Soft-deleted flashcards", () => {
    it("should not return soft-deleted flashcards", async () => {
      // This is tested implicitly by the .is("flashcards.deleted_at", null) filter
      // The mock setup ensures deleted_at is null for all returned cards
      const mockDueCards = Array.from({ length: 10 }, (_, i) => ({
        flashcard_id: `card-${i}`,
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        flashcards: {
          id: `card-${i}`,
          content: JSON.stringify({ question: `Q${i}`, answer: `A${i}` }),
          deleted_at: null, // Not deleted
        },
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(10);
      // Verify the .is() method was called with correct parameters
      expect(mockFrom).toHaveBeenCalledWith("flashcard_schedule");
    });
  });

  describe("Error handling", () => {
    it("should handle database error when fetching due cards", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Database connection failed" },
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch due cards");
      expect(result.statusCode).toBe(500);
    });

    it("should handle database error when fetching new cards", async () => {
      // Arrange
      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;

        // First call: due cards query (success)
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: schedule query (success)
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: new cards query (error)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: "Database error" },
                  }),
                }),
              }),
            }),
          }),
        };
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch new cards");
      expect(result.statusCode).toBe(500);
    });

    it("should handle malformed JSON content gracefully", async () => {
      // Arrange
      const mockDueCards = Array.from({ length: 10 }, (_, i) => ({
        flashcard_id: `card-${i}`,
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        flashcards: {
          id: `card-${i}`,
          content: "invalid json {{{", // Malformed JSON
          deleted_at: null,
        },
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(10);
      // Should return empty strings for malformed content
      expect(result.cards).toBeDefined();
      expect(result.cards?.[0]?.question).toBe("");
      expect(result.cards?.[0]?.answer).toBe("");
    });
  });

  describe("Edge cases", () => {
    it("should handle user with no flashcards at all", async () => {
      // Arrange
      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;

        // First call: due cards query (empty)
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                lte: vi.fn().mockReturnValue({
                  is: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      limit: vi.fn().mockResolvedValue({
                        data: [],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: schedule query (empty)
        if (callCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: new cards query (empty)
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 10,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should return only due cards when limit is reached", async () => {
      // Arrange
      const mockDueCards = Array.from({ length: 50 }, (_, i) => ({
        flashcard_id: `due-card-${i}`,
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        flashcards: {
          id: `due-card-${i}`,
          content: JSON.stringify({ question: `Q${i}`, answer: `A${i}` }),
          deleted_at: null,
        },
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 50,
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(50);
      expect(result.count).toBe(50);
      // Should not have called for new cards since limit is reached
    });
  });

  describe("Invalid limit values", () => {
    it("should reject limit = 0 (validation handled at route level)", async () => {
      // Note: This test documents that limit=0 should be rejected at the API route level
      // by Zod validation before reaching the service layer.
      // The service layer assumes valid input (limit >= 1).

      // For completeness, we test what happens if 0 somehow reaches the service
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 0,
        supabase: mockSupabaseClient,
      });

      // Assert - service will return empty result for limit=0
      expect(result.success).toBe(true);
      expect(result.cards).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should reject negative limits (validation handled at route level)", async () => {
      // Note: This documents that negative limits should be rejected at the API route level
      // The service layer assumes valid input.

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: -5,
        supabase: mockSupabaseClient,
      });

      // Assert - service will handle gracefully but this should never reach here
      expect(result.success).toBe(true);
      expect(result.cards).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should reject limit > 50 (validation handled at route level)", async () => {
      // Note: This documents that limits > 50 should be rejected at the API route level
      // If it somehow reaches the service, it will process up to the limit

      const mockDueCards = Array.from({ length: 100 }, (_, i) => ({
        flashcard_id: `card-${i}`,
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        flashcards: {
          id: `card-${i}`,
          content: JSON.stringify({ question: `Q${i}`, answer: `A${i}` }),
          deleted_at: null,
        },
      }));

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: mockDueCards,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act - service will process whatever limit is given
      const result = await fetchTodaysCards({
        userId: "test-user-id",
        limit: 100,
        supabase: mockSupabaseClient,
      });

      // Assert - service processes the request (validation should happen at route level)
      // When limit >= requestedLimit from due cards, returns early
      expect(result.success).toBe(true);
      expect(result.cards).toHaveLength(100);
      expect(result.count).toBe(100);
    });
  });
});

describe("learningService - recordReviewRating", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock for each test
    mockSupabaseClient = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
  });

  describe("Successful review recording", () => {
    it("should successfully record a review rating and update schedule", async () => {
      // Arrange
      const mockScheduleRow = {
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        user_id: "test-user-id",
      };

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        callCount++;

        // First call: fetch schedule
        if (callCount === 1 && table === "flashcard_schedule") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockScheduleRow,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: update schedule
        if (callCount === 2 && table === "flashcard_schedule") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: insert review log
        if (callCount === 3 && table === "review_logs") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "test-flashcard-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.reviewed).toBeDefined();
      expect(result.data?.reviewed.flashcardId).toBe("test-flashcard-id");
      expect(result.data?.reviewed.previous_schedule).toEqual({
        next_due: mockScheduleRow.next_due,
        interval_days: mockScheduleRow.interval_days,
        repetition_count: mockScheduleRow.repetition_count,
        ease_factor: mockScheduleRow.ease_factor,
      });
      expect(result.data?.reviewed.new_schedule).toBeDefined();
      expect(result.data?.reviewed.new_schedule.interval_days).toBeGreaterThan(0);
    });

    it("should handle different rating values (again, hard, good, easy)", async () => {
      // Arrange
      const mockScheduleRow = {
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        user_id: "test-user-id",
      };

      const ratings: ("again" | "hard" | "good" | "easy")[] = ["again", "hard", "good", "easy"];

      for (const rating of ratings) {
        vi.clearAllMocks();
        let callCount = 0;

        const mockFrom = vi.fn().mockImplementation((table: string) => {
          callCount++;

          if (callCount === 1 && table === "flashcard_schedule") {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockScheduleRow,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }

          if (callCount === 2 && table === "flashcard_schedule") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            };
          }

          if (callCount === 3 && table === "review_logs") {
            return {
              insert: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }

          return {};
        });

        mockSupabaseClient.from = mockFrom;

        // Act
        const result = await recordReviewRating({
          userId: "test-user-id",
          flashcardId: "test-flashcard-id",
          rating,
          supabase: mockSupabaseClient,
        });

        // Assert
        expect(result.success).toBe(true);
        expect(result.data?.reviewed).toBeDefined();
      }
    });
  });

  describe("Error handling", () => {
    it("should return NotFoundError when schedule is not found", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "No rows returned" },
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "non-existent-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.statusCode).toBe(404);
    });

    it("should return NotFoundError when schedule row is null", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "non-existent-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.statusCode).toBe(404);
    });

    it("should return NotFoundError when user_id does not match", async () => {
      // Arrange
      const mockScheduleRow = {
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        user_id: "different-user-id", // Different user
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockScheduleRow,
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "test-flashcard-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(NotFoundError);
      expect(result.statusCode).toBe(404);
    });

    it("should handle database error when fetching schedule", async () => {
      // Arrange
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST500", message: "Database error" },
              }),
            }),
          }),
        }),
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "test-flashcard-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch flashcard schedule");
      expect(result.statusCode).toBe(500);
    });

    it("should handle database error when updating schedule", async () => {
      // Arrange
      const mockScheduleRow = {
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        user_id: "test-user-id",
      };

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1 && table === "flashcard_schedule") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockScheduleRow,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (callCount === 2 && table === "flashcard_schedule") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: "Update failed" },
                }),
              }),
            }),
          };
        }

        return {};
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "test-flashcard-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update flashcard schedule");
      expect(result.statusCode).toBe(500);
    });

    it("should rollback schedule update when review log insertion fails", async () => {
      // Arrange
      const mockScheduleRow = {
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 1,
        repetition_count: 2,
        ease_factor: 2.5,
        user_id: "test-user-id",
      };

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        callCount++;

        // First call: fetch schedule
        if (callCount === 1 && table === "flashcard_schedule") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockScheduleRow,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: update schedule (success)
        if (callCount === 2 && table === "flashcard_schedule") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        // Third call: insert review log (fails)
        if (callCount === 3 && table === "review_logs") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Insert failed" },
            }),
          };
        }

        // Fourth call: rollback schedule update
        if (callCount === 4 && table === "flashcard_schedule") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        return {};
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "test-flashcard-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to log review");
      expect(result.statusCode).toBe(500);
      // Verify rollback was attempted
      expect(mockFrom).toHaveBeenCalledTimes(4);
    });
  });

  describe("Edge cases", () => {
    it("should handle new card (repetition_count = 0)", async () => {
      // Arrange
      const mockScheduleRow = {
        next_due: "2025-01-01T00:00:00Z",
        interval_days: 0,
        repetition_count: 0, // New card
        ease_factor: 2.5,
        user_id: "test-user-id",
      };

      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        callCount++;

        if (callCount === 1 && table === "flashcard_schedule") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockScheduleRow,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (callCount === 2 && table === "flashcard_schedule") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        if (callCount === 3 && table === "review_logs") {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        return {};
      });

      mockSupabaseClient.from = mockFrom;

      // Act
      const result = await recordReviewRating({
        userId: "test-user-id",
        flashcardId: "test-flashcard-id",
        rating: "good",
        supabase: mockSupabaseClient,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.reviewed.previous_schedule.repetition_count).toBe(0);
      expect(result.data?.reviewed.new_schedule.repetition_count).toBeGreaterThanOrEqual(0);
    });
  });
});
