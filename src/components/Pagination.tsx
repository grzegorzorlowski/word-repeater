// src/components/Pagination.tsx
import { Button } from "@/components/ui/button";

/**
 * Props for Pagination component
 */
interface PaginationProps {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
}

/**
 * Generates an array of page numbers to display in pagination.
 * Shows ellipsis (...) for large page ranges.
 *
 * @param currentPage - Current active page
 * @param totalPages - Total number of pages
 * @returns Array of page numbers (numbers or 'ellipsis' string)
 */
function generatePageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  // If 7 or fewer pages, show all
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Always show first page, last page, current page, and neighbors
  const pages: (number | "ellipsis")[] = [];

  // Always include first page
  pages.push(1);

  // Calculate range around current page
  const showEllipsisStart = currentPage > 3;
  const showEllipsisEnd = currentPage < totalPages - 2;

  if (showEllipsisStart) {
    pages.push("ellipsis");
  }

  // Show pages around current page
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (showEllipsisEnd) {
    pages.push("ellipsis");
  }

  // Always include last page (if not already included)
  if (!pages.includes(totalPages)) {
    pages.push(totalPages);
  }

  return pages;
}

/**
 * Pagination component for navigating through pages of content.
 * Provides Previous/Next buttons and page number buttons.
 *
 * @param props - Component props
 * @returns Rendered pagination controls
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Don't render if there are no pages or only one page
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages);
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <nav className="flex items-center justify-center gap-1" role="navigation" aria-label="Pagination">
      {/* Previous button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Go to previous page"
        className="mr-2"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </Button>

      {/* Page number buttons */}
      {pageNumbers.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" aria-hidden="true">
              ...
            </span>
          );
        }

        const isCurrentPage = page === currentPage;

        return (
          <Button
            key={page}
            variant={isCurrentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            disabled={isCurrentPage}
            aria-label={`Go to page ${page}`}
            aria-current={isCurrentPage ? "page" : undefined}
            className="min-w-[2.5rem]"
          >
            {page}
          </Button>
        );
      })}

      {/* Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Go to next page"
        className="ml-2"
      >
        Next
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </nav>
  );
}
