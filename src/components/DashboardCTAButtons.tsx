/**
 * DashboardCTAButtons Component
 * Provides three action buttons for navigation:
 * - Generate flashcards
 * - View existing flashcards
 * - Start learning session
 */
import * as React from "react";
import { Button } from "@/components/ui/button";

export function DashboardCTAButtons() {
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto" role="navigation" aria-label="Dashboard navigation">
      <Button
        onClick={() => handleNavigation("/generate")}
        size="lg"
        className="w-full py-6 text-lg"
        aria-label="Generate new flashcards"
      >
        Generate Flashcards
      </Button>

      <Button
        onClick={() => handleNavigation("/flashcards")}
        size="lg"
        variant="outline"
        className="w-full py-6 text-lg"
        aria-label="View my flashcards"
      >
        My Flashcards
      </Button>

      <Button
        onClick={() => handleNavigation("/learn")}
        size="lg"
        variant="secondary"
        className="w-full py-6 text-lg"
        aria-label="Start learning session"
      >
        Start Learning
      </Button>
    </div>
  );
}
