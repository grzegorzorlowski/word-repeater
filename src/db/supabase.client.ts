import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the SupabaseClient type for use in other parts of the application
export type SupabaseClient = typeof supabaseClient;

// Default user ID for development/testing purposes
// This will be replaced with actual authenticated user ID when auth is implemented
export const DEFAULT_USER = "00647a8c-3e04-4f84-8e59-ef4900413931";
