# Page Object Model (POM) Classes

This directory contains Page Object Model classes that encapsulate interactions with different pages of the application.

## Overview

The Page Object Model (POM) pattern provides a layer of abstraction between tests and the actual page elements, making tests more maintainable and resilient to UI changes.

## Structure

```
page-objects/
├── LoginPage.ts       # Login page interactions
├── DashboardPage.ts   # Dashboard page interactions
├── index.ts          # Central export point
└── README.md         # This file
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
import { LoginPage, DashboardPage } from "./page-objects";
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
