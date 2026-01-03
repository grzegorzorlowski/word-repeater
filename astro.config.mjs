// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Load environment variables based on mode
// eslint-disable-next-line no-undef
const mode = process.env.NODE_ENV || "development";
// eslint-disable-next-line no-undef
const envMode = process.argv.includes("--mode") ? process.argv[process.argv.indexOf("--mode") + 1] : mode;

// Load .env.test when in test mode (only if file exists and not in CI)
if (envMode === "test" && !process.env.CI) {
  try {
    // eslint-disable-next-line no-undef
    process.loadEnvFile?.(".env.test");
  } catch (error) {
    // In CI or if file doesn't exist, environment variables should already be set
    console.log("Skipping .env.test - using environment variables from CI");
  }
}

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [
    react({
      jsxImportSource: "react",
      jsxTransform: true,
    }),
    sitemap(),
  ],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["msw"],
    },
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "react",
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
