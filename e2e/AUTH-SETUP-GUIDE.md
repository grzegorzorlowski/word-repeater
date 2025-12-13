# Authentication Setup Guide for E2E Tests

This guide explains how authentication works in our E2E test suite using Playwright's storage state pattern.

## Overview

Instead of logging in through the UI for every test, we use **API-based authentication** with **storage state** to:

1. Authenticate once via API request
2. Save the authenticated state (cookies, local storage)
3. Reuse that state across all tests

This approach is:
- ✅ **Faster** - No UI login for each test
- ✅ **More reliable** - Fewer moving parts
- ✅ **More maintainable** - Single auth logic
- ✅ **Parallel-friendly** - Tests can run in parallel

## File Structure

```
e2e/
├── .auth/
│   ├── .gitignore          # Ignore *.json auth files
│   └── user.json           # Generated auth state (gitignored)
├── fixtures/
│   ├── auth.ts             # Test user credentials from env
│   └── auth.setup.ts       # Auth setup script (NEW)
└── manual-flashcard-creation.spec.ts  # Tests using auth state
```

## Configuration

### 1. Environment Variables (.env.test)

Create a `.env.test` file in the project root by copying the example:

```bash
cp .env.test.example .env.test
```

Then update `.env.test` with your test credentials:

```bash
# E2E Test Environment Variables
BASE_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# OpenRouter API (for AI flashcard generation)
OPENROUTER_API_KEY=your-test-api-key-here

# Test User Credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=SecurePass123!
E2E_USERNAME_ID=your-test-user-uuid-here
```

**Important Notes**:
- This file should be in `.gitignore` to avoid committing credentials
- Use `.env.test.example` as a template
- The `E2E_USERNAME_ID` is the UUID of the test user in your Supabase database
- For AI flashcard tests, you'll need a valid `OPENROUTER_API_KEY`

### 2. Playwright Config (playwright.config.ts)

The config includes a **setup project** that runs before tests:

```typescript
projects: [
  // Setup project for authentication
  {
    name: "setup",
    testMatch: /.*\.setup\.ts/,
  },
  // Main test project that depends on auth setup
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
    dependencies: ["setup"],  // Runs after "setup"
  },
],
```

### 3. Auth Setup Script (e2e/fixtures/auth.setup.ts)

This file authenticates via API and saves the state:

```typescript
import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../.auth/user.json");

const TEST_EMAIL = process.env.E2E_USERNAME || "test@example.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD || "TestPassword123!";

setup("authenticate via API", async ({ request, baseURL }) => {
  // POST to login API
  const response = await request.post(`${baseURL}/api/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });

  // Verify success
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  // Save authenticated state
  await request.storageState({ path: authFile });
  
  console.log(`✓ Authentication successful for ${TEST_EMAIL}`);
});
```

**Key Points**:
- Uses `APIRequestContext` (not browser) for faster auth
- Validates the API response
- Saves cookies/storage to `user.json`

## Using Auth State in Tests

### Basic Usage

```typescript
import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

// Get auth file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, ".auth/user.json");

test.describe("My Feature Tests", () => {
  // Use the authenticated state for all tests in this suite
  test.use({ storageState: authFile });

  test.beforeEach(async ({ page }) => {
    // Navigate to any authenticated page
    // No need to login - already authenticated!
    await page.goto("/dashboard");
  });

  test("should access protected page", async ({ page }) => {
    // Test implementation
  });
});
```

### Example: Manual Flashcard Tests

```typescript
test.describe("Manual Flashcard Creation", () => {
  let manualFlashcardPage: ManualFlashcardPage;
  let dashboardCTAButtons: DashboardCTAButtons;

  // Use authenticated state
  test.use({ storageState: authFile });

  test.beforeEach(async ({ page }) => {
    manualFlashcardPage = new ManualFlashcardPage(page);
    dashboardCTAButtons = new DashboardCTAButtons(page);

    // No login needed - just navigate
    await page.goto("/dashboard");
    await dashboardCTAButtons.waitForButtons();
  });

  test("should create flashcard", async () => {
    await manualFlashcardPage.goto();
    await manualFlashcardPage.createFlashcard("Q", "A");
    // ...
  });
});
```

## Running Tests

### 1. Run Setup + Tests Together

```bash
# Runs setup automatically before tests
npx playwright test
```

Playwright will:
1. Run `auth.setup.ts` first (setup project)
2. Generate `e2e/.auth/user.json`
3. Run all tests using the auth state

### 2. Run Setup Only

```bash
# Only run auth setup
npx playwright test --project=setup
```

Useful for:
- Regenerating auth state
- Debugging authentication issues
- CI/CD pipelines

### 3. Run Specific Test Suite

```bash
# Run only manual flashcard tests
npx playwright test manual-flashcard-creation.spec.ts

