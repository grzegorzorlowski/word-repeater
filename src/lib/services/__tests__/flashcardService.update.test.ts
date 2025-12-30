// src/lib/services/__tests__/flashcardService.update.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateFlashcard } from "../flashcardService";
import type { SupabaseClient } from "../../../db/supabase.client";

describe("flashcardService - updateFlashcard", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateFlashcard", () => {
    it("should successfully update a flashcard with new question and answer", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "flashcard-123" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "What is TypeScript?",
        answer: "TypeScript is a typed superset of JavaScript",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Flashcard updated successfully");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
    });

    it("should update content as JSON stringified question and answer", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "flashcard-123" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Updated question",
        answer: "Updated answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await updateFlashcard(params);

      // Assert
      const updateCall = mockUpdate.mock.calls[0][0];
      const parsedContent = JSON.parse(updateCall.content);
      expect(parsedContent).toEqual({
        question: "Updated question",
        answer: "Updated answer",
      });
    });

    it("should verify flashcard belongs to user (ownership check)", async () => {
      // Arrange
      const mockEqUserId = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "flashcard-123" },
              error: null,
            }),
          }),
        }),
      });

      const mockEqId = vi.fn().mockReturnValue({
        eq: mockEqUserId,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEqId,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "specific-user-456",
        supabase: mockSupabaseClient,
      };

      // Act
      await updateFlashcard(params);

      // Assert
      expect(mockEqId).toHaveBeenCalledWith("id", "flashcard-123");
      expect(mockEqUserId).toHaveBeenCalledWith("user_id", "specific-user-456");
    });

    it("should only update non-deleted flashcards", async () => {
      // Arrange
      const mockIs = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "flashcard-123" },
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: mockIs,
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await updateFlashcard(params);

      // Assert
      expect(mockIs).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should return 404 when flashcard not found", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "non-existent-id",
        question: "Test",
        answer: "Test",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should return 404 when flashcard belongs to different user", async () => {
      // Arrange - simulating no rows returned because user_id doesn't match
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "wrong-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should return 404 when Supabase returns PGRST116 error code", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "PGRST116", message: "No rows found" },
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should handle database errors", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: "23505", message: "Database constraint violation" },
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update flashcard in database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (mockSupabaseClient.from as any) = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred while updating flashcard");
      expect(result.statusCode).toBe(500);
    });

    it("should handle maximum length question and answer", async () => {
      // Arrange
      const longQuestion = "Q".repeat(300); // Exactly 300 characters
      const longAnswer = "A".repeat(500); // Exactly 500 characters

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "flashcard-123" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: longQuestion,
        answer: longAnswer,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      const updateCall = mockUpdate.mock.calls[0][0];
      const parsedContent = JSON.parse(updateCall.content);
      expect(parsedContent.question.length).toBe(300);
      expect(parsedContent.answer.length).toBe(500);
    });

    it("should preserve metadata when updating content", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "flashcard-123" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Updated question",
        answer: "Updated answer",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await updateFlashcard(params);

      // Assert
      // Verify that only 'content' is in the update call (not metadata)
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty("content");
      expect(updateCall).not.toHaveProperty("metadata");
    });

    it("should return success message on successful update", async () => {
      // Arrange
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "flashcard-123" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        update: mockUpdate,
      });

      const params = {
        flashcardId: "flashcard-123",
        question: "Test",
        answer: "Test",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await updateFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Flashcard updated successfully");
      expect(result.error).toBeUndefined();
      expect(result.statusCode).toBeUndefined();
    });
  });
});
