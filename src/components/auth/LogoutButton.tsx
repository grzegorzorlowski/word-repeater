import * as React from "react";
import { Button } from "../ui/button";
import InlineLoader from "../InlineLoader";
import type { ErrorResponseDTO } from "@/types";

interface LogoutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

/**
 * Logout button component that handles user sign out
 * Calls the logout API endpoint and redirects to login page on success
 */
export function LogoutButton({ variant = "outline", className }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = (await response.json()) as ErrorResponseDTO;
        setError(data.error || "Logout failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Successful logout - redirect to login page
      window.location.href = "/login";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
      setError("Network error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant={variant} onClick={handleLogout} disabled={isLoading} className={className} aria-label="Sign out">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <InlineLoader visible={true} />
            Signing out...
          </span>
        ) : (
          "Sign out"
        )}
      </Button>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
