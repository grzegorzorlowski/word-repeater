// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Load environment variables based on mode
const mode = process.env.NODE_ENV || "development";
const envMode = process.argv.includes("--mode") ? process.argv[process.argv.indexOf("--mode") + 1] : mode;

// Load .env.test when in test mode
if (envMode === "test") {
  process.loadEnvFile?.(".env.test");
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
