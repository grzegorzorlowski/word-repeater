// src/components/NoDataMessage.tsx

/**
 * Props for NoDataMessage component
 */
interface NoDataMessageProps {
  /**
   * Whether any filters are active
   */
  hasActiveFilters: boolean;
}

/**
 * NoDataMessage component displays a friendly message when no flashcards are found.
 * Shows different messages based on whether filters are active.
 * Provides CTA buttons to create or generate flashcards.
 *
 * @param props - Component props
 * @returns Rendered no data message
 */
export function NoDataMessage({ hasActiveFilters }: NoDataMessageProps) {
  return (
    <div className="bg-card rounded-lg border p-12 text-center">
      <svg
        className="w-16 h-16 mx-auto mb-4 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 className="text-xl font-semibold text-foreground mb-2">No flashcards found</h3>
      <p className="text-muted-foreground mb-6">
        {hasActiveFilters
          ? "Try adjusting your filters or create new flashcards."
          : "Get started by creating your first flashcard."}
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <a
          href="/flashcards/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Create Flashcard
        </a>
        <a
          href="/generate"
          className="inline-flex items-center px-4 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Generate with AI
        </a>
      </div>
    </div>
  );
}
