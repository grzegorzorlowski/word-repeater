// src/lib/utils/flashcardUtils.ts

/**
 * Parses flashcard content from JSON format to extract question and answer.
 * The content is stored as JSON: {"question": "...", "answer": "..."}
 *
 * @param content - Raw content string from database (JSON stringified)
 * @returns Object with question and answer properties
 */
export function parseFlashcardContent(content: string): { question: string; answer: string } {
  try {
    const parsed = JSON.parse(content);
    return {
      question: parsed.question || "",
      answer: parsed.answer || "",
    };
  } catch {
    // Fallback for malformed content
    return { question: content, answer: "" };
  }
}

/**
 * Truncates text to a specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Formats ISO date string to readable format
 *
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
