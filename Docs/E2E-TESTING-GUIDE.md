# E2E Testing Guide

This guide will help you set up and run end-to-end (E2E) tests using Playwright.

## Prerequisites

1. **Node.js and npm** installed
2. **Supabase** running locally (for test database)
3. **Test environment variables** configured

## Configuration Overview

### Key Files

- `playwright.config.ts` - Playwright configuration
- `.env.test` - Test environment variables (not tracked in git)
- `package.json` - Test scripts
- `astro.config.mjs` - Astro configuration with test mode support

### How Environment Variables Work

1. **Playwright** loads `.env.test` using `dotenv` at the start
2. **Astro dev server** is started with `--mode test` flag via `npm run dev:e2e`
3. **Test server** runs on port `3000` (as configured in `astro.config.mjs`)

## Setup Instructions

### 1. Create .env.test File

Create a `.env.test` file in the project root with the following variables:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key-here

# API Base URL
BASE_URL=http://localhost:3000

# OpenRouter API (for AI flashcard generation)
OPENROUTER_API_KEY=your-test-api-key-here

# Test User Credentials (used by e2e/login.spec.ts)
E2E_USERNAME=test@example.com
E2E_PASSWORD=SecurePass123!
E2E_USERNAME_ID=your-test-user-uuid-here
```

**Note:** Tests automatically load these credentials from `.env.test` - no hardcoded credentials in test files!

**Important:** Never commit `.env.test` to git!

### 2. Set Up Test Database

Make sure your local Supabase instance is running:

```bash
npx supabase start
```

Create a test user in your Supabase database:

- Email: `test@example.com`
- Password: `SecurePass123!`

### 3. Verify Configuration

Run the verification script to check if everything is set up correctly:

```bash
npm run test:e2e:verify
```

This will:

- ✅ Check if `.env.test` exists
- ✅ Display loaded environment variables (hiding secrets)
- ✅ Verify `playwright.config.ts` configuration
- ✅ Check package.json scripts
- ✅ Validate Astro configuration

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

This command will:

1. Load environment variables from `.env.test`
2. Start Astro dev server on port 3000 (via `npm run dev:e2e`)
3. Wait for server to be ready
4. Run all E2E tests
5. Generate HTML report

### Run Tests in UI Mode

Interactive mode with test explorer:

```bash
npm run test:e2e:ui
```

### Debug Tests

Run tests with Playwright Inspector for debugging:

```bash
npm run test:e2e:debug
```

### Run Tests in Headed Mode

See the browser while tests run:

```bash
npm run test:e2e:headed
```

### Generate Test Code

Use Playwright codegen to record tests:

```bash
npm run test:e2e:codegen
```

### Run Specific Test File

```bash
npx playwright test e2e/login.spec.ts
```

### Run Tests Matching Pattern

```bash
npx playwright test --grep "login"
```

## Troubleshooting

### Issue: Tests Hang on Startup

**Symptoms:**

- Command `npx playwright test` runs indefinitely
- No output or progress
- Have to Ctrl+C to stop

**Possible Causes & Solutions:**

1. **Port Mismatch**
   - **Check:** Verify that `playwright.config.ts` webServer URL matches Astro port
   - **Solution:** Both should use `http://localhost:3000`

2. **Server Won't Start**
   - **Check:** Try starting dev server manually: `npm run dev:e2e`
   - **Look for:** Port conflicts, missing dependencies, or Supabase issues
   - **Solution:** Fix any errors before running tests

3. **Missing .env.test**
   - **Check:** Ensure `.env.test` file exists
   - **Solution:** Create it based on the template above

4. **Environment Variables Not Loaded**
   - **Check:** Run `npm run test:e2e:verify`
   - **Solution:** Make sure `dotenv` is installed: `npm install --save-dev dotenv`

### Issue: "Cannot find module 'dotenv'"

**Solution:**

```bash
npm install --save-dev dotenv
```

### Issue: Tests Fail with Authentication Errors

**Causes:**

- Test user doesn't exist in database
- Wrong credentials in `.env.test`
- Supabase not running

**Solutions:**

1. Start Supabase: `npx supabase start`
2. Create test user in Supabase dashboard
3. Verify credentials match in `.env.test`

### Issue: Port Already in Use

**Solution:**

1. Find and kill the process using port 3000:

   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```

2. Or use a different port in both:
   - `astro.config.mjs` → `server: { port: 3001 }`
   - `playwright.config.ts` → `url: "http://localhost:3001"`

### Issue: Tests Pass Locally But Fail in CI

**Common Causes:**

1. Different environment variables
2. Timing issues (CI is slower)
3. Missing test database setup

**Solutions:**

1. Set up environment variables in CI
2. Increase timeouts in `playwright.config.ts`
3. Use `retries: 2` in CI (already configured)

## Understanding the Configuration

### playwright.config.ts

```typescript
import * as dotenv from "dotenv";

// Load .env.test file BEFORE tests run
dotenv.config({ path: ".env.test" });

export default defineConfig({
  // Tests are in e2e/ directory
  testDir: "./e2e",

  // Base URL for page.goto('/')
  use: {
    baseURL: "http://localhost:3000",
  },

  // Start dev server before tests
  webServer: {
    command: "npm run dev:e2e", // Uses --mode test
    url: "http://localhost:3000",
    timeout: 120000, // 2 minutes to start
  },
});
```

### package.json Scripts

- `dev:e2e` - Starts Astro in test mode with `.env.test` variables
- `test:e2e` - Runs all E2E tests
- `test:e2e:verify` - Verifies E2E configuration

## Writing Tests

### Using Page Objects

Tests use the Page Object pattern for maintainability:

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage } from "./page-objects";

test("should login successfully", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);

  await loginPage.goto();
  await loginPage.login("test@example.com", "SecurePass123!");

  await expect(dashboardPage.dashboardTitle).toHaveText("Dashboard");
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Follow Arrange-Act-Assert** pattern
3. **Use Page Objects** to encapsulate page interactions
4. **Wait for elements** before interacting
5. **Clean up test data** after tests

## Test Structure

```
e2e/
├── login.spec.ts              # Login flow tests
├── example.spec.ts            # Basic navigation tests
├── accessibility.spec.ts      # Accessibility tests
├── page-objects/              # Page Object Models
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── index.ts
└── fixtures/                  # Shared test fixtures
    └── auth.ts
```

## CI/CD Integration

Tests are configured to run in CI with:

- Automatic retries (2 times)
- Single worker (sequential tests)
- GitHub Actions reporter
- HTML report artifacts

## Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Page Object Model](https://playwright.dev/docs/pom)
