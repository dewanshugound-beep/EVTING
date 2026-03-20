import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/banned(.*)", "/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // 1. If not logged in, just let clerk handle public/private logic
  if (!userId) return;

  // 2. If logged in, check if user is banned in Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: user, error } = await supabase
    .from("users")
    .select("is_banned")
    .eq("id", userId)
    .single();

  // 3. If banned and not already on the /banned page, redirect
  if (user?.is_banned && !req.nextUrl.pathname.startsWith("/banned")) {
    const bannedUrl = new URL("/banned", req.url);
    return NextResponse.redirect(bannedUrl);
  }

  // 4. If NOT banned but trying to access /banned, redirect back home
  if (!user?.is_banned && req.nextUrl.pathname.startsWith("/banned")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
