import { Button } from "./ui/button";

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  "data-testid"?: string;
}

/**
 * Dismissible alert/toast for API or validation errors.
 * Supports optional retry action for recoverable errors (US-009).
 */
export default function ErrorToast({
  message,
  onDismiss,
  onRetry,
  showRetry = false,
  "data-testid": testId,
}: ErrorToastProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">Error</p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300" data-testid="error-message">
              {message}
            </p>
          </div>

          {/* Retry button for recoverable errors (US-009) */}
          {showRetry && onRetry && (
            <div className="flex items-center gap-2">
              <Button onClick={onRetry} variant="outline" size="sm" className="h-8" data-testid="error-retry-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="mr-1.5 h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Retry
              </Button>
              <span className="text-xs text-red-600 dark:text-red-400">Your text has been preserved</span>
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="rounded-md p-1 text-red-900 hover:bg-red-100 dark:text-red-100 dark:hover:bg-red-900"
          data-testid="error-dismiss-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
