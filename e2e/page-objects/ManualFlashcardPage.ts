import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for the Manual Flashcard Creation Page
 * Encapsulates all interactions with the manual flashcard form
 * 
 * Test scenarios:
 * 1. Invalid flashcard validation (empty fields, validation errors)
 * 2. Valid flashcard creation and navigation back to dashboard
 */
export class ManualFlashcardPage {
  readonly page: Page;
  
  // Container
  readonly formContainer: Locator;
  readonly formTitle: Locator;
  readonly backToDashboardLink: Locator;
  
  // Question field
  readonly questionInput: Locator;
  readonly questionCharacterCount: Locator;
  readonly questionError: Locator;
  
  // Answer field
  readonly answerInput: Locator;
  readonly answerCharacterCount: Locator;
  readonly answerError: Locator;
  
  // Actions
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly savingIndicator: Locator;
  
  // Success state
  readonly successMessage: Locator;
  readonly successTitle: Locator;
  readonly successBackToDashboardButton: Locator;
  readonly successViewAllFlashcardsButton: Locator;
  readonly successCreateAnotherButton: Locator;
  
  // Error state
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Container
    this.formContainer = page.getByTestId("manual-flashcard-form-container");
    this.formTitle = page.getByTestId("form-title");
    this.backToDashboardLink = page.getByTestId("back-to-dashboard-link");
    
    // Question field
    this.questionInput = page.getByTestId("question-input");
    this.questionCharacterCount = page.getByTestId("question-character-count");
    this.questionError = page.getByTestId("question-error");
    
    // Answer field
    this.answerInput = page.getByTestId("answer-input");
    this.answerCharacterCount = page.getByTestId("answer-character-count");
    this.answerError = page.getByTestId("answer-error");
    
    // Actions
    this.saveButton = page.getByTestId("save-flashcard-button");
    this.cancelButton = page.getByTestId("cancel-button");
    this.savingIndicator = page.getByTestId("saving-indicator");
    
    // Success state
    this.successMessage = page.getByTestId("success-message");
    this.successTitle = page.getByTestId("success-title");
    this.successBackToDashboardButton = page.getByTestId("success-back-to-dashboard-button");
    this.successViewAllFlashcardsButton = page.getByTestId("success-view-all-flashcards-button");
    this.successCreateAnotherButton = page.getByTestId("success-create-another-button");
    
