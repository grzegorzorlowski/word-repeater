// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

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
