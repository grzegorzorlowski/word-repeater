import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.test file for e2e tests (only if not in CI and file exists)
if (!process.env.CI) {
  const envTestPath = path.resolve(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath });
  }
}
// In CI, environment variables are already set via GitHub secrets

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html"], ["list"], ...(process.env.CI ? [["github"] as const] : [])],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure */
    screenshot: "only-on-failure",
    /* Video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project for authentication (runs first)
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      teardown: "teardown", // Run teardown after this project
    },
    // Main test project that depends on auth setup
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    // Teardown project for cleanup (runs last)
    {
      name: "teardown",
      testMatch: /.*\.teardown\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "pipe",
    stderr: "pipe",
    // Ensure astro:env sees PUBLIC_ENV_NAME=local in the dev server process.
    // In CI there is no .env.test, and subprocess env inheritance can be unreliable,
    // so we explicitly pass env so feature flags (e.g. signup, resetPassword) are enabled for e2e.
    env: {
      ...process.env,
      PUBLIC_ENV_NAME: process.env.PUBLIC_ENV_NAME || "local",
    },
  },
});
