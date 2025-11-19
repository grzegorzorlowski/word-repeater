import * as React from "react";
import { Button } from "../ui/button";
import { FormField } from "../ui/FormField";
import InlineLoader from "../InlineLoader";
import { forgotPasswordSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO } from "@/types";

interface ForgotPasswordFormState {
  email: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
  };
}

/**
 * Forgot password form component for requesting password reset email
 */
export function ForgotPasswordForm() {
  const [state, setState] = React.useState<ForgotPasswordFormState>({
    email: "",
    isSubmitting: false,
    isSuccess: false,
    error: null,
    validationErrors: {},
  });

  const handleFieldChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      email: value,
      validationErrors: {},
      error: null,
    }));
  };

  const validateForm = (): boolean => {
    const result = forgotPasswordSchema.safeParse({
      email: state.email,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setState((prev) => ({
        ...prev,
        validationErrors: {
          email: errors.email?.[0],
        },
      }));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponseDTO;
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorData.error || "Request failed. Please try again.",
        }));
        return;
      }

      // Success - always show success message (security best practice)
      setState((prev) => ({ ...prev, isSubmitting: false, isSuccess: true }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Network error. Please check your connection and try again.",
      }));
    }
  };

  if (state.isSuccess) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-start gap-3">
            <svg
              className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div className="space-y-2">
              <p className="font-medium text-green-900 dark:text-green-100">Check your email</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                If an account exists with this email, you will receive password reset instructions shortly.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField
        label="Email"
        name="email"
        type="email"
        value={state.email}
        onChange={handleFieldChange}
        error={state.validationErrors.email}
        required
        autocomplete="email"
        placeholder="you@example.com"
        disabled={state.isSubmitting}
      />

      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={state.isSubmitting}>
          {state.isSubmitting ? (
            <span className="flex items-center gap-2">
              <InlineLoader visible={true} />
              Sending...
            </span>
          ) : (
            "Send Reset Instructions"
          )}
        </Button>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={state.isSubmitting ? -1 : 0}
          >
            Back to login
          </a>
        </div>
      </div>
    </form>
  );
}
