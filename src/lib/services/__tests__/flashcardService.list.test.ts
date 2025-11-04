// src/lib/services/__tests__/flashcardService.list.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { listUserFlashcards } from "../flashcardService";
import type { SupabaseClient } from "../../../db/supabase.client";

describe("flashcardService - listUserFlashcards", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listUserFlashcards", () => {
    it("should successfully retrieve flashcards with pagination", async () => {
      // Arrange
      const mockData = [
        {
          id: "flashcard-1",
          content: JSON.stringify({ question: "Question 1", answer: "Answer 1" }),
          created_at: "2025-01-01T00:00:00Z",
        },
        {
          id: "flashcard-2",
          content: JSON.stringify({ question: "Question 2", answer: "Answer 2" }),
          created_at: "2025-01-02T00:00:00Z",
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
          count: 10,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await listUserFlashcards(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBe(2);
      expect(result.total).toBe(10);
      expect(result.data![0]).toHaveProperty("id");
      expect(result.data![0]).toHaveProperty("content");
      expect(result.data![0]).toHaveProperty("created_at");
    });

    it("should filter by status=active (deleted_at IS NULL)", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should filter by status=deleted (deleted_at IS NOT NULL)", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "deleted" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockQuery.not).toHaveBeenCalledWith("deleted_at", "is", null);
    });

    it("should filter by source=ai_generated (source column)", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        source: "ai_generated" as const,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "ai_generated");
    });

    it("should filter by source=manual (source column)", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        source: "manual" as const,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith("source", "manual");
    });

    it("should apply correct pagination offset and limit", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 3,
        limit: 20,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      // Page 3 with limit 20 should have offset = (3-1) * 20 = 40
      // Range should be from 40 to 59 (40 + 20 - 1)
      expect(mockQuery.range).toHaveBeenCalledWith(40, 59);
    });

    it("should order by created_at descending", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockQuery.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("should return empty array when no flashcards found", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await listUserFlashcards(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle database errors", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database connection error" },
          count: null,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await listUserFlashcards(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to retrieve flashcards from database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (mockSupabaseClient.from as any) = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await listUserFlashcards(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred while retrieving flashcards");
      expect(result.statusCode).toBe(500);
    });

    it("should always filter by user_id", async () => {
      // Arrange
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockQuery),
      });

      const params = {
        userId: "specific-user-123",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockQuery.eq).toHaveBeenCalledWith("user_id", "specific-user-123");
    });

    it("should include count in select for total pagination", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const params = {
        userId: "test-user-id",
        page: 1,
        limit: 10,
        status: "active" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await listUserFlashcards(params);

      // Assert
      expect(mockSelect).toHaveBeenCalledWith("id, content, created_at", { count: "exact" });
    });
  });
});
