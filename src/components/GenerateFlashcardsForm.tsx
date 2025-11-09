import { Button } from "./ui/button";
import TextAreaWithCounter from "./TextAreaWithCounter";
import CharacterLimitHint from "./CharacterLimitHint";
import ErrorToast from "./ErrorToast";
import TruncateDialog from "./TruncateDialog";
import InlineLoader from "./InlineLoader";
import { useFlashcardGeneration } from "../hooks/useFlashcardGeneration";

/**
 * Main interactive form enabling text input, validation, and submit to generate flashcards.
 * Manages view state, API integration, loading and error handling, and post-success affordances.
 */
export default function GenerateFlashcardsForm() {
  const {
    text,
    setText,
    charCount,
    isGenerating,
    error,
    clearError,
    showTruncateDialog,
    setShowTruncateDialog,
    generatedFlashcards,
    successMessage,
    canSubmit,
    submit,
  } = useFlashcardGeneration();

  const handleGenerate = () => {
    if (charCount > 5000) {
      setShowTruncateDialog(true);
      return;
    }
    submit();
  };

  const handleRetry = () => {
    // Clear error and retry submission
    clearError();
    submit();
  };

  const handleTruncateConfirm = () => {
    const truncatedText = text.slice(0, 5000);
    setText(truncatedText);
    setShowTruncateDialog(false);
    submit(truncatedText);
  };

  const handleTruncateCancel = () => {
    setShowTruncateDialog(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Generate Flashcards</h1>
          <p className="text-muted-foreground">
            Paste your text below and let AI generate flashcard suggestions for you. Your flashcards will be saved as
            pending for review.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <TextAreaWithCounter
            value={text}
            onChange={setText}
            count={charCount}
            min={500}
            max={5000}
            disabled={isGenerating}
          />

          <CharacterLimitHint count={charCount} min={500} max={5000} />

          <div className="flex items-center gap-4">
            <Button onClick={handleGenerate} disabled={!canSubmit || isGenerating} className="min-w-[140px]">
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <InlineLoader visible={true} />
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </Button>

            {isGenerating && <span className="text-sm text-muted-foreground">This may take a few moments...</span>}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && generatedFlashcards.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="font-medium text-green-900 dark:text-green-100">{successMessage}</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Generated {generatedFlashcards.length} flashcard{generatedFlashcards.length !== 1 ? "s" : ""}. Your
                  flashcards are now pending review.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button asChild>
                <a href="/dashboard">Go to Dashboard to Review</a>
              </Button>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && <ErrorToast message={error} onDismiss={clearError} onRetry={handleRetry} showRetry={true} />}

        {/* Truncate Dialog */}
        <TruncateDialog open={showTruncateDialog} onConfirm={handleTruncateConfirm} onCancel={handleTruncateCancel} />
      </div>
    </div>
  );
}
