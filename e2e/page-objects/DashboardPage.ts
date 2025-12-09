import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Dashboard Page
 * Encapsulates all interactions with the dashboard
 */
export class DashboardPage {
  // Page elements using data-testid selectors
  readonly page: Page;
  readonly dashboardPageContainer: Locator;
  readonly dashboardTitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardPageContainer = page.getByTestId("dashboard-page");
    this.dashboardTitle = page.getByTestId("dashboard-title");
  }

  /**
   * Navigate to the dashboard page
   */
  async goto() {
    await this.page.goto("/dashboard");
  }

  /**
   * Check if the dashboard page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return await this.dashboardPageContainer.isVisible();
  }

  /**
   * Wait for the dashboard to be fully loaded
   */
  async waitForDashboard() {
    await this.dashboardPageContainer.waitFor({ state: "visible" });
    await this.dashboardTitle.waitFor({ state: "visible" });
  }

  /**
   * Get the dashboard title text
   */
  async getDashboardTitle(): Promise<string> {
    return (await this.dashboardTitle.textContent()) || "";
  }

  /**
   * Check if user is on the dashboard (URL-based check)
   */
  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes("/dashboard");
  }
}
