export interface EmptyLearningStateProps {
  message?: string;
}

const DEFAULT_MESSAGE = "No flashcards to review today";

/**
 * Shown when GET today returns count === 0. Message and CTAs
 * to generate or create flashcards (and optionally dashboard).
 */
export default function EmptyLearningState({ message = DEFAULT_MESSAGE }: EmptyLearningStateProps) {
  return (
    <section
      className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm text-center"
      aria-labelledby="empty-learning-heading"
    >
      <h2 id="empty-learning-heading" className="text-xl font-semibold">
        {message}
      </h2>
      <p className="mt-3 text-muted-foreground">
        Add more flashcards or generate some from your text to get scheduled reviews.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <a
          href="/generate"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="empty-generate-link"
        >
          Generate flashcards
        </a>
        <a
          href="/flashcards/new"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="empty-create-link"
        >
          Create flashcard
        </a>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="empty-dashboard-link"
        >
          Dashboard
        </a>
      </div>
    </section>
  );
}
