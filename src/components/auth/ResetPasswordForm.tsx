import * as React from "react";
import { Button } from "../ui/button";
import { FormField } from "../ui/FormField";
import { PasswordStrengthIndicator } from "../ui/PasswordStrengthIndicator";
import InlineLoader from "../InlineLoader";
import { resetPasswordSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO } from "@/types";

interface ResetPasswordFormProps {
  token: string;
}

interface ResetPasswordFormState {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  validationErrors: {
    password?: string;
    confirmPassword?: string;
  };
}

/**
 * Reset password form component for setting new password with token validation
 */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, setState] = React.useState<ResetPasswordFormState>({
    password: "",
    confirmPassword: "",
    isSubmitting: false,
    isSuccess: false,
    error: null,
    validationErrors: {},
  });

  const handleFieldChange = (field: "password" | "confirmPassword", value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      validationErrors: {
        ...prev.validationErrors,
        [field]: undefined,
      },
      error: null,
    }));
  };

  const validateForm = (): boolean => {
    const result = resetPasswordSchema.safeParse({
      token,
      password: state.password,
      confirmPassword: state.confirmPassword,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setState((prev) => ({
        ...prev,
        validationErrors: {
          password: errors.password?.[0],
          confirmPassword: errors.confirmPassword?.[0],
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: state.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponseDTO;
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorData.error || "Failed to reset password. Please try again.",
        }));
        return;
      }

      // Success
      setState((prev) => ({ ...prev, isSubmitting: false, isSuccess: true }));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="space-y-1">
              <p className="font-medium text-green-900 dark:text-green-100">Password reset successful!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your password has been updated. Redirecting you to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <FormField
          label="New Password"
          name="password"
          type="password"
          value={state.password}
          onChange={(value) => handleFieldChange("password", value)}
          error={state.validationErrors.password}
          required
          autocomplete="new-password"
          placeholder="••••••••"
          disabled={state.isSubmitting}
        />
        <PasswordStrengthIndicator password={state.password} />
      </div>

      <FormField
        label="Confirm New Password"
        name="confirmPassword"
        type="password"
        value={state.confirmPassword}
        onChange={(value) => handleFieldChange("confirmPassword", value)}
        error={state.validationErrors.confirmPassword}
        required
        autocomplete="new-password"
        placeholder="••••••••"
        disabled={state.isSubmitting}
      />

      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={state.isSubmitting}>
        {state.isSubmitting ? (
          <span className="flex items-center gap-2">
            <InlineLoader visible={true} />
            Resetting password...
          </span>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}
