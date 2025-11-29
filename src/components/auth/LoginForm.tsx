import * as React from "react";
import { Button } from "../ui/button";
import { FormField } from "../ui/FormField";
import InlineLoader from "../InlineLoader";
import { loginSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO } from "@/types";

interface LoginFormProps {
  redirectTo?: string;
}

interface LoginFormState {
  email: string;
  password: string;
  isSubmitting: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
    password?: string;
  };
}

/**
 * Login form component with email/password fields and validation
 */
export function LoginForm({ redirectTo = "/dashboard" }: LoginFormProps) {
  const [state, setState] = React.useState<LoginFormState>({
    email: "",
    password: "",
    isSubmitting: false,
    error: null,
    validationErrors: {},
  });

  const handleFieldChange = (field: "email" | "password", value: string) => {
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
    const result = loginSchema.safeParse({
      email: state.email,
      password: state.password,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setState((prev) => ({
        ...prev,
        validationErrors: {
          email: errors.email?.[0],
          password: errors.password?.[0],
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponseDTO;
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorData.error || "Login failed. Please try again.",
        }));
        return;
      }

      // Success - redirect to dashboard or specified location
      window.location.href = redirectTo;
    } catch {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Network error. Please check your connection and try again.",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate role="form">
      <FormField
        label="Email"
        name="email"
        type="email"
        value={state.email}
        onChange={(value) => handleFieldChange("email", value)}
        error={state.validationErrors.email}
        required
        autocomplete="email"
        placeholder="you@example.com"
        disabled={state.isSubmitting}
      />

      <FormField
        label="Password"
        name="password"
        type="password"
        value={state.password}
        onChange={(value) => handleFieldChange("password", value)}
        error={state.validationErrors.password}
        required
        autocomplete="current-password"
        placeholder="••••••••"
        disabled={state.isSubmitting}
      />

      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4" role="alert" aria-live="polite">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Button type="submit" className="w-full" disabled={state.isSubmitting}>
          {state.isSubmitting ? (
            <span className="flex items-center gap-2">
              <InlineLoader visible={true} />
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="text-center">
          <a
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
            tabIndex={state.isSubmitting ? -1 : 0}
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </form>
  );
}
