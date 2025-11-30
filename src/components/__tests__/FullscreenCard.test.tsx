import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import { FullscreenCard } from "../FullscreenCard";

describe("FullscreenCard", () => {
  const defaultProps = {
    flashcard: {
      id: "test-flashcard-id",
      question: "What is React?",
      answer: "A JavaScript library for building user interfaces",
    },
  };

  describe("Rendering", () => {
    it("should render the question section", () => {
      render(<FullscreenCard {...defaultProps} />);

      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("What is React?")).toBeInTheDocument();
    });

    it("should render the answer section", () => {
      render(<FullscreenCard {...defaultProps} />);

      expect(screen.getByText("Answer")).toBeInTheDocument();
      expect(screen.getByText("A JavaScript library for building user interfaces")).toBeInTheDocument();
    });

    it("should render as an article element", () => {
      render(<FullscreenCard {...defaultProps} />);

      const article = screen.getByRole("article");
      expect(article).toBeInTheDocument();
    });

    it("should render divider between question and answer", () => {
      render(<FullscreenCard {...defaultProps} />);

      const divider = screen.getByRole("separator", { hidden: true });
      expect(divider).toBeInTheDocument();
      expect(divider).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      render(<FullscreenCard {...defaultProps} />);

      const headings = screen.getAllByRole("heading");
      expect(headings).toHaveLength(2);

      const questionHeading = screen.getByRole("heading", { name: "Question" });
      const answerHeading = screen.getByRole("heading", { name: "Answer" });

      expect(questionHeading).toBeInTheDocument();
      expect(answerHeading).toBeInTheDocument();
    });

    it("should have proper aria-labels on headings", () => {
      render(<FullscreenCard {...defaultProps} />);

      const questionHeading = screen.getByRole("heading", { name: "Question" });
      const answerHeading = screen.getByRole("heading", { name: "Answer" });

      expect(questionHeading).toHaveAttribute("aria-label", "Question");
      expect(answerHeading).toHaveAttribute("aria-label", "Answer");
    });

    it("should have proper aria-labelledby on article", () => {
      render(<FullscreenCard {...defaultProps} />);

      const article = screen.getByRole("article");
      expect(article).toHaveAttribute("aria-labelledby", `flashcard-question-${defaultProps.flashcard.id}`);
    });

    it("should have proper aria-label on answer text", () => {
      render(<FullscreenCard {...defaultProps} />);

      const answerText = screen.getByText("A JavaScript library for building user interfaces");
      expect(answerText).toHaveAttribute("aria-label", "Answer: A JavaScript library for building user interfaces");
    });

    it("should have proper id on question text", () => {
      render(<FullscreenCard {...defaultProps} />);

      const questionText = screen.getByText("What is React?");
      expect(questionText).toHaveAttribute("id", `flashcard-question-${defaultProps.flashcard.id}`);
    });
  });

  describe("Content Display", () => {
    it("should preserve line breaks in question", () => {
      const multilineQuestion = "What is React?\nIt's a library.";
      render(
        <FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, question: multilineQuestion }} />
      );

      const questionText = screen.getByText(/What is React\?/);
      expect(questionText).toHaveClass("whitespace-pre-line");
    });

    it("should preserve line breaks in answer", () => {
      const multilineAnswer = "A JavaScript library\nfor building user interfaces";
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, answer: multilineAnswer }} />);

      const answerText = screen.getByText(/A JavaScript library/);
      expect(answerText).toHaveClass("whitespace-pre-line");
    });

    it("should handle empty question", () => {
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, question: "" }} />);

      // Find the question text element by its id
      const questionText = document.getElementById(`flashcard-question-${defaultProps.flashcard.id}`);
      expect(questionText).toBeInTheDocument();
      expect(questionText?.textContent).toBe("");
    });

    it("should handle empty answer", () => {
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, answer: "" }} />);

      // Find the answer section by its heading, then find the paragraph within it
      const answerSection = screen.getByRole("heading", { name: "Answer" }).parentElement;
      const answerText = answerSection?.querySelector("p");

      expect(answerText).toBeInTheDocument();
      expect(answerText?.textContent).toBe("");
    });

    it("should handle special characters in question", () => {
      const specialQuestion = "What is JSX? (JavaScript XML)";
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, question: specialQuestion }} />);

      expect(screen.getByText(specialQuestion)).toBeInTheDocument();
    });

    it("should handle special characters in answer", () => {
      const specialAnswer = "JSX = <div>Hello</div> & more!";
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, answer: specialAnswer }} />);

      expect(screen.getByText(specialAnswer)).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should apply card container styles", () => {
      render(<FullscreenCard {...defaultProps} />);

      const article = screen.getByRole("article");
      expect(article).toHaveClass("w-full");
      expect(article).toHaveClass("max-w-4xl");
      expect(article).toHaveClass("mx-auto");
    });

    it("should apply card styling", () => {
      render(<FullscreenCard {...defaultProps} />);

      const article = screen.getByRole("article");
      const card = article.querySelector("div");
      expect(card).toHaveClass("bg-card");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("border-border");
      expect(card).toHaveClass("rounded-lg");
      expect(card).toHaveClass("shadow-lg");
    });

    it("should apply hover effects", () => {
      render(<FullscreenCard {...defaultProps} />);

      const card = screen.getByRole("article").querySelector("div");
      expect(card).toHaveClass("hover:shadow-xl");
    });

    it("should apply responsive padding", () => {
      render(<FullscreenCard {...defaultProps} />);

      const card = screen.getByRole("article").querySelector("div");
      expect(card).toHaveClass("p-6");
      expect(card).toHaveClass("sm:p-8");
      expect(card).toHaveClass("md:p-12");
    });

    it("should apply question section spacing", () => {
      render(<FullscreenCard {...defaultProps} />);

      const questionSection = screen.getByText("Question").parentElement;
      expect(questionSection).toHaveClass("mb-6");
      expect(questionSection).toHaveClass("md:mb-8");
    });

    it("should apply answer section styling", () => {
      render(<FullscreenCard {...defaultProps} />);

      const answerText = screen.getByText("A JavaScript library for building user interfaces");
      expect(answerText).toHaveClass("text-lg");
      expect(answerText).toHaveClass("sm:text-xl");
      expect(answerText).toHaveClass("md:text-2xl");
      expect(answerText).toHaveClass("text-foreground");
    });

    it("should apply question text styling", () => {
      render(<FullscreenCard {...defaultProps} />);

      const questionText = screen.getByText("What is React?");
      expect(questionText).toHaveClass("text-xl");
      expect(questionText).toHaveClass("sm:text-2xl");
      expect(questionText).toHaveClass("md:text-3xl");
      expect(questionText).toHaveClass("font-medium");
      expect(questionText).toHaveClass("text-foreground");
    });

    it("should apply heading styling", () => {
      render(<FullscreenCard {...defaultProps} />);

      const headings = screen.getAllByRole("heading");
      headings.forEach((heading) => {
        expect(heading).toHaveClass("text-xs");
        expect(heading).toHaveClass("sm:text-sm");
        expect(heading).toHaveClass("font-semibold");
        expect(heading).toHaveClass("text-muted-foreground");
        expect(heading).toHaveClass("uppercase");
        expect(heading).toHaveClass("tracking-wide");
        expect(heading).toHaveClass("mb-3");
      });
    });

    it("should apply divider styling", () => {
      render(<FullscreenCard {...defaultProps} />);

      const divider = screen.getByRole("separator", { hidden: true });
      expect(divider).toHaveClass("border-t");
      expect(divider).toHaveClass("border-border");
      expect(divider).toHaveClass("my-6");
      expect(divider).toHaveClass("md:my-8");
    });

    it("should apply text break and spacing classes", () => {
      render(<FullscreenCard {...defaultProps} />);

      const questionText = screen.getByText("What is React?");
      const answerText = screen.getByText("A JavaScript library for building user interfaces");

      expect(questionText).toHaveClass("break-words");
      expect(questionText).toHaveClass("leading-relaxed");
      expect(answerText).toHaveClass("break-words");
      expect(answerText).toHaveClass("leading-relaxed");
    });
  });

  describe("Layout Structure", () => {
    it("should have correct section structure", () => {
      render(<FullscreenCard {...defaultProps} />);

      const sections = screen.getAllByRole("generic", { hidden: true });
      // Should have question and answer sections
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it("should maintain proper content hierarchy", () => {
      render(<FullscreenCard {...defaultProps} />);

      // Question section should come before answer section
      const questionSection = screen.getByText("Question").parentElement;
      const answerSection = screen.getByText("Answer").parentElement;

      expect(questionSection).toBeInTheDocument();
      expect(answerSection).toBeInTheDocument();

      // Verify the DOM order (question before answer)
      const allSections = screen.getAllByRole("generic", { hidden: true });
      const questionIndex = allSections.indexOf(questionSection as HTMLElement);
      const answerIndex = allSections.indexOf(answerSection as HTMLElement);
      expect(questionIndex).toBeLessThan(answerIndex);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long question text", () => {
      const longQuestion = "a".repeat(1000);
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, question: longQuestion }} />);

      const questionText = screen.getByText(longQuestion);
      expect(questionText).toBeInTheDocument();
      expect(questionText).toHaveClass("break-words");
    });

    it("should handle very long answer text", () => {
      const longAnswer = "a".repeat(1000);
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, answer: longAnswer }} />);

      const answerText = screen.getByText(longAnswer);
      expect(answerText).toBeInTheDocument();
      expect(answerText).toHaveClass("break-words");
    });

    it("should handle flashcard with different id", () => {
      const differentId = "different-id";
      render(<FullscreenCard {...defaultProps} flashcard={{ ...defaultProps.flashcard, id: differentId }} />);

      const article = screen.getByRole("article");
      expect(article).toHaveAttribute("aria-labelledby", `flashcard-question-${differentId}`);

      const questionText = screen.getByText("What is React?");
      expect(questionText).toHaveAttribute("id", `flashcard-question-${differentId}`);
    });
  });
});
