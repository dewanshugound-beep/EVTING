import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], projects: [] });
  }

  const sb = createServerSupabase();
  const searchTerm = `%${q}%`;

  const [usersResult, projectsResult] = await Promise.all([
    sb
      .from("users")
      .select("id, display_name, avatar_url, username")
      .or(`display_name.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .limit(5),
    sb
      .from("projects")
      .select("id, title, slug, tags, star_count, users(display_name)")
      .or(`title.ilike.${searchTerm},tags.cs.{${q.toLowerCase()}}`)
      .eq("is_published", true)
      .limit(5),
  ]);

  return NextResponse.json({
    users: usersResult.data ?? [],
    projects: projectsResult.data ?? [],
  });
}
