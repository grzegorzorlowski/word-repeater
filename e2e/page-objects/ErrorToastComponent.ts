import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the ErrorToast Component
 * Encapsulates all interactions with error toast notifications
 * 
 * This component can appear on multiple pages, so it's designed
 * to be composed into page objects rather than used standalone.
 */
export class ErrorToastComponent {
  readonly page: Page;
  
  // Main container
  readonly errorToast: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;
  readonly dismissButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.errorToast = page.getByTestId("error-toast");
    this.errorMessage = page.getByTestId("error-message");
    this.retryButton = page.getByTestId("error-retry-button");
    this.dismissButton = page.getByTestId("error-dismiss-button");
  }

  /**
   * Check if error toast is visible
   */
  async isVisible(): Promise<boolean> {
    try {
      return await this.errorToast.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for error toast to appear
   * @param timeout Timeout in milliseconds (default: 10000)
   */
  async waitForError(timeout = 10000) {
    await this.errorToast.waitFor({ state: "visible", timeout });
  }

  /**
   * Get the error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Check if the error message contains specific text
   * @param text Text to check for
   */
  async hasErrorMessage(text: string): Promise<boolean> {
    const message = await this.getErrorMessage();
    return message.includes(text);
  }

  /**
   * Check if retry button is visible
   */
  async isRetryButtonVisible(): Promise<boolean> {
    try {
      return await this.retryButton.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Click the retry button
   */
  async retry() {
    await this.retryButton.waitFor({ state: "visible" });
    await this.retryButton.click();
  }

  /**
   * Click the dismiss button to close the error toast
   */
  async dismiss() {
    await this.dismissButton.waitFor({ state: "visible" });
    await this.dismissButton.click();
  }

  /**
   * Wait for error toast to disappear
   * @param timeout Timeout in milliseconds (default: 5000)
   */
  async waitForDisappear(timeout = 5000) {
    await this.errorToast.waitFor({ state: "hidden", timeout });
  }

  /**
   * Dismiss and wait for the error toast to disappear
   */
  async dismissAndWait() {
    await this.dismiss();
    await this.waitForDisappear();
  }
}

