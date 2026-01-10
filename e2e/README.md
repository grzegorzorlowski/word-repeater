# E2E Tests

End-to-end tests using Playwright.

## Structure

- `example.spec.ts` - Example tests for landing and auth pages
- `login.spec.ts` - Login flow tests using Page Object Model
- `manual-flashcard-creation.spec.ts` - Manual flashcard creation tests
- `accessibility.spec.ts` - Accessibility tests using axe-core
- `fixtures/` - Shared test fixtures and helpers
  - `auth.ts` - Authentication helpers and test user credentials
  - `auth.setup.ts` - API-based authentication setup for tests
  - `global.teardown.ts` - Database cleanup after all tests complete
- `.auth/` - Authenticated storage state (gitignored)
  - `user.json` - Generated auth state used by tests
- `page-objects/` - Page Object Model classes for maintainable tests
  - `LoginPage.ts` - Login page interactions
  - `DashboardPage.ts` - Dashboard page interactions
  - `ManualFlashcardPage.ts` - Manual flashcard creation page
  - `DashboardCTAButtons.ts` - Dashboard navigation component
  - `ErrorToastComponent.ts` - Error toast component
  - `index.ts` - Central export point for all page objects

## Documentation

- `AUTH-SETUP-GUIDE.md` - Complete guide for authentication setup
- `MANUAL-FLASHCARD-POM-GUIDE.md` - Page Object Model guide for flashcard tests
- `TEST-IDS-MANUAL-FLASHCARD.md` - Test ID reference for flashcard components
- `page-objects/README.md` - Page Object Model patterns and best practices

## Running Tests

### First Time Setup

1. Copy `.env.test.example` to `.env.test` and update credentials:

```bash
cp .env.test.example .env.test
```

2. Ensure your test user exists in the database with the credentials from `.env.test`

### Running Tests

```bash
# Run all e2e tests (includes auth setup and database cleanup)
npm run test:e2e

# Run auth setup only
npx playwright test --project=setup

# Run cleanup/teardown only
npx playwright test --project=teardown

# Run specific test file
npx playwright test manual-flashcard-creation.spec.ts

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Generate tests using Playwright codegen
npx playwright codegen http://localhost:4321
```

### Database Cleanup

After tests complete, the teardown script automatically:

- Deletes all flashcards created by the test user
- Ensures a clean state for the next test run
- Uses `E2E_USERNAME_ID` from `.env.test` to identify test data

**Note**: Make sure `E2E_USERNAME_ID` is set in your `.env.test` file for cleanup to work.

## Writing Tests

### Page Object Model

This project uses the Page Object Model (POM) pattern to organize tests. All page objects are located in `page-objects/` directory.

**Example usage:**

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage } from "./page-objects";

test("should login successfully", async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  // Act
  await loginPage.goto();
  await loginPage.login("user@example.com", "password123");

  // Assert
  await dashboardPage.waitForDashboard();
  await expect(dashboardPage.dashboardTitle).toHaveText("Dashboard");
});
```

**Available Page Objects:**

- `LoginPage` - Login page interactions using `data-testid` selectors
- `DashboardPage` - Dashboard page interactions using `data-testid` selectors
- `ManualFlashcardPage` - Manual flashcard creation form interactions
- `DashboardCTAButtons` - Dashboard navigation buttons component
- `ErrorToastComponent` - Error notification toast (reusable across pages)

**Creating New Page Objects:**

1. Create a new file in `page-objects/` directory
2. Use `data-testid` attributes for resilient selectors
3. Export the class from `page-objects/index.ts`
4. Follow the existing pattern with locators and helper methods

### Best Practices

1. **Use data-testid selectors**: Use `getByTestId()` for resilient test-oriented selectors
2. **Page Object Model**: Encapsulate page interactions in dedicated classes in `page-objects/`
3. **Arrange-Act-Assert**: Structure tests with clear AAA pattern for readability
4. **Wait for navigation**: Use `waitForURL` after actions that navigate
5. **Isolate tests**: Each test should be independent and not rely on other tests
6. **Use fixtures**: Share common setup code using fixtures
7. **Test accessibility**: Include accessibility tests for all pages
8. **Visual regression**: Use `toHaveScreenshot()` for visual comparisons

## Debugging

- Use `await page.pause()` to pause test execution
- Run tests with `--debug` flag for step-by-step debugging
- Use the Playwright Inspector: `npx playwright test --debug`
- View trace files: `npx playwright show-trace trace.zip`

## CI/CD

Tests run automatically on pull requests and main branch commits. See `.github/workflows/` for CI configuration.
