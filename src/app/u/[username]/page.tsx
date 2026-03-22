import { createServerSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import ProfileClient from "./ProfileClient";
import { currentUser } from "@/lib/auth";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const sb = createServerSupabase();

  // Fetch the profile user
  const { data: profileUser } = await sb
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!profileUser) notFound();

  // Fetch follower/following counts
  const [{ count: followers }, { count: following }] = await Promise.all([
    sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileUser.id),
    sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileUser.id),
  ]);

  // Fetch posts
  const { data: posts } = await sb
    .from("posts")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("user_id", profileUser.id)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch store listings (public ones)
  const { data: listings } = await sb
    .from("store_listings")
    .select("*")
    .eq("user_id", profileUser.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(10);

  // Current viewer (to show follow button / own profile detection)
  const viewer = await currentUser();
  let isFollowing = false;
  if (viewer && viewer.id !== profileUser.id) {
    const { data: followRow } = await sb
      .from("follows")
      .select("id")
      .eq("follower_id", viewer.id)
      .eq("following_id", profileUser.id)
      .maybeSingle();
    isFollowing = !!followRow;
  }

  return (
    <ProfileClient
      profileUser={profileUser}
      posts={posts || []}
      listings={listings || []}
      followerCount={followers || 0}
      followingCount={following || 0}
      viewerId={viewer?.id}
      isFollowing={isFollowing}
    />
  );
}
