import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";

export interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  autocomplete?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Reusable form field component with consistent styling, labels, and error display
 */
export function FormField({
  label,
  name,
  type,
  value,
  onChange,
  error,
  required = false,
  autocomplete,
  placeholder,
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autocomplete}
        placeholder={placeholder}
        disabled={disabled}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
