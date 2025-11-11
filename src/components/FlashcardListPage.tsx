// src/components/FlashcardListPage.tsx
import { useState, useCallback } from "react";
import { FilterChips } from "./FilterChips";
import { FlashcardTable } from "./FlashcardTable";
import { Pagination } from "./Pagination";
import { EditModal } from "./EditModal";
import { DeleteModal } from "./DeleteModal";
import { NoDataMessage } from "./NoDataMessage";
import { useFlashcardList } from "../hooks/useFlashcardList";
import type { FlashcardSummaryDTO } from "../types";

/**
 * Main container component for the Flashcard List view.
 * Manages state for flashcards, filters, pagination, and modals.
 * Integrates all child components to create the complete view.
 *
 * @returns Rendered flashcard list page
 */
export function FlashcardListPage() {
  // Use custom hook for state management
  const { flashcards, page, limit, total, loading, error, filters, setPage, setFilters, refetch } = useFlashcardList();

  // Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [flashcardToEdit, setFlashcardToEdit] = useState<FlashcardSummaryDTO | null>(null);
  const [flashcardToDelete, setFlashcardToDelete] = useState<FlashcardSummaryDTO | null>(null);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  /**
   * Handle source filter change
   */
  const handleSourceFilterChange = useCallback(
    (source: "ai_generated" | "manual" | "") => {
      setFilters({ source });
    },
    [setFilters]
  );

  /**
   * Handle status filter change
   */
  const handleStatusFilterChange = useCallback(
    (status: "active" | "pending" | "") => {
      setFilters({ status });
    },
    [setFilters]
  );

  /**
   * Handle edit button click
   */
  const handleEdit = useCallback((flashcard: FlashcardSummaryDTO) => {
    setFlashcardToEdit(flashcard);
    setIsEditModalOpen(true);
  }, []);

  /**
   * Handle delete button click
   */
  const handleDelete = useCallback((flashcard: FlashcardSummaryDTO) => {
    setFlashcardToDelete(flashcard);
    setIsDeleteModalOpen(true);
  }, []);

  /**
   * Handle successful edit
   */
  const handleEditSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle successful delete
   */
  const handleDeleteSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <a
              href="/dashboard"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-label="Back to Dashboard"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </a>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Flashcards</h1>
          <p className="text-muted-foreground">
            Browse and manage your flashcards. Total: {total} flashcard{total !== 1 ? "s" : ""}
          </p>
        </header>

        {/* Filters */}
        <div className="mb-6">
          <FilterChips
            sourceFilter={filters.source}
            statusFilter={filters.status}
            onSourceFilterChange={handleSourceFilterChange}
            onStatusFilterChange={handleStatusFilterChange}
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status">
              <span className="sr-only">Loading flashcards...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div
            className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md mb-6"
            role="alert"
          >
            <div className="flex items-start">
              <svg
                className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">Error loading flashcards</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="mt-3 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 rounded"
            >
              Try again
            </button>
          </div>
        )}

        {/* No data message */}
        {!loading && !error && flashcards.length === 0 && (
          <NoDataMessage hasActiveFilters={!!(filters.source || filters.status)} />
        )}

        {/* Flashcard table */}
        {!loading && !error && flashcards.length > 0 && (
          <div className="space-y-6">
            <FlashcardTable flashcards={flashcards} onEdit={handleEdit} onDelete={handleDelete} />

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        flashcard={flashcardToEdit}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        flashcard={flashcardToDelete}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
