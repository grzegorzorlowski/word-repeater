import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Authentication setup for E2E tests
 * This file runs before tests to authenticate a user and save the state
 *
 * Usage in tests:
 * test.use({ storageState: authFile });
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");

// Load test credentials from environment variables
const TEST_EMAIL = process.env.E2E_USERNAME || "test@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "TestPassword123!";

setup("authenticate via API", async ({ request, baseURL }) => {
  // Send authentication request to our login API
  const response = await request.post(`${baseURL}/api/auth/login`, {
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  // Verify login was successful
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const responseData = await response.json();
  expect(responseData.message).toBe("Login successful");
  expect(responseData.user).toBeDefined();
  expect(responseData.user.email).toBe(TEST_EMAIL);

  // Save authentication state (cookies, local storage, etc.)
  await request.storageState({ path: authFile });

  // eslint-disable-next-line no-console
  console.log(`✓ Authentication successful for ${TEST_EMAIL}`);
  // eslint-disable-next-line no-console
  console.log(`✓ Auth state saved to ${authFile}`);
});
