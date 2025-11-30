import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashcardListPage } from "../FlashcardListPage";
import type { FlashcardSummaryDTO } from "@/types";

// Mock the useFlashcardList hook
const mockUseFlashcardList = vi.fn();
vi.mock("../../hooks/useFlashcardList", () => ({
  useFlashcardList: () => mockUseFlashcardList(),
}));

// Mock fetch for modal operations
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
const mockFlashcards: FlashcardSummaryDTO[] = [
  {
    id: "flashcard-1",
    content: JSON.stringify({
      question: "What is React?",
      answer: "A JavaScript library for building user interfaces",
    }),
    created_at: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "flashcard-2",
    content: JSON.stringify({
      question: "What is TypeScript?",
      answer: "A typed superset of JavaScript",
    }),
    created_at: "2024-01-16T14:20:00.000Z",
  },
];

describe("FlashcardListPage", () => {
  const mockHookReturn = {
    flashcards: mockFlashcards,
    page: 1,
    limit: 10,
    total: 2,
    loading: false,
    error: null,
    filters: {
      source: "",
      status: "",
    },
    setPage: vi.fn(),
    setFilters: vi.fn(),
    refetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFlashcardList.mockReturnValue(mockHookReturn);
  });

  describe("Initial Rendering", () => {
    it("should render the page header with correct title and total count", () => {
      render(<FlashcardListPage />);

      expect(screen.getByText("My Flashcards")).toBeInTheDocument();
      expect(screen.getByText("Browse and manage your flashcards. Total: 2 flashcards")).toBeInTheDocument();
    });

    it("should render back to dashboard link", () => {
      render(<FlashcardListPage />);

      const backLink = screen.getByLabelText("Back to Dashboard");
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute("href", "/dashboard");
    });

    it("should render filter chips component", () => {
      render(<FlashcardListPage />);

      expect(screen.getByLabelText("Flashcard filters")).toBeInTheDocument();
    });

    it("should render flashcard table with data", () => {
      render(<FlashcardListPage />);

      // Check table headers
      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("Answer")).toBeInTheDocument();
      expect(screen.getByText("Created")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();

      // Check flashcard content
      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByText("What is TypeScript?")).toBeInTheDocument();
    });

    it("should render pagination component when multiple pages exist", () => {
      // Set up mock data with enough flashcards for pagination
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        total: 25, // More than 10 (limit) to show pagination
      });

      render(<FlashcardListPage />);

      expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when loading is true", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        loading: true,
      });

      render(<FlashcardListPage />);

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText("Loading flashcards...")).toBeInTheDocument();
    });

    it("should not show table or pagination when loading", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        loading: true,
      });

      render(<FlashcardListPage />);

      expect(screen.queryByText("Question")).not.toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should show error message and retry button when there is an error", () => {
      const errorMessage = "Failed to load flashcards";
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        error: errorMessage,
      });

      render(<FlashcardListPage />);

      expect(screen.getByText("Error loading flashcards")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });

    it("should call refetch when retry button is clicked", async () => {
      const user = userEvent.setup();

      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        error: "Some error",
      });

      render(<FlashcardListPage />);

      const retryButton = screen.getByText("Try again");
      await user.click(retryButton);

      expect(mockHookReturn.refetch).toHaveBeenCalledTimes(1);
    });

    it("should not show table when there is an error", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        error: "Some error",
      });

      render(<FlashcardListPage />);

      expect(screen.queryByText("Question")).not.toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("should show NoDataMessage when no flashcards and no filters active", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        flashcards: [],
        total: 0,
      });

      render(<FlashcardListPage />);

      expect(screen.getByText("No flashcards found")).toBeInTheDocument();
      expect(screen.getByText("Get started by creating your first flashcard.")).toBeInTheDocument();
      expect(screen.getByText("Create Flashcard")).toBeInTheDocument();
      expect(screen.getByText("Generate with AI")).toBeInTheDocument();
    });

    it("should show different message when filters are active", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        flashcards: [],
        total: 0,
        filters: { source: "ai_generated", status: "" },
      });

      render(<FlashcardListPage />);

      expect(screen.getByText("No flashcards found")).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your filters or create new flashcards.")).toBeInTheDocument();
    });
  });

  describe("Filter Integration", () => {
    it("should pass current filter values to FilterChips", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        filters: { source: "manual", status: "active" },
      });

      render(<FlashcardListPage />);

      // The FilterChips component should receive the correct props
      // This is tested through the component's internal behavior
      expect(screen.getByLabelText("Flashcard filters")).toBeInTheDocument();
    });

    it("should call setFilters when source filter changes", async () => {
      const user = userEvent.setup();

      render(<FlashcardListPage />);

      // Click on AI Generated filter
      const aiFilter = screen.getByLabelText("Filter by AI-generated flashcards");
      await user.click(aiFilter);

      expect(mockHookReturn.setFilters).toHaveBeenCalledWith({ source: "ai_generated" });
    });

    it("should call setFilters when status filter changes", async () => {
      const user = userEvent.setup();

      render(<FlashcardListPage />);

      // Click on Active filter
      const activeFilter = screen.getByLabelText("Filter by active flashcards");
      await user.click(activeFilter);

      expect(mockHookReturn.setFilters).toHaveBeenCalledWith({ status: "active" });
    });
  });

  describe("Pagination Integration", () => {
    it("should pass current page and total pages to Pagination component", () => {
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        page: 2,
        total: 25,
      });

      render(<FlashcardListPage />);

      // Should show page 2 as current
      const currentPageButton = screen.getByLabelText("Go to page 2");
      expect(currentPageButton).toHaveAttribute("aria-current", "page");
    });

    it("should call setPage when page changes", async () => {
      const user = userEvent.setup();

      // Set up with enough flashcards for multiple pages
      mockUseFlashcardList.mockReturnValue({
        ...mockHookReturn,
        total: 30, // 30 flashcards with limit of 10 = 3 pages
      });

      render(<FlashcardListPage />);

      // Click on next page
      const nextButton = screen.getByLabelText("Go to next page");
      await user.click(nextButton);

      expect(mockHookReturn.setPage).toHaveBeenCalledWith(2);
    });
  });

  describe("Modal Management", () => {
    it("should not render modals initially", () => {
      render(<FlashcardListPage />);

      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete Flashcard")).not.toBeInTheDocument();
    });

    it("should open edit modal when edit button is clicked", async () => {
      const user = userEvent.setup();

      render(<FlashcardListPage />);

      // Click edit button for first flashcard
      const editButtons = screen.getAllByLabelText(/Edit flashcard:/);
      await user.click(editButtons[0]);

      expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();
      expect(screen.getByDisplayValue("What is React?")).toBeInTheDocument();
    });

    it("should open delete modal when delete button is clicked", async () => {
      const user = userEvent.setup();

      render(<FlashcardListPage />);

      // Click delete button for first flashcard
      const deleteButtons = screen.getAllByLabelText(/Delete flashcard:/);
      await user.click(deleteButtons[0]);

      expect(screen.getByText("Delete Flashcard")).toBeInTheDocument();
      // Check that the modal shows the question
      const questionElements = screen.getAllByText("What is React?");
      expect(questionElements.length).toBeGreaterThan(0);
    });

    it("should close edit modal when close button is clicked", async () => {
      const user = userEvent.setup();

      render(<FlashcardListPage />);

      // Open edit modal
      const editButtons = screen.getAllByLabelText(/Edit flashcard:/);
      await user.click(editButtons[0]);

      expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByLabelText("Close dialog");
      await user.click(closeButton);

      expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
    });

    it("should close delete modal when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(<FlashcardListPage />);

      // Open delete modal
      const deleteButtons = screen.getAllByLabelText(/Delete flashcard:/);
      await user.click(deleteButtons[0]);

      expect(screen.getByText("Delete Flashcard")).toBeInTheDocument();

      // Close modal
      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(screen.queryByText("Delete Flashcard")).not.toBeInTheDocument();
    });

    it("should call refetch after successful edit", async () => {
      const user = userEvent.setup();

      // Mock successful API response
      fetchMock.mockResolvedValueOnce(createMockResponse({ message: "Updated successfully" }));

      render(<FlashcardListPage />);

      // Open edit modal
      const editButtons = screen.getAllByLabelText(/Edit flashcard:/);
      await user.click(editButtons[0]);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Wait for the modal to close (indicating success)
      await waitFor(() => {
        expect(screen.queryByText("Edit Flashcard")).not.toBeInTheDocument();
      });

      // Should call refetch to update the list
      expect(mockHookReturn.refetch).toHaveBeenCalledTimes(1);
    });

    it("should call refetch after successful delete", async () => {
      const user = userEvent.setup();

      // Mock successful API response
      fetchMock.mockResolvedValueOnce(createMockResponse({ message: "Deleted successfully" }));

      render(<FlashcardListPage />);

      // Open delete modal
      const deleteButtons = screen.getAllByLabelText(/Delete flashcard:/);
      await user.click(deleteButtons[0]);

      // Confirm deletion - get the button within the modal
      const deleteButton = screen.getByRole("button", { name: /^Delete$/i });
      await user.click(deleteButton);

      // Wait for the modal to close (indicating success)
      await waitFor(() => {
        expect(screen.queryByText("Delete Flashcard")).not.toBeInTheDocument();
      });

      // Should call refetch to update the list
      expect(mockHookReturn.refetch).toHaveBeenCalledTimes(1);
    });

    it("should handle edit modal API errors", async () => {
      const user = userEvent.setup();

      // Mock failed API response
      fetchMock.mockResolvedValueOnce(createMockResponse({ error: "Update failed" }, false, 400));

      render(<FlashcardListPage />);

      // Open edit modal
      const editButtons = screen.getAllByLabelText(/Edit flashcard:/);
      await user.click(editButtons[0]);

      // Submit the form
      const submitButton = screen.getByText("Save Changes");
      await user.click(submitButton);

      // Should show error and keep modal open
      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        const hasError = alerts.some((alert) => alert.textContent?.includes("Update failed"));
        expect(hasError).toBe(true);
      });

      expect(screen.getByText("Edit Flashcard")).toBeInTheDocument();
      expect(mockHookReturn.refetch).not.toHaveBeenCalled();
    });

    it("should handle delete modal API errors", async () => {
      const user = userEvent.setup();

      // Mock failed API response
      fetchMock.mockResolvedValueOnce(createMockResponse({ error: "Delete failed" }, false, 400));

      render(<FlashcardListPage />);

      // Open delete modal
      const deleteButtons = screen.getAllByLabelText(/Delete flashcard:/);
      await user.click(deleteButtons[0]);

      // Confirm deletion - get the button within the modal
      const deleteButton = screen.getByRole("button", { name: /^Delete$/i });
      await user.click(deleteButton);

      // Should show error and keep modal open
      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        const hasError = alerts.some((alert) => alert.textContent?.includes("Delete failed"));
        expect(hasError).toBe(true);
      });

      expect(screen.getByText("Delete Flashcard")).toBeInTheDocument();
      expect(mockHookReturn.refetch).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<FlashcardListPage />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("My Flashcards");
    });

    it("should have proper table structure", () => {
      render(<FlashcardListPage />);

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      // Should have proper table headers
      const headers = screen.getAllByRole("columnheader");
      expect(headers).toHaveLength(4); // Question, Answer, Created, Actions
    });

    it("should have accessible action buttons in table", () => {
      render(<FlashcardListPage />);

      // Should have accessible edit and delete buttons
      const editButtons = screen.getAllByLabelText(/Edit flashcard:/);
      const deleteButtons = screen.getAllByLabelText(/Delete flashcard:/);

      expect(editButtons).toHaveLength(2); // One for each flashcard
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe("Layout and Styling", () => {
    it("should have proper container styling", () => {
      const { container } = render(<FlashcardListPage />);

      // Get the root container div with min-h-screen class
      const mainContainer = container.querySelector(".min-h-screen");
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass("min-h-screen", "bg-background");
    });

    it("should have proper table styling", () => {
      render(<FlashcardListPage />);

      const table = screen.getByRole("table");
      expect(table).toHaveClass("w-full", "border-collapse");
    });

    it("should render table within proper container", () => {
      render(<FlashcardListPage />);

      // Table should be within an overflow container
      const tableContainer = screen.getByRole("table").parentElement;
      expect(tableContainer).toHaveClass("overflow-x-auto", "rounded-lg", "border");
    });
  });
});
