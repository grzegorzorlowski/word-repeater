/**
 * DashboardCTAButtons Component
 * Provides action buttons for navigation:
 * - Review pending AI flashcards
 * - Generate flashcards
 * - Create manual flashcard
 * - View existing flashcards
 * - Start learning session
 */
import * as React from "react";
import { Button } from "@/components/ui/button";

export function DashboardCTAButtons() {
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = React.useState(true);

  // Fetch pending flashcards count on mount
  React.useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch("/api/flashcards?status=pending&source=ai_generated&limit=1");

        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.total || 0);
        }
      } catch (err) {
        // Silently fail - the button will just not show
        console.error("Failed to fetch pending flashcards count:", err);
      } finally {
        setIsLoadingCount(false);
      }
    };

    fetchPendingCount();
  }, []);

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto" role="navigation" aria-label="Dashboard navigation">
      {/* Review Pending Flashcards - Only show if there are pending flashcards */}
      {!isLoadingCount && pendingCount !== null && pendingCount > 0 && (
        <Button
          onClick={() => handleNavigation("/accept")}
          size="lg"
          className="w-full py-6 text-lg bg-orange-600 hover:bg-orange-700 text-white shadow-md"
          aria-label={`Review ${pendingCount} pending flashcard${pendingCount === 1 ? "" : "s"}`}
        >
          Review Pending Flashcards
          <span className="ml-2 px-2.5 py-0.5 bg-white text-orange-600 rounded-full text-sm font-bold">
            {pendingCount}
          </span>
        </Button>
      )}

      <Button
        onClick={() => handleNavigation("/generate")}
        size="lg"
        className="w-full py-6 text-lg"
        aria-label="Generate new flashcards"
      >
        Generate Flashcards
      </Button>

      <Button
        onClick={() => handleNavigation("/flashcards/new")}
        size="lg"
        variant="outline"
        className="w-full py-6 text-lg"
        aria-label="Create manual flashcard"
      >
        Create Manual Flashcard
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
