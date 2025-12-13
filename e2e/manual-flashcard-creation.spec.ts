import { test, expect } from "@playwright/test";
import { ManualFlashcardPage, DashboardCTAButtons, ErrorToastComponent } from "./page-objects";
import path from "path";
import { fileURLToPath } from "url";

/**
 * E2E Tests for Manual Flashcard Creation Flow
 *
 * Test Scenarios:
 * 1. Invalid flashcard submission (validation)
 * 2. Valid flashcard creation and return to dashboard
 * 3. Error handling and retry functionality
 *
 * Authentication:
 * These tests use a pre-authenticated state from auth.setup.ts
 * Run setup with: npx playwright test auth.setup
 */

// Use authenticated state for all tests
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, ".auth/user.json");

test.describe("Manual Flashcard Creation", () => {
  let manualFlashcardPage: ManualFlashcardPage;
  let dashboardCTAButtons: DashboardCTAButtons;
  let errorToast: ErrorToastComponent;

  // Use the authenticated state
  test.use({ storageState: authFile });

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    manualFlashcardPage = new ManualFlashcardPage(page);
    dashboardCTAButtons = new DashboardCTAButtons(page);
    errorToast = new ErrorToastComponent(page);

    // No need to login - we're using authenticated state
    // Just navigate to the dashboard to verify we're logged in
    await page.goto("/dashboard");
    await dashboardCTAButtons.waitForButtons();
  });

  test.describe("Validation and Invalid Submissions", () => {
    test("should prevent submission with empty fields", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Assert - save button should be disabled with empty fields
      await expect(manualFlashcardPage.saveButton).toBeDisabled();
    });

    test("should prevent submission with only question filled", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act
      await manualFlashcardPage.fillQuestion("What is React?");

      // Assert
      await expect(manualFlashcardPage.saveButton).toBeDisabled();
      const count = await manualFlashcardPage.getQuestionCharacterCount();
      expect(count).toMatch(/14\/300/); // "What is React?" = 14 characters
    });

    test("should prevent submission with only answer filled", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act
      await manualFlashcardPage.fillAnswer("A JavaScript library");

      // Assert
      await expect(manualFlashcardPage.saveButton).toBeDisabled();
      const count = await manualFlashcardPage.getAnswerCharacterCount();
      expect(count).toMatch(/20\/500/); // "A JavaScript library" = 20 characters
    });

    test("should show validation error when trying to submit empty question", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act - fill answer only
      await manualFlashcardPage.fillAnswer("Test answer");

      // Try to enable button by filling question then clearing it
      await manualFlashcardPage.fillQuestion("Test");
      await manualFlashcardPage.clearQuestion();

      // Assert
      await expect(manualFlashcardPage.saveButton).toBeDisabled();
    });

    test("should update character count as user types", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act & Assert - question
      await manualFlashcardPage.fillQuestion("Test");
      let count = await manualFlashcardPage.getQuestionCharacterCount();
      expect(count).toMatch(/4\/300/); // "Test" = 4 characters

      await manualFlashcardPage.fillQuestion("Test question");
      count = await manualFlashcardPage.getQuestionCharacterCount();
      expect(count).toMatch(/13\/300/); // "Test question" = 13 characters

      // Act & Assert - answer
      await manualFlashcardPage.fillAnswer("Test");
      count = await manualFlashcardPage.getAnswerCharacterCount();
      expect(count).toMatch(/4\/500/); // "Test" = 4 characters

      await manualFlashcardPage.fillAnswer("Test answer with more details");
      count = await manualFlashcardPage.getAnswerCharacterCount();
      expect(count).toMatch(/29\/500/); // "Test answer with more details" = 29 characters
    });

    test("should enforce maximum character limits", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      const longQuestion = "a".repeat(350); // Exceeds 300 limit
      const longAnswer = "b".repeat(550); // Exceeds 500 limit

      // Act
      await manualFlashcardPage.fillQuestion(longQuestion);
      await manualFlashcardPage.fillAnswer(longAnswer);

      // Assert - inputs should enforce maxLength attribute
      const questionValue = await manualFlashcardPage.questionInput.inputValue();
      const answerValue = await manualFlashcardPage.answerInput.inputValue();

      expect(questionValue.length).toBeLessThanOrEqual(300);
      expect(answerValue.length).toBeLessThanOrEqual(500);
    });
  });

  test.describe("Valid Flashcard Creation", () => {
    test("should create a valid flashcard and show success message", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      const question = "What is TypeScript?";
      const answer = "TypeScript is a strongly typed programming language that builds on JavaScript.";

      // Act
      await manualFlashcardPage.fillQuestion(question);
      await manualFlashcardPage.fillAnswer(answer);

      // Assert button is enabled
      await expect(manualFlashcardPage.saveButton).toBeEnabled();

      // Submit
      await manualFlashcardPage.submit();
      await manualFlashcardPage.waitForSuccess();

      // Assert success message
      await expect(manualFlashcardPage.successMessage).toBeVisible();
      const successText = await manualFlashcardPage.getSuccessMessageText();
      expect(successText.toLowerCase()).toContain("success");
    });

    test("should navigate back to dashboard after successful creation", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act - create flashcard
      await manualFlashcardPage.createFlashcard(
        "What is Playwright?",
        "Playwright is an end-to-end testing framework for modern web applications."
      );
      await manualFlashcardPage.waitForSuccess();

      // Navigate to dashboard
      await manualFlashcardPage.goToDashboardAfterSuccess();

      // Assert - verify we're on dashboard
      await expect(dashboardCTAButtons.ctaButtonsContainer).toBeVisible();
      await expect(dashboardCTAButtons.createManualFlashcardButton).toBeVisible();
    });

    test("should allow creating another flashcard after success", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act - create first flashcard
      await manualFlashcardPage.createFlashcard("Question 1", "Answer 1");
      await manualFlashcardPage.waitForSuccess();

      // Click create another
      await manualFlashcardPage.createAnotherFlashcard();

      // Wait for page reload
      await manualFlashcardPage.page.waitForLoadState("networkidle");

      // Assert - form should be empty and ready
      await manualFlashcardPage.waitForForm();
      expect(await manualFlashcardPage.questionInput.inputValue()).toBe("");
      expect(await manualFlashcardPage.answerInput.inputValue()).toBe("");
      await expect(manualFlashcardPage.saveButton).toBeDisabled();
    });

    test("should navigate to flashcards list after successful creation", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act - create flashcard
      await manualFlashcardPage.createFlashcard("What is REST?", "REST stands for Representational State Transfer.");
      await manualFlashcardPage.waitForSuccess();

      // Navigate to flashcards list
      await manualFlashcardPage.viewAllFlashcardsAfterSuccess();

      // Assert - verify we're on flashcards list page
      await manualFlashcardPage.page.waitForURL("**/flashcards");
      expect(manualFlashcardPage.page.url()).toContain("/flashcards");
    });
  });

  test.describe("Navigation and Cancellation", () => {
    test("should navigate back to dashboard using back link", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Act
      await manualFlashcardPage.clickBackToDashboard();

      // Assert
      await manualFlashcardPage.page.waitForURL("**/dashboard");
      await expect(dashboardCTAButtons.ctaButtonsContainer).toBeVisible();
    });

    test("should navigate back to dashboard using cancel button", async () => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Fill some data
      await manualFlashcardPage.fillQuestion("Test question");

      // Act
      await manualFlashcardPage.cancel();

      // Assert
      await manualFlashcardPage.page.waitForURL("**/dashboard");
      await expect(dashboardCTAButtons.ctaButtonsContainer).toBeVisible();
    });
  });

  test.describe("Error Handling", () => {
    test("should show error toast on API failure", async ({ page }) => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Mock API failure
      await page.route("**/api/flashcards", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error. Please try again later." }),
        });
      });

      // Act
      await manualFlashcardPage.createFlashcard("Test Question", "Test Answer");
      await errorToast.waitForError();

      // Assert
      await expect(errorToast.errorToast).toBeVisible();
      const errorMessage = await errorToast.getErrorMessage();
      expect(errorMessage.toLowerCase()).toContain("error");
    });

    test("should show retry button and preserve form data on error", async ({ page }) => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      const question = "What is GraphQL?";
      const answer = "GraphQL is a query language for APIs.";

      // Mock API failure
      await page.route("**/api/flashcards", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Network error" }),
        });
      });

      // Act
      await manualFlashcardPage.createFlashcard(question, answer);
      await errorToast.waitForError();

      // Assert - form data should be preserved
      expect(await manualFlashcardPage.questionInput.inputValue()).toBe(question);
      expect(await manualFlashcardPage.answerInput.inputValue()).toBe(answer);

      // Assert - retry button should be visible
      expect(await errorToast.isRetryButtonVisible()).toBe(true);
    });

    test("should dismiss error toast", async ({ page }) => {
      // Arrange
      await manualFlashcardPage.goto();
      await manualFlashcardPage.waitForForm();

      // Mock API failure
      await page.route("**/api/flashcards", (route) => {
        route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Validation failed" }),
        });
      });

      // Act
      await manualFlashcardPage.createFlashcard("Test", "Test");
      await errorToast.waitForError();

      // Dismiss error
      await errorToast.dismiss();
      await errorToast.waitForDisappear();

      // Assert
      expect(await errorToast.isVisible()).toBe(false);
    });
  });

  test.describe("Dashboard Navigation to Create Flashcard", () => {
    test("should navigate from dashboard to create manual flashcard page", async ({ page }) => {
      // Arrange - start at dashboard
      await page.goto("/dashboard");
      await dashboardCTAButtons.waitForButtons();

      // Act
      await dashboardCTAButtons.clickCreateManualFlashcard();

      // Assert
      await manualFlashcardPage.waitForForm();
      await expect(manualFlashcardPage.formContainer).toBeVisible();
      expect(await manualFlashcardPage.getFormTitle()).toContain("Create Flashcard");
      expect(manualFlashcardPage.isOnCreatePage()).toBe(true);
    });
  });
});
