# Unit and Integration Tests

Unit and integration tests using Vitest, React Testing Library, and MSW.

## Structure

- `setup.ts` - Global test setup and configuration
- `mocks/` - Mock implementations
  - `handlers.ts` - MSW API request handlers
  - `supabase.mock.ts` - Supabase client mocks
- `utils/` - Test utilities
  - `test-utils.tsx` - Custom render functions with providers

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx vitest src/components/__tests__/InlineLoader.test.tsx

# Run tests matching pattern
npx vitest --grep "InlineLoader"

# Run tests in UI mode
npx vitest --ui
```

## Environment

Tests run in `happy-dom` environment by default, which provides a lightweight DOM implementation optimized for testing. For tests that don't need a DOM, you can specify the node environment:

```typescript
// @vitest-environment node
```

## Writing Tests

### Component Tests

Use React Testing Library for component tests:

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

### Service/Utility Tests

Test pure functions and business logic:

```typescript
import { describe, it, expect } from "vitest";
import { myUtilFunction } from "../myUtil";

describe("myUtilFunction", () => {
  it("should return expected result", () => {
    const result = myUtilFunction("input");
    expect(result).toBe("expected");
  });

  it("should handle edge cases", () => {
    expect(myUtilFunction("")).toBe("");
    expect(myUtilFunction(null)).toBe(null);
  });
});
```

### API Mocking with MSW

Add mock handlers in `mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/endpoint", () => {
    return HttpResponse.json({ data: "mocked" });
  }),

  http.post("/api/endpoint", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true });
  }),
];
```

Use in tests:

```typescript
import { server } from "@/test/setup";
import { http, HttpResponse } from "msw";

it("handles API error", async () => {
  // Override handler for this test
  server.use(
    http.get("/api/endpoint", () => {
      return HttpResponse.json({ error: "Failed" }, { status: 500 });
    })
  );

  // Your test code...
});
```

### Mocking Modules

Use Vitest's `vi.mock()` for module mocking:

```typescript
import { vi } from "vitest";

vi.mock("../myModule", () => ({
  myFunction: vi.fn(() => "mocked"),
}));
```

### Supabase Mocking

Use the provided Supabase mock:

```typescript
import { createMockSupabaseClient } from "@/test/mocks/supabase.mock";

vi.mock("@/db/supabase.client", () => ({
  supabase: createMockSupabaseClient(),
}));
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
   - Arrange: Set up test data and conditions
   - Act: Execute the code being tested
   - Assert: Verify the results

2. **User-centric testing**: Test from user's perspective
   - Use `getByRole`, `getByLabelText`, `getByText`
   - Avoid testing implementation details
   - Test behavior, not structure

3. **Descriptive test names**: Use clear, descriptive names

   ```typescript
   it("should show error message when form is submitted with empty fields", () => {
     // test code
   });
   ```

4. **Isolated tests**: Each test should be independent
   - Don't rely on test execution order
   - Clean up after each test (handled by `afterEach`)
   - Reset mocks between tests

5. **Coverage with purpose**: Focus on meaningful tests
   - Test critical paths and edge cases
   - Don't chase 100% coverage artificially
   - Use coverage to find untested code, not as a goal

6. **Type safety**: Leverage TypeScript in tests

   ```typescript
   import { expectTypeOf } from "vitest";

   expectTypeOf(myFunction).toBeFunction();
   expectTypeOf(myFunction).parameter(0).toBeString();
   ```

## Testing Hooks

Test custom React hooks:

```typescript
import { renderHook, waitFor } from "@testing-library/react";

it("should fetch data", async () => {
  const { result } = renderHook(() => useMyHook());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toBeDefined();
});
```

## Debugging

- Use `screen.debug()` to print current DOM
- Use `await screen.findByRole()` for async elements
- Use `waitFor()` for async operations
- Run single test: `npx vitest -t "test name"`

## CI/CD

Tests run automatically on:

- Pre-commit (via husky and lint-staged)
- Pull requests
- Main branch commits

Coverage reports are generated and can be viewed in `coverage/` directory.
