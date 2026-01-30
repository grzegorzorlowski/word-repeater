import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import LearningSessionView from "../LearningSessionView";

vi.mock("../../hooks/useLearningSession", () => ({
  useLearningSession: vi.fn(),
}));

import { useLearningSession } from "../../hooks/useLearningSession";

const mockUseLearningSession = vi.mocked(useLearningSession);

const mockCard = {
  flashcardId: "card-1",
  question: "What is React?",
  answer: "A JavaScript library for building UIs",
  schedule: {
    next_due: "2025-01-28T12:00:00.000Z",
    interval_days: 1,
    repetition_count: 1,
    ease_factor: 2.5,
  },
};

const defaultMockReturn = {
  cards: [mockCard],
  currentCard: mockCard,
  currentIndex: 0,
  totalCards: 1,
  showAnswer: false,
  setShowAnswer: vi.fn(),
  loading: false,
  error: null,
  sessionStartTime: Date.now(),
  reviewedCount: 0,
  submitting: false,
  cardRemovedToast: null,
  isSessionComplete: false,
  durationSeconds: 0,
  durationMinutes: 0,
  submitRating: vi.fn(),
  retry: vi.fn(),
  clearError: vi.fn(),
};

describe("LearningSessionView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLearningSession.mockReturnValue(defaultMockReturn as ReturnType<typeof useLearningSession>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Loading state", () => {
    it("should show loader when loading and no cards", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        loading: true,
        totalCards: 0,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByText("Loading flashcards...")).toBeInTheDocument();
      expect(screen.getByTestId("inline-loader")).toBeInTheDocument();
      expect(screen.getByTestId("learning-loading")).toBeInTheDocument();
    });
  });

  describe("Fetch error", () => {
    it("should show error and Retry when fetch fails", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        error: "Server error. Please try again later.",
        totalCards: 0,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByTestId("learning-fetch-error")).toBeInTheDocument();
      expect(screen.getByText("Server error. Please try again later.")).toBeInTheDocument();
      expect(screen.getByTestId("error-retry-button")).toBeInTheDocument();
    });

    it("should show login link when error is 401 message", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        error: "You must be logged in to review flashcards.",
        totalCards: 0,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      const loginLink = screen.getByTestId("login-link");
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
      expect(loginLink).toHaveTextContent("Log in");
    });
  });

  describe("Empty state", () => {
    it("should show EmptyLearningState when no cards", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        cards: [],
        currentCard: null,
        totalCards: 0,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByTestId("learning-empty")).toBeInTheDocument();
      expect(screen.getByText("No flashcards to review today")).toBeInTheDocument();
      expect(screen.getByTestId("empty-generate-link")).toHaveAttribute("href", "/generate");
      expect(screen.getByTestId("empty-create-link")).toHaveAttribute("href", "/flashcards/new");
    });
  });

  describe("Session complete", () => {
    it("should show SessionSummary when isSessionComplete", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        currentCard: null,
        isSessionComplete: true,
        reviewedCount: 5,
        durationMinutes: 2,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByTestId("learning-summary")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Session complete" })).toBeInTheDocument();
      expect(screen.getByText(/You reviewed 5 cards/)).toBeInTheDocument();
      expect(screen.getByTestId("back-to-dashboard")).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("Active session", () => {
    it("should show header, progress, card and Dashboard link", () => {
      render(<LearningSessionView />);

      expect(screen.getByTestId("learning-active")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Learning Session" })).toBeInTheDocument();
      expect(screen.getByText("Card 1 of 1")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Back to Dashboard" })).toBeInTheDocument();
      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Show answer" })).toBeInTheDocument();
    });

    it("should not show RatingButtons until answer is visible", () => {
      render(<LearningSessionView />);

      expect(screen.queryByRole("button", { name: /Rate as: Again/ })).not.toBeInTheDocument();
    });

    it("should show RatingButtons when showAnswer is true", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        showAnswer: true,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByRole("button", { name: "Rate as: Again" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate as: Hard" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate as: Good" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Rate as: Easy" })).toBeInTheDocument();
    });

    it("should call setShowAnswer when Show Answer is clicked", async () => {
      const user = userEvent.setup();
      const setShowAnswer = vi.fn();
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        setShowAnswer,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      await user.click(screen.getByRole("button", { name: "Show answer" }));

      expect(setShowAnswer).toHaveBeenCalledWith(true);
    });

    it("should call submitRating when rating button clicked", async () => {
      const user = userEvent.setup();
      const submitRating = vi.fn().mockResolvedValue(undefined);
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        showAnswer: true,
        submitRating,
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      await user.click(screen.getByRole("button", { name: "Rate as: Good" }));

      expect(submitRating).toHaveBeenCalledWith("good");
    });

    it("should show card-removed toast when cardRemovedToast is set", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        showAnswer: true,
        cardRemovedToast: "This card was removed.",
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByTestId("card-removed-toast")).toBeInTheDocument();
      expect(screen.getByText("This card was removed.")).toBeInTheDocument();
    });

    it("should show ErrorToast for submit error when currentCard present", () => {
      mockUseLearningSession.mockReturnValue({
        ...defaultMockReturn,
        showAnswer: true,
        error: "Could not save your rating. Try again.",
      } as ReturnType<typeof useLearningSession>);

      render(<LearningSessionView />);

      expect(screen.getByText("Could not save your rating. Try again.")).toBeInTheDocument();
    });
  });
});
