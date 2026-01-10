# Test IDs for Manual Flashcard Creation Flow

This document lists all `data-testid` attributes added for E2E testing of the manual flashcard creation and validation scenario.

## Test Scenario Coverage

### Scenario 1: Add Invalid Flashcard

- Try to submit with empty fields
- Verify validation errors appear
- Check that submit button is disabled

### Scenario 2: Add Valid Flashcard and Return to Dashboard

- Fill in valid question and answer
- Submit the form
- Verify success message
- Navigate back to dashboard
- Verify flashcard was created

---

## Component: ManualFlashcardForm

**Location**: `src/components/ManualFlashcardForm.tsx`

### Container & Layout

| Test ID                           | Element | Description                        |
| --------------------------------- | ------- | ---------------------------------- |
| `manual-flashcard-form-container` | `div`   | Main container for the entire form |
| `form-title`                      | `h1`    | Page title "Create Flashcard"      |
| `back-to-dashboard-link`          | `a`     | Link to return to dashboard        |

### Question Field

| Test ID                    | Element    | Description                                 |
| -------------------------- | ---------- | ------------------------------------------- |
| `question-input`           | `textarea` | Input field for flashcard question          |
| `question-character-count` | `span`     | Character counter display (e.g., "0/300")   |
| `question-error`           | `p`        | Validation error message for question field |

### Answer Field

| Test ID                  | Element    | Description                               |
| ------------------------ | ---------- | ----------------------------------------- |
| `answer-input`           | `textarea` | Input field for flashcard answer          |
| `answer-character-count` | `span`     | Character counter display (e.g., "0/500") |
| `answer-error`           | `p`        | Validation error message for answer field |

### Actions

| Test ID                 | Element  | Description                            |
| ----------------------- | -------- | -------------------------------------- |
| `save-flashcard-button` | `Button` | Submit button to save the flashcard    |
| `cancel-button`         | `Button` | Cancel button (navigates to dashboard) |
| `saving-indicator`      | `span`   | Text shown during save operation       |

### Success State

| Test ID                              | Element  | Description                               |
| ------------------------------------ | -------- | ----------------------------------------- |
| `success-message`                    | `div`    | Success message container                 |
| `success-title`                      | `p`      | Success message text                      |
| `success-back-to-dashboard-button`   | `Button` | Navigate to dashboard after success       |
| `success-view-all-flashcards-button` | `Button` | Navigate to flashcards list after success |
| `success-create-another-button`      | `Button` | Reload page to create another flashcard   |

### Error State

| Test ID       | Element | Description                                       |
| ------------- | ------- | ------------------------------------------------- |
| `error-toast` | `div`   | Error toast container (from ErrorToast component) |

---

## Component: ErrorToast

**Location**: `src/components/ErrorToast.tsx`

| Test ID                | Element  | Description                                   |
| ---------------------- | -------- | --------------------------------------------- |
| `error-toast`          | `div`    | Main error toast container (passed as prop)   |
| `error-message`        | `p`      | Error message text                            |
| `error-retry-button`   | `Button` | Retry button (shown when `showRetry` is true) |
| `error-dismiss-button` | `button` | Dismiss/close button                          |

---

## Component: DashboardCTAButtons

**Location**: `src/components/DashboardCTAButtons.tsx`

| Test ID                            | Element  | Description                                          |
| ---------------------------------- | -------- | ---------------------------------------------------- |
| `dashboard-cta-buttons`            | `div`    | Main container for all CTA buttons                   |
| `review-pending-flashcards-button` | `Button` | Button to review pending AI flashcards (conditional) |
| `pending-flashcards-count`         | `span`   | Badge showing count of pending flashcards            |
| `generate-flashcards-button`       | `Button` | Navigate to AI generation page                       |
| `create-manual-flashcard-button`   | `Button` | Navigate to manual flashcard creation                |
| `my-flashcards-button`             | `Button` | Navigate to flashcards list                          |
| `start-learning-button`            | `Button` | Start a learning session                             |

---

## Example Test Flow

### Test 1: Invalid Flashcard Submission

```typescript
// Navigate to create flashcard page
await page.goto("/flashcards/new");

// Verify page loaded
await expect(page.getByTestId("manual-flashcard-form-container")).toBeVisible();
await expect(page.getByTestId("form-title")).toHaveText("Create Flashcard");

// Try to submit with empty fields
const submitButton = page.getByTestId("save-flashcard-button");
await expect(submitButton).toBeDisabled();

// Fill only question (missing answer)
await page.getByTestId("question-input").fill("What is React?");
await expect(submitButton).toBeDisabled();

// Clear question and fill only answer (missing question)
await page.getByTestId("question-input").clear();
await page.getByTestId("answer-input").fill("A JavaScript library");
await expect(submitButton).toBeDisabled();
```

### Test 2: Valid Flashcard Creation

```typescript
// Fill valid data
await page.getByTestId("question-input").fill("What is React?");
await page.getByTestId("answer-input").fill("A JavaScript library for building user interfaces");

// Submit button should be enabled
const submitButton = page.getByTestId("save-flashcard-button");
await expect(submitButton).toBeEnabled();

// Submit the form
await submitButton.click();

// Verify success message
await expect(page.getByTestId("success-message")).toBeVisible();
await expect(page.getByTestId("success-title")).toContainText("successfully");

// Return to dashboard
await page.getByTestId("success-back-to-dashboard-button").click();

// Verify we're on dashboard
await expect(page.getByTestId("dashboard-cta-buttons")).toBeVisible();
await expect(page.getByTestId("create-manual-flashcard-button")).toBeVisible();
```

### Test 3: Error Handling

```typescript
// Simulate network error (intercept API call)
await page.route("/api/flashcards", (route) => {
  route.fulfill({ status: 500, body: "Server error" });
});

// Fill and submit
await page.getByTestId("question-input").fill("Test question");
await page.getByTestId("answer-input").fill("Test answer");
await page.getByTestId("save-flashcard-button").click();

// Verify error toast appears
await expect(page.getByTestId("error-toast")).toBeVisible();
await expect(page.getByTestId("error-message")).toBeVisible();

// Test retry functionality
await expect(page.getByTestId("error-retry-button")).toBeVisible();
await page.getByTestId("error-retry-button").click();

// Or dismiss error
await page.getByTestId("error-dismiss-button").click();
await expect(page.getByTestId("error-toast")).not.toBeVisible();
```

---

## Notes

- All test IDs follow kebab-case naming convention
- Test IDs are semantic and describe the element's purpose or action
- Character counters and validation errors are only visible when relevant
- Success and error states are mutually exclusive
- The form prevents submission when fields are invalid (disabled state)
