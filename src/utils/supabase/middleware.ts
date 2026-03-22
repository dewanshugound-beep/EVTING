import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid reading `supabase.auth.getUser()` down the line in Server Components
  // without calling it in middleware first if you want the session refreshed securely.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Guest users nudge and redirecting unauthenticated users away from protected routes
  const protectedRoutes = ['/settings', '/dashboard', '/chat', '/admin', '/store/upload']
  const isProtectedRoute = protectedRoutes.some((route) => url.pathname.startsWith(route))

  if (!user && isProtectedRoute) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin routing logic
  if (user && url.pathname.startsWith('/admin')) {
    // Only query DB if going to admin route to save performance.
    const { data: dbUser } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!dbUser || dbUser.role !== 'admin') {
      url.pathname = '/404'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
