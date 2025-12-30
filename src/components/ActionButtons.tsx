/**
 * ActionButtons Component
 * Provides Accept and Reject buttons for flashcard decisions.
 * Supports keyboard navigation with arrow keys and Enter/Space.
 */
import * as React from "react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onDecision: (decision: "accept" | "reject") => void;
  disabled: boolean;
}

export function ActionButtons({ onDecision, disabled }: ActionButtonsProps) {
  const rejectButtonRef = React.useRef<HTMLButtonElement>(null);
  const acceptButtonRef = React.useRef<HTMLButtonElement>(null);

  // Keyboard navigation: Arrow keys to switch between buttons
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const activeElement = document.activeElement;

      if (activeElement === rejectButtonRef.current) {
        acceptButtonRef.current?.focus();
      } else if (activeElement === acceptButtonRef.current) {
        rejectButtonRef.current?.focus();
      }
    }
  };

  return (
    <div
      className="flex flex-col sm:flex-row gap-4 w-full max-w-4xl mx-auto"
      role="group"
      aria-label="Flashcard decision buttons"
    >
      {/* Reject Button */}
      <Button
        ref={rejectButtonRef}
        variant="outline"
        size="lg"
        onClick={() => onDecision("reject")}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 h-14 text-lg font-semibold transition-transform hover:scale-105 active:scale-95"
        aria-label="Reject this flashcard and move to the next one"
        aria-keyshortcuts="r"
      >
        <span className="inline-block mr-2" aria-hidden="true">
          ✕
        </span>
        Reject
      </Button>

      {/* Accept Button */}
      <Button
        ref={acceptButtonRef}
        variant="default"
        size="lg"
        onClick={() => onDecision("accept")}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex-1 h-14 text-lg font-semibold transition-transform hover:scale-105 active:scale-95"
        aria-label="Accept this flashcard and add it to your deck"
        aria-keyshortcuts="a"
      >
        <span className="inline-block mr-2" aria-hidden="true">
          ✓
        </span>
        Accept
      </Button>
    </div>
  );
}
