import * as React from "react";

export interface PasswordStrengthIndicatorProps {
  password: string;
}

type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Calculate password strength based on various criteria
 */
function calculateStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return "weak";
  }

  let score = 0;

  // Length criteria
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Complexity criteria
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Determine strength based on score
  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

/**
 * Visual indicator showing password strength with color-coded bar
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculateStrength(password);

  const strengthConfig = {
    weak: {
      label: "Weak",
      color: "bg-red-500",
      width: "w-1/3",
      textColor: "text-red-600 dark:text-red-400",
    },
    medium: {
      label: "Medium",
      color: "bg-yellow-500",
      width: "w-2/3",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    strong: {
      label: "Strong",
      color: "bg-green-500",
      width: "w-full",
      textColor: "text-green-600 dark:text-green-400",
    },
  };

  const config = strengthConfig[strength];

  if (password.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${config.color} ${config.width} transition-all duration-300`} />
      </div>
      <p className={`text-xs font-medium ${config.textColor}`}>Password strength: {config.label}</p>
    </div>
  );
}
