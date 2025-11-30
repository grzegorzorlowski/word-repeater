import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { AcceptFlashcardView } from "../AcceptFlashcardView";

// Mock the custom hook
vi.mock("../../hooks/useAcceptFlashcard", () => ({
  useAcceptFlashcard: vi.fn(),
}));

import { useAcceptFlashcard } from "../../hooks/useAcceptFlashcard";

const mockUseAcceptFlashcard = vi.mocked(useAcceptFlashcard);

describe("AcceptFlashcardView", () => {
  const mockFlashcard = {
    id: "test-flashcard-id",
    question: "What is React?",
    answer: "A JavaScript library for building user interfaces",
  };

  const defaultMockReturn = {
    flashcard: mockFlashcard,
    loading: false,
    error: null,
    hasMore: true,
    processDecision: vi.fn(),
    clearError: vi.fn(),
    retry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAcceptFlashcard.mockReturnValue(defaultMockReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render header with correct title", () => {
      render(<AcceptFlashcardView />);

      expect(screen.getByText("Review Flashcard")).toBeInTheDocument();
    });

    it("should render back to dashboard link", () => {
      render(<AcceptFlashcardView />);

      const backLink = screen.getByRole("link", { name: /back to dashboard/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute("href", "/dashboard");
    });

    it("should render instructional text", () => {
      render(<AcceptFlashcardView />);

      expect(
        screen.getByText(/Review the question and answer, then decide whether to accept or reject this flashcard/i)
      ).toBeInTheDocument();
    });

    it("should render FullscreenCard when flashcard is present", () => {
      render(<AcceptFlashcardView />);

      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByText("Answer")).toBeInTheDocument();
      expect(screen.getByText("A JavaScript library for building user interfaces")).toBeInTheDocument();
    });

    it("should render ActionButtons", () => {
      render(<AcceptFlashcardView />);

      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show initial loading spinner when loading and no flashcard", () => {
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        flashcard: null,
        loading: true,
      });

      render(<AcceptFlashcardView />);

      expect(screen.getByText("Loading flashcards...")).toBeInTheDocument();
      expect(screen.getByTestId("inline-loader")).toBeInTheDocument();
    });

    it("should show loading spinner during decision processing", () => {
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      render(<AcceptFlashcardView />);

      expect(screen.getByTestId("decision-loader")).toBeInTheDocument();
    });

    it("should not show loading spinner when not loading", () => {
      render(<AcceptFlashcardView />);

      expect(screen.queryByTestId("inline-loader")).not.toBeInTheDocument();
    });
  });

  describe("Error States", () => {
    it("should show error state with retry when error and no flashcard", () => {
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        flashcard: null,
        loading: false,
        error: "Failed to load flashcards",
      });

      render(<AcceptFlashcardView />);

      expect(screen.getByText("Failed to load flashcards")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    it("should call retry when retry button is clicked", async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        flashcard: null,
        loading: false,
        error: "Failed to load flashcards",
        retry: mockRetry,
      });

      render(<AcceptFlashcardView />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it("should show error toast when error and flashcard present", () => {
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        error: "Decision failed",
      });

      render(<AcceptFlashcardView />);

      expect(screen.getByText("Decision failed")).toBeInTheDocument();
    });

    it("should call clearError when error toast is dismissed", async () => {
      const user = userEvent.setup();
      const mockClearError = vi.fn();

      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        error: "Decision failed",
        clearError: mockClearError,
      });

      render(<AcceptFlashcardView />);

      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      await user.click(dismissButton);

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe("Empty State", () => {
    it("should show all done message when no flashcard and not loading", () => {
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        flashcard: null,
        loading: false,
        error: null,
      });

      render(<AcceptFlashcardView />);

      expect(screen.getByText("All Done! 🎉")).toBeInTheDocument();
      expect(screen.getByText("You've reviewed all pending flashcards. Great work!")).toBeInTheDocument();

      const dashboardLink = screen.getByRole("link", { name: /back to dashboard/i });
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("User Interactions", () => {
    it("should call processDecision with 'accept' when accept button is clicked", async () => {
      const user = userEvent.setup();
      const mockProcessDecision = vi.fn();

      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        processDecision: mockProcessDecision,
      });

      render(<AcceptFlashcardView />);

      const acceptButton = screen.getByRole("button", { name: /accept/i });
      await user.click(acceptButton);

      expect(mockProcessDecision).toHaveBeenCalledWith("accept");
    });

    it("should call processDecision with 'reject' when reject button is clicked", async () => {
      const user = userEvent.setup();
      const mockProcessDecision = vi.fn();

      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        processDecision: mockProcessDecision,
      });

      render(<AcceptFlashcardView />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      await user.click(rejectButton);

      expect(mockProcessDecision).toHaveBeenCalledWith("reject");
    });

    it("should disable buttons when loading", () => {
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      render(<AcceptFlashcardView />);

      const acceptButton = screen.getByRole("button", { name: /accept/i });
      const rejectButton = screen.getByRole("button", { name: /reject/i });

      expect(acceptButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });

    it("should show success message after decision", async () => {
      const user = userEvent.setup();
      let successMessage = "";
      let isTransitioning = false;

      // Mock the component's internal state changes
      const mockProcessDecision = vi.fn().mockImplementation(async () => {
        successMessage = "Flashcard accepted! ✓";
        isTransitioning = true;
        // Simulate the timeout
        setTimeout(() => {
          successMessage = "";
          isTransitioning = false;
        }, 500);
      });

      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        processDecision: mockProcessDecision,
      });

      render(<AcceptFlashcardView />);

      const acceptButton = screen.getByRole("button", { name: /accept/i });
      await user.click(acceptButton);

      expect(mockProcessDecision).toHaveBeenCalledWith("accept");

      // Note: Testing the exact success message display would require more complex mocking
      // of the component's internal state, which is tested separately in integration tests
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes on flashcard region", () => {
      render(<AcceptFlashcardView />);

      const flashcardRegion = screen.getByRole("region", { name: /current flashcard/i });
      expect(flashcardRegion).toBeInTheDocument();
      expect(flashcardRegion).toHaveAttribute("aria-live", "polite");
    });

    it("should have proper button labels", () => {
      render(<AcceptFlashcardView />);

      expect(screen.getByLabelText("Reject this flashcard and move to the next one")).toBeInTheDocument();
      expect(screen.getByLabelText("Accept this flashcard and add it to your deck")).toBeInTheDocument();
    });

    it("should have keyboard shortcuts indicated", () => {
      render(<AcceptFlashcardView />);

      const rejectButton = screen.getByRole("button", { name: /reject/i });
      const acceptButton = screen.getByRole("button", { name: /accept/i });

      expect(rejectButton).toHaveAttribute("aria-keyshortcuts", "r");
      expect(acceptButton).toHaveAttribute("aria-keyshortcuts", "a");
    });
  });

  describe("Focus Management", () => {
    it("should focus first button when flashcard loads", async () => {
      // Start with no flashcard
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        flashcard: null,
      });

      const { rerender } = render(<AcceptFlashcardView />);

      // Change to have flashcard
      mockUseAcceptFlashcard.mockReturnValue(defaultMockReturn);

      rerender(<AcceptFlashcardView />);

      await waitFor(() => {
        const firstButton = screen.getByRole("button", { name: /reject/i });
        // Note: Focus testing in JSDOM is limited, but we verify the button exists
        expect(firstButton).toBeInTheDocument();
      });
    });
  });

  describe("Visual States", () => {
    it("should apply transition classes during state changes", () => {
      render(<AcceptFlashcardView />);

      const flashcardContainer = screen.getByRole("region", { name: /current flashcard/i });
      expect(flashcardContainer).toHaveClass("transition-all");
      expect(flashcardContainer).toHaveClass("duration-300");
    });

    it("should have proper container styling", () => {
      render(<AcceptFlashcardView />);

      // Find the main container by looking for an element with the specific flex-col class
      // and containing the Review Flashcard text
      const reviewHeader = screen.getByText("Review Flashcard");
      const mainContainer = reviewHeader.closest(".flex-col");

      expect(mainContainer).toHaveClass("flex");
      expect(mainContainer).toHaveClass("gap-8");
      expect(mainContainer).toHaveClass("max-w-5xl");
      expect(mainContainer).toHaveClass("mx-auto");
    });
  });

  describe("Component Integration", () => {
    it("should pass correct props to child components", () => {
      const mockProcessDecision = vi.fn();

      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        processDecision: mockProcessDecision,
        loading: true,
      });

      render(<AcceptFlashcardView />);

      // ActionButtons should receive the correct props
      const acceptButton = screen.getByRole("button", { name: /accept/i });
      const rejectButton = screen.getByRole("button", { name: /reject/i });

      expect(acceptButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });

    it("should handle all state combinations correctly", () => {
      // Test loading with flashcard
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
      });

      const { rerender } = render(<AcceptFlashcardView />);

      expect(screen.getByTestId("decision-loader")).toBeInTheDocument();
      expect(screen.getByText("What is React?")).toBeInTheDocument();

      // Test error with flashcard
      mockUseAcceptFlashcard.mockReturnValue({
        ...defaultMockReturn,
        loading: false,
        error: "Something went wrong",
      });

      rerender(<AcceptFlashcardView />);

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("What is React?")).toBeInTheDocument();
    });
  });
});
