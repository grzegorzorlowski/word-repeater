import { describe, it, expect } from "vitest";
import {
  parseFlashcardContent,
  formatDate,
  truncateText,
  isWithinCharacterLimit,
  validateFlashcard,
} from "../flashcardUtils";

describe("flashcardUtils", () => {
  describe("parseFlashcardContent", () => {
    it("should parse valid JSON content", () => {
      const content = JSON.stringify({
        question: "What is React?",
        answer: "A JavaScript library",
      });
      const result = parseFlashcardContent(content);
      expect(result.question).toBe("What is React?");
      expect(result.answer).toBe("A JavaScript library");
    });

    it("should return empty strings for invalid JSON", () => {
      const result = parseFlashcardContent("invalid json");
      expect(result.question).toBe("");
      expect(result.answer).toBe("");
    });

    it("should handle missing question or answer fields", () => {
      const content = JSON.stringify({ question: "Test?" });
      const result = parseFlashcardContent(content);
      expect(result.question).toBe("Test?");
      expect(result.answer).toBe("");
    });
  });

  describe("formatDate", () => {
    it("should format ISO date string", () => {
      const date = "2024-01-15T10:30:00.000Z";
      const result = formatDate(date);
      // Result will vary by locale, but should contain year and day
      expect(result).toMatch(/2024/);
      expect(result).toMatch(/15/);
      // Should be a non-empty string
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle different date formats", () => {
      const date = "2023-12-25";
      const result = formatDate(date);
      expect(result).toMatch(/2023/);
      expect(result).toMatch(/25/);
      // Should be a non-empty string
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return a string in date format", () => {
      const date = "2024-06-10T15:30:00.000Z";
      const result = formatDate(date);
      // Should contain year
      expect(result).toContain("2024");
      // Should be a formatted string (not just the ISO date)
      expect(result).not.toBe(date);
    });
  });

  describe("truncateText", () => {
    it("should return the original text if within limit", () => {
      const text = "Short text";
      const result = truncateText(text, 100);
      expect(result).toBe(text);
    });

    it("should truncate text that exceeds the limit", () => {
      const text = "This is a very long text that exceeds the character limit";
      const result = truncateText(text, 20);
      expect(result).toBe("This is a very long ...");
      expect(result.length).toBeLessThanOrEqual(23); // 20 + "..."
    });

    it("should handle empty string", () => {
      const result = truncateText("", 10);
      expect(result).toBe("");
    });
  });

  describe("isWithinCharacterLimit", () => {
    it("should return true for text within limit", () => {
      const text = "Within limit";
      const result = isWithinCharacterLimit(text, 100);
      expect(result).toBe(true);
    });

    it("should return false for text exceeding limit", () => {
      const text = "This text exceeds the limit";
      const result = isWithinCharacterLimit(text, 10);
      expect(result).toBe(false);
    });

    it("should return true for text exactly at limit", () => {
      const text = "12345";
      const result = isWithinCharacterLimit(text, 5);
      expect(result).toBe(true);
    });

    it("should handle empty string", () => {
      const result = isWithinCharacterLimit("", 10);
      expect(result).toBe(true);
    });
  });

  describe("validateFlashcard", () => {
    it("should validate correct flashcard", () => {
      const result = validateFlashcard("What is React?", "A JavaScript library");
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject empty question", () => {
      const result = validateFlashcard("", "Answer");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Question is required");
    });

    it("should reject empty answer", () => {
      const result = validateFlashcard("Question?", "");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Answer is required");
    });

    it("should reject question exceeding 300 characters", () => {
      const longQuestion = "a".repeat(301);
      const result = validateFlashcard(longQuestion, "Answer");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Question must be 300 characters or less");
    });

    it("should reject answer exceeding 500 characters", () => {
      const longAnswer = "a".repeat(501);
      const result = validateFlashcard("Question?", longAnswer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Answer must be 500 characters or less");
    });

    it("should accept question at 300 characters", () => {
      const question = "a".repeat(300);
      const result = validateFlashcard(question, "Answer");
      expect(result.isValid).toBe(true);
    });

    it("should accept answer at 500 characters", () => {
      const answer = "a".repeat(500);
      const result = validateFlashcard("Question?", answer);
      expect(result.isValid).toBe(true);
    });

    it("should return multiple errors when applicable", () => {
      const result = validateFlashcard("", "");
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain("Question is required");
      expect(result.errors).toContain("Answer is required");
    });
  });
});
