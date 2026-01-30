import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should redirect unauthenticated users from landing page to login", async ({ page }) => {
    await page.goto("/");

    // Check that we're redirected to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page).toHaveTitle(/Login.*WordRepeater/);
  });
});

test.describe("Authentication Flow", () => {
  test("should show validation errors on empty login form submission", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });

    // Wait for form to be hydrated (React component mounted)
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("login-email-input")).toBeVisible();
    await expect(page.getByTestId("login-password-input")).toBeVisible();

    // Try to submit empty form
    await page.getByTestId("login-submit-button").click();

    // Check for validation errors - they should appear after form submission
    const emailError = page.getByText(/email.*required/i);
    const passwordError = page.getByText(/password.*required/i);

    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });
});
