# Testing Guide

This document provides an overview of the testing setup and best practices for the Word Repeater project.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Unit & Integration Tests](#unit--integration-tests)
- [E2E Tests](#e2e-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

We use a comprehensive testing approach with:

- **Vitest** for unit and integration tests
- **React Testing Library** for component testing
- **MSW (Mock Service Worker)** for API mocking
- **Playwright** for end-to-end tests
- **axe-core** for accessibility testing

## Testing Stack

| Tool                  | Purpose                  | Documentation                                                          |
| --------------------- | ------------------------ | ---------------------------------------------------------------------- |
| Vitest                | Unit/Integration Testing | [vitest.dev](https://vitest.dev)                                       |
| React Testing Library | Component Testing        | [testing-library.com](https://testing-library.com/react)               |
| MSW                   | API Mocking              | [mswjs.io](https://mswjs.io)                                           |
| Playwright            | E2E Testing              | [playwright.dev](https://playwright.dev)                               |
| axe-core              | Accessibility Testing    | [github.com/dequelabs/axe-core](https://github.com/dequelabs/axe-core) |

## Project Structure

```
word-repeater/
├── src/
│   ├── components/
│   │   └── __tests__/           # Component tests
│   ├── lib/
│   │   └── utils/
│   │       └── __tests__/       # Utility tests
│   └── test/
│       ├── setup.ts             # Global test setup
│       ├── mocks/               # Mock implementations
│       │   ├── handlers.ts      # MSW handlers
│       │   └── supabase.mock.ts # Supabase mocks
│       ├── utils/               # Test utilities
│       │   └── test-utils.tsx   # Custom render
│       └── README.md
├── e2e/
│   ├── example.spec.ts          # Example E2E tests
│   ├── accessibility.spec.ts    # Accessibility tests
│   ├── fixtures/                # Test fixtures
│   │   └── auth.ts              # Auth helpers
│   └── README.md
├── vitest.config.ts             # Vitest configuration
└── playwright.config.ts         # Playwright configuration
```

## Quick Start

### Install Dependencies

All testing dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Run Unit Tests

```bash
# Run once
npm test

# Watch mode (recommended for development)
npm run test:watch

# With coverage
npm run test:coverage

# UI mode
npm run test:ui
```

### Run E2E Tests

```bash
# Run all e2e tests
npm run test:e2e

# UI mode (recommended for development)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Headed mode (see the browser)
npm run test:e2e:headed

# Generate tests with codegen
npm run test:e2e:codegen
```

### Run All Tests

```bash
npm run test:all
```

## Unit & Integration Tests

### Writing Component Tests

```typescript
import { describe, it, expect } from "vitest";
import { render, screen, userEvent } from "@/test/utils/test-utils";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Clicked")).toBeInTheDocument();
  });
});
```

### Writing Service Tests

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "../myService";

describe("myService", () => {
  it("should process data correctly", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  it("should handle errors", () => {
    expect(() => myFunction(null)).toThrow("Invalid input");
  });
});
```

### API Mocking

API requests are mocked using MSW. Add handlers in `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/endpoint", () => {
    return HttpResponse.json({ data: "mocked" });
  }),
];
```

Override in specific tests:

```typescript
import { server } from "@/test/setup";
import { http, HttpResponse } from "msw";

it("handles API error", async () => {
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json({ error: "Failed" }, { status: 500 });
    })
  );
  // Your test...
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useMyHook } from "../useMyHook";

it("should fetch data", async () => {
  const { result } = renderHook(() => useMyHook());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toBeDefined();
});
```

## E2E Tests

### Writing E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to login page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /login/i }).click();
  await expect(page).toHaveURL(/.*login/);
});
```

### Page Object Model

Organize tests using the Page Object Model:

```typescript
// e2e/pages/LoginPage.ts
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

### Accessibility Testing

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("should not have accessibility violations", async ({ page }) => {
  await page.goto("/");
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

## Best Practices

### General

1. **Write tests that users can understand** - Test behavior, not implementation
2. **Keep tests isolated** - Each test should be independent
3. **Use descriptive names** - Test names should clearly describe what is being tested
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Test edge cases** - Don't just test the happy path

### Component Testing

1. **Use user-facing queries**
   - ✅ `getByRole("button", { name: "Submit" })`
   - ❌ `querySelector(".submit-btn")`

2. **Test accessibility** - Use `getByRole`, `getByLabelText`, etc.

3. **Avoid testing implementation details**
   - ✅ Test that a button click shows a message
   - ❌ Test that state changes to `{ isVisible: true }`

4. **Use userEvent over fireEvent**
   ```typescript
   const user = userEvent.setup();
   await user.click(button);
   ```

### E2E Testing

1. **Use resilient selectors** - Prefer `getByRole`, `getByLabel` over CSS selectors
2. **Wait for navigation** - Use `waitForURL` after navigating
3. **Isolate tests** - Use fresh context for each test
4. **Test critical user journeys** - Focus on main user flows
5. **Keep tests maintainable** - Use Page Object Model for complex pages

### Mocking

1. **Mock at the network level** - Use MSW for API mocking
2. **Keep mocks realistic** - Mock data should match actual API responses
3. **Reset mocks between tests** - Handled automatically in setup
4. **Mock external services** - Don't make real API calls in tests

## CI/CD Integration

Tests run automatically in CI/CD:

### Pre-commit

- Linting and formatting (via husky and lint-staged)

### Pull Requests

- Unit tests with coverage
- E2E tests on Chromium
- Accessibility tests

### Main Branch

- Full test suite
- Coverage reports
- Performance tests

## Troubleshooting

### Common Issues

**Tests timeout**

```bash
# Increase timeout in test
it("slow test", async () => {
  // ...
}, 10000); // 10 second timeout
```

**MSW handlers not working**

- Ensure handlers are added to `src/test/mocks/handlers.ts`
- Check that the URL matches exactly
- Verify the HTTP method (GET, POST, etc.)

**Playwright tests fail locally**

```bash
# Install browsers
npx playwright install
```

**Coverage not generated**

```bash
# Ensure coverage provider is installed
npm install -D @vitest/coverage-v8
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [MSW Documentation](https://mswjs.io)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass: `npm run test:all`
3. Check coverage: `npm run test:coverage`
4. Add E2E tests for critical user flows
5. Include accessibility tests for new pages/components

## Support

For questions or issues with tests:

- Check this documentation
- Review existing test examples
- Consult the official documentation for each tool
- Ask the team in the project chat
