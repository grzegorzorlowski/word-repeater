// src/lib/services/__tests__/flashcardService.create.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createManualFlashcard } from "../flashcardService";
import type { SupabaseClient } from "../../../db/supabase.client";

describe("flashcardService - createManualFlashcard", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createManualFlashcard", () => {
    it("should successfully create a flashcard with question and answer", async () => {
      // Arrange
      const mockCreatedFlashcard = {
        id: "flashcard-123",
        content: JSON.stringify({
          question: "What is TypeScript?",
          answer: "TypeScript is a typed superset of JavaScript",
        }),
        created_at: "2025-01-01T00:00:00Z",
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCreatedFlashcard,
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "What is TypeScript?",
        answer: "TypeScript is a typed superset of JavaScript",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.flashcard).toBeDefined();
      expect(result.flashcard?.id).toBe("flashcard-123");
      expect(result.flashcard?.content).toContain("What is TypeScript?");
      expect(result.message).toBe("Flashcard created successfully");
    });

    it("should include metadata with source set to 'manual'", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              content: JSON.stringify({ question: "Q", answer: "A" }),
              created_at: "2025-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await createManualFlashcard(params);

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "test-user-id",
          content: expect.any(String),
          metadata: expect.objectContaining({
            source: "manual",
            created_at: expect.any(String),
          }),
        })
      );
    });

    it("should merge user-provided metadata with default metadata", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              content: JSON.stringify({ question: "Q", answer: "A" }),
              created_at: "2025-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        metadata: {
          tags: ["javascript", "programming"],
          category: "tech",
        },
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await createManualFlashcard(params);

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: "manual",
            tags: ["javascript", "programming"],
            category: "tech",
            created_at: expect.any(String),
          }),
        })
      );
    });

    it("should store content as JSON stringified question and answer", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              content: JSON.stringify({
                question: "What is REST?",
                answer: "Representational State Transfer",
              }),
              created_at: "2025-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "What is REST?",
        answer: "Representational State Transfer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await createManualFlashcard(params);

      // Assert
      const insertedData = mockInsert.mock.calls[0][0];
      const parsedContent = JSON.parse(insertedData.content);
      expect(parsedContent).toEqual({
        question: "What is REST?",
        answer: "Representational State Transfer",
      });
    });

    it("should handle database insertion errors", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database constraint violation" },
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create flashcard in database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle when database returns no data", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to create flashcard in database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (mockSupabaseClient.from as any) = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred while creating flashcard");
      expect(result.statusCode).toBe(500);
    });

    it("should correctly associate flashcard with user_id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              content: JSON.stringify({ question: "Q", answer: "A" }),
              created_at: "2025-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        userId: "specific-user-456",
        supabase: mockSupabaseClient,
      };

      // Act
      await createManualFlashcard(params);

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "specific-user-456",
        })
      );
    });

    it("should work without optional metadata parameter", async () => {
      // Arrange
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              content: JSON.stringify({ question: "Q", answer: "A" }),
              created_at: "2025-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Test question",
        answer: "Test answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
        // metadata is intentionally omitted
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            source: "manual",
          }),
        })
      );
    });

    it("should return FlashcardSummaryDTO with correct fields", async () => {
      // Arrange
      const mockCreatedFlashcard = {
        id: "flashcard-abc-123",
        content: JSON.stringify({
          question: "Sample question",
          answer: "Sample answer",
        }),
        created_at: "2025-01-15T10:30:00Z",
      };

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCreatedFlashcard,
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: "Sample question",
        answer: "Sample answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.flashcard).toEqual({
        id: "flashcard-abc-123",
        content: expect.any(String),
        created_at: "2025-01-15T10:30:00Z",
      });
    });

    it("should handle long question and answer within limits", async () => {
      // Arrange
      const longQuestion = "Q".repeat(300); // Exactly 300 characters
      const longAnswer = "A".repeat(500); // Exactly 500 characters

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              content: JSON.stringify({ question: longQuestion, answer: longAnswer }),
              created_at: "2025-01-01T00:00:00Z",
            },
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        question: longQuestion,
        answer: longAnswer,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await createManualFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      const insertedData = mockInsert.mock.calls[0][0];
      const parsedContent = JSON.parse(insertedData.content);
      expect(parsedContent.question.length).toBe(300);
      expect(parsedContent.answer.length).toBe(500);
    });
  });
});

