/**
 * DashboardError Component
 * Displays error messages with optional retry functionality.
 */
import * as React from "react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  message: string;
  onRetry?: () => void;
}

export function DashboardError({ message, onRetry }: DashboardErrorProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-6 rounded-lg border border-destructive/50 bg-destructive/10"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 text-destructive">
        <svg
          className="size-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="font-semibold">Error</p>
      </div>
      <p className="text-sm text-center text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" aria-label="Retry action">
          Try Again
        </Button>
      )}
    </div>
  );
}
