export interface SessionSummaryProps {
  cardsReviewed: number;
  durationMinutes: number;
}

/**
 * Shown when all cards have been reviewed. Displays count and duration,
 * with a primary CTA to return to the dashboard.
 */
export default function SessionSummary({ cardsReviewed, durationMinutes }: SessionSummaryProps) {
  return (
    <section
      className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
      aria-labelledby="session-summary-heading"
    >
      <h2 id="session-summary-heading" className="text-xl font-semibold" tabIndex={-1}>
        Session complete
      </h2>
      <div className="mt-4 space-y-2 text-muted-foreground">
        <p>You reviewed {cardsReviewed} {cardsReviewed === 1 ? "card" : "cards"}.</p>
        <p>Duration: approximately {durationMinutes} {durationMinutes === 1 ? "min" : "mins"}.</p>
      </div>
      <div className="mt-6">
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="back-to-dashboard"
        >
          Back to Dashboard
        </a>
      </div>
    </section>
  );
}
