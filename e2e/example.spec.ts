import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should redirect unauthenticated users from landing page to login", async ({ page }) => {
    await page.goto("/");

    // Check that we're redirected to login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page).toHaveTitle(/Login.*WordRepeater/);
  });

  test("login page should have register link", async ({ page }) => {
    await page.goto("/login");

    // Check for register link
    const registerLink = page.getByTestId("register-link");
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveText(/sign up/i);
  });
});

test.describe("Authentication Flow", () => {
  test("should navigate from login to register page", async ({ page }) => {
    await page.goto("/login");

    // Wait for page to load
    await expect(page.getByTestId("login-page")).toBeVisible();

    // Click register link
    await page.getByTestId("register-link").click();

    // Check that we're on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
  });

  test("should navigate from register to login page", async ({ page }) => {
    await page.goto("/register");

    // Wait for page to load
    await expect(page.getByTestId("register-page")).toBeVisible();

    // Click login link
    await page.getByTestId("login-link").click();

    // Check that we're on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

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
