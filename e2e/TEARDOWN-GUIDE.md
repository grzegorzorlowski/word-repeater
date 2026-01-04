# Database Teardown Guide for E2E Tests

This guide explains how the database cleanup (teardown) works after Playwright tests complete.

## Overview

After all E2E tests run, the **teardown script** automatically cleans up test data from the database to ensure:

- ✅ Clean state for next test run
- ✅ No leftover test data polluting the database
- ✅ Consistent test results
- ✅ Isolation between test runs

## How It Works

### Execution Flow

```
1. Run "setup" project
   └── auth.setup.ts → Creates authenticated session

2. Run "chromium" project
   └── All *.spec.ts tests → Create flashcards, test features

3. Run "teardown" project (after all tests)
   └── global.teardown.ts → Deletes all test flashcards
```

### What Gets Cleaned Up

The teardown script deletes:
- ✅ All flashcards created by the test user
- ✅ Only data belonging to `E2E_USERNAME_ID`
- ✅ Both AI-generated and manual flashcards

### What Stays

The teardown script does NOT delete:
- ❌ The test user account itself
- ❌ Audit logs (immutable records)
- ❌ Other users' data

## Configuration

### Required Environment Variables

In your `.env.test` file:

```bash
# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Test User ID (UUID from database)
E2E_USERNAME_ID=your-test-user-uuid-here
```

### How to Get `E2E_USERNAME_ID`

1. **Start Supabase locally:**
   ```bash
   npx supabase start
   ```

2. **Find the test user's UUID:**
   ```bash
   # Using Supabase Studio (http://localhost:54323)
   # Navigate to: Authentication > Users
   # Find: test@example.com
   # Copy: User UID
   ```

   Or using SQL:
   ```sql
   SELECT id FROM auth.users WHERE email = 'test@example.com';
   ```

3. **Add to `.env.test`:**
   ```bash
   E2E_USERNAME_ID=abc12345-6789-0def-ghij-klmnopqrstuv
   ```

## Teardown Script

### Location
`e2e/fixtures/global.teardown.ts`

### Code Breakdown

```typescript
import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Load from .env.test
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const TEST_USER_ID = process.env.E2E_USERNAME_ID || "";

teardown("cleanup database", async ({}) => {
  // Safety checks
  if (!SUPABASE_ANON_KEY || !TEST_USER_ID) {
    console.warn("⚠️  Missing environment variables, skipping cleanup");
    return;
  }

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Delete all flashcards for test user
  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .eq("user_id", TEST_USER_ID);

  if (error) throw error;

  console.log(`✓ Deleted ${count || 0} flashcard(s)`);
});
```

### Key Features

1. **Safety First** - Only runs if env vars are set
2. **Scoped Deletion** - Only deletes test user's flashcards
3. **Count Reporting** - Shows how many records were deleted
4. **Error Handling** - Throws errors for visibility

## Playwright Configuration

### In `playwright.config.ts`

```typescript
projects: [
  // Setup runs first
  {
    name: "setup",
    testMatch: /.*\.setup\.ts/,
    teardown: "teardown", // Links to teardown project
  },
  // Tests run second
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
    dependencies: ["setup"],
  },
  // Teardown runs last
  {
    name: "teardown",
    testMatch: /.*\.teardown\.ts/,
  },
]
```

### Execution Order

The `teardown: "teardown"` property ensures:
1. Setup runs first
2. Tests run second
3. Teardown runs last (after all tests)

## Running Teardown

### Automatic (Recommended)

```bash
# Runs setup → tests → teardown
npx playwright test
```

Output:
```
Running 3 projects:
  setup ⚙️
  chromium 🌐
  teardown 🧹

Project: setup
  ✓ authenticate via API (1.2s)

Project: chromium
  ✓ should create flashcard (2.5s)
  ✓ should prevent invalid submission (1.8s)
  16 passed (18.3s)

Project: teardown
  🧹 Starting database cleanup...
  ✓ Deleted 5 flashcard(s) for test user
  ✓ Database cleanup completed successfully
  ✓ cleanup database (0.5s)
```

