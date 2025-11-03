// src/lib/services/__tests__/flashcardService.delete.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteFlashcard } from "../flashcardService";
import type { SupabaseClient } from "../../../db/supabase.client";

describe("flashcardService - deleteFlashcard", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteFlashcard", () => {
    it("should successfully soft delete a flashcard", async () => {
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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Flashcard deleted successfully");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
    });

    it("should set deleted_at timestamp to current time", async () => {
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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await deleteFlashcard(params);

      // Assert
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty("deleted_at");
      expect(updateCall.deleted_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
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
        userId: "specific-user-456",
        supabase: mockSupabaseClient,
      };

      // Act
      await deleteFlashcard(params);

      // Assert
      expect(mockEqId).toHaveBeenCalledWith("id", "flashcard-123");
      expect(mockEqUserId).toHaveBeenCalledWith("user_id", "specific-user-456");
    });

    it("should only delete non-deleted flashcards (idempotency)", async () => {
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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await deleteFlashcard(params);

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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

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
        userId: "wrong-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should return 404 when flashcard is already deleted (idempotency)", async () => {
      // Arrange - simulating no rows returned because deleted_at is not null
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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to delete flashcard in database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (mockSupabaseClient.from as any) = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const params = {
        flashcardId: "flashcard-123",
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred while deleting flashcard");
      expect(result.statusCode).toBe(500);
    });

    it("should return success message on successful delete", async () => {
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
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await deleteFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Flashcard deleted successfully");
      expect(result.error).toBeUndefined();
      expect(result.statusCode).toBeUndefined();
    });
  });
});
