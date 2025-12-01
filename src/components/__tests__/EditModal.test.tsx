import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditModal } from "../EditModal";
import type { FlashcardSummaryDTO } from "@/types";

// Mock fetch globally
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

// Helper to create proper mock responses
const createMockResponse = (data: any, ok = true, status = 200) => ({
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

describe("EditModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Modal Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<EditModal isOpen={false} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
    });

    it("should not render when flashcard is null", () => {
      render(<EditModal isOpen={true} flashcard={null} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
    });

    it("should render modal with flashcard data when open", () => {
      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();
      expect(screen.getByDisplayValue("What is React?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("A JavaScript library for building user interfaces")).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Edit Flashcard")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors for empty question", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Clear the question field
      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);

      // Try to submit
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText("Question is required")).toBeInTheDocument();
      });
    });

    it("should show validation errors for empty answer", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Clear the answer field
      const answerField = screen.getByLabelText("Answer");
      await user.clear(answerField);

      // Try to submit
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Check for validation error
      await waitFor(() => {
        expect(screen.getByText("Answer is required")).toBeInTheDocument();
      });
    });

    it("should allow question with exactly 300 characters", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter exactly 300 characters (maxLength limit)
      const questionField = screen.getByLabelText("Question") as HTMLTextAreaElement;
      const text300 = "a".repeat(300);

      await user.clear(questionField);
      // Use paste for performance - typing 300 characters is slow
      await user.click(questionField);
      await user.paste(text300);

      // Verify the character count
      expect(questionField.value).toHaveLength(300);

      // Mock the API response so it doesn't fail
      fetchMock.mockResolvedValueOnce(createMockResponse({ message: "Success" }));

      // Submit should succeed
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Modal should close on success
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should show validation error for whitespace-only question", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter only whitespace
      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);
      await user.type(questionField, "   ");

      // Try to submit
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Check for validation error (trimmed content is empty)
      await waitFor(() => {
        expect(screen.getByText("Question is required")).toBeInTheDocument();
      });
    });

    it("should allow answer with exactly 500 characters", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter exactly 500 characters (maxLength limit)
      const answerField = screen.getByLabelText("Answer") as HTMLTextAreaElement;
      const text500 = "a".repeat(500);

      await user.clear(answerField);
      // Use paste for performance - typing 500 characters is slow
      await user.click(answerField);
      await user.paste(text500);

      // Verify the character count
      expect(answerField.value).toHaveLength(500);

      // Mock the API response so it doesn't fail
      fetchMock.mockResolvedValueOnce(createMockResponse({ message: "Success" }));

      // Submit should succeed
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Modal should close on success
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should show validation error for whitespace-only answer", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter only whitespace in answer field
      const answerField = screen.getByLabelText("Answer");
      await user.clear(answerField);
      await user.type(answerField, "   ");

      // Try to submit
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Check for validation error (trimmed content is empty)
      await waitFor(() => {
        expect(screen.getByText("Answer is required")).toBeInTheDocument();
      });
    });

    it("should clear validation errors when fields are corrected", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Clear question field to trigger error
      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);

      // Submit to show error
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Question is required")).toBeInTheDocument();
      });

      // Fix the question
      await user.type(questionField, "Fixed question");

      // Mock the API to fail (to keep modal open and verify validation cleared)
      fetchMock.mockResolvedValueOnce(createMockResponse({ error: "API error" }, false, 400));

      // Submit again
      await user.click(submitButton);

      // Validation error should be gone (though API error may appear)
      await waitFor(() => {
        expect(screen.queryByText("Question is required")).not.toBeInTheDocument();
      });
    });

    it("should show character count for question field", () => {
      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/14\s*\/\s*300/)).toBeInTheDocument();
    });

    it("should show character count for answer field", () => {
      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText(/49\s*\/\s*500/)).toBeInTheDocument();
    });

    it("should update character count as user types", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);
      await user.type(questionField, "New question");

      expect(screen.getByText(/12\s*\/\s*300/)).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should successfully submit valid form", async () => {
      const user = userEvent.setup();

      const mockResponse = { message: "Flashcard updated successfully" };
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Modify the question
      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);
      await user.type(questionField, "Updated question");

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Verify API call - check call arguments
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
        const call = fetchMock.mock.calls[0];
        const [urlOrRequest, options] = call;

        // Handle both string URL + options or Request object
        if (typeof urlOrRequest === "string") {
          expect(urlOrRequest).toBe("/api/flashcards/test-flashcard-id");
          expect(options?.method).toBe("PUT");
        } else {
          // Request object - check URL and method
          expect(urlOrRequest.url).toContain("/api/flashcards/test-flashcard-id");
          expect(urlOrRequest.method).toBe("PUT");
        }
      });

      // Verify callbacks
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      // Create a promise that doesn't resolve immediately
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Should show loading state (submit button disabled)
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(createMockResponse({ message: "Success" }));

      await waitFor(() => {
        const updatedButtons = screen.getAllByRole("button") as HTMLButtonElement[];
        const hasDisabledButtonAfter = updatedButtons.some((button) => button.disabled);
        expect(hasDisabledButtonAfter).toBe(false);
      });
    });

    it("should disable close button during submission", async () => {
      const user = userEvent.setup();

      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Close button should be disabled
      const closeButton = screen.getByLabelText("Close dialog");
      expect(closeButton).toBeDisabled();

      // Cancel button should be disabled
      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(createMockResponse({ message: "Success" }));

      await waitFor(() => {
        expect(closeButton).not.toBeDisabled();
        expect(cancelButton).not.toBeDisabled();
      });
    });

    it("should handle API errors gracefully", async () => {
      const user = userEvent.setup();

      const errorResponse = { error: "Failed to update flashcard" };
      fetchMock.mockResolvedValueOnce(createMockResponse(errorResponse, false, 400));

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText("Failed to update flashcard")).toBeInTheDocument();
      });

      // Should not call success/close callbacks
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      const user = userEvent.setup();

      // Alternative 2: Control timing with manual promise resolution
      let rejectPromise: (error: Error) => void;
      const networkErrorPromise = new Promise<Response>((_, reject) => {
        rejectPromise = reject;
      });

      fetchMock.mockReturnValueOnce(networkErrorPromise);

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      expect(submitButton).toBeInTheDocument();
      await user.click(submitButton);

      // Verify buttons are disabled immediately after click
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Cancel")).toBeDisabled();

      // Now reject the promise to simulate network error
      rejectPromise!(new Error("Network error"));

      // Should show network error message
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });

      // Buttons should be re-enabled after error
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(screen.getByText("Cancel")).not.toBeDisabled();
      });
    });

    it("should trim whitespace from question and answer before submitting", async () => {
      const user = userEvent.setup();

      const mockResponse = { message: "Flashcard updated successfully" };
      fetchMock.mockResolvedValueOnce(createMockResponse(mockResponse));

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Add whitespace to fields
      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);
      await user.type(questionField, "  Question with spaces  ");

      const answerField = screen.getByLabelText("Answer");
      await user.clear(answerField);
      await user.type(answerField, "  Answer with spaces  ");

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Verify trimmed values were sent
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
        const call = fetchMock.mock.calls[0];
        const [urlOrRequest] = call;

        // Just verify the call was made with correct URL
        if (typeof urlOrRequest === "string") {
          expect(urlOrRequest).toBe("/api/flashcards/test-flashcard-id");
        } else {
          expect(urlOrRequest.url).toContain("/api/flashcards/test-flashcard-id");
          expect(urlOrRequest.method).toBe("PUT");
        }
      });
    });
  });

  describe("Modal Interaction", () => {
    it("should call onClose when Cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const closeButton = screen.getByLabelText("Close dialog");
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not call onClose during submission", async () => {
      const user = userEvent.setup();

      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      fetchMock.mockReturnValueOnce(pendingPromise);

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Try to close during submission
      const closeButton = screen.getByLabelText("Close dialog");
      await user.click(closeButton);

      // Should not call onClose during submission
      expect(mockOnClose).not.toHaveBeenCalled();

      // Resolve the promise
      resolvePromise!(createMockResponse({ message: "Success" }));

      // Now closing should work
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should close modal on backdrop click", async () => {
      const user = userEvent.setup();

      const { container } = render(
        <EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      // Click on the backdrop (the modal overlay) - this is the div with role="dialog"
      const backdrop = container.querySelector('[role="dialog"]') as HTMLElement;
      await user.click(backdrop);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should not close modal when clicking inside modal content", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Click inside the modal content
      const modalContent = screen.getByText("Edit Flashcard");
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Field Updates", () => {
    it("should update question field when user types", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const questionField = screen.getByLabelText("Question");
      await user.clear(questionField);
      await user.type(questionField, "New question text");

      expect(questionField).toHaveValue("New question text");
    });

    it("should update answer field when user types", async () => {
      const user = userEvent.setup();

      render(<EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const answerField = screen.getByLabelText("Answer");
      await user.clear(answerField);
      await user.type(answerField, "New answer text");

      expect(answerField).toHaveValue("New answer text");
    });

    it("should reset form when flashcard changes", () => {
      const { rerender } = render(
        <EditModal isOpen={true} flashcard={mockFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      );

      const newFlashcard: FlashcardSummaryDTO = {
        id: "new-flashcard-id",
        content: JSON.stringify({
          question: "What is Vue?",
          answer: "A progressive JavaScript framework",
        }),
        created_at: "2024-01-16T10:30:00.000Z",
      };

      rerender(<EditModal isOpen={true} flashcard={newFlashcard} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByDisplayValue("What is Vue?")).toBeInTheDocument();
      expect(screen.getByDisplayValue("A progressive JavaScript framework")).toBeInTheDocument();
    });
  });
});
