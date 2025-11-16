// src/lib/services/__tests__/flashcardService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateFlashcardsFromText } from "../flashcardService";
import type { SupabaseClient } from "../../../db/supabase.client";

// Mock the AI flashcard generator service
vi.mock("../aiFlashcardGenerator.service", () => ({
  generateFlashcardsWithAI: vi.fn(),
}));

import { generateFlashcardsWithAI } from "../aiFlashcardGenerator.service";

describe("flashcardService - generate flashcards", () => {
  // Mock Supabase client
  const mockSupabaseClient = {
    from: vi.fn(),
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateFlashcardsFromText", () => {
    it("should generate flashcards and persist them to database", async () => {
      // Arrange - Mock AI service
      vi.mocked(generateFlashcardsWithAI).mockResolvedValue({
        success: true,
        flashcards: [
          {
            question: "What is the key concept in this text?",
            answer: "This is a test sentence for flashcard generation.",
          },
        ],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "test-id-1",
              content: JSON.stringify({
                question: "What is the key concept in this text?",
                answer: "This is a test sentence for flashcard generation.",
              }),
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        text: "This is a test sentence for flashcard generation. It contains enough characters to pass the minimum length requirement. We need at least 500 characters for the validation to pass. So let me add more text here to make sure we meet that requirement. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        limit: 5,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await generateFlashcardsFromText(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.flashcards).toBeDefined();
      expect(result.flashcards!.length).toBeGreaterThan(0);
      expect(result.flashcards![0]).toHaveProperty("id");
      expect(result.flashcards![0]).toHaveProperty("question");
      expect(result.flashcards![0]).toHaveProperty("answer");
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("flashcards");
      expect(mockInsert).toHaveBeenCalled();
    });

    it("should generate at least one flashcard even with short text", async () => {
      // Arrange - Mock AI service
      vi.mocked(generateFlashcardsWithAI).mockResolvedValue({
        success: true,
        flashcards: [
          {
            question: "What is the main topic of this text?",
            answer: "Short text",
          },
        ],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "test-id-1",
              content: JSON.stringify({
                question: "What is the main topic of this text?",
                answer: "Short text",
              }),
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        text: "Short text",
        limit: 5,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await generateFlashcardsFromText(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.flashcards).toBeDefined();
      expect(result.flashcards!.length).toBeGreaterThan(0);
    });

    it("should handle database insertion errors", async () => {
      // Arrange - Mock AI service
      vi.mocked(generateFlashcardsWithAI).mockResolvedValue({
        success: true,
        flashcards: [
          {
            question: "Test question",
            answer: "Test answer",
          },
        ],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        text: "This is a test sentence for flashcard generation. It contains enough characters to pass the minimum length requirement. We need at least 500 characters for the validation to pass. So let me add more text here to make sure we meet that requirement. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        limit: 5,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await generateFlashcardsFromText(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to save flashcards to database");
      expect(result.statusCode).toBe(500);
    });

    it("should respect the limit parameter", async () => {
      // Arrange - Mock AI service
      vi.mocked(generateFlashcardsWithAI).mockResolvedValue({
        success: true,
        flashcards: [
          {
            question: "Test question 1",
            answer: "Test answer 1",
          },
          {
            question: "Test question 2",
            answer: "Test answer 2",
          },
        ],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "test-id-1",
              content: JSON.stringify({
                question: "Test question 1",
                answer: "Test answer 1",
              }),
              created_at: "2025-01-01T00:00:00Z",
            },
            {
              id: "test-id-2",
              content: JSON.stringify({
                question: "Test question 2",
                answer: "Test answer 2",
              }),
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        text: "First sentence for testing. Second sentence for more testing. Third sentence for additional testing. Fourth sentence to verify limit. Fifth sentence to complete the test. This is a test sentence for flashcard generation. It contains enough characters to pass the minimum length requirement. We need at least 500 characters for the validation to pass. So let me add more text here to make sure we meet that requirement. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        limit: 2,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await generateFlashcardsFromText(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: "test-user-id",
            source: "ai_generated",
            status: "pending",
          }),
        ])
      );
      // Verify that the inserted array has at most 'limit' items
      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData.length).toBeLessThanOrEqual(2);
    });

    it("should include metadata with source and generated_at timestamp", async () => {
      // Arrange - Mock AI service
      vi.mocked(generateFlashcardsWithAI).mockResolvedValue({
        success: true,
        flashcards: [
          {
            question: "Test question",
            answer: "Test answer",
          },
        ],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            {
              id: "test-id-1",
              content: JSON.stringify({
                question: "Test question",
                answer: "Test answer",
              }),
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
          error: null,
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        text: "This is a test sentence for flashcard generation. It contains enough characters to pass the minimum length requirement. We need at least 500 characters for the validation to pass. So let me add more text here to make sure we meet that requirement. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        limit: 5,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      await generateFlashcardsFromText(params);

      // Assert
      expect(mockInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            source: "ai_generated",
            status: "pending",
            metadata: expect.objectContaining({
              generated_at: expect.any(String),
            }),
          }),
        ])
      );
    });

    it("should return empty data error when database returns empty array", async () => {
      // Arrange - Mock AI service
      vi.mocked(generateFlashcardsWithAI).mockResolvedValue({
        success: true,
        flashcards: [
          {
            question: "Test question",
            answer: "Test answer",
          },
        ],
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      (mockSupabaseClient.from as any) = vi.fn().mockReturnValue({
        insert: mockInsert,
      });

      const params = {
        text: "This is a test sentence for flashcard generation. It contains enough characters to pass the minimum length requirement. We need at least 500 characters for the validation to pass. So let me add more text here to make sure we meet that requirement. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
        limit: 5,
        userId: "test-user-id",
        supabase: mockSupabaseClient,
      };

      // Act
      const result = await generateFlashcardsFromText(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to save flashcards to database");
      expect(result.statusCode).toBe(500);
    });
  });
});
