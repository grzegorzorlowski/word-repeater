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
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const TEST_USER_ID = process.env.E2E_USERNAME_ID || "";

teardown("cleanup database", async ({}) => {
  if (!SUPABASE_ANON_KEY) {
    console.warn("⚠️  SUPABASE_ANON_KEY not found in environment variables");
    console.warn("⚠️  Skipping database cleanup");
    return;
  }

  if (!TEST_USER_ID) {
    console.warn("⚠️  E2E_USERNAME_ID not found in environment variables");
    console.warn("⚠️  Skipping database cleanup");
    return;
  }

  console.log("🧹 Starting database cleanup...");

  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Delete all flashcards created by the test user
    const { data, error, count } = await supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .eq("user_id", TEST_USER_ID);

    if (error) {
      console.error("❌ Error cleaning up flashcards:", error.message);
      throw error;
    }

    console.log(`✓ Deleted ${count || 0} flashcard(s) for test user`);
    console.log(`✓ Database cleanup completed successfully`);
  } catch (error) {
    console.error("❌ Database cleanup failed:", error);
    throw error;
  }
});

