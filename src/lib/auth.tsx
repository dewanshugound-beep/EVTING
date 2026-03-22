// Server-side auth utilities for MatrixIN.
// NO "use client" — safe to import from Server Components, Server Actions, API routes.
//
// For client-side hooks (useUser, useAuth, etc.), import from '@/lib/auth-hooks'

export async function currentUser() {
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      return (dbUser as any) ?? user;
    }
  } catch {
    // Returns null if server context unavailable or user not logged in
  }
  return null;
}

export async function auth() {
  const user = await currentUser();
  return { userId: (user as any)?.id ?? null };
}

// Clerk compatibility stubs (harmless no-ops)
export function clerkMiddleware(fn: any) { return fn; }
export function createRouteMatcher(routes: string[]) {
  return (req: any) =>
    routes.some(r =>
      new RegExp('^' + r.replace(/\(.*\)/, '.*') + '$').test(req.nextUrl?.pathname ?? '')
    );
}
