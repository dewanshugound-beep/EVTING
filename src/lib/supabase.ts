import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for use in Server Components and Server Actions.
 * Uses the service role key when available for admin operations,
 * otherwise uses the anon key with SSR session awareness.
 * 
 * For auth-aware server usage, prefer `@/utils/supabase/server` directly.
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Use service role key if available (bypasses RLS - for server-only trust zones)
  const key = serviceKey && !serviceKey.includes("your_service_role") ? serviceKey : anonKey;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Browser-side Supabase client singleton using anon key.
 * RLS policies protect all data access.
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserSupabase(): any {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "matrixin-auth",
        },
      }
    );
  }
  return browserClient;
}
