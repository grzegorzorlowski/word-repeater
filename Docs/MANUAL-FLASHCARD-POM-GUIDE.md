# Manual Flashcard Creation - Page Object Model Guide

This guide provides comprehensive documentation for the Page Object Model (POM) classes created for testing the manual flashcard creation flow.

## Overview

Three new POM classes have been created to support E2E testing of the manual flashcard creation feature:

1. **ManualFlashcardPage** - Main page for creating flashcards
2. **DashboardCTAButtons** - Dashboard navigation component
3. **ErrorToastComponent** - Error notification component (reusable across pages)

## Test Scenarios Covered

### 1. Invalid Flashcard Validation

- Empty field detection and prevention
- Character count validation (300 for question, 500 for answer)
- Submit button disabled state with invalid data
- Real-time validation feedback

### 2. Valid Flashcard Creation

- Successful flashcard submission
- Success message display
- Navigation back to dashboard
- Creating multiple flashcards
- Viewing created flashcards

### 3. Error Handling

- API error display
- Retry functionality
- Form data preservation on error
- Error dismissal

## POM Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────┐
│         DashboardCTAButtons             │
│  (Dashboard Navigation Component)       │
│  ┌─────────────────────────────────┐   │
│  │ Create Manual Flashcard Button  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                  │
                  │ navigate
                  ▼
┌─────────────────────────────────────────┐
│        ManualFlashcardPage              │
│  (Manual Flashcard Creation Form)       │
│  ┌─────────────────────────────────┐   │
│  │  Question Input                  │   │
│  │  Answer Input                    │   │
│  │  Save Button                     │   │
│  │  Cancel Button                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Success Message (conditional)   │   │
│  │  - Back to Dashboard            │   │
│  │  - View All Flashcards          │   │
│  │  - Create Another               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ErrorToastComponent (optional)  │   │
│  │  - Error Message                │   │
│  │  - Retry Button                 │   │
│  │  - Dismiss Button               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Class Details

### ManualFlashcardPage

**Purpose**: Encapsulates all interactions with the manual flashcard creation form.

**Key Features**:

- Form input handling (question and answer)
- Character count tracking
- Validation error handling
- Submit and cancel actions
- Success state management
- Error state integration

**Most Used Methods**:

```typescript
// Navigation
await flashcardPage.goto();
await flashcardPage.waitForForm();

// Form interaction
await flashcardPage.fillQuestion("What is React?");
await flashcardPage.fillAnswer("A JavaScript library");
await flashcardPage.submit();

// Or use the combined method
await flashcardPage.createFlashcard("Question", "Answer");

// Success handling
await flashcardPage.waitForSuccess();
await flashcardPage.goToDashboardAfterSuccess();

// Validation checks
expect(await flashcardPage.isSaveButtonDisabled()).toBe(true);
expect(await flashcardPage.getQuestionCharacterCount()).toContain("15/300");
```

**Public Locators** (for custom assertions):

```typescript
await expect(flashcardPage.questionInput).toBeVisible();
await expect(flashcardPage.questionInput).toBeFocused();
await expect(flashcardPage.saveButton).toBeEnabled();
await expect(flashcardPage.successMessage).toContainText("successfully");
```

### DashboardCTAButtons

**Purpose**: Encapsulates interactions with dashboard navigation buttons.

**Key Features**:

- Navigation to all main features
- Conditional pending flashcards button
- Pending count display
- URL verification after navigation

**Most Used Methods**:

```typescript
// Wait for buttons to load
await ctaButtons.waitForButtons();

// Navigate to different pages
await ctaButtons.clickCreateManualFlashcard();
await ctaButtons.clickGenerateFlashcards();
await ctaButtons.clickMyFlashcards();
await ctaButtons.clickStartLearning();

// Check pending flashcards
const hasReview = await ctaButtons.isReviewPendingButtonVisible();
if (hasReview) {
  const count = await ctaButtons.getPendingFlashcardsCount();
  console.log(`${count} flashcards pending review`);
}
```

### ErrorToastComponent

**Purpose**: Reusable component for error toast interactions across multiple pages.

**Key Features**:

- Error message extraction
- Retry functionality
- Dismiss/close action
- Visibility checks

**Most Used Methods**:

