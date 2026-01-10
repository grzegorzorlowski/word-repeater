# Page Object Model (POM) Classes

This directory contains Page Object Model classes that encapsulate interactions with different pages of the application.

## Overview

The Page Object Model (POM) pattern provides a layer of abstraction between tests and the actual page elements, making tests more maintainable and resilient to UI changes.

## Structure

```
page-objects/
├── LoginPage.ts                # Login page interactions
├── DashboardPage.ts            # Dashboard page interactions
├── ManualFlashcardPage.ts      # Manual flashcard creation page
├── DashboardCTAButtons.ts      # Dashboard navigation buttons component
├── ErrorToastComponent.ts      # Error toast notification component
├── index.ts                    # Central export point
└── README.md                   # This file
```

## Available Page Objects

### LoginPage

Encapsulates all interactions with the login form.

**Location Elements:**

- `loginPageContainer` - Main login page container
- `loginPageTitle` - "Welcome Back" heading
- `loginForm` - Form element
- `emailInput` - Email input field
- `passwordInput` - Password input field
- `submitButton` - Submit button
- `errorMessage` - Error message display
- `forgotPasswordLink` - Forgot password link
- `registerLink` - Register/Sign up link

**Key Methods:**

- `goto(redirectTo?: string)` - Navigate to login page
- `login(email, password)` - Complete login flow
- `fillEmail(email)` - Fill email field
- `fillPassword(password)` - Fill password field
- `submit()` - Submit the form
- `waitForSuccessfulLogin(expectedUrl)` - Wait for redirect after login
- `isErrorMessageVisible()` - Check if error is displayed
- `getErrorMessageText()` - Get error message text
- `isSubmitButtonDisabled()` - Check button disabled state

**Example Usage:**

```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login("user@example.com", "password123");
await loginPage.waitForSuccessfulLogin("/dashboard");
```

### DashboardPage

Encapsulates all interactions with the dashboard page.

**Location Elements:**

- `dashboardPageContainer` - Main dashboard container
- `dashboardTitle` - Dashboard heading ("Dashboard")

**Key Methods:**

- `goto()` - Navigate to dashboard
- `waitForDashboard()` - Wait for dashboard to load
- `isLoaded()` - Check if dashboard is visible
- `getDashboardTitle()` - Get dashboard title text
- `isOnDashboard()` - Check if URL is dashboard

**Example Usage:**

```typescript
const dashboardPage = new DashboardPage(page);
await dashboardPage.waitForDashboard();
expect(await dashboardPage.getDashboardTitle()).toBe("Dashboard");
```

### ManualFlashcardPage

Encapsulates all interactions with the manual flashcard creation form.

**Location Elements:**

- `formContainer` - Main form container
- `formTitle` - Page title "Create Flashcard"
- `backToDashboardLink` - Back to dashboard link
- `questionInput` - Question textarea input
- `questionCharacterCount` - Question character counter
- `questionError` - Question validation error message
- `answerInput` - Answer textarea input
- `answerCharacterCount` - Answer character counter
- `answerError` - Answer validation error message
- `saveButton` - Save/Submit button
- `cancelButton` - Cancel button
- `savingIndicator` - Loading indicator during save
- `successMessage` - Success message container
- `successTitle` - Success message text
- `successBackToDashboardButton` - Navigate to dashboard after success
- `successViewAllFlashcardsButton` - Navigate to flashcards list after success
- `successCreateAnotherButton` - Create another flashcard button
- `errorToast` - Error toast notification

**Key Methods:**

