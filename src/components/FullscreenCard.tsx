/**
 * FullscreenCard Component
 * Displays a flashcard with question and answer in a fullscreen-friendly layout.
 * Optimized for accessibility and responsive design.
 */
import * as React from "react";

interface FlashcardDisplay {
  id: string;
  question: string;
  answer: string;
}

interface FullscreenCardProps {
  flashcard: FlashcardDisplay;
}

export function FullscreenCard({ flashcard }: FullscreenCardProps) {
  return (
    <article className="w-full max-w-4xl mx-auto" aria-labelledby={`flashcard-question-${flashcard.id}`}>
      <div className="bg-card border border-border rounded-lg shadow-lg p-6 sm:p-8 md:p-12 transition-shadow hover:shadow-xl">
        {/* Question Section */}
        <section className="mb-6 md:mb-8">
          <h2
            className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3"
            aria-label="Question"
          >
            Question
          </h2>
          <p
            id={`flashcard-question-${flashcard.id}`}
            className="text-xl sm:text-2xl md:text-3xl font-medium text-foreground leading-relaxed break-words"
          >
            {flashcard.question}
          </p>
        </section>

        {/* Divider */}
        <hr className="border-t border-border my-6 md:my-8" aria-hidden="true" />

        {/* Answer Section */}
        <section>
          <h2
            className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3"
            aria-label="Answer"
          >
            Answer
          </h2>
          <p
            className="text-lg sm:text-xl md:text-2xl text-foreground leading-relaxed break-words"
            aria-label={`Answer: ${flashcard.answer}`}
          >
            {flashcard.answer}
          </p>
        </section>
      </div>
    </article>
  );
}
