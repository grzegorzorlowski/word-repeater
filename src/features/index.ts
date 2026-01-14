/**
 * Feature Flags System
 *
 * This module provides a type-safe feature flag system that works on both
 * frontend (Astro pages) and backend (API endpoints).
 *
 * Features:
 * - Type-safe flag names (only defined flags can be checked)
 * - Runtime evaluation based on ENV_NAME environment variable
 * - Per-flag default values when not explicitly configured
 * - Environment-specific configuration (local, integration, prod)
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Supported environment names
 */
export type Environment = "local" | "integration" | "prod";

/**
 * Feature flag names - add new flags here
 */
export type FeatureFlag = "signup" | "resetPassword";

/**
 * Configuration for a single feature flag
 */
export interface FeatureFlagConfig {
  /**
   * Default state when environment is not explicitly configured
   */
  defaultEnabled: boolean;

  /**
   * Environment-specific overrides
   */
  environments: {
    local?: boolean;
    integration?: boolean;
    prod?: boolean;
  };
}

/**
 * Complete feature flags configuration
 */
export type FeatureFlagsConfig = Record<FeatureFlag, FeatureFlagConfig>;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Feature flags configuration
 *
 * To add a new feature flag:
 * 1. Add the flag name to the FeatureFlag type above
 * 2. Add configuration here with defaultEnabled and environment overrides
 */
const featureFlagsConfig: FeatureFlagsConfig = {
  signup: {
    defaultEnabled: false,
    environments: {
      local: true,
      integration: false,
      prod: false,
    },
  },

  resetPassword: {
    defaultEnabled: false,
    environments: {
      local: true,
      integration: false,
      prod: false,
    },
  },
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Gets the current environment from PUBLIC_ENV_NAME environment variable
 *
 * SECURITY: Defaults to "prod" (most restrictive) if not set or invalid.
 * This ensures features are disabled by default, preventing accidental
 * feature leaks in production if PUBLIC_ENV_NAME is not configured.
 */
function getCurrentEnvironment(): Environment {
  // Try to get PUBLIC_ENV_NAME from different sources depending on the runtime
  let envName: string | undefined;

  // Check if we're in an Astro/Vite environment (import.meta.env available)
  if (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env) {
    envName = (import.meta as { env?: Record<string, string> }).env.PUBLIC_ENV_NAME;
  }

  // Fall back to Node.js process.env
  if (!envName && typeof process !== "undefined" && process.env) {
    envName = process.env.PUBLIC_ENV_NAME;
  }

  // SECURITY: Default to most restrictive environment if not set
  if (!envName) {
    // eslint-disable-next-line no-console
    console.error(
      "⚠️  SECURITY WARNING: PUBLIC_ENV_NAME environment variable not set!\n" +
        "   Defaulting to 'prod' (most restrictive) for safety.\n" +
        "   All feature flags will be disabled.\n" +
        "   Please set PUBLIC_ENV_NAME to 'local', 'integration', or 'prod'."
    );
    return "prod";
  }

  const normalizedEnv = envName.toLowerCase();

  if (normalizedEnv === "local" || normalizedEnv === "integration" || normalizedEnv === "prod") {
    return normalizedEnv;
  }

  // SECURITY: Invalid values also default to prod
  // eslint-disable-next-line no-console
  console.error(
    `⚠️  SECURITY WARNING: Invalid PUBLIC_ENV_NAME value: "${envName}"\n` +
      `   Defaulting to 'prod' (most restrictive) for safety.\n` +
      `   Valid values are: 'local', 'integration', 'prod'`
  );
  return "prod";
}

/**
 * Checks if a feature flag is enabled in the current environment
 *
 * @param flagName - The name of the feature flag to check
 * @returns true if the feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled("signup")) {
 *   // Show signup form
 * }
 * ```
 */
export function isFeatureEnabled(flagName: FeatureFlag): boolean {
  const config = featureFlagsConfig[flagName];

  if (!config) {
    // eslint-disable-next-line no-console
    console.error(`Feature flag '${flagName}' not found in configuration`);
    return false;
  }

  const currentEnv = getCurrentEnvironment();
  const envSpecificValue = config.environments[currentEnv];

  // Use environment-specific value if defined, otherwise use default
  return envSpecificValue !== undefined ? envSpecificValue : config.defaultEnabled;
}

/**
 * Gets all feature flags and their current states
 * Useful for debugging or displaying feature flag status
 *
 * @returns Object with all feature flags and their enabled state
 *
 * @example
 * ```typescript
 * const flags = getAllFeatureFlags();
 * console.log(flags); // { signup: true, resetPassword: false }
 * ```
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags = Object.keys(featureFlagsConfig) as FeatureFlag[];

  return flags.reduce(
    (acc, flagName) => {
      acc[flagName] = isFeatureEnabled(flagName);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>
  );
}

/**
 * Gets the current environment name
 * Useful for debugging or conditional logic based on environment
 *
 * @returns The current environment name
 *
 * @example
 * ```typescript
 * const env = getEnvironment();
 * console.log(env); // "local" | "integration" | "prod"
 * ```
 */
export function getEnvironment(): Environment {
  return getCurrentEnvironment();
}

// ============================================================================
// Helper Functions for Common Use Cases
// ============================================================================

/**
 * Creates a Response object for a disabled feature (403 Forbidden)
 * Use this in API endpoints when a feature is disabled
 *
 * @param featureName - Human-readable name of the feature
 * @returns Response object with 403 status
 *
 * @example
 * ```typescript
 * if (!isFeatureEnabled("signup")) {
 *   return createFeatureDisabledResponse("User Registration");
 * }
 * ```
 */
export function createFeatureDisabledResponse(featureName: string): Response {
  return new Response(
    JSON.stringify({
      error: "Feature not available",
      message: `The ${featureName} feature is currently disabled`,
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Checks if a feature is enabled and returns a Response if not
 * Useful for early returns in API endpoints
 *
 * @param flagName - The feature flag to check
 * @param featureName - Human-readable name for the error message
 * @returns Response object if feature is disabled, null if enabled
 *
 * @example
 * ```typescript
 * export const POST: APIRoute = async ({ request }) => {
 *   const featureCheck = requireFeatureEnabled("signup", "User Registration");
 *   if (featureCheck) return featureCheck;
 *
 *   // Feature is enabled, continue with normal logic
 *   // ...
 * };
 * ```
 */
export function requireFeatureEnabled(flagName: FeatureFlag, featureName: string): Response | null {
  if (!isFeatureEnabled(flagName)) {
    return createFeatureDisabledResponse(featureName);
  }
  return null;
}