- `goto()` - Navigate to manual flashcard creation page
- `waitForForm()` - Wait for form to be loaded
- `fillQuestion(question)` - Fill question field
- `fillAnswer(answer)` - Fill answer field
- `clearQuestion()` - Clear question field
- `clearAnswer()` - Clear answer field
- `fillFlashcard(question, answer)` - Fill both fields
- `createFlashcard(question, answer)` - Fill and submit form
- `submit()` - Click save button
- `cancel()` - Click cancel button
- `clickBackToDashboard()` - Navigate back using link
- `getQuestionCharacterCount()` - Get question character count text
- `getAnswerCharacterCount()` - Get answer character count text
- `isQuestionErrorVisible()` - Check if question error is visible
- `isAnswerErrorVisible()` - Check if answer error is visible
- `getQuestionErrorText()` - Get question error message
- `getAnswerErrorText()` - Get answer error message
- `isSaveButtonEnabled()` - Check if save button is enabled
- `isSaveButtonDisabled()` - Check if save button is disabled
- `isSaving()` - Check if form is in saving state
- `waitForSaveComplete()` - Wait for save operation to finish
- `isSuccessMessageVisible()` - Check if success message is visible
- `getSuccessMessageText()` - Get success message text
- `waitForSuccess()` - Wait for success message to appear
- `goToDashboardAfterSuccess()` - Navigate to dashboard after success
- `viewAllFlashcardsAfterSuccess()` - Navigate to flashcards list
- `createAnotherFlashcard()` - Reload page to create another
- `isErrorVisible()` - Check if error toast is visible
- `waitForError()` - Wait for error toast to appear
- `getFormTitle()` - Get form title text
- `isOnCreatePage()` - Check if on create flashcard page

**Example Usage:**

```typescript
const flashcardPage = new ManualFlashcardPage(page);
await flashcardPage.goto();
await flashcardPage.waitForForm();

// Create a flashcard
await flashcardPage.createFlashcard("What is TypeScript?", "TypeScript is a strongly typed programming language.");

// Wait for success
await flashcardPage.waitForSuccess();
await expect(flashcardPage.successMessage).toBeVisible();

// Navigate back to dashboard
await flashcardPage.goToDashboardAfterSuccess();
```

### DashboardCTAButtons

Encapsulates interactions with dashboard navigation buttons component.

**Location Elements:**

- `ctaButtonsContainer` - Main CTA buttons container
- `reviewPendingFlashcardsButton` - Review pending AI flashcards button (conditional)
- `pendingFlashcardsCount` - Badge showing pending count
- `generateFlashcardsButton` - Navigate to generation page
- `createManualFlashcardButton` - Navigate to manual creation
- `myFlashcardsButton` - Navigate to flashcards list
- `startLearningButton` - Start learning session

**Key Methods:**

- `isVisible()` - Check if buttons are visible
- `waitForButtons()` - Wait for buttons to load
- `isReviewPendingButtonVisible()` - Check if review pending button visible
- `getPendingFlashcardsCount()` - Get count of pending flashcards
- `clickReviewPendingFlashcards()` - Navigate to accept page
- `clickGenerateFlashcards()` - Navigate to generate page
- `clickCreateManualFlashcard()` - Navigate to create page
- `clickMyFlashcards()` - Navigate to flashcards list
- `clickStartLearning()` - Navigate to learning page
- Various `is[Button]Visible()` methods for each button

**Example Usage:**

```typescript
const ctaButtons = new DashboardCTAButtons(page);
await ctaButtons.waitForButtons();

// Navigate to manual flashcard creation
await ctaButtons.clickCreateManualFlashcard();

// Check if there are pending flashcards
const pendingCount = await ctaButtons.getPendingFlashcardsCount();
if (pendingCount && pendingCount > 0) {
  await ctaButtons.clickReviewPendingFlashcards();
}
```

### ErrorToastComponent

Encapsulates interactions with error toast notifications (component that can appear on multiple pages).

**Location Elements:**

- `errorToast` - Main error toast container
- `errorMessage` - Error message text
- `retryButton` - Retry button
- `dismissButton` - Dismiss/close button

**Key Methods:**

