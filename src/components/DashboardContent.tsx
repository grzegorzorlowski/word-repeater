/**
 * DashboardContent Component
 * Main React component that manages dashboard state and renders appropriate UI.
 */
import * as React from "react";
import { DashboardCTAButtons } from "./DashboardCTAButtons";
import { DashboardLoader } from "./DashboardLoader";
import { DashboardError } from "./DashboardError";
import type { DashboardViewModel } from "@/types";

export function DashboardContent() {
  const [state, setState] = React.useState<DashboardViewModel>({
    loading: false,
    error: null,
  });

  const handleRetry = () => {
    setState({ loading: false, error: null });
  };

  // If there's an error, show error component
  if (state.error) {
    return <DashboardError message={state.error} onRetry={handleRetry} />;
  }

  // If loading, show loader
  if (state.loading) {
    return <DashboardLoader visible={true} />;
  }

  // Default: show CTA buttons
  return <DashboardCTAButtons />;
}
