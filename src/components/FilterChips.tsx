// src/components/FilterChips.tsx
import { Button } from "@/components/ui/button";

/**
 * Props for FilterChips component
 */
interface FilterChipsProps {
  /**
   * Current source filter value
   */
  sourceFilter: "ai_generated" | "manual" | "";
  /**
   * Current status filter value
   */
  statusFilter: "active" | "pending" | "";
  /**
   * Callback when source filter changes
   */
  onSourceFilterChange: (source: "ai_generated" | "manual" | "") => void;
  /**
   * Callback when status filter changes
   */
  onStatusFilterChange: (status: "active" | "pending" | "") => void;
}

/**
 * FilterChips component for filtering flashcards by source and status.
 * Renders clickable chips/buttons that toggle filter states.
 *
 * @param props - Component props
 * @returns Rendered filter chips
 */
export function FilterChips({
  sourceFilter,
  statusFilter,
  onSourceFilterChange,
  onStatusFilterChange,
}: FilterChipsProps) {
  /**
   * Toggles source filter value
   */
  const handleSourceToggle = (source: "ai_generated" | "manual") => {
    // If clicking the same filter, clear it; otherwise set it
    onSourceFilterChange(sourceFilter === source ? "" : source);
  };

  /**
   * Toggles status filter value
   */
  const handleStatusToggle = (status: "active" | "pending") => {
    // If clicking the same filter, clear it; otherwise set it
    onStatusFilterChange(statusFilter === status ? "" : status);
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Flashcard filters">
      {/* Source filters */}
      <div className="flex gap-2" role="group" aria-label="Source filters">
        <Button
          variant={sourceFilter === "ai_generated" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSourceToggle("ai_generated")}
          aria-pressed={sourceFilter === "ai_generated"}
          aria-label="Filter by AI-generated flashcards"
        >
          AI Generated
        </Button>
        <Button
          variant={sourceFilter === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSourceToggle("manual")}
          aria-pressed={sourceFilter === "manual"}
          aria-label="Filter by manually created flashcards"
        >
          Manual
        </Button>
      </div>

      {/* Divider */}
      <div className="w-px bg-border" aria-hidden="true" />

      {/* Status filters */}
      <div className="flex gap-2" role="group" aria-label="Status filters">
        <Button
          variant={statusFilter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusToggle("active")}
          aria-pressed={statusFilter === "active"}
          aria-label="Filter by active flashcards"
        >
          Active
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusToggle("pending")}
          aria-pressed={statusFilter === "pending"}
          aria-label="Filter by pending flashcards"
        >
          Pending
        </Button>
      </div>

      {/* Clear all filters button - only shown when filters are active */}
      {(sourceFilter || statusFilter) && (
        <>
          <div className="w-px bg-border" aria-hidden="true" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSourceFilterChange("");
              onStatusFilterChange("");
            }}
            aria-label="Clear all filters"
          >
            Clear All
          </Button>
        </>
      )}
    </div>
  );
}
