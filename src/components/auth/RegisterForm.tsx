import * as React from "react";
import { Button } from "../ui/button";
import { FormField } from "../ui/FormField";
import { PasswordStrengthIndicator } from "../ui/PasswordStrengthIndicator";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import InlineLoader from "../InlineLoader";
import { registerSchema } from "@/lib/validation/authSchemas";
import type { ErrorResponseDTO } from "@/types";

interface RegisterFormProps {
  onSuccess?: () => void;
}

interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  validationErrors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: string;
  };
}

/**
 * Registration form component with email, password, password confirmation, and terms acceptance
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [state, setState] = React.useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    isSubmitting: false,
    isSuccess: false,
    error: null,
    validationErrors: {},
  });

  const handleFieldChange = (
    field: "email" | "password" | "confirmPassword" | "acceptTerms",
    value: string | boolean
  ) => {
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
    const result = registerSchema.safeParse({
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword,
      acceptTerms: state.acceptTerms,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setState((prev) => ({
        ...prev,
        validationErrors: {
          email: errors.email?.[0],
          password: errors.password?.[0],
          confirmPassword: errors.confirmPassword?.[0],
          acceptTerms: errors.acceptTerms?.[0],
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: state.email,
          password: state.password,
          acceptTerms: state.acceptTerms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as ErrorResponseDTO;
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorData.error || "Registration failed. Please try again.",
        }));
        return;
      }

      // Success
      setState((prev) => ({ ...prev, isSubmitting: false, isSuccess: true }));

      if (onSuccess) {
        onSuccess();
      }

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
              <p className="font-medium text-green-900 dark:text-green-100">Registration successful!</p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account has been created. Redirecting you to login...
              </p>
            </div>
          </div>
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
        onChange={(value) => handleFieldChange("email", value)}
        error={state.validationErrors.email}
        required
        autocomplete="email"
        placeholder="you@example.com"
        disabled={state.isSubmitting}
      />

      <div className="space-y-2">
        <FormField
          label="Password"
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
        label="Confirm Password"
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

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="acceptTerms"
            checked={state.acceptTerms}
            onCheckedChange={(checked) => handleFieldChange("acceptTerms", checked === true)}
            disabled={state.isSubmitting}
            aria-invalid={state.validationErrors.acceptTerms ? "true" : "false"}
            aria-describedby={state.validationErrors.acceptTerms ? "acceptTerms-error" : undefined}
          />
          <Label htmlFor="acceptTerms" className="text-sm font-normal leading-tight cursor-pointer">
            I accept the{" "}
            <a href="/legal/terms" target="_blank" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/legal/privacy" target="_blank" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </Label>
        </div>
        {state.validationErrors.acceptTerms && (
          <p id="acceptTerms-error" className="text-sm text-destructive" role="alert">
            {state.validationErrors.acceptTerms}
          </p>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{state.error}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={state.isSubmitting}>
        {state.isSubmitting ? (
          <span className="flex items-center gap-2">
            <InlineLoader visible={true} />
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
