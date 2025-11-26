import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import CharacterLimitHint from "../CharacterLimitHint";

describe("CharacterLimitHint", () => {
  const min = 500;
  const max = 5000;

  describe("Message Content", () => {
    it("should show initial message when count is 0", () => {
      render(<CharacterLimitHint count={0} min={min} max={max} />);

      expect(
        screen.getByText("Please enter between 500 and 5000 characters to generate flashcards.")
      ).toBeInTheDocument();
    });

    it("should show remaining characters when count is less than minimum", () => {
      render(<CharacterLimitHint count={100} min={min} max={max} />);

      expect(screen.getByText("You need at least 400 more characters to generate flashcards.")).toBeInTheDocument();
    });

    it("should show singular 'character' when exactly 1 character remaining", () => {
      render(<CharacterLimitHint count={499} min={min} max={max} />);

      expect(screen.getByText("You need at least 1 more character to generate flashcards.")).toBeInTheDocument();
    });

    it("should show plural 'characters' when multiple characters remaining", () => {
      render(<CharacterLimitHint count={498} min={min} max={max} />);

      expect(screen.getByText("You need at least 2 more characters to generate flashcards.")).toBeInTheDocument();
    });

    it("should show ready message when count is at minimum", () => {
      render(<CharacterLimitHint count={500} min={min} max={max} />);

      expect(screen.getByText("Your text is ready for flashcard generation.")).toBeInTheDocument();
    });

    it("should show ready message when count is within valid range", () => {
      render(<CharacterLimitHint count={2500} min={min} max={max} />);

      expect(screen.getByText("Your text is ready for flashcard generation.")).toBeInTheDocument();
    });

    it("should show ready message when count is at maximum", () => {
      render(<CharacterLimitHint count={5000} min={min} max={max} />);

      expect(screen.getByText("Your text is ready for flashcard generation.")).toBeInTheDocument();
    });

    it("should show excess characters when count exceeds maximum", () => {
      render(<CharacterLimitHint count={5100} min={min} max={max} />);

      expect(
        screen.getByText("Your text exceeds the limit by 100 characters. Click Generate to trim to 5000 characters.")
      ).toBeInTheDocument();
    });

    it("should show singular 'character' when exceeding by exactly 1", () => {
      render(<CharacterLimitHint count={5001} min={min} max={max} />);

      expect(
        screen.getByText("Your text exceeds the limit by 1 character. Click Generate to trim to 5000 characters.")
      ).toBeInTheDocument();
    });

    it("should show plural 'characters' when exceeding by multiple", () => {
      render(<CharacterLimitHint count={5002} min={min} max={max} />);

      expect(
        screen.getByText("Your text exceeds the limit by 2 characters. Click Generate to trim to 5000 characters.")
      ).toBeInTheDocument();
    });
  });

  describe("Visual Styling", () => {
    it("should apply warning color when count is 0", () => {
      const { container } = render(<CharacterLimitHint count={0} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-yellow-700");
      expect(hint).toHaveClass("dark:text-yellow-400");
    });

    it("should apply warning color when count is below minimum", () => {
      const { container } = render(<CharacterLimitHint count={499} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-yellow-700");
      expect(hint).toHaveClass("dark:text-yellow-400");
    });

    it("should apply success color when count is at minimum", () => {
      const { container } = render(<CharacterLimitHint count={500} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-green-700");
      expect(hint).toHaveClass("dark:text-green-400");
    });

    it("should apply success color when count is within valid range", () => {
      const { container } = render(<CharacterLimitHint count={2500} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-green-700");
      expect(hint).toHaveClass("dark:text-green-400");
    });

    it("should apply success color when count is at maximum", () => {
      const { container } = render(<CharacterLimitHint count={5000} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-green-700");
      expect(hint).toHaveClass("dark:text-green-400");
    });

    it("should apply error color when count exceeds maximum", () => {
      const { container } = render(<CharacterLimitHint count={5001} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-red-700");
      expect(hint).toHaveClass("dark:text-red-400");
    });
  });

  describe("Accessibility", () => {
    it("should have proper id for ARIA describedby reference", () => {
      const { container } = render(<CharacterLimitHint count={500} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveAttribute("id", "char-limit-hint");
    });

    it("should have appropriate text size", () => {
      const { container } = render(<CharacterLimitHint count={500} min={min} max={max} />);
      const hint = container.querySelector("p");

      expect(hint).toHaveClass("text-sm");
    });
  });

  describe("Edge Cases", () => {
    it("should handle count of exactly 1", () => {
      render(<CharacterLimitHint count={1} min={min} max={max} />);

      expect(screen.getByText("You need at least 499 more characters to generate flashcards.")).toBeInTheDocument();
    });

    it("should handle count just before minimum (499)", () => {
      render(<CharacterLimitHint count={499} min={min} max={max} />);

      expect(screen.getByText("You need at least 1 more character to generate flashcards.")).toBeInTheDocument();
    });

    it("should handle count just after minimum (501)", () => {
      render(<CharacterLimitHint count={501} min={min} max={max} />);

      expect(screen.getByText("Your text is ready for flashcard generation.")).toBeInTheDocument();
    });

    it("should handle count just before maximum (4999)", () => {
      render(<CharacterLimitHint count={4999} min={min} max={max} />);

      expect(screen.getByText("Your text is ready for flashcard generation.")).toBeInTheDocument();
    });

    it("should handle count just after maximum (5001)", () => {
      render(<CharacterLimitHint count={5001} min={min} max={max} />);

      expect(
        screen.getByText("Your text exceeds the limit by 1 character. Click Generate to trim to 5000 characters.")
      ).toBeInTheDocument();
    });

    it("should handle very large excess count", () => {
      render(<CharacterLimitHint count={10000} min={min} max={max} />);

      expect(
        screen.getByText("Your text exceeds the limit by 5000 characters. Click Generate to trim to 5000 characters.")
      ).toBeInTheDocument();
    });
  });

  describe("Calculation Accuracy", () => {
    it("should calculate remaining characters correctly for various counts", () => {
      const testCases = [
        { count: 0, expected: 500 },
        { count: 100, expected: 400 },
        { count: 250, expected: 250 },
        { count: 490, expected: 10 },
        { count: 499, expected: 1 },
      ];

      testCases.forEach(({ count, expected }) => {
        const { rerender } = render(<CharacterLimitHint count={count} min={min} max={max} />);

        if (count === 0) {
          expect(
            screen.getByText("Please enter between 500 and 5000 characters to generate flashcards.")
          ).toBeInTheDocument();
        } else {
          const text = `You need at least ${expected} more character${expected !== 1 ? "s" : ""} to generate flashcards.`;
          expect(screen.getByText(text)).toBeInTheDocument();
        }

        rerender(<div />);
      });
    });

    it("should calculate excess characters correctly for various counts", () => {
      const testCases = [
        { count: 5001, expected: 1 },
        { count: 5010, expected: 10 },
        { count: 5100, expected: 100 },
        { count: 6000, expected: 1000 },
      ];

      testCases.forEach(({ count, expected }) => {
        const { rerender } = render(<CharacterLimitHint count={count} min={min} max={max} />);

        const text = `Your text exceeds the limit by ${expected} character${expected !== 1 ? "s" : ""}. Click Generate to trim to 5000 characters.`;
        expect(screen.getByText(text)).toBeInTheDocument();

        rerender(<div />);
      });
    });
  });
});

