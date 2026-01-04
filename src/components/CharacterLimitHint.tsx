interface CharacterLimitHintProps {
  count: number;
  min: number;
  max: number;
}

/**
 * Small helper text explaining limits and minimum with dynamic visual states.
 */
export default function CharacterLimitHint({ count, min, max }: CharacterLimitHintProps) {
  const getVariant = () => {
    if (count < min) return "warn";
    if (count > max) return "error";
    return "info";
  };

  const getMessage = () => {
    if (count === 0) {
      return `Please enter between ${min} and ${max} characters to generate flashcards.`;
    }
    if (count < min) {
      const remaining = min - count;
      return `You need at least ${remaining} more character${remaining !== 1 ? "s" : ""} to generate flashcards.`;
    }
    if (count > max) {
      const excess = count - max;
      return `Your text exceeds the limit by ${excess} character${excess !== 1 ? "s" : ""}. Click Generate to trim to ${max} characters.`;
    }
    return `Your text is ready for flashcard generation.`;
  };

  const variant = getVariant();
  const message = getMessage();

  const getVariantClasses = () => {
    switch (variant) {
      case "warn":
        return "text-yellow-700 dark:text-yellow-400";
      case "error":
        return "text-red-700 dark:text-red-400";
      case "info":
        return "text-green-700 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <p id="char-limit-hint" className={`text-sm ${getVariantClasses()}`}>
      {message}
    </p>
  );
}