- `isVisible()` - Check if error toast is visible
- `waitForError(timeout?)` - Wait for error to appear
- `getErrorMessage()` - Get error message text
- `hasErrorMessage(text)` - Check if error contains text
- `isRetryButtonVisible()` - Check if retry button is visible
- `retry()` - Click retry button
- `dismiss()` - Click dismiss button
- `waitForDisappear(timeout?)` - Wait for toast to disappear
- `dismissAndWait()` - Dismiss and wait for disappearance

**Example Usage:**

```typescript
const errorToast = new ErrorToastComponent(page);

// Wait for error and check message
await errorToast.waitForError();
expect(await errorToast.getErrorMessage()).toContain("Server error");

// Retry the operation
if (await errorToast.isRetryButtonVisible()) {
  await errorToast.retry();
}

// Or dismiss the error
await errorToast.dismissAndWait();
expect(await errorToast.isVisible()).toBe(false);
```

## Design Principles

### 1. Use data-testid Selectors

All locators use `data-testid` attributes for resilient, test-oriented selectors:

```typescript
readonly emailInput: Locator;

constructor(page: Page) {
  this.emailInput = page.getByTestId("login-email-input");
}
```

### 2. Expose Locators as Public Properties

Locators are exposed as public readonly properties, allowing flexible assertions in tests:

```typescript
await expect(loginPage.emailInput).toBeVisible();
await expect(loginPage.emailInput).toHaveAttribute("type", "email");
```

### 3. Provide Helper Methods

Common workflows are encapsulated in helper methods:

```typescript
// Instead of:
await loginPage.fillEmail(email);
await loginPage.fillPassword(password);
await loginPage.submit();

// Use:
await loginPage.login(email, password);
```

### 4. Return Meaningful Values

Helper methods return useful values for assertions:

```typescript
const isVisible = await loginPage.isErrorMessageVisible(); // boolean
const errorText = await loginPage.getErrorMessageText(); // string
```

### 5. Follow Arrange-Act-Assert Pattern

Methods are designed to support the AAA testing pattern:

```typescript
test("should login successfully", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Act
  await loginPage.login("user@example.com", "pass123");

  // Assert
  await expect(page).toHaveURL("/dashboard");
});
```

## Creating New Page Objects

When creating a new page object:

1. **Create the class file** in this directory
2. **Import required types** from Playwright
3. **Define locators** using `data-testid` selectors
4. **Add helper methods** for common interactions
5. **Export the class** from `index.ts`
6. **Document the class** in this README

**Template:**

```typescript
import type { Page, Locator } from "@playwright/test";

export class NewPage {
  readonly page: Page;
  readonly mainContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainContainer = page.getByTestId("new-page");
  }

  async goto() {
    await this.page.goto("/new-page");
  }

  async isLoaded(): Promise<boolean> {
    return await this.mainContainer.isVisible();
  }
}
```

## Testing Guidelines

### Import Page Objects

```typescript
import {
  LoginPage,
  DashboardPage,
  ManualFlashcardPage,
  DashboardCTAButtons,
  ErrorToastComponent,
} from "./page-objects";
```

### Initialize in beforeEach

```typescript
let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
});
```

### Use Descriptive Test Names

```typescript
test("should display error message with invalid credentials", async () => {
  // Test implementation
});
```

### Follow AAA Pattern

```typescript
test("should login successfully", async () => {
  // Arrange: Set up test state
  await loginPage.goto();

  // Act: Perform the action
  await loginPage.login(email, password);

  // Assert: Verify the outcome
  await expect(dashboardPage.dashboardTitle).toBeVisible();
});
```

## Maintenance

When UI changes occur:

1. **Update data-testid attributes** in the component files
2. **Update corresponding locators** in page object classes
3. **Run tests** to verify everything still works
4. **No need to update test files** - that's the beauty of POM!

## Additional Resources

- [Playwright Page Object Model Guide](https://playwright.dev/docs/pom)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors Best Practices](https://playwright.dev/docs/selectors)