```typescript
// Check for errors
await errorToast.waitForError();
expect(await errorToast.isVisible()).toBe(true);

// Get error details
const message = await errorToast.getErrorMessage();
expect(message).toContain("Server error");

// Retry or dismiss
if (await errorToast.isRetryButtonVisible()) {
  await errorToast.retry();
} else {
  await errorToast.dismissAndWait();
}
```

## Complete Test Example

Here's a complete test demonstrating the full flow:

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, ManualFlashcardPage, DashboardCTAButtons, ErrorToastComponent } from "./page-objects";

test.describe("Manual Flashcard Creation - Complete Flow", () => {
  let loginPage: LoginPage;
  let flashcardPage: ManualFlashcardPage;
  let ctaButtons: DashboardCTAButtons;
  let errorToast: ErrorToastComponent;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize all page objects
    loginPage = new LoginPage(page);
    flashcardPage = new ManualFlashcardPage(page);
    ctaButtons = new DashboardCTAButtons(page);
    errorToast = new ErrorToastComponent(page);

    // Login
    await loginPage.goto();
    await loginPage.login("test@example.com", "password123");
    await loginPage.waitForSuccessfulLogin();
  });

  test("should prevent invalid submission and create valid flashcard", async () => {
    // Arrange: Navigate to create page
    await ctaButtons.waitForButtons();
    await ctaButtons.clickCreateManualFlashcard();
    await flashcardPage.waitForForm();

    // Assert: Save button should be disabled with empty fields
    await expect(flashcardPage.saveButton).toBeDisabled();

    // Act: Fill only question (missing answer)
    await flashcardPage.fillQuestion("What is TypeScript?");

    // Assert: Still disabled
    await expect(flashcardPage.saveButton).toBeDisabled();
    expect(await flashcardPage.getQuestionCharacterCount()).toContain("20/300");

    // Act: Fill answer
    await flashcardPage.fillAnswer("A strongly typed JavaScript superset");

    // Assert: Now enabled
    await expect(flashcardPage.saveButton).toBeEnabled();

    // Act: Submit
    await flashcardPage.submit();
    await flashcardPage.waitForSuccess();

    // Assert: Success message
    await expect(flashcardPage.successMessage).toBeVisible();
    const successText = await flashcardPage.getSuccessMessageText();
    expect(successText.toLowerCase()).toContain("success");

    // Act: Return to dashboard
    await flashcardPage.goToDashboardAfterSuccess();

    // Assert: Back on dashboard
    await ctaButtons.waitForButtons();
    await expect(ctaButtons.ctaButtonsContainer).toBeVisible();
  });

  test("should handle API errors with retry functionality", async ({ page }) => {
    // Arrange: Navigate to create page
    await flashcardPage.goto();
    await flashcardPage.waitForForm();

    // Mock API error
    await page.route("**/api/flashcards", (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    // Act: Try to create flashcard
    const question = "Test Question";
    const answer = "Test Answer";
    await flashcardPage.createFlashcard(question, answer);
    await errorToast.waitForError();

    // Assert: Error is shown
    await expect(errorToast.errorToast).toBeVisible();
    expect(await errorToast.getErrorMessage()).toContain("error");

    // Assert: Form data preserved
    expect(await flashcardPage.questionInput.inputValue()).toBe(question);
    expect(await flashcardPage.answerInput.inputValue()).toBe(answer);

    // Assert: Retry button visible
    expect(await errorToast.isRetryButtonVisible()).toBe(true);

    // Act: Dismiss error
    await errorToast.dismiss();
    await errorToast.waitForDisappear();

    // Assert: Error dismissed
    expect(await errorToast.isVisible()).toBe(false);
  });
});
```

## Testing Patterns

### Pattern 1: Arrange-Act-Assert (AAA)

```typescript
test("should show character count", async () => {
  // Arrange
  await flashcardPage.goto();
  await flashcardPage.waitForForm();

  // Act
  await flashcardPage.fillQuestion("Test");

  // Assert
  expect(await flashcardPage.getQuestionCharacterCount()).toContain("4/300");
});
```

### Pattern 2: Page Object Composition

```typescript
test("should navigate from dashboard to create flashcard", async ({ page }) => {
  // Use multiple page objects together
  await page.goto("/dashboard");
  await ctaButtons.waitForButtons();
  await ctaButtons.clickCreateManualFlashcard();

  await flashcardPage.waitForForm();
  expect(flashcardPage.isOnCreatePage()).toBe(true);
});
```

### Pattern 3: Conditional Logic

```typescript
test("should handle success or error appropriately", async () => {
  await flashcardPage.createFlashcard("Q", "A");

  // Wait for either success or error
  await flashcardPage.page.waitForFunction(() => {
    return (
      document.querySelector('[data-testid="success-message"]') || document.querySelector('[data-testid="error-toast"]')
    );
  });

  if (await flashcardPage.isSuccessMessageVisible()) {
    // Handle success case
    await flashcardPage.goToDashboardAfterSuccess();
  } else if (await errorToast.isVisible()) {
    // Handle error case
    await errorToast.retry();
  }
});
```

### Pattern 4: Custom Waits

```typescript
test("should wait for save to complete", async () => {
  await flashcardPage.createFlashcard("Question", "Answer");

  // Custom wait function
  await flashcardPage.waitForSaveComplete();

  // Now check result
  const success = await flashcardPage.isSuccessMessageVisible();
  const error = await errorToast.isVisible();
  expect(success || error).toBe(true);
});
```

## Best Practices

### 1. Use Helper Methods for Common Workflows

✅ **Good**:

```typescript
await flashcardPage.createFlashcard("Q", "A");
```

❌ **Avoid**:

```typescript
await flashcardPage.fillQuestion("Q");
await flashcardPage.fillAnswer("A");
await flashcardPage.submit();
```

### 2. Expose Locators for Flexible Assertions

✅ **Good**:

```typescript
await expect(flashcardPage.saveButton).toBeDisabled();
await expect(flashcardPage.questionInput).toHaveAttribute("maxLength", "300");
```

### 3. Handle Async Operations Properly

✅ **Good**:

```typescript
await flashcardPage.submit();
await flashcardPage.waitForSuccess(); // Explicit wait
await flashcardPage.goToDashboardAfterSuccess();
```

❌ **Avoid**:

```typescript
await flashcardPage.submit();
// Navigating immediately without waiting for success
await flashcardPage.goToDashboardAfterSuccess();
```

### 4. Use Descriptive Test Names

✅ **Good**:

```typescript
test("should prevent submission when question field is empty", async () => {
```

❌ **Avoid**:

```typescript
test("test validation", async () => {
```

### 5. Keep Tests Independent

Each test should:

- Set up its own state (use `beforeEach`)
- Not depend on other tests
- Clean up after itself if needed

## Running the Tests

```bash
# Run all manual flashcard tests
npx playwright test manual-flashcard-creation.spec.ts

# Run in headed mode (see the browser)
npx playwright test manual-flashcard-creation.spec.ts --headed

# Run specific test
npx playwright test manual-flashcard-creation.spec.ts -g "should create a valid flashcard"

# Debug mode
npx playwright test manual-flashcard-creation.spec.ts --debug

# Generate test report
npx playwright test manual-flashcard-creation.spec.ts --reporter=html
```

## Debugging Tips

### 1. Use Playwright Inspector

```bash
npx playwright test --debug
```

### 2. Add console.log in Page Objects

```typescript
async createFlashcard(question: string, answer: string) {
  console.log(`Creating flashcard: Q="${question}", A="${answer}"`);
  await this.fillFlashcard(question, answer);
  await this.submit();
}
```

### 3. Take Screenshots on Failure

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: `failure-${testInfo.title}.png` });
  }
});
```

### 4. Use Trace Viewer

```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## Maintenance

When UI changes occur:

1. **Update data-testid in components** (if selectors change)
2. **Update page object locators** (if needed)
3. **Update helper methods** (if workflows change)
4. **Tests remain unchanged** - that's the POM benefit!

## Related Files

- **Test IDs Documentation**: `e2e/TEST-IDS-MANUAL-FLASHCARD.md`
- **Page Objects README**: `e2e/page-objects/README.md`
- **Test Specification**: `e2e/manual-flashcard-creation.spec.ts`
- **Component Files**:
  - `src/components/ManualFlashcardForm.tsx`
  - `src/components/ErrorToast.tsx`
  - `src/components/DashboardCTAButtons.tsx`
