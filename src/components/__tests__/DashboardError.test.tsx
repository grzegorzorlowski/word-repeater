/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { DashboardError } from "../DashboardError";

describe("DashboardError", () => {
  describe("Initial Rendering", () => {
    it("should render error message correctly", () => {
      const errorMessage = "Failed to load dashboard data";
      render(<DashboardError message={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it("should render error icon", () => {
      render(<DashboardError message="Test error" />);

      // Icon should be present (svg element)
      const errorContainer = screen.getByRole("alert");
      const svg = errorContainer.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should render 'Error' label", () => {
      render(<DashboardError message="Test error" />);

      expect(screen.getByText("Error")).toBeInTheDocument();
    });

    it("should apply destructive styling", () => {
      render(<DashboardError message="Test error" />);

      const container = screen.getByRole("alert");
      expect(container).toHaveClass("border-destructive/50");
      expect(container).toHaveClass("bg-destructive/10");
    });
  });

  describe("Retry Button", () => {
    it("should show retry button when onRetry prop is provided", () => {
      const mockRetry = vi.fn();
      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      expect(screen.getByRole("button", { name: /retry action/i })).toBeInTheDocument();
    });

    it("should not show retry button when onRetry prop is undefined", () => {
      render(<DashboardError message="Test error" />);

      expect(screen.queryByRole("button", { name: /retry action/i })).not.toBeInTheDocument();
    });

    it("should call onRetry callback when retry button is clicked", async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry action/i });
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it("should call onRetry multiple times if clicked multiple times", async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry action/i });

      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(mockRetry).toHaveBeenCalledTimes(3);
    });

    it("should have outline variant styling for retry button", () => {
      const mockRetry = vi.fn();
      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry action/i });
      expect(retryButton).toHaveClass("border");
    });

    it("should render retry button with correct text", () => {
      const mockRetry = vi.fn();
      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have role='alert' for screen readers", () => {
      render(<DashboardError message="Test error" />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
    });

    it("should have aria-live='assertive' attribute", () => {
      render(<DashboardError message="Test error" />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toHaveAttribute("aria-live", "assertive");
    });

    it("should have proper aria-label on retry button", () => {
      const mockRetry = vi.fn();
      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: "Retry action" });
      expect(retryButton).toHaveAttribute("aria-label", "Retry action");
    });

    it("should mark icon as aria-hidden", () => {
      render(<DashboardError message="Test error" />);

      const alertElement = screen.getByRole("alert");
      const svg = alertElement.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Error Message Variations", () => {
    it("should handle short error messages", () => {
      render(<DashboardError message="Oops" />);

      expect(screen.getByText("Oops")).toBeInTheDocument();
    });

    it("should handle long error messages", () => {
      const longMessage =
        "This is a very long error message that explains in detail what went wrong and provides helpful information for the user to understand the issue.";
      render(<DashboardError message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should handle error messages with special characters", () => {
      const specialMessage = "Error: Failed to fetch data (404) - Resource not found!";
      render(<DashboardError message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it("should handle empty error message gracefully", () => {
      render(<DashboardError message="" />);

      // Component should still render with empty message
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("should render all UI elements in correct order", () => {
      const mockRetry = vi.fn();
      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const alertElement = screen.getByRole("alert");

      // Should contain: icon container, error title, message, and retry button
      expect(alertElement.children).toHaveLength(3); // Icon+title container, message paragraph, button
    });

    it("should apply correct CSS classes for layout", () => {
      render(<DashboardError message="Test error" />);

      const alertElement = screen.getByRole("alert");
      expect(alertElement).toHaveClass("flex", "flex-col", "items-center", "justify-center", "gap-4");
    });

    it("should style error message text correctly", () => {
      render(<DashboardError message="Test error" />);

      const message = screen.getByText("Test error");
      expect(message).toHaveClass("text-sm", "text-center", "text-muted-foreground");
    });
  });

  describe("User Interaction", () => {
    it("should not trigger any action when message text is clicked", async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const message = screen.getByText("Test error");
      await user.click(message);

      // Clicking message should not trigger retry
      expect(mockRetry).not.toHaveBeenCalled();
    });

    it("should allow keyboard navigation to retry button", async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry action/i });

      // Tab to button and press Enter
      retryButton.focus();
      await user.keyboard("{Enter}");

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it("should support Space key on retry button", async () => {
      const user = userEvent.setup();
      const mockRetry = vi.fn();

      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry action/i });

      retryButton.focus();
      await user.keyboard(" "); // Space key

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("Props Validation", () => {
    it("should accept message prop as required", () => {
      // This test ensures TypeScript types are correct
      render(<DashboardError message="Required message" />);

      expect(screen.getByText("Required message")).toBeInTheDocument();
    });

    it("should accept optional onRetry prop", () => {
      const mockRetry = vi.fn();

      // Should compile and work with onRetry
      const { unmount } = render(<DashboardError message="Test" onRetry={mockRetry} />);
      expect(screen.getByRole("button", { name: /retry action/i })).toBeInTheDocument();
      unmount();

      // Should compile and work without onRetry
      render(<DashboardError message="Test" />);
      expect(screen.queryByRole("button", { name: /retry action/i })).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined onRetry prop correctly", () => {
      render(<DashboardError message="Test error" onRetry={undefined} />);

      expect(screen.queryByRole("button", { name: /retry action/i })).not.toBeInTheDocument();
    });

    it("should handle onRetry that throws an error without crashing", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockRetry = vi.fn().mockImplementation(() => {
        throw new Error("Retry failed");
      });

      render(<DashboardError message="Test error" onRetry={mockRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry action/i });

      // Click the button - the error should be caught by the event handler
      // Component should not crash
      try {
        await user.click(retryButton);
      } catch (error) {
        // Error may or may not be caught depending on implementation
      }

      // Verify the handler was called
      expect(mockRetry).toHaveBeenCalledTimes(1);

      // Component should still be in the document
      expect(screen.getByRole("alert")).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("should remain interactive after multiple renders", () => {
      const mockRetry = vi.fn();
      const { rerender } = render(<DashboardError message="Error 1" onRetry={mockRetry} />);

      expect(screen.getByText("Error 1")).toBeInTheDocument();

      rerender(<DashboardError message="Error 2" onRetry={mockRetry} />);

      expect(screen.getByText("Error 2")).toBeInTheDocument();
      expect(screen.queryByText("Error 1")).not.toBeInTheDocument();
    });
  });
});
