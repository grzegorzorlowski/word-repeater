import { useId } from "react";
import { Button } from "@/components/ui/button";

export interface LearningCardDisplayProps {
  question: string;
  answer: string;
  answerVisible: boolean;
  onShowAnswer: () => void;
  cardId?: string;
}

/**
 * Displays one flashcard: question always visible; answer hidden until
 * the user clicks "Show Answer", then answer is shown and the button is hidden.
 */
export default function LearningCardDisplay({
  question,
  answer,
  answerVisible,
  onShowAnswer,
  cardId,
}: LearningCardDisplayProps) {
  const generatedId = useId();
  const baseId = cardId ?? `learning-card-${generatedId.replace(/:/g, "")}`;
  const questionHeadingId = `${baseId}-question-heading`;
  const questionTextId = `${baseId}-question-text`;
  const answerId = `${baseId}-answer`;

  return (
    <article
      aria-labelledby={questionTextId}
      className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-shadow duration-200 hover:shadow-md"
    >
      <div className="space-y-4">
        <section aria-labelledby={questionHeadingId}>
          <h2 id={questionHeadingId} className="text-sm font-medium text-muted-foreground">
            Question
          </h2>
          <p id={questionTextId} className="mt-2 text-base whitespace-pre-line">
            {question}
          </p>
        </section>

        {!answerVisible && (
          <Button
            type="button"
            variant="outline"
            onClick={onShowAnswer}
            aria-label="Show answer"
            data-testid="show-answer-button"
          >
            Show Answer
          </Button>
        )}

        {answerVisible && (
          <section
            id={answerId}
            aria-labelledby={`${answerId}-heading`}
            aria-label={answer ? `Answer: ${answer}` : undefined}
            className="animate-in fade-in duration-300"
          >
            <h3 id={`${answerId}-heading`} className="text-sm font-medium text-muted-foreground">
              Answer
            </h3>
            <p className="mt-2 text-base whitespace-pre-line">{answer}</p>
          </section>
        )}
      </div>
    </article>
  );
}
