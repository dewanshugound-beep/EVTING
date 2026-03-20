import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (uses service role key for full access)
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // If the key is the placeholder, use the anon key
  const finalKey = key.includes("your_service_role_key_here")
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : key;

  return createClient(url, finalKey, {
    auth: { persistSession: false },
  });
}

// Browser-side Supabase client (uses anon key, limited access via RLS)
let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserSupabase() {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
