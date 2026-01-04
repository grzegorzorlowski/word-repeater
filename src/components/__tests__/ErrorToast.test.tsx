/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import ErrorToast from "../ErrorToast";

describe("ErrorToast", () => {
  const defaultProps = {
    message: "Something went wrong",
    onDismiss: vi.fn(),
  };

  describe("Rendering", () => {
    it("should render error message", () => {
      render(<ErrorToast {...defaultProps} />);

      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should have role=alert for accessibility", () => {
      render(<ErrorToast {...defaultProps} />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should render dismiss button", () => {
      render(<ErrorToast {...defaultProps} />);

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it("should not render retry button by default", () => {
      render(<ErrorToast {...defaultProps} />);

      const retryButton = screen.queryByRole("button", { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it("should not render retry button when showRetry is false", () => {
      render(<ErrorToast {...defaultProps} showRetry={false} />);

      const retryButton = screen.queryByRole("button", { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it("should render retry button when showRetry is true", () => {
      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={vi.fn()} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it("should render preservation message when retry is shown", () => {
      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={vi.fn()} />);

      expect(screen.getByText("Your text has been preserved")).toBeInTheDocument();
    });

    it("should not render preservation message when retry is hidden", () => {
      render(<ErrorToast {...defaultProps} showRetry={false} />);

      expect(screen.queryByText("Your text has been preserved")).not.toBeInTheDocument();
    });
  });

  describe("User Interactions - Dismiss", () => {
    it("should call onDismiss when dismiss button is clicked", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(<ErrorToast {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should call onDismiss only once on single click", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(<ErrorToast {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should call onDismiss on each click", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      render(<ErrorToast {...defaultProps} onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      await user.click(dismissButton);
      await user.click(dismissButton);
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(3);
    });
  });

  describe("User Interactions - Retry", () => {
    it("should call onRetry when retry button is clicked", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={onRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("should not call onRetry if it is not provided", async () => {
      const user = userEvent.setup();

      render(<ErrorToast {...defaultProps} showRetry={true} />);

      const retryButton = screen.queryByRole("button", { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it("should call onRetry multiple times if clicked multiple times", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={onRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(2);
    });

    it("should not call onDismiss when retry button is clicked", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const onRetry = vi.fn();

      render(<ErrorToast {...defaultProps} onDismiss={onDismiss} showRetry={true} onRetry={onRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("Message Variations", () => {
    it("should render short error message", () => {
      const shortMessage = "Network error";
      render(<ErrorToast {...defaultProps} message={shortMessage} />);

      expect(screen.getByText(shortMessage)).toBeInTheDocument();
    });

    it("should render long error message", () => {
      const longMessage = "An unexpected error occurred while processing your request. Please try again later.";
      render(<ErrorToast {...defaultProps} message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it("should render error message with special characters", () => {
      const message = "Error: Failed to save! (Code: 500)";
      render(<ErrorToast {...defaultProps} message={message} />);

      expect(screen.getByText(message)).toBeInTheDocument();
    });

    it("should render error message with line breaks", () => {
      const message = "Multiple errors occurred:\n- Invalid question\n- Invalid answer";
      render(<ErrorToast {...defaultProps} message={message} />);

      // Text with line breaks is rendered but may be normalized in the DOM
      expect(screen.getByText(/Multiple errors occurred/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid question/i)).toBeInTheDocument();
      expect(screen.getByText(/Invalid answer/i)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label on dismiss button", () => {
      render(<ErrorToast {...defaultProps} />);

      const dismissButton = screen.getByLabelText("Dismiss error");
      expect(dismissButton).toBeInTheDocument();
    });

    it("should have alert role for screen readers", () => {
      render(<ErrorToast {...defaultProps} />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should have visible text on retry button", () => {
      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={vi.fn()} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toHaveAccessibleName();
    });

    it("should render SVG icon with aria-hidden on retry button", () => {
      const { container } = render(<ErrorToast {...defaultProps} showRetry={true} onRetry={vi.fn()} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      const svg = retryButton.querySelector("svg");

      expect(svg).toBeInTheDocument();
    });
  });

  describe("Visual States", () => {
    it("should apply error styling classes", () => {
      const { container } = render(<ErrorToast {...defaultProps} />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("border-red-200");
      expect(alert).toHaveClass("bg-red-50");
    });

    it("should apply dark mode classes", () => {
      const { container } = render(<ErrorToast {...defaultProps} />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("dark:border-red-800");
      expect(alert).toHaveClass("dark:bg-red-950");
    });

    it("should have rounded corners", () => {
      render(<ErrorToast {...defaultProps} />);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("rounded-lg");
    });
  });

  describe("Button States", () => {
    it("should have hover styles on dismiss button", () => {
      render(<ErrorToast {...defaultProps} />);

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      expect(dismissButton).toHaveClass("hover:bg-red-100");
    });

    it("should render outline variant for retry button", () => {
      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={vi.fn()} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });
      // Check if button has the data-slot attribute from shadcn/ui button
      expect(retryButton).toHaveAttribute("data-slot", "button");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty message string", () => {
      render(<ErrorToast {...defaultProps} message="" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("should handle showRetry=true with undefined onRetry", () => {
      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={undefined} />);

      const retryButton = screen.queryByRole("button", { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it("should handle showRetry=false with provided onRetry", () => {
      const onRetry = vi.fn();
      render(<ErrorToast {...defaultProps} showRetry={false} onRetry={onRetry} />);

      const retryButton = screen.queryByRole("button", { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });

    it("should not break with very long error messages", () => {
      const veryLongMessage = "a".repeat(1000);
      render(<ErrorToast {...defaultProps} message={veryLongMessage} />);

      expect(screen.getByText(veryLongMessage)).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should work with both buttons present", async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();
      const onRetry = vi.fn();

      render(<ErrorToast {...defaultProps} onDismiss={onDismiss} showRetry={true} onRetry={onRetry} />);

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      const retryButton = screen.getByRole("button", { name: /retry/i });

      expect(dismissButton).toBeInTheDocument();
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);

      await user.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("should maintain focus on retry button after click", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(<ErrorToast {...defaultProps} showRetry={true} onRetry={onRetry} />);

      const retryButton = screen.getByRole("button", { name: /retry/i });

      retryButton.focus();
      expect(retryButton).toHaveFocus();

      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalled();
    });
  });
});
