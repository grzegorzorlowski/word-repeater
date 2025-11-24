# E2E Tests

End-to-end tests using Playwright.

## Structure

- `example.spec.ts` - Example tests for landing and auth pages
- `accessibility.spec.ts` - Accessibility tests using axe-core
- `fixtures/` - Shared test fixtures and helpers

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test example.spec.ts

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Generate tests using Playwright codegen
npx playwright codegen http://localhost:4321
```

## Writing Tests

### Page Object Model

Use the Page Object Model pattern to organize your tests:

```typescript
// pages/LoginPage.ts
import { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email);
    await this.page.getByLabel(/password/i).fill(password);
    await this.page.getByRole("button", { name: /login/i }).click();
  }
}
```

### Best Practices

1. **Use user-facing selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for navigation**: Use `waitForURL` after actions that navigate
3. **Isolate tests**: Each test should be independent and not rely on other tests
4. **Use fixtures**: Share common setup code using fixtures
5. **Test accessibility**: Include accessibility tests for all pages
6. **Visual regression**: Use `toHaveScreenshot()` for visual comparisons

## Debugging

- Use `await page.pause()` to pause test execution
- Run tests with `--debug` flag for step-by-step debugging
- Use the Playwright Inspector: `npx playwright test --debug`
- View trace files: `npx playwright show-trace trace.zip`

## CI/CD

Tests run automatically on pull requests and main branch commits. See `.github/workflows/` for CI configuration.
