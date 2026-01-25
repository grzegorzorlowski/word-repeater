// @ts-check
import { defineConfig, envField } from "astro/config";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// CRITICAL: Detect test mode and load .env.test BEFORE Astro reads environment variables
// This must happen at the top of the config file, before defineConfig() is called
// eslint-disable-next-line no-undef
const mode = process.argv.includes("--mode")
  ? // eslint-disable-next-line no-undef
    process.argv[process.argv.indexOf("--mode") + 1]
  : "development";

// Load .env.test immediately if in test mode, BEFORE Astro's env system initializes
if (mode === "test") {
  // eslint-disable-next-line no-undef
  const envTestPath = path.resolve(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    // Load .env.test with override to ensure it wins over .env
    dotenv.config({ path: envTestPath, override: true });
    // eslint-disable-next-line no-undef, no-console
    console.log("✓ [Config] Loaded .env.test (overriding .env values for astro:env)");
  }
}

// https://astro.build/config
export default defineConfig({
  output: "server",

  // Environment variables configuration using astro:env
  // This replaces the old import.meta.env usage and properly separates
  // build-time (public) from runtime (secret) variables for Cloudflare
  //
  // NOTE: When running with --mode test (e.g., npm run dev:e2e),
  // .env.test is loaded at the top of this config file (before defineConfig)
  // to ensure astro:env reads the correct test values
  env: {
    schema: {
      // Private/secret variables (runtime-only, not inlined at build time)
      // These are bound to the Cloudflare Worker at runtime via Dashboard secrets
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),

      // Optional: Model name for OpenRouter (can have a default)
      OPENROUTER_MODEL_NAME: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "openai/gpt-4o-mini",
      }),

      // Public variables (inlined at build time, available everywhere)
      // These can be safely committed to wrangler.toml or set via Dashboard
      PUBLIC_ENV_NAME: envField.string({
        context: "server",
        access: "public",
        optional: false,
        default: "prod", // Default to most restrictive for safety
      }),
    },
  },

  integrations: [
    react({
      jsxImportSource: "react",
      jsxTransform: true,
    }),
    sitemap(),
  ],
  server: { port: 3000 },
  vite: {
    // Explicitly configure how environment files are loaded
    envPrefix: ["VITE_", "PUBLIC_", "SUPABASE_", "OPENROUTER_", "E2E_"],

    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["msw"],
    },
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react",
    },
  },
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: {
      enabled: true,
      // Tell Wrangler's getPlatformProxy() to use the "test" environment
      // This makes it load .env.test instead of .env
      environment: mode === "test" ? "test" : undefined,
      // Optionally specify the config path to ensure wrangler.toml is found
      configPath: mode === "test" ? "wrangler.toml" : undefined,
    },
    // Cloudflare Workers runtime configuration for React 19
    runtime: {
      mode: "local",
      type: "pages",
      bindings: {},
    },
    wasmModuleImports: true,
  }),
});