### Manual (For Testing)

```bash
# Run only teardown
npx playwright test --project=teardown
```

Use cases:
- Testing teardown script
- Manual cleanup after failed test run
- Debugging cleanup logic

## Troubleshooting

### Issue: "Missing environment variables"

```
⚠️  SUPABASE_ANON_KEY not found in environment variables
⚠️  Skipping database cleanup
```

**Solution**: 
1. Check `.env.test` exists
2. Verify `SUPABASE_ANON_KEY` is set
3. Restart terminal/IDE to reload environment

### Issue: "E2E_USERNAME_ID not found"

```
⚠️  E2E_USERNAME_ID not found in environment variables
⚠️  Skipping database cleanup
```

**Solution**:
1. Get user UUID from Supabase Studio
2. Add `E2E_USERNAME_ID=<uuid>` to `.env.test`
3. Ensure test user exists in database

### Issue: Teardown fails with permission error

```
❌ Error cleaning up flashcards: permission denied for table flashcards
```

**Solution**:
1. Check Supabase RLS policies
2. Ensure anon key has delete permissions
3. For local dev, RLS can be disabled temporarily

### Issue: Flashcards not being deleted

**Check:**
1. Is `E2E_USERNAME_ID` correct?
2. Are flashcards actually created during tests?
3. Run with `--debug` to see what's happening:
   ```bash
   npx playwright test --project=teardown --debug
   ```

## Best Practices

### 1. Always Set E2E_USERNAME_ID

❌ **Don't** skip this:
```bash
E2E_USERNAME_ID=  # Empty
```

✅ **Do** set properly:
```bash
E2E_USERNAME_ID=abc12345-6789-0def-ghij-klmnopqrstuv
```

### 2. Use Dedicated Test User

❌ **Don't** use your personal account:
```bash
E2E_USERNAME_ID=my-real-user-id  # BAD!
```

✅ **Do** create a dedicated test user:
```bash
E2E_USERNAME_ID=test-user-uuid  # Good
```

### 3. Verify Cleanup Worked

After tests:
```sql
-- Check if test flashcards exist
SELECT COUNT(*) FROM flashcards WHERE user_id = '<test-user-uuid>';
-- Should return: 0
```

### 4. Handle Cleanup Failures Gracefully

The teardown script:
- ✅ Warns if env vars missing (doesn't fail tests)
- ✅ Throws errors for real failures
- ✅ Reports deletion count

## CI/CD Considerations

### GitHub Actions

```yaml
- name: Run E2E tests
  run: npx playwright test
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    E2E_USERNAME_ID: ${{ secrets.E2E_USERNAME_ID }}
```

### Key Points

1. **Store as secrets** - Never commit credentials
2. **Use test database** - Separate from production
3. **Cleanup always runs** - Even if tests fail
4. **Parallel runs** - Each run should clean up after itself

## Advanced: Custom Cleanup

### Clean Up Other Tables

Extend `global.teardown.ts`:

```typescript
// Delete flashcards
await supabase.from("flashcards").delete().eq("user_id", TEST_USER_ID);

// Delete audit logs (if needed)
await supabase.from("audit_logs").delete().eq("user_id", TEST_USER_ID);

// Delete other test data
// ...
```

### Conditional Cleanup

```typescript
// Only clean up in CI
if (process.env.CI) {
  await supabase.from("flashcards").delete().eq("user_id", TEST_USER_ID);
} else {
  console.log("Skipping cleanup in local development");
}
```

### Multiple Test Users

```typescript
const TEST_USER_IDS = [
  process.env.E2E_USERNAME_ID,
  process.env.E2E_ADMIN_ID,
].filter(Boolean);

for (const userId of TEST_USER_IDS) {
  await supabase.from("flashcards").delete().eq("user_id", userId);
}
```

## Summary

The teardown system provides:

- ✅ Automatic cleanup after tests
- ✅ Scoped to test user only
- ✅ Safe error handling
- ✅ Visibility with console output
- ✅ Environment-based configuration
- ✅ Easy to extend for other tables

This ensures your test database stays clean and tests remain reliable! 🧹✨

