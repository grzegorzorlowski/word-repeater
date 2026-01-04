import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteModal } from "../DeleteModal";
import type { FlashcardSummaryDTO } from "@/types";

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Helper to create proper mock responses
const createMockResponse = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: () => Promise.resolve(data),
  clone: function () {
    return this;
  },
});

// Mock flashcard data
const mockFlashcard: FlashcardSummaryDTO = {
  id: "test-flashcard-id",
  content: JSON.stringify({
    question: "What is React?",
    answer: "A JavaScript library for building user interfaces",
  }),
  created_at: "2024-01-15T10:30:00.000Z",
};

describe("DeleteModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock for each test
    fetchMock.mockReset();
    // Re-stub global fetch after clearing mocks
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Modal Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<DeleteModal isOpen={false} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.queryByText("Delete Flashcard")).not.toBeInTheDocument();
    });

    it("should not render when flashcard is null", () => {
      render(<DeleteModal isOpen={true} flashcard={null} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.queryByText("Delete Flashcard")).not.toBeInTheDocument();
    });

    it("should render modal with flashcard question when open", () => {
      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText("Delete Flashcard")).toBeInTheDocument();
      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByText("Are you sure you want to delete this flashcard?")).toBeInTheDocument();
      expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Delete Flashcard")).toBeInTheDocument();
    });

    it("should show warning icon", () => {
      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Warning icon should be present (it's an SVG with specific classes)
      const warningIcon = document.querySelector("svg.text-destructive");
      expect(warningIcon).toBeInTheDocument();
    });
  });

  describe("Delete Action", () => {
    it("should successfully delete flashcard", async () => {
      const user = userEvent.setup();

      // Create a promise that doesn't resolve immediately
      let resolvePromise: ((value: ReturnType<typeof createMockResponse>) => void) | undefined;
      const pendingPromise = new Promise<ReturnType<typeof createMockResponse>>((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click delete button
      const deleteButton = screen.getByText("Delete");
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).not.toBeDisabled();
      await user.click(deleteButton);

      // Wait for the delete operation to start (buttons become disabled)
      await waitFor(() => {
        const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
        const hasDisabledButton = buttons.some((button) => button.disabled);
        expect(hasDisabledButton).toBe(true);
      });

      // Verify API call was made
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Check the call arguments
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs[0]).toBe("/api/flashcards/test-flashcard-id");
      expect(callArgs[1]).toHaveProperty("method", "DELETE");

      // Resolve the promise to complete the deletion
      if (resolvePromise) {
        resolvePromise(createMockResponse({ message: "Flashcard deleted successfully" }));
      }

      // Wait for the operation to complete (modal should close)
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should show loading state during deletion", async () => {
      const user = userEvent.setup();

      // Create a promise that doesn't resolve immediately
      let resolvePromise: ((value: ReturnType<typeof createMockResponse>) => void) | undefined;
      const pendingPromise = new Promise<ReturnType<typeof createMockResponse>>((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click delete button
      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      // Should show loading state (buttons disabled)
      const buttons = screen.getAllByRole("button") as HTMLButtonElement[];
      const hasDisabledButton = buttons.some((button) => button.disabled);
      expect(hasDisabledButton).toBe(true);

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise(createMockResponse({ message: "Success" }));
      }

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole("button") as HTMLButtonElement[];
        const hasDisabledButtonAfter = updatedButtons.some((button) => button.disabled);
        expect(hasDisabledButtonAfter).toBe(false);
      });
    });

    it("should disable buttons during deletion", async () => {
      const user = userEvent.setup();

      let resolvePromise: ((value: ReturnType<typeof createMockResponse>) => void) | undefined;
      const pendingPromise = new Promise<ReturnType<typeof createMockResponse>>((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click delete button
      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      // All buttons should be disabled during deletion
      expect(deleteButton).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();
      expect(screen.getByLabelText("Close dialog")).toBeDisabled();

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise(createMockResponse({ message: "Success" }));
      }

      await waitFor(() => {
        expect(deleteButton).not.toBeDisabled();
        expect(screen.getByText("Cancel")).not.toBeDisabled();
        expect(screen.getByLabelText("Close dialog")).not.toBeDisabled();
      });
    });

    it("should handle API errors gracefully", async () => {
      const user = userEvent.setup();

      // Create a promise that resolves with error response after a delay to allow loading state to show
      const errorResponse = { error: "Failed to delete flashcard" };
      const delayedErrorResponse = new Promise<ReturnType<typeof createMockResponse>>((resolve) => {
        setTimeout(() => resolve(createMockResponse(errorResponse, false, 400)), 10);
      });

      fetchMock.mockReturnValueOnce(delayedErrorResponse);

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click delete button
      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      // Should show error message (skip checking loading state as it's too fast)
      await waitFor(() => {
        expect(screen.getByText("Failed to delete flashcard")).toBeInTheDocument();
      });

      // Buttons should be enabled again after error
      expect(deleteButton).not.toBeDisabled();
      expect(screen.getByText("Cancel")).not.toBeDisabled();

      // Should not call success/close callbacks
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      const user = userEvent.setup();

      // Mock fetch to reject with network error
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click delete button
      const deleteButton = screen.getByText("Delete");
      expect(deleteButton).toBeInTheDocument();
      await user.click(deleteButton);

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("Modal Interaction", () => {
    it("should call onClose when Cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const closeButton = screen.getByLabelText("Close dialog");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not call onClose during deletion", async () => {
      const user = userEvent.setup();

      let resolvePromise: ((value: ReturnType<typeof createMockResponse>) => void) | undefined;
      const pendingPromise = new Promise<ReturnType<typeof createMockResponse>>((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Start deletion
      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      // Try to close during deletion
      const closeButton = screen.getByLabelText("Close dialog");
      await user.click(closeButton);

      // Should not call onClose during deletion
      expect(mockOnClose).not.toHaveBeenCalled();

      // Resolve the promise
      if (resolvePromise) {
        resolvePromise(createMockResponse({ message: "Success" }));
      }

      // Wait for promise to resolve and modal to close automatically
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should close modal on backdrop click", async () => {
      const user = userEvent.setup();

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click on the backdrop (the modal overlay is the dialog itself)
      const backdrop = screen.getByRole("dialog");
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close modal when clicking inside modal content", async () => {
      const user = userEvent.setup();

      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click inside the modal content
      const modalContent = screen.getByText("Delete Flashcard");
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Content Parsing", () => {
    it("should parse and display flashcard question correctly", () => {
      render(<DeleteModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByText("Question:")).toBeInTheDocument();
    });

    it("should handle malformed flashcard content gracefully", () => {
      const malformedFlashcard: FlashcardSummaryDTO = {
        ...mockFlashcard,
        content: "invalid json",
      };

      render(
        <DeleteModal isOpen={true} flashcard={malformedFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Should show empty question when parsing fails
      expect(screen.getByText("Question:")).toBeInTheDocument();
      // The question content would be empty, so we just verify the structure exists
      const questionContainer = screen.getByText("Question:").nextElementSibling;
      expect(questionContainer).toBeInTheDocument();
    });

    it("should handle flashcard with missing question field", () => {
      const incompleteFlashcard: FlashcardSummaryDTO = {
        ...mockFlashcard,
        content: JSON.stringify({ answer: "Just an answer" }),
      };

      render(
        <DeleteModal isOpen={true} flashcard={incompleteFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Should show empty question
      const questionContainer = screen.getByText("Question:").nextElementSibling;
      expect(questionContainer).toBeInTheDocument();
    });
  });
});
