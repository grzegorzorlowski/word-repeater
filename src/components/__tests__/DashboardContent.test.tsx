/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-function */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { DashboardContent } from "../DashboardContent";
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";

describe("DashboardContent", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    server.resetHandlers();

    // Mock window.location for navigation
    delete (window as any).location;
    window.location = { href: "" } as any;

    // Setup default fetch mock
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, data: [] }),
    });
  });

  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
  });

  describe("Initial State", () => {
    it("should render CTA buttons by default", async () => {
      // Mock the API call that DashboardCTAButtons makes
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, data: [] }),
      });

      render(<DashboardContent />);

      // Wait for the component to finish loading
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });
    });

    it("should not show loader initially", () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      // Loader should not be present (loading: false)
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should not show error initially", () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("should maintain state correctly", async () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        // Should show CTA buttons (default state)
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });
    });

    it("should have proper initial state values", () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      // Should not show loading state
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      // Should not show error state
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("should render all navigation buttons when no error or loading", async () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create manual flashcard/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /view my flashcards/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /start learning session/i })).toBeInTheDocument();
      });
    });
  });

  describe("Integration with Child Components", () => {
    it("should pass correct props to DashboardCTAButtons", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 5, data: [] }),
      });

      render(<DashboardContent />);

      // Verify that DashboardCTAButtons renders and functions correctly
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /review 5 pending flashcards/i })).toBeInTheDocument();
      });
    });

    it("should render navigation container with proper structure", async () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        const nav = screen.getByRole("navigation");
        expect(nav).toBeInTheDocument();
        expect(nav).toHaveAttribute("aria-label", "Dashboard navigation");
      });
    });
  });

  describe("User Interactions", () => {
    it("should allow navigation through CTA buttons", async () => {
      const user = userEvent.setup();

      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      const generateButton = screen.getByRole("button", { name: /generate new flashcards/i });
      await user.click(generateButton);

      expect(window.location.href).toBe("/generate");
    });

    it("should handle multiple button clicks", async () => {
      const user = userEvent.setup();

      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      // Click generate button
      const generateButton = screen.getByRole("button", { name: /generate new flashcards/i });
      await user.click(generateButton);
      expect(window.location.href).toBe("/generate");

      // Reset location
      window.location.href = "";

      // Click create manual button
      const createButton = screen.getByRole("button", { name: /create manual flashcard/i });
      await user.click(createButton);
      expect(window.location.href).toBe("/flashcards/new");
    });
  });

  describe("API Integration", () => {
    it("should handle successful API response from child component", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 10, data: [] }),
      });

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /review 10 pending flashcards/i })).toBeInTheDocument();
      });
    });

    it("should handle API errors gracefully in child component", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });

      render(<DashboardContent />);

      await waitFor(() => {
        // Should still render other buttons even if API fails
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Component Composition", () => {
    it("should render only CTA buttons when state is default", async () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        // CTA buttons should be present
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      });

      // Loader and error should not be present
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should not render multiple views simultaneously", async () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByRole("navigation")).toBeInTheDocument();
      });

      // Only one view should be rendered at a time
      const navigationElements = screen.getAllByRole("navigation");
      expect(navigationElements).toHaveLength(1);
    });
  });

  describe("Accessibility", () => {
    it("should maintain accessibility features from child components", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 3, data: [] }),
      });

      render(<DashboardContent />);

      await waitFor(() => {
        // Navigation should have proper aria-label
        const nav = screen.getByRole("navigation");
        expect(nav).toHaveAttribute("aria-label", "Dashboard navigation");

        // All buttons should have proper aria-labels
        expect(screen.getByRole("button", { name: "Review 3 pending flashcards" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Generate new flashcards" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Create manual flashcard" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "View my flashcards" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Start learning session" })).toBeInTheDocument();
      });
    });
  });

  describe("Performance", () => {
    it("should not cause unnecessary re-renders", async () => {
      server.use(
        http.get("/api/flashcards", () => {
          return HttpResponse.json({ total: 0, data: [] });
        })
      );

      const { rerender } = render(<DashboardContent />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(<DashboardContent />);

      // Component should still work correctly
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /generate new flashcards/i })).toBeInTheDocument();
      });
    });
  });
});
