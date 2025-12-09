import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Login Page
 * Encapsulates all interactions with the login form
 */
export class LoginPage {
  // Page elements using data-testid selectors
  readonly page: Page;
  readonly loginPageContainer: Locator;
  readonly loginPageTitle: Locator;
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginPageContainer = page.getByTestId("login-page");
    this.loginPageTitle = page.getByTestId("login-page-title");
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-error-message");
    this.forgotPasswordLink = page.getByTestId("forgot-password-link");
    this.registerLink = page.getByTestId("register-link");
  }

  /**
   * Navigate to the login page
   * @param redirectTo Optional redirect URL parameter
   */
  async goto(redirectTo?: string) {
    const url = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  /**
   * Fill the email input field
   * @param email Email address
   */
  async fillEmail(email: string) {
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.click(); // Ensure input is focused
    await this.emailInput.fill(email);
  }

  /**
   * Fill the password input field
   * @param password Password
   */
  async fillPassword(password: string) {
    await this.passwordInput.waitFor({ state: "visible" });
    await this.passwordInput.click(); // Ensure input is focused
    await this.passwordInput.fill(password);
  }

  /**
   * Submit the login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow with email and password
   * Ensures form is fully hydrated before interaction
   * @param email Email address
   * @param password Password
   */
  async login(email: string, password: string) {
    // Wait for form to be hydrated and inputs to be enabled
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Wait for the login form to be visible
   */
  async waitForLoginForm() {
    await this.loginForm.waitFor({ state: "visible" });
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text
   */
  async getErrorMessageText(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Click on the forgot password link
   */
  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  /**
   * Click on the register link
   */
  async clickRegister() {
    await this.registerLink.click();
  }

  /**
   * Check if the login page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return await this.loginPageContainer.isVisible();
  }

  /**
   * Wait for navigation after successful login
   * @param expectedUrl Expected URL after redirect (default: /dashboard)
   */
  async waitForSuccessfulLogin(expectedUrl = "/dashboard") {
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }
}
