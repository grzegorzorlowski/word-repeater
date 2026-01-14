import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Global teardown for E2E tests
 * Cleans up test data from the database after all tests complete
 *
 * This runs after all test projects complete to remove any flashcards
 * created during testing, ensuring a clean state for the next test run.
 */

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";
const TEST_USER_ID = process.env.E2E_USERNAME_ID || "";

teardown("cleanup database", async () => {
  if (!SUPABASE_KEY) {
    // eslint-disable-next-line no-console
    console.warn("⚠️  SUPABASE_KEY not found in environment variables");
    // eslint-disable-next-line no-console
    console.warn("⚠️  Skipping database cleanup");
    return;
  }

  if (!TEST_USER_ID) {
    // eslint-disable-next-line no-console
    console.warn("⚠️  E2E_USERNAME_ID not found in environment variables");
    // eslint-disable-next-line no-console
    console.warn("⚠️  Skipping database cleanup");
    return;
  }

  // eslint-disable-next-line no-console
  console.log("🧹 Starting database cleanup...");

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Delete all flashcards created by the test user
    const { error, count } = await supabase.from("flashcards").delete({ count: "exact" }).eq("user_id", TEST_USER_ID);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("❌ Error cleaning up flashcards:", error.message);
      throw error;
    }

    // eslint-disable-next-line no-console
    console.log(`✓ Deleted ${count || 0} flashcard(s) for test user`);
    // eslint-disable-next-line no-console
    console.log(`✓ Database cleanup completed successfully`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Database cleanup failed:", err);
    throw err;
  }
});
