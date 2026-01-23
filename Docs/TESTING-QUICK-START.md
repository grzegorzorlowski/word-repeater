# Testing Quick Start Guide

## 🚀 Quick Commands

```bash
# Unit Tests
npm test                    # Run once
npm run test:watch          # Watch mode (recommended)
npm run test:coverage       # With coverage report
npm run test:ui             # Visual UI mode

# E2E Tests
npm run test:e2e            # Run all e2e tests
npm run test:e2e:ui         # UI mode (recommended)
npm run test:e2e:debug      # Debug mode
npm run test:e2e:headed     # See browser
npm run test:e2e:codegen    # Record tests

# All Tests
npm run test:all            # Run everything
```

## 📁 Where to Put Tests

```
src/
├── components/
│   └── __tests__/              ← Component tests here
│       └── MyComponent.test.tsx
├── lib/
│   ├── services/
│   │   └── __tests__/          ← Service tests here
│   └── utils/
│       └── __tests__/          ← Utility tests here
└── hooks/
    └── __tests__/              ← Hook tests here

e2e/
├── login.spec.ts              ← E2E test files here
├── flashcards.spec.ts
└── fixtures/                  ← Shared helpers
    └── auth.ts
```

## ✍️ Test Templates

### Component Test

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import MyComponent from "../MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### E2E Test

```typescript
import { test, expect } from "@playwright/test";

test("user can login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("user@test.com");
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /login/i }).click();
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Accessibility Test

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("no a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## 🎯 Common Queries

### Finding Elements (Prefer in order)

```typescript
// ✅ Best - Accessible to everyone
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText(/welcome/i);

// ✅ Good - For forms
screen.getByPlaceholderText(/search/i);

// ⚠️ Last resort
screen.getByTestId("submit-button");
```

### User Interactions

```typescript
import { userEvent } from "@testing-library/user-event";

const user = userEvent.setup();
await user.click(button);
await user.type(input, "text");
await user.clear(input);
await user.selectOptions(select, "option");
```

## 🔧 Mocking

### API Calls (MSW)

```typescript
import { server } from "@/test/setup";
import { http, HttpResponse } from "msw";

it("handles API error", async () => {
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json({ error: "Failed" }, { status: 500 });
    })
  );
  // Test error handling...
});
```

### Functions

```typescript
import { vi } from "vitest";

const mockFn = vi.fn(() => "mocked value");
const spy = vi.spyOn(object, "method");
```

## 📊 Coverage

```bash
npm run test:coverage

# View report
open coverage/index.html   # Mac
start coverage/index.html  # Windows
```

## 🐛 Debugging

### Unit Tests

```typescript
import { screen } from "@/test/utils/test-utils";

screen.debug(); // Print current DOM
screen.logTestingPlaygroundURL(); // Get query suggestions
```

### E2E Tests

```typescript
await page.pause(); // Pause execution
await page.screenshot(); // Take screenshot
```

```bash
npx playwright test --debug       # Step through tests
npx playwright show-trace trace.zip  # View trace
```

## ✅ Best Practices

1. **Test behavior, not implementation**

   ```typescript
   // ❌ Bad
   expect(component.state.isOpen).toBe(true);

   // ✅ Good
   expect(screen.getByRole("dialog")).toBeVisible();
   ```

2. **Use user-facing queries**

   ```typescript
   // ❌ Bad
   container.querySelector(".submit-btn");

   // ✅ Good
   screen.getByRole("button", { name: /submit/i });
   ```

3. **Wait for async updates**

   ```typescript
   // ✅ For elements that appear
   await screen.findByText("Success");

   // ✅ For conditions
   await waitFor(() => {
     expect(screen.getByText("Loaded")).toBeInTheDocument();
   });
   ```

4. **Keep tests isolated**
   - Don't depend on test order
   - Clean up after each test (automatic)
   - Use fresh data for each test

5. **Write descriptive test names**

   ```typescript
   // ❌ Bad
   it("works", () => {});

   // ✅ Good
   it("shows error message when form is submitted with invalid email", () => {});
   ```

## 🆘 Troubleshooting

**Tests timeout**

- Increase timeout: `it("test", async () => {...}, 10000)`
- Check for missing `await` statements
- Ensure elements exist before interacting

**Element not found**

- Use `screen.debug()` to see current DOM
- Check if element is rendered conditionally
- Verify correct query (role, label, text)

**Tests pass locally but fail in CI**

- Check for timing issues (add proper waits)
- Ensure consistent test data
- Check environment variables

## 📚 Full Documentation

- See `TESTING.md` for comprehensive guide
- See `src/test/README.md` for unit testing details
- See `e2e/README.md` for E2E testing details
- See `.ai/testing-setup-summary.md` for setup info

## 🎓 Learning Resources

- [Vitest](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
