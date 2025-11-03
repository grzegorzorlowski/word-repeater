// src/lib/services/__tests__/flashcardService.acceptReject.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { acceptRejectFlashcard } from "../flashcardService";
import type { SupabaseClient } from "../../../db/supabase.client";

describe("flashcardService - acceptRejectFlashcard", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("accept decision", () => {
    it("should successfully accept an AI-generated pending flashcard", async () => {
      // Arrange - Mock fetch to return valid AI-generated pending flashcard
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "pending",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect }) // First call for select
        .mockReturnValueOnce({ update: mockUpdate }); // Second call for update

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Flashcard accepted successfully");
      expect(result.status).toBe("active");
      expect(mockUpdate).toHaveBeenCalledWith({ status: "active" });
    });

    it("should update status from pending to active on accept", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "pending",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await acceptRejectFlashcard(params);

      // Assert
      expect(mockUpdate).toHaveBeenCalledWith({ status: "active" });
    });

    it("should verify ownership when accepting flashcard", async () => {
      // Arrange
      const mockEq2 = vi.fn().mockReturnValue({
        is: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "flashcard-123",
              user_id: "user-456",
              source: "ai_generated",
              status: "pending",
              deleted_at: null,
            },
            error: null,
          }),
        }),
      });

      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-456",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await acceptRejectFlashcard(params);

      // Assert
      expect(mockEq1).toHaveBeenCalledWith("id", "flashcard-123");
      expect(mockEq2).toHaveBeenCalledWith("user_id", "user-456");
    });
  });

  describe("reject decision", () => {
    it("should successfully reject an AI-generated pending flashcard", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "pending",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "reject" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("Flashcard rejected successfully");
      expect(result.status).toBe("deleted");
    });

    it("should soft delete flashcard on reject", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "pending",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "reject" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      await acceptRejectFlashcard(params);

      // Assert
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall).toHaveProperty("deleted_at");
      expect(updateCall.deleted_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
    });
  });

  describe("validation - flashcard not found", () => {
    it("should return 404 when flashcard does not exist", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "non-existent-id",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should return 404 when flashcard belongs to different user", async () => {
      // Arrange - No data returned because user_id doesn't match
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "wrong-user-id",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should return 404 when flashcard is already deleted", async () => {
      // Arrange - No data returned because deleted_at is not null
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });

    it("should return 404 when database returns PGRST116 error", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "No rows found" },
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Flashcard not found");
      expect(result.statusCode).toBe(404);
    });
  });

  describe("validation - wrong source", () => {
    it("should return 400 when flashcard source is manual", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "manual", // Wrong source
                  status: "active",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Only AI-generated flashcards can be accepted or rejected");
      expect(result.statusCode).toBe(400);
    });
  });

  describe("validation - wrong status", () => {
    it("should return 400 when flashcard status is active", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "active", // Wrong status
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Only pending flashcards can be accepted or rejected");
      expect(result.statusCode).toBe(400);
    });

    it("should return 400 when flashcard status is archived", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "archived", // Wrong status
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "reject" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Only pending flashcards can be accepted or rejected");
      expect(result.statusCode).toBe(400);
    });
  });

  describe("error handling", () => {
    it("should handle database errors on fetch", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "23505", message: "Database constraint violation" },
              }),
            }),
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockReturnValueOnce({ select: mockSelect });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch flashcard from database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle database errors on accept update", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "pending",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "Database update error" },
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to accept flashcard in database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle database errors on reject update", async () => {
      // Arrange
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "flashcard-123",
                  user_id: "user-123",
                  source: "ai_generated",
                  status: "pending",
                  deleted_at: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "Database update error" },
          }),
        }),
      });

      (mockSupabaseClient.from as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "reject" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to reject flashcard in database");
      expect(result.statusCode).toBe(500);
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      (mockSupabaseClient.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Unexpected database error");
      });

      const params = {
        flashcardId: "flashcard-123",
        userId: "user-123",
        decision: "accept" as const,
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await acceptRejectFlashcard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred while processing flashcard decision");
      expect(result.statusCode).toBe(500);
    });
  });
});

