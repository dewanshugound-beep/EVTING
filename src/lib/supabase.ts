import { createClient } from "@supabase/supabase-js";

/**
 * Shared Browser Supabase client instance.
 * For use in Client Components and hooks.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Compatibility alias for legacy browser components.
 */
export const createBrowserSupabase = () => supabase;
