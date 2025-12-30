import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Tests", () => {
  test("should not have any automatically detectable accessibility issues on landing page", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have accessibility issues on login page", async ({ page }) => {
    await page.goto("/login");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have accessibility issues on register page", async ({ page }) => {
    await page.goto("/register");

    // Wait for page to be fully loaded and stable
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have proper focus management", async ({ page }) => {
    await page.goto("/login");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);

    // Should focus on an interactive element
    expect(["INPUT", "BUTTON", "A"]).toContain(firstFocusedElement);
  });
});
