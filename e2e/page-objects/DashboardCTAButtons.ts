import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Dashboard CTA Buttons Component
 * Encapsulates interactions with dashboard navigation buttons
 * 
 * This component appears on the dashboard and provides navigation
 * to various features of the application.
 */
export class DashboardCTAButtons {
  readonly page: Page;
  
  // Container
  readonly ctaButtonsContainer: Locator;
  
  // Navigation buttons
  readonly reviewPendingFlashcardsButton: Locator;
  readonly pendingFlashcardsCount: Locator;
  readonly generateFlashcardsButton: Locator;
  readonly createManualFlashcardButton: Locator;
  readonly myFlashcardsButton: Locator;
  readonly startLearningButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    this.ctaButtonsContainer = page.getByTestId("dashboard-cta-buttons");
    this.reviewPendingFlashcardsButton = page.getByTestId("review-pending-flashcards-button");
    this.pendingFlashcardsCount = page.getByTestId("pending-flashcards-count");
    this.generateFlashcardsButton = page.getByTestId("generate-flashcards-button");
    this.createManualFlashcardButton = page.getByTestId("create-manual-flashcard-button");
    this.myFlashcardsButton = page.getByTestId("my-flashcards-button");
    this.startLearningButton = page.getByTestId("start-learning-button");
  }

  /**
   * Check if CTA buttons container is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.ctaButtonsContainer.isVisible();
  }

  /**
   * Wait for CTA buttons to be loaded
   */
  async waitForButtons() {
    await this.ctaButtonsContainer.waitFor({ state: "visible" });
  }

  /**
   * Check if review pending flashcards button is visible
   * This button only appears when there are pending AI-generated flashcards
   */
  async isReviewPendingButtonVisible(): Promise<boolean> {
    try {
      return await this.reviewPendingFlashcardsButton.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Get the count of pending flashcards
   * Returns null if the button is not visible
   */
  async getPendingFlashcardsCount(): Promise<number | null> {
    const isVisible = await this.isReviewPendingButtonVisible();
    if (!isVisible) return null;
    
    const countText = await this.pendingFlashcardsCount.textContent();
    return countText ? parseInt(countText.trim(), 10) : null;
  }

  /**
   * Click the review pending flashcards button
   */
  async clickReviewPendingFlashcards() {
    await this.reviewPendingFlashcardsButton.click();
    await this.page.waitForURL("**/accept");
  }

  /**
   * Click the generate flashcards button
   */
  async clickGenerateFlashcards() {
    await this.generateFlashcardsButton.click();
    await this.page.waitForURL("**/generate");
  }

  /**
   * Click the create manual flashcard button
   */
  async clickCreateManualFlashcard() {
    await this.createManualFlashcardButton.click();
    await this.page.waitForURL("**/flashcards/new");
  }

  /**
   * Click the my flashcards button
   */
  async clickMyFlashcards() {
    await this.myFlashcardsButton.click();
    await this.page.waitForURL("**/flashcards");
  }

  /**
   * Click the start learning button
   */
  async clickStartLearning() {
    await this.startLearningButton.click();
    await this.page.waitForURL("**/learn");
  }

  /**
   * Check if generate flashcards button is visible
   */
  async isGenerateFlashcardsButtonVisible(): Promise<boolean> {
    return await this.generateFlashcardsButton.isVisible();
  }

  /**
   * Check if create manual flashcard button is visible
   */
  async isCreateManualFlashcardButtonVisible(): Promise<boolean> {
    return await this.createManualFlashcardButton.isVisible();
  }

  /**
   * Check if my flashcards button is visible
   */
  async isMyFlashcardsButtonVisible(): Promise<boolean> {
    return await this.myFlashcardsButton.isVisible();
  }

  /**
   * Check if start learning button is visible
   */
  async isStartLearningButtonVisible(): Promise<boolean> {
    return await this.startLearningButton.isVisible();
  }
}

