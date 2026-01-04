// src/components/FlashcardTable.tsx
import type { FlashcardSummaryDTO } from "../types";
import { Button } from "@/components/ui/button";
import { parseFlashcardContent, truncateText, formatDate } from "@/lib/utils/flashcardUtils";

/**
 * Props for FlashcardTable component
 */
interface FlashcardTableProps {
  /**
   * Array of flashcards to display
   */
  flashcards: FlashcardSummaryDTO[];
  /**
   * Callback when edit button is clicked
   */
  onEdit: (flashcard: FlashcardSummaryDTO) => void;
  /**
   * Callback when delete button is clicked
   */
  onDelete: (flashcard: FlashcardSummaryDTO) => void;
}

/**
 * FlashcardTable component displays flashcards in a table format.
 * Shows flashcard details with edit and delete action buttons.
 *
 * @param props - Component props
 * @returns Rendered flashcard table
 */
export function FlashcardTable({ flashcards, onEdit, onDelete }: FlashcardTableProps) {
  if (flashcards.length === 0) {
    return null; // NoDataMessage component will handle empty state
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse bg-card">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Question</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Answer</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Created</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {flashcards.map((flashcard) => {
            const { question, answer } = parseFlashcardContent(flashcard.content);
            const formattedDate = formatDate(flashcard.created_at);

            return (
              <tr
                key={flashcard.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-foreground max-w-xs">
                  <div title={question}>{truncateText(question, 60)}</div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs">
                  <div title={answer}>{truncateText(answer, 60)}</div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{formattedDate}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(flashcard)}
                      aria-label={`Edit flashcard: ${question}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(flashcard)}
                      aria-label={`Delete flashcard: ${question}`}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
