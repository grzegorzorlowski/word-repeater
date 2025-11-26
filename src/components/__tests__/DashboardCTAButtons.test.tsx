import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { DashboardCTAButtons } from "../DashboardCTAButtons";
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";

describe("DashboardCTAButtons", () => {
  // Mock window.location.href
  const originalLocation = window.location;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Reset handlers before each test
    server.resetHandlers();

    // Mock window.location
    delete (window as any).location;
    window.location = { ...originalLocation, href: "" };

    // Setup default fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore window.location and fetch
    window.location = originalLocation;
    global.fetch = originalFetch;
  });

  describe("Initial Rendering", () => {
    it("should render all navigation buttons", async () => {
      // Mock fetch to return 0 pending flashcards
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });

      render(<DashboardCTAButtons />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /review pending flashcards/i })).not.toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /create manual flashcard/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view my flashcards/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /start learning session/i })).toBeInTheDocument();
    });

    it("should have proper navigation aria-label", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        const nav = screen.getByRole("navigation");
        expect(nav).toHaveAttribute("aria-label", "Dashboard navigation");
      });
    });
  });

  describe("Pending Flashcards Count", () => {
    it("should fetch pending flashcards count on mount", async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 5, data: [] }),
      });
      global.fetch = fetchMock;

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith("/api/flashcards?status=pending&source=ai_generated&limit=1");
      });
    });

    it("should show pending button when count is greater than 0", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 5, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /review 5 pending flashcards/i })).toBeInTheDocument();
      });
    });

    it("should hide pending button when count is 0", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /review pending flashcards/i })).not.toBeInTheDocument();
      });
    });

    it("should display singular label for 1 pending flashcard", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 1, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Review 1 pending flashcard" })).toBeInTheDocument();
      });
    });

    it("should display plural label for multiple pending flashcards", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 10, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Review 10 pending flashcards" })).toBeInTheDocument();
      });
    });

    it("should display count badge with correct number", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 42, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /review 42 pending flashcards/i });
        expect(button).toBeInTheDocument();
        expect(button.textContent).toContain("42");
      });
    });

    it("should not show pending button while loading count", () => {
      // Delay the response to keep it in loading state
      (global.fetch as any).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          ok: true,
          json: async () => ({ total: 5, data: [] }),
        };
      });

      render(<DashboardCTAButtons />);

      // Should not show pending button immediately
      expect(screen.queryByRole("button", { name: /review pending flashcards/i })).not.toBeInTheDocument();
    });

    it("should handle API errors gracefully without crashing", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        // Component should still render other buttons
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      // Should not show pending button on error
      expect(screen.queryByRole("button", { name: /review pending flashcards/i })).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should handle network errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      // Should not show pending button on network error
      expect(screen.queryByRole("button", { name: /review pending flashcards/i })).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Navigation Functionality", () => {
    beforeEach(async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ total: 5, data: [] }),
      });
    });

    it("should navigate to /accept when clicking review pending button", async () => {
      const user = userEvent.setup();
      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /review 5 pending flashcards/i })).toBeInTheDocument();
      });

      const reviewButton = screen.getByRole("button", { name: /review 5 pending flashcards/i });
      await user.click(reviewButton);

      expect(window.location.href).toBe("/accept");
    });

    it("should navigate to /generate when clicking generate button", async () => {
      const user = userEvent.setup();
      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole("button", { name: /generate new flashcards/i });
      await user.click(generateButton);

      expect(window.location.href).toBe("/generate");
    });

    it("should navigate to /flashcards/new when clicking create manual button", async () => {
      const user = userEvent.setup();
      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create manual flashcard/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create manual flashcard/i });
      await user.click(createButton);

      expect(window.location.href).toBe("/flashcards/new");
    });

    it("should navigate to /flashcards when clicking my flashcards button", async () => {
      const user = userEvent.setup();
      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /view my flashcards/i })).toBeInTheDocument();
      });

      const myFlashcardsButton = screen.getByRole("button", { name: /view my flashcards/i });
      await user.click(myFlashcardsButton);

      expect(window.location.href).toBe("/flashcards");
    });

    it("should navigate to /learn when clicking start learning button", async () => {
      const user = userEvent.setup();
      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /start learning session/i })).toBeInTheDocument();
      });

      const learnButton = screen.getByRole("button", { name: /start learning session/i });
      await user.click(learnButton);

      expect(window.location.href).toBe("/learn");
    });
  });

  describe("Button Styling", () => {
    it("should apply primary styling to pending flashcards button", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 5, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        const reviewButton = screen.getByRole("button", { name: /review 5 pending flashcards/i });
        expect(reviewButton).toHaveClass("bg-orange-600");
      });
    });

    it("should apply outline variant to create manual and my flashcards buttons", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      const createButton = screen.getByRole("button", { name: /create manual flashcard/i });
      const myFlashcardsButton = screen.getByRole("button", { name: /view my flashcards/i });

      // Both should have border class (outline variant)
      expect(createButton).toHaveClass("border");
      expect(myFlashcardsButton).toHaveClass("border");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for all buttons", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 3, data: [] }),
      });

      render(<DashboardCTAButtons />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Review 3 pending flashcards" })).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: "Generate new flashcards" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create manual flashcard" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "View my flashcards" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Start learning session" })).toBeInTheDocument();
    });
  });
});
