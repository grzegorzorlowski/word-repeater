/**
 * DashboardLoader Component
 * A visual indicator (spinner) displayed during data fetching or loading states.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardLoaderProps {
  visible: boolean;
}

export function DashboardLoader({ visible }: DashboardLoaderProps) {
  if (!visible) return null;

  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite" aria-busy="true">
      <div className="relative">
        <div
          className={cn("size-12 rounded-full border-4 border-muted", "border-t-primary animate-spin")}
          aria-hidden="true"
        />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
