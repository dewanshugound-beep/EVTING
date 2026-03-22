import { createClient } from "@supabase/supabase-js";

// Shared Supabase client instance as per Step 1
export const supabase = createClient(
  "https://mgmbbhfjawxlhfssnrbt.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Compatibility alias for existing codebase components (e.g. Navbar)
 * that expect createBrowserSupabase() function.
 */
export const createBrowserSupabase = () => supabase;
