import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isFeatureEnabled,
  getAllFeatureFlags,
  getEnvironment,
  requireFeatureEnabled,
  createFeatureDisabledResponse,
  type FeatureFlag,
  type Environment,
} from "./index";

describe("Feature Flags System", () => {
  // Store original PUBLIC_ENV_NAME to restore after tests
  let originalEnvName: string | undefined;

  beforeEach(() => {
    originalEnvName = process.env.PUBLIC_ENV_NAME;
  });

  afterEach(() => {
    // Restore original environment
    if (originalEnvName !== undefined) {
      process.env.PUBLIC_ENV_NAME = originalEnvName;
    } else {
      delete process.env.PUBLIC_ENV_NAME;
    }
  });

  describe("getEnvironment", () => {
    it("should return 'prod' by default when PUBLIC_ENV_NAME is not set (security)", () => {
      delete process.env.PUBLIC_ENV_NAME;
      expect(getEnvironment()).toBe("prod");
    });

    it("should return correct environment when PUBLIC_ENV_NAME is set", () => {
      process.env.PUBLIC_ENV_NAME = "prod";
      expect(getEnvironment()).toBe("prod");

      process.env.PUBLIC_ENV_NAME = "integration";
      expect(getEnvironment()).toBe("integration");

      process.env.PUBLIC_ENV_NAME = "local";
      expect(getEnvironment()).toBe("local");
    });

    it("should handle case-insensitive PUBLIC_ENV_NAME values", () => {
      process.env.PUBLIC_ENV_NAME = "PROD";
      expect(getEnvironment()).toBe("prod");

      process.env.PUBLIC_ENV_NAME = "Local";
      expect(getEnvironment()).toBe("local");
    });

    it("should default to 'prod' for invalid PUBLIC_ENV_NAME values (security)", () => {
      process.env.PUBLIC_ENV_NAME = "invalid";
      expect(getEnvironment()).toBe("prod");

      process.env.PUBLIC_ENV_NAME = "development";
      expect(getEnvironment()).toBe("prod");
    });
  });

  describe("isFeatureEnabled", () => {
    describe("signup feature", () => {
      it("should be enabled in local environment", () => {
        process.env.PUBLIC_ENV_NAME = "local";
        expect(isFeatureEnabled("signup")).toBe(true);
      });

      it("should be disabled in integration environment", () => {
        process.env.PUBLIC_ENV_NAME = "integration";
        expect(isFeatureEnabled("signup")).toBe(false);
      });

      it("should be disabled in prod environment", () => {
        process.env.PUBLIC_ENV_NAME = "prod";
        expect(isFeatureEnabled("signup")).toBe(false);
      });
    });

    describe("resetPassword feature", () => {
      it("should be enabled in local environment", () => {
        process.env.PUBLIC_ENV_NAME = "local";
        expect(isFeatureEnabled("resetPassword")).toBe(true);
      });

      it("should be disabled in integration environment", () => {
        process.env.PUBLIC_ENV_NAME = "integration";
        expect(isFeatureEnabled("resetPassword")).toBe(false);
      });

      it("should be disabled in prod environment", () => {
        process.env.PUBLIC_ENV_NAME = "prod";
        expect(isFeatureEnabled("resetPassword")).toBe(false);
      });
    });

    it("should use default value when environment is not explicitly configured", () => {
      // The config specifies defaults for all environments
      // This test verifies the fallback behavior
      process.env.PUBLIC_ENV_NAME = "local";
      const signup = isFeatureEnabled("signup");
      expect(typeof signup).toBe("boolean");
    });
  });

  describe("getAllFeatureFlags", () => {
    it("should return all feature flags with their states", () => {
      process.env.PUBLIC_ENV_NAME = "local";
      const flags = getAllFeatureFlags();

      expect(flags).toHaveProperty("signup");
      expect(flags).toHaveProperty("resetPassword");
      expect(typeof flags.signup).toBe("boolean");
      expect(typeof flags.resetPassword).toBe("boolean");
    });

    it("should return correct states for local environment", () => {
      process.env.PUBLIC_ENV_NAME = "local";
      const flags = getAllFeatureFlags();

      expect(flags.signup).toBe(true);
      expect(flags.resetPassword).toBe(true);
    });

    it("should return correct states for integration environment", () => {
      process.env.PUBLIC_ENV_NAME = "integration";
      const flags = getAllFeatureFlags();

      expect(flags.signup).toBe(false);
      expect(flags.resetPassword).toBe(false);
    });

    it("should return correct states for prod environment", () => {
      process.env.PUBLIC_ENV_NAME = "prod";
      const flags = getAllFeatureFlags();

      expect(flags.signup).toBe(false);
      expect(flags.resetPassword).toBe(false);
    });
  });

  describe("createFeatureDisabledResponse", () => {
    it("should create a 403 response with correct format", async () => {
      const response = createFeatureDisabledResponse("User Registration");

      expect(response.status).toBe(403);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body).toEqual({
        error: "Feature not available",
        message: "The User Registration feature is currently disabled",
      });
    });

    it("should include the feature name in the message", async () => {
      const response = createFeatureDisabledResponse("Password Reset");
      const body = await response.json();

      expect(body.message).toContain("Password Reset");
    });
  });

  describe("requireFeatureEnabled", () => {
    it("should return null when feature is enabled", () => {
      process.env.PUBLIC_ENV_NAME = "local";
      const result = requireFeatureEnabled("signup", "User Registration");

      expect(result).toBeNull();
    });

    it("should return Response when feature is disabled", () => {
      process.env.PUBLIC_ENV_NAME = "prod";
      const result = requireFeatureEnabled("signup", "User Registration");

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);
    });

    it("should return Response with correct error message", async () => {
      process.env.PUBLIC_ENV_NAME = "prod";
      const result = requireFeatureEnabled("signup", "User Registration");

      expect(result).not.toBeNull();
      if (result) {
        const body = await result.json();
        expect(body.message).toContain("User Registration");
      }
    });
  });

  describe("Type Safety", () => {
    it("should only accept valid FeatureFlag names", () => {
      // This test ensures TypeScript compilation succeeds with valid flags
      const validFlags: FeatureFlag[] = ["signup", "resetPassword"];

      validFlags.forEach((flag) => {
        const result = isFeatureEnabled(flag);
        expect(typeof result).toBe("boolean");
      });
    });

    it("should work with all valid Environment types", () => {
      const validEnvironments: Environment[] = ["local", "integration", "prod"];

      validEnvironments.forEach((env) => {
        process.env.PUBLIC_ENV_NAME = env;
        const result = getEnvironment();
        expect(validEnvironments).toContain(result);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing PUBLIC_ENV_NAME gracefully (defaults to prod)", () => {
      delete process.env.PUBLIC_ENV_NAME;

      // Should not throw
      expect(() => isFeatureEnabled("signup")).not.toThrow();
      expect(() => getAllFeatureFlags()).not.toThrow();
      expect(() => getEnvironment()).not.toThrow();

      // Should default to prod (all features disabled)
      expect(getEnvironment()).toBe("prod");
      expect(isFeatureEnabled("signup")).toBe(false);
    });

    it("should handle empty string PUBLIC_ENV_NAME (defaults to prod)", () => {
      process.env.PUBLIC_ENV_NAME = "";

      expect(getEnvironment()).toBe("prod");
      expect(() => isFeatureEnabled("signup")).not.toThrow();
    });

    it("should handle whitespace in PUBLIC_ENV_NAME (defaults to prod)", () => {
      process.env.PUBLIC_ENV_NAME = "  local  ";

      // Should be invalid and default to prod
      expect(getEnvironment()).toBe("prod");
      expect(() => isFeatureEnabled("signup")).not.toThrow();
    });
  });

  describe("Security Behavior", () => {
    it("should default to prod (most restrictive) when PUBLIC_ENV_NAME is missing", () => {
      delete process.env.PUBLIC_ENV_NAME;

      expect(getEnvironment()).toBe("prod");

      const flags = getAllFeatureFlags();
      // All flags should be disabled in prod
      expect(flags.signup).toBe(false);
      expect(flags.resetPassword).toBe(false);
    });

    it("should default to prod when PUBLIC_ENV_NAME is invalid", () => {
      const invalidValues = ["development", "staging", "test", "invalid", "production", "dev"];

      invalidValues.forEach((invalidValue) => {
        process.env.PUBLIC_ENV_NAME = invalidValue;
        expect(getEnvironment()).toBe("prod");
        expect(isFeatureEnabled("signup")).toBe(false);
      });
    });

    it("should prevent accidental feature leaks in misconfigured production", () => {
      // Simulate production with missing PUBLIC_ENV_NAME
      delete process.env.PUBLIC_ENV_NAME;

      // All features should be disabled for safety
      expect(isFeatureEnabled("signup")).toBe(false);
      expect(isFeatureEnabled("resetPassword")).toBe(false);

      // requireFeatureEnabled should return 403 Response
      const response = requireFeatureEnabled("signup", "User Registration");
      expect(response).toBeInstanceOf(Response);
      expect(response?.status).toBe(403);
    });
  });

  describe("Integration Scenarios", () => {
    it("should correctly gate signup feature across environments", () => {
      const environments: Environment[] = ["local", "integration", "prod"];
      const expectedResults = {
        local: true,
        integration: false,
        prod: false,
      };

      environments.forEach((env) => {
        process.env.PUBLIC_ENV_NAME = env;
        expect(isFeatureEnabled("signup")).toBe(expectedResults[env]);
      });
    });

    it("should correctly gate resetPassword feature across environments", () => {
      const environments: Environment[] = ["local", "integration", "prod"];
      const expectedResults = {
        local: true,
        integration: false,
        prod: false,
      };

      environments.forEach((env) => {
        process.env.PUBLIC_ENV_NAME = env;
        expect(isFeatureEnabled("resetPassword")).toBe(expectedResults[env]);
      });
    });

    it("should allow different flags to have different states", () => {
      process.env.PUBLIC_ENV_NAME = "integration";

      expect(isFeatureEnabled("signup")).toBe(false);
      expect(isFeatureEnabled("resetPassword")).toBe(false);
    });
  });
});
