interface TextAreaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  count: number;
  min: number;
  max: number;
  disabled?: boolean;
}

/**
 * Textarea with a "N / 5000" counter and accessibility labels.
 * Shows visual states based on character count ranges.
 */
export default function TextAreaWithCounter({
  value,
  onChange,
  count,
  min,
  max,
  disabled = false,
}: TextAreaWithCounterProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Determine visual state
  const getCounterColorClass = () => {
    if (count < min) {
      return "text-yellow-600 dark:text-yellow-500";
    }
    if (count > max) {
      return "text-red-600 dark:text-red-500";
    }
    return "text-green-600 dark:text-green-500";
  };

  const getBorderColorClass = () => {
    if (count < min) {
      return "border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500";
    }
    if (count > max) {
      return "border-red-300 focus:border-red-500 focus:ring-red-500";
    }
    if (count >= min) {
      return "border-green-300 focus:border-green-500 focus:ring-green-500";
    }
    return "border-input";
  };

  return (
    <div className="space-y-2">
      <label htmlFor="flashcard-text-input" className="block text-sm font-medium">
        Input Text
      </label>
      <div className="relative">
        <textarea
          id="flashcard-text-input"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Paste your text here (500-5000 characters)..."
          aria-describedby="char-counter char-limit-hint"
          className={`w-full min-h-[300px] rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${getBorderColorClass()}`}
        />
        <div
          id="char-counter"
          className={`absolute bottom-2 right-2 text-xs font-medium ${getCounterColorClass()}`}
          aria-live="polite"
        >
          {count} / {max}
        </div>
      </div>
    </div>
  );
}
