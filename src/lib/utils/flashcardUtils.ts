/**
 * Utility functions for flashcard operations
 */

/**
 * Parses flashcard content from the database format.
 * Expected format: JSON string with question and answer properties
 * Example: { "question": "What is...", "answer": "It is..." }
 */
export function parseFlashcardContent(content: string): {
  question: string;
  answer: string;
} {
  try {
    const parsed = JSON.parse(content);
    return {
      question: parsed.question || "",
      answer: parsed.answer || "",
    };
  } catch (err) {
    // Fallback: return empty strings if parsing fails
    // eslint-disable-next-line no-console
    console.error("Failed to parse flashcard content:", err);
    return { question: "", answer: "" };
  }
}

/**
 * Formats a date string to a localized date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}

/**
 * Checks if text is within character limit
 */
export function isWithinCharacterLimit(text: string, limit: number): boolean {
  return text.length <= limit;
}

/**
 * Validates flashcard content
 */
export function validateFlashcard(
  question: string,
  answer: string
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!question.trim()) {
    errors.push("Question is required");
  }

  if (!answer.trim()) {
    errors.push("Answer is required");
  }

  if (question.length > 300) {
    errors.push("Question must be 300 characters or less");
  }

  if (answer.length > 500) {
    errors.push("Answer must be 500 characters or less");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