# Run with UI
npx playwright test manual-flashcard-creation.spec.ts --headed

# Debug mode
npx playwright test manual-flashcard-creation.spec.ts --debug
```

## How It Works

### Authentication Flow

```
┌─────────────────────────────────────────────────┐
│  1. Run Setup Project (auth.setup.ts)           │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ POST /api/auth/login                    │    │
│  │ { email, password }                     │    │
│  └───────────────┬─────────────────────────┘    │
│                  │                               │
│                  ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │ Server responds with 200 OK            │    │
│  │ Sets auth cookies                      │    │
│  └───────────────┬─────────────────────────┘    │
│                  │                               │
│                  ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │ request.storageState()                 │    │
│  │ Saves cookies to user.json             │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                  │
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. Run Tests (*.spec.ts)                       │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │ test.use({ storageState: user.json })  │    │
│  └───────────────┬─────────────────────────┘    │
│                  │                               │
│                  ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │ Browser context initialized with        │    │
│  │ cookies and storage from user.json      │    │
│  └───────────────┬─────────────────────────┘    │
│                  │                               │
│                  ▼                               │
│  ┌────────────────────────────────────────┐    │
│  │ All requests include auth cookies       │    │
│  │ User is authenticated automatically     │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Troubleshooting

### Problem: Auth setup fails

```
Error: expect(received).toBeTruthy()
Expected: truthy
Received: false
```

**Solution**: 
1. Check that test database is running
2. Verify `E2E_USERNAME` and `E2E_PASSWORD` in `.env.test`
3. Ensure the test user exists in the database
4. Check that the API endpoint is correct

### Problem: Tests fail with 401 Unauthorized

**Solution**:
1. Delete `e2e/.auth/user.json`
2. Run setup again: `npx playwright test --project=setup`
3. Verify auth state was created
4. Check cookie expiration settings

### Problem: `__dirname is not defined` error

This is a **linter false positive**. The code is correct:

```typescript
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);  // Defined here
```

The error appears because the linter doesn't fully understand ES modules. The code will run fine.

### Problem: Storage state not found

```
Error: ENOENT: no such file or directory, open 'e2e/.auth/user.json'
```

**Solution**:
1. Ensure setup project runs first (check `playwright.config.ts`)
2. Run manually: `npx playwright test --project=setup`
3. Check that `e2e/.auth/` directory exists

## Best Practices

### 1. Use Environment Variables

❌ **Don't** hardcode credentials:
```typescript
const email = "test@example.com";  // BAD
```

✅ **Do** use environment variables:
```typescript
const email = process.env.E2E_USERNAME || "test@example.com";
```

### 2. Separate Setup from Tests

❌ **Don't** login in every test:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button[type=submit]");
});
```

✅ **Do** use storage state:
```typescript
test.use({ storageState: authFile });
```

### 3. Use API for Setup

❌ **Don't** use UI for authentication:
```typescript
setup("auth", async ({ page }) => {
  await page.goto("/login");
  // ...slow UI interaction
});
```

✅ **Do** use API:
```typescript
setup("auth", async ({ request }) => {
  await request.post("/api/auth/login", { ... });
});
```

### 4. Verify Auth State

✅ **Do** add assertions:
```typescript
expect(response.ok()).toBeTruthy();
expect(responseData.user.email).toBe(TEST_EMAIL);
```

### 5. Handle Multiple Users

For tests requiring different users:

```typescript
// auth.setup.admin.ts
const adminAuthFile = path.join(__dirname, "../.auth/admin.json");
setup("admin auth", async ({ request }) => {
  // Login as admin
  await request.storageState({ path: adminAuthFile });
});

// In tests
test.describe("Admin Features", () => {
  test.use({ storageState: adminAuthFile });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Install Playwright
  run: npm ci

- name: Run Playwright tests
  run: npx playwright test
  env:
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
```

**Key points**:
- Store credentials as GitHub secrets
- Setup runs automatically before tests
- No special CI configuration needed

## References

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [API Testing in Playwright](https://playwright.dev/docs/api-testing)
- [Storage State API](https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-storage-state)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)

## Summary

Our authentication setup provides:

- ✅ Fast, reliable authentication
- ✅ API-based login (no UI flakiness)
- ✅ Reusable auth state
- ✅ Environment variable configuration
- ✅ Parallel test execution support
- ✅ Easy CI/CD integration

The setup runs once, and all tests benefit from the authenticated state!

