import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import TextAreaWithCounter from "../TextAreaWithCounter";

describe("TextAreaWithCounter", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    count: 0,
    min: 500,
    max: 5000,
  };

  describe("Rendering", () => {
    it("should render textarea with label", () => {
      render(<TextAreaWithCounter {...defaultProps} />);

      expect(screen.getByLabelText("Input Text")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with provided value", () => {
      render(<TextAreaWithCounter {...defaultProps} value="Hello World" count={11} />);

      expect(screen.getByRole("textbox")).toHaveValue("Hello World");
    });

    it("should render character counter", () => {
      render(<TextAreaWithCounter {...defaultProps} count={100} />);

      expect(screen.getByText("100 / 5000")).toBeInTheDocument();
    });

    it("should render with placeholder text", () => {
      render(<TextAreaWithCounter {...defaultProps} />);

      expect(screen.getByPlaceholderText("Paste your text here (500-5000 characters)...")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("should call onChange when user types", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<TextAreaWithCounter {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Hello");

      expect(onChange).toHaveBeenCalled();
      // Should be called for each character typed
      expect(onChange).toHaveBeenCalledTimes(5);
    });

    it("should pass the new value to onChange handler", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<TextAreaWithCounter {...defaultProps} onChange={onChange} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Test");

      // Each character is typed separately, so check that onChange was called for each
      // The last character typed is "t"
      expect(onChange).toHaveBeenLastCalledWith("t");
      // Verify it was called 4 times (once per character)
      expect(onChange).toHaveBeenCalledTimes(4);
    });

    it("should be editable by default", async () => {
      const user = userEvent.setup();
      render(<TextAreaWithCounter {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).not.toBeDisabled();

      await user.type(textarea, "Text");
      // If it's editable, onChange should be called
      expect(defaultProps.onChange).toHaveBeenCalled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<TextAreaWithCounter {...defaultProps} disabled={true} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeDisabled();
    });
  });

  describe("Counter Color Logic", () => {
    it("should show yellow color when count is below minimum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={499} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-yellow-600");
      expect(counter).toHaveClass("dark:text-yellow-500");
    });

    it("should show yellow color when count is 0", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={0} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-yellow-600");
      expect(counter).toHaveClass("dark:text-yellow-500");
    });

    it("should show green color when count is at minimum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={500} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-green-600");
      expect(counter).toHaveClass("dark:text-green-500");
    });

    it("should show green color when count is within valid range", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={2500} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-green-600");
      expect(counter).toHaveClass("dark:text-green-500");
    });

    it("should show green color when count is at maximum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={5000} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-green-600");
      expect(counter).toHaveClass("dark:text-green-500");
    });

    it("should show red color when count exceeds maximum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={5001} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-red-600");
      expect(counter).toHaveClass("dark:text-red-500");
    });
  });

  describe("Border Color Logic", () => {
    it("should apply yellow border when count is below minimum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={499} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("border-yellow-300");
      expect(textarea).toHaveClass("focus:border-yellow-500");
      expect(textarea).toHaveClass("focus:ring-yellow-500");
    });

    it("should apply green border when count is at minimum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={500} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("border-green-300");
      expect(textarea).toHaveClass("focus:border-green-500");
      expect(textarea).toHaveClass("focus:ring-green-500");
    });

    it("should apply green border when count is within valid range", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={2500} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("border-green-300");
      expect(textarea).toHaveClass("focus:border-green-500");
      expect(textarea).toHaveClass("focus:ring-green-500");
    });

    it("should apply green border when count is at maximum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={5000} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("border-green-300");
      expect(textarea).toHaveClass("focus:border-green-500");
      expect(textarea).toHaveClass("focus:ring-green-500");
    });

    it("should apply red border when count exceeds maximum", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={5001} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("border-red-300");
      expect(textarea).toHaveClass("focus:border-red-500");
      expect(textarea).toHaveClass("focus:ring-red-500");
    });
  });

  describe("Accessibility", () => {
    it("should have proper label association", () => {
      render(<TextAreaWithCounter {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("id", "flashcard-text-input");

      const label = screen.getByText("Input Text");
      expect(label).toHaveAttribute("for", "flashcard-text-input");
    });

    it("should have aria-describedby pointing to counter and hint", () => {
      render(<TextAreaWithCounter {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAttribute("aria-describedby", "char-counter char-limit-hint");
    });

    it("should have aria-live on counter for screen reader updates", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveAttribute("aria-live", "polite");
    });

    it("should have counter with proper id", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveAttribute("id", "char-counter");
    });

    it("should maintain accessibility when disabled", () => {
      render(<TextAreaWithCounter {...defaultProps} disabled={true} />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveAttribute("aria-describedby", "char-counter char-limit-hint");
    });
  });

  describe("Counter Display", () => {
    it("should display count relative to max (0 / 5000)", () => {
      render(<TextAreaWithCounter {...defaultProps} count={0} />);

      expect(screen.getByText("0 / 5000")).toBeInTheDocument();
    });

    it("should display count relative to max (500 / 5000)", () => {
      render(<TextAreaWithCounter {...defaultProps} count={500} />);

      expect(screen.getByText("500 / 5000")).toBeInTheDocument();
    });

    it("should display count relative to max (5000 / 5000)", () => {
      render(<TextAreaWithCounter {...defaultProps} count={5000} />);

      expect(screen.getByText("5000 / 5000")).toBeInTheDocument();
    });

    it("should display count even when exceeding max (5001 / 5000)", () => {
      render(<TextAreaWithCounter {...defaultProps} count={5001} />);

      expect(screen.getByText("5001 / 5000")).toBeInTheDocument();
    });

    it("should update counter when count prop changes", () => {
      const { rerender } = render(<TextAreaWithCounter {...defaultProps} count={100} />);

      expect(screen.getByText("100 / 5000")).toBeInTheDocument();

      rerender(<TextAreaWithCounter {...defaultProps} count={200} />);

      expect(screen.getByText("200 / 5000")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle count at exact minimum boundary (500)", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={500} />);

      const counter = container.querySelector("#char-counter");
      const textarea = container.querySelector("textarea");

      expect(counter).toHaveClass("text-green-600");
      expect(textarea).toHaveClass("border-green-300");
    });

    it("should handle count just before minimum (499)", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={499} />);

      const counter = container.querySelector("#char-counter");
      const textarea = container.querySelector("textarea");

      expect(counter).toHaveClass("text-yellow-600");
      expect(textarea).toHaveClass("border-yellow-300");
    });

    it("should handle count just after minimum (501)", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={501} />);

      const counter = container.querySelector("#char-counter");
      const textarea = container.querySelector("textarea");

      expect(counter).toHaveClass("text-green-600");
      expect(textarea).toHaveClass("border-green-300");
    });

    it("should handle count at exact maximum boundary (5000)", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={5000} />);

      const counter = container.querySelector("#char-counter");
      const textarea = container.querySelector("textarea");

      expect(counter).toHaveClass("text-green-600");
      expect(textarea).toHaveClass("border-green-300");
    });

    it("should handle count just before maximum (4999)", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={4999} />);

      const counter = container.querySelector("#char-counter");
      const textarea = container.querySelector("textarea");

      expect(counter).toHaveClass("text-green-600");
      expect(textarea).toHaveClass("border-green-300");
    });

    it("should handle count just after maximum (5001)", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={5001} />);

      const counter = container.querySelector("#char-counter");
      const textarea = container.querySelector("textarea");

      expect(counter).toHaveClass("text-red-600");
      expect(textarea).toHaveClass("border-red-300");
    });

    it("should handle very large count", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} count={10000} />);

      expect(screen.getByText("10000 / 5000")).toBeInTheDocument();

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-red-600");
    });
  });

  describe("Styling and Layout", () => {
    it("should have minimum height for textarea", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("min-h-[300px]");
    });

    it("should apply disabled styles when disabled", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} disabled={true} />);

      const textarea = container.querySelector("textarea");
      expect(textarea).toHaveClass("disabled:cursor-not-allowed");
      expect(textarea).toHaveClass("disabled:opacity-50");
    });

    it("should position counter at bottom-right", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("absolute");
      expect(counter).toHaveClass("bottom-2");
      expect(counter).toHaveClass("right-2");
    });

    it("should have appropriate font styling for counter", () => {
      const { container } = render(<TextAreaWithCounter {...defaultProps} />);

      const counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-xs");
      expect(counter).toHaveClass("font-medium");
    });
  });

  describe("State Changes", () => {
    it("should reflect value changes", () => {
      const { rerender } = render(<TextAreaWithCounter {...defaultProps} value="" count={0} />);

      expect(screen.getByRole("textbox")).toHaveValue("");

      rerender(<TextAreaWithCounter {...defaultProps} value="Hello World" count={11} />);

      expect(screen.getByRole("textbox")).toHaveValue("Hello World");
      expect(screen.getByText("11 / 5000")).toBeInTheDocument();
    });

    it("should update visual state as count changes across boundaries", () => {
      const { container, rerender } = render(<TextAreaWithCounter {...defaultProps} count={499} />);

      let counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-yellow-600");

      rerender(<TextAreaWithCounter {...defaultProps} count={500} />);
      counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-green-600");

      rerender(<TextAreaWithCounter {...defaultProps} count={5001} />);
      counter = container.querySelector("#char-counter");
      expect(counter).toHaveClass("text-red-600");
    });
  });
});
