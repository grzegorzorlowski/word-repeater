import { useMemo } from "react";

export interface ProgressIndicatorProps {
  current: number;
  total: number;
}

/**
 * Shows session progress as "Card X of Y" with an optional progress bar.
 * Updates are announced to screen readers via aria-live.
 */
export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const { safeCurrent, safeTotal, percentage } = useMemo(() => {
    const c = Math.max(0, Math.min(current, total));
    const t = Math.max(0, total);
    const p = t > 0 ? Math.round((c / t) * 100) : 0;
    return { safeCurrent: c, safeTotal: t, percentage: p };
  }, [current, total]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="space-y-2"
      data-testid="progress-indicator"
    >
      <p className="text-sm text-muted-foreground">
        Card {safeCurrent} of {safeTotal}
      </p>
      {safeTotal > 0 && (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuenow={safeCurrent}
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-label={`Progress: card ${safeCurrent} of ${safeTotal}`}
        >
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
