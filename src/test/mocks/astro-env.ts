/**
 * Mock for astro:env/server module
 * Used in unit tests since astro:env is a virtual module only available in Astro runtime
 *
 * IMPORTANT: These must be getters to allow tests to dynamically change process.env values
 */

// Use getters to read from process.env dynamically (allows tests to modify env vars)
Object.defineProperty(exports, "SUPABASE_URL", {
  get() {
    return process.env.SUPABASE_URL || "";
  },
  enumerable: true,
});

Object.defineProperty(exports, "SUPABASE_KEY", {
  get() {
    return process.env.SUPABASE_KEY || "test-anon-key";
  },
  enumerable: true,
});

Object.defineProperty(exports, "OPENROUTER_API_KEY", {
  get() {
    return process.env.OPENROUTER_API_KEY || "test-api-key";
  },
  enumerable: true,
});

Object.defineProperty(exports, "OPENROUTER_MODEL_NAME", {
  get() {
    return process.env.OPENROUTER_MODEL_NAME || "openai/gpt-4o-mini";
  },
  enumerable: true,
});

Object.defineProperty(exports, "PUBLIC_ENV_NAME", {
  get() {
    // No default - let the feature flags system handle the default to "prod"
    return process.env.PUBLIC_ENV_NAME;
  },
  enumerable: true,
});
