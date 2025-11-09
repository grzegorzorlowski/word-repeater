interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Dismissible alert/toast for API or validation errors.
 */
export default function ErrorToast({ message, onDismiss }: ErrorToastProps) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-red-900 dark:text-red-100">Error</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="rounded-md p-1 text-red-900 hover:bg-red-100 dark:text-red-100 dark:hover:bg-red-900"
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
