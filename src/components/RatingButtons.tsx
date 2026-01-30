import { useCallback, useEffect } from "react";
import type { Rating } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RATING_OPTIONS: { rating: Rating; label: string; variant: "destructive" | "outline" | "default"; success?: boolean }[] = [
  { rating: "again", label: "Again", variant: "destructive" },
  { rating: "hard", label: "Hard", variant: "outline" },
  { rating: "good", label: "Good", variant: "default" },
  { rating: "easy", label: "Easy", variant: "default", success: true },
];

const KEY_TO_RATING: Record<string, Rating> = {
  "1": "again",
  "2": "hard",
  "3": "good",
  "4": "easy",
};

export interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  disabled: boolean;
  answerVisible: boolean;
}

/**
 * Four rating buttons (Again, Hard, Good, Easy) with distinct styling.
 * Enabled only when answer is visible. Supports keyboard shortcuts 1–4.
 */
export default function RatingButtons({ onRate, disabled, answerVisible }: RatingButtonsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!answerVisible || disabled) return;
      const rating = KEY_TO_RATING[e.key];
      if (!rating) return;
      e.preventDefault();
      onRate(rating);
    },
    [answerVisible, disabled, onRate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const buttonsEnabled = answerVisible && !disabled;

  return (
    <div
      role="group"
      aria-label="Rate your recall"
      className="flex flex-wrap gap-3 sm:gap-4 justify-center"
    >
      {RATING_OPTIONS.map(({ rating, label, variant, success }) => (
        <Button
          key={rating}
          type="button"
          variant={variant}
          className={cn(
            "min-h-[44px] min-w-[44px]",
            success && "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600/20 dark:bg-green-700 dark:hover:bg-green-800"
          )}
          disabled={!buttonsEnabled}
          onClick={() => onRate(rating)}
          aria-label={`Rate as: ${label}`}
          data-testid={`rating-${rating}`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
