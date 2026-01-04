import { Page } from "@playwright/test";

/**
 * Test fixtures for authentication flows
 */

export interface TestUser {
  email: string;
  password: string;
}

// Load test credentials from environment variables
// These should be set in .env.test file
export const testUser: TestUser = {
  email: process.env.E2E_USERNAME || "test@example.com",
  password: process.env.E2E_PASSWORD || "TestPassword123!",
};

/**
 * Helper to login a user through the UI
 */
export async function loginUser(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for navigation to dashboard
  await page.waitForURL(/.*dashboard/);
}

/**
 * Helper to register a new user through the UI
 */
export async function registerUser(page: Page, user: TestUser) {
  await page.goto("/register");
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByLabel(/confirm password/i).fill(user.password);
  await page.getByLabel(/accept/i).check();
  await page.getByRole("button", { name: /register/i }).click();

  // Wait for navigation
  await page.waitForURL(/.*dashboard|.*login/);
}

/**
 * Helper to logout
 */
export async function logoutUser(page: Page) {
  await page.goto("/logout");
  await page.waitForURL(/.*login|.*\//);
}
