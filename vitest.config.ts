import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    // Use happy-dom for component tests, node for API/service tests
    environment: "happy-dom",
    environmentOptions: {
      happyDOM: {
        url: "http://localhost:3000",
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/test/**", "src/**/*.d.ts", "src/env.d.ts", "src/types.ts"],
      // Monitor coverage without failing builds
      // thresholds: {
      //   lines: 60,
      //   functions: 60,
      //   branches: 60,
      //   statements: 60,
      // },
    },
    // IMPORTANT: Aliases here only apply during test execution
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mock astro:env/server for unit tests (virtual module not available in Vitest)
      "astro:env/server": path.resolve(__dirname, "./src/test/mocks/astro-env.ts"),
    },
  },
});
