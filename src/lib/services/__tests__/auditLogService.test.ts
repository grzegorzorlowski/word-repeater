// src/lib/services/__tests__/auditLogService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  logAuditEntry,
  logFlashcardGeneration,
  logFlashcardGenerationFailure,
  logFlashcardListFailure,
  logFlashcardCreationFailure,
  logFlashcardUpdateFailure,
  logFlashcardDeletion,
  logFlashcardDeleteFailure,
  logFlashcardAcceptance,
  logFlashcardRejection,
  logFlashcardDecisionFailure,
  logValidationError,
} from "../auditLogService";
import type { SupabaseClient } from "../../../db/supabase.client";

describe("auditLogService", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logAuditEntry", () => {
    it("should log an audit entry to the database", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const entry = {
        userId: "test-user-id",
        action: "test_action",
        details: { key: "value" },
      };

      // Act
      await logAuditEntry(mockSupabaseClient, entry);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        action: 'test_action: {"key":"value"}',
      });
    });

    it("should log action without details if details are not provided", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const entry = {
        userId: "test-user-id",
        action: "simple_action",
      };

      // Act
      await logAuditEntry(mockSupabaseClient, entry);

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "test-user-id",
        action: "simple_action",
      });
    });

    it("should not throw error if database insertion fails", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: "Database error" },
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const entry = {
        userId: "test-user-id",
        action: "test_action",
      };

      // Act & Assert - should not throw
      await expect(logAuditEntry(mockSupabaseClient, entry)).resolves.toBeUndefined();
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      (mockSupabaseClient.from as any) = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const entry = {
        userId: "test-user-id",
        action: "test_action",
      };

      // Act & Assert - should not throw
      await expect(logAuditEntry(mockSupabaseClient, entry)).resolves.toBeUndefined();
    });
  });

  describe("logFlashcardGeneration", () => {
    it("should log successful flashcard generation", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardGeneration(mockSupabaseClient, "user-123", 5, 1000);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: 'flashcard_generation_success: {"flashcard_count":5,"text_length":1000}',
      });
    });
  });

  describe("logFlashcardGenerationFailure", () => {
    it("should log flashcard generation failure with user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardGenerationFailure(mockSupabaseClient, "user-123", "Validation failed", 100);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: 'flashcard_generation_failure: {"error":"Validation failed","text_length":100}',
      });
    });

    it("should log flashcard generation failure without user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardGenerationFailure(mockSupabaseClient, null, "System error");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: 'flashcard_generation_failure: {"error":"System error"}',
      });
    });
  });

  describe("logValidationError", () => {
    it("should log validation errors", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const errors = [
        { field: "text", message: "Text is required" },
        { field: "limit", message: "Limit must be positive" },
      ];

      // Act
      await logValidationError(mockSupabaseClient, errors);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("validation_error"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("Text is required"),
      });
    });
  });

  describe("logFlashcardListFailure", () => {
    it("should log flashcard list retrieval failure with query params", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const queryParams = {
        page: 1,
        limit: 10,
        source: "ai_generated",
        status: "active",
      };

      // Act
      await logFlashcardListFailure(mockSupabaseClient, "user-123", "Database error", queryParams);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_list_failure"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("Database error"),
      });
    });

    it("should log flashcard list retrieval failure without query params", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardListFailure(mockSupabaseClient, null, "Unexpected error");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("flashcard_list_failure"),
      });
    });
  });

  describe("logFlashcardCreationFailure", () => {
    it("should log flashcard creation failure with user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardCreationFailure(mockSupabaseClient, "user-123", "Validation failed");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_creation_failure"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("Validation failed"),
      });
    });

    it("should log flashcard creation failure without user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardCreationFailure(mockSupabaseClient, null, "System error");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("flashcard_creation_failure"),
      });
    });
  });

  describe("logFlashcardUpdateFailure", () => {
    it("should log flashcard update failure with user id and flashcard id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardUpdateFailure(mockSupabaseClient, "user-123", "Flashcard not found", "flashcard-456");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_update_failure"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("Flashcard not found"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard-456"),
      });
    });

    it("should log flashcard update failure without flashcard id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardUpdateFailure(mockSupabaseClient, "user-123", "Database error");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_update_failure"),
      });
    });

    it("should log flashcard update failure without user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardUpdateFailure(mockSupabaseClient, null, "Unexpected error", "flashcard-789");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("flashcard_update_failure"),
      });
    });
  });

  describe("logFlashcardDeletion", () => {
    it("should log successful flashcard deletion", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDeletion(mockSupabaseClient, "user-123", "flashcard-456");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_deleted"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard-456"),
      });
    });

    it("should include flashcard id in audit log", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDeletion(mockSupabaseClient, "user-789", "flashcard-xyz");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-789",
        action: expect.stringContaining("flashcard-xyz"),
      });
    });
  });

  describe("logFlashcardDeleteFailure", () => {
    it("should log flashcard delete failure with flashcard id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDeleteFailure(mockSupabaseClient, "user-123", "Flashcard not found", "flashcard-456");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("Flashcard not found"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard-456"),
      });
    });

    it("should log flashcard delete failure without flashcard id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDeleteFailure(mockSupabaseClient, "user-123", "Database error");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_delete_failure"),
      });
    });

    it("should log flashcard delete failure without user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDeleteFailure(mockSupabaseClient, null, "Unexpected error", "flashcard-789");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("flashcard_delete_failure"),
      });
    });
  });

  describe("logFlashcardAcceptance", () => {
    it("should log successful flashcard acceptance", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardAcceptance(mockSupabaseClient, "user-123", "flashcard-456");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_accepted"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard-456"),
      });
    });
  });

  describe("logFlashcardRejection", () => {
    it("should log successful flashcard rejection", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardRejection(mockSupabaseClient, "user-123", "flashcard-789");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_rejected"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard-789"),
      });
    });
  });

  describe("logFlashcardDecisionFailure", () => {
    it("should log flashcard decision failure with all details", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDecisionFailure(mockSupabaseClient, "user-123", "Validation failed", "flashcard-456", "accept");

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_decision_failure"),
      });
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("Validation failed"),
      });
    });

    it("should log flashcard decision failure without flashcard id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDecisionFailure(mockSupabaseClient, "user-123", "Database error", undefined, "reject");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "user-123",
        action: expect.stringContaining("flashcard_decision_failure"),
      });
    });

    it("should log flashcard decision failure without user id", async () => {
      // Arrange
      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      // Act
      await logFlashcardDecisionFailure(mockSupabaseClient, null, "Unexpected error", "flashcard-789", "accept");

      // Assert
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: null,
        action: expect.stringContaining("flashcard_decision_failure"),
      });
    });
  });
});
