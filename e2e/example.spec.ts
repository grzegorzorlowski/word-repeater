import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load the landing page successfully", async ({ page }) => {
    await page.goto("/");

    // Check that the page loaded
    await expect(page).toHaveTitle(/Word Repeater/);
  });

  test("should have login and register buttons", async ({ page }) => {
    await page.goto("/");

    // Check for login button
    const loginButton = page.getByRole("link", { name: /login/i });
    await expect(loginButton).toBeVisible();

    // Check for register button
    const registerButton = page.getByRole("link", { name: /register/i });
    await expect(registerButton).toBeVisible();
  });
});

test.describe("Authentication Flow", () => {
  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Click login button
    await page.getByRole("link", { name: /login/i }).click();

    // Check that we're on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/");

    // Click register button
    await page.getByRole("link", { name: /register/i }).click();

    // Check that we're on register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole("heading", { name: /register/i })).toBeVisible();
  });

  test("should show validation errors on empty login form submission", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.getByRole("button", { name: /login/i }).click();

    // Check for validation errors
    await expect(page.getByText(/email.*required/i)).toBeVisible();
  });
});