    // Error state
    this.errorToast = page.getByTestId("error-toast");
  }

  /**
   * Navigate to the manual flashcard creation page
   */
  async goto() {
    await this.page.goto("/flashcards/new", { waitUntil: "networkidle" });
  }

  /**
   * Check if the page is loaded
   */
  async isLoaded(): Promise<boolean> {
    return await this.formContainer.isVisible();
  }

  /**
   * Wait for the form to be fully loaded and interactive
   */
  async waitForForm() {
    await this.formContainer.waitFor({ state: "visible" });
    await this.formTitle.waitFor({ state: "visible" });
    await this.questionInput.waitFor({ state: "visible" });
    await this.answerInput.waitFor({ state: "visible" });
  }

  /**
   * Fill the question input field
   * @param question Question text
   */
  async fillQuestion(question: string) {
    await this.questionInput.waitFor({ state: "visible" });
    await this.questionInput.click();
    await this.questionInput.fill(question);
  }

  /**
   * Fill the answer input field
   * @param answer Answer text
   */
  async fillAnswer(answer: string) {
    await this.answerInput.waitFor({ state: "visible" });
    await this.answerInput.click();
    await this.answerInput.fill(answer);
  }

  /**
   * Clear the question input field
   */
  async clearQuestion() {
    await this.questionInput.clear();
  }

  /**
   * Clear the answer input field
   */
  async clearAnswer() {
    await this.answerInput.clear();
  }

  /**
   * Fill both question and answer fields
   * @param question Question text
   * @param answer Answer text
   */
  async fillFlashcard(question: string, answer: string) {
    await this.fillQuestion(question);
    await this.fillAnswer(answer);
  }

  /**
   * Submit the flashcard form
   */
  async submit() {
    await this.saveButton.click();
  }

  /**
   * Complete flow: fill and submit flashcard
   * @param question Question text
   * @param answer Answer text
   */
  async createFlashcard(question: string, answer: string) {
    await this.fillFlashcard(question, answer);
    await this.submit();
  }

  /**
   * Click the cancel button
   */
  async cancel() {
    await this.cancelButton.click();
  }

  /**
   * Click back to dashboard link
   */
  async clickBackToDashboard() {
    await this.backToDashboardLink.click();
  }

  /**
   * Get the current question character count text
   */
  async getQuestionCharacterCount(): Promise<string> {
    return (await this.questionCharacterCount.textContent()) || "";
  }

  /**
   * Get the current answer character count text
   */
  async getAnswerCharacterCount(): Promise<string> {
    return (await this.answerCharacterCount.textContent()) || "";
  }

  /**
   * Check if question validation error is visible
   */
  async isQuestionErrorVisible(): Promise<boolean> {
    try {
      return await this.questionError.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if answer validation error is visible
   */
  async isAnswerErrorVisible(): Promise<boolean> {
    try {
      return await this.answerError.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Get the question validation error text
   */
  async getQuestionErrorText(): Promise<string> {
    return (await this.questionError.textContent()) || "";
  }

  /**
   * Get the answer validation error text
   */
  async getAnswerErrorText(): Promise<string> {
    return (await this.answerError.textContent()) || "";
  }

  /**
   * Check if the save button is enabled
   */
  async isSaveButtonEnabled(): Promise<boolean> {
    return await this.saveButton.isEnabled();
  }

  /**
   * Check if the save button is disabled
   */
  async isSaveButtonDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Check if the form is in saving state
   */
  async isSaving(): Promise<boolean> {
    try {
      return await this.savingIndicator.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for the saving operation to complete
   */
  async waitForSaveComplete() {
    // Wait for saving indicator to appear (if form submits quickly)
    try {
      await this.savingIndicator.waitFor({ state: "visible", timeout: 2000 });
    } catch {
      // Saving might complete too quickly, continue
    }
    
    // Wait for saving indicator to disappear or success/error to appear
    await this.page.waitForFunction(
      () => {
        const saving = document.querySelector('[data-testid="saving-indicator"]');
        const success = document.querySelector('[data-testid="success-message"]');
        const error = document.querySelector('[data-testid="error-toast"]');
        return !saving || success || error;
      },
      { timeout: 10000 }
    );
  }

  /**
   * Check if success message is visible
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    try {
      return await this.successMessage.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Get the success message text
   */
  async getSuccessMessageText(): Promise<string> {
    return (await this.successTitle.textContent()) || "";
  }

  /**
   * Wait for success message to appear
   */
  async waitForSuccess() {
    await this.successMessage.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Navigate to dashboard after successful creation
   */
  async goToDashboardAfterSuccess() {
    await this.successBackToDashboardButton.click();
  }

  /**
   * Navigate to flashcards list after successful creation
   */
  async viewAllFlashcardsAfterSuccess() {
    await this.successViewAllFlashcardsButton.click();
  }

  /**
   * Create another flashcard after successful creation
   */
  async createAnotherFlashcard() {
    await this.successCreateAnotherButton.click();
  }

  /**
   * Check if error toast is visible
   */
  async isErrorVisible(): Promise<boolean> {
    try {
      return await this.errorToast.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Wait for error toast to appear
   */
  async waitForError() {
    await this.errorToast.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Get the form title text
   */
  async getFormTitle(): Promise<string> {
    return (await this.formTitle.textContent()) || "";
  }

  /**
   * Check if the page URL matches the expected route
   */
  isOnCreatePage(): boolean {
    return this.page.url().includes("/flashcards/new");
  }
}

