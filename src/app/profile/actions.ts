"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { requireAuth } from "@/lib/actions";
import { getRank, XP_REWARDS } from "@/lib/rank";

// Using await createServerSupabase() directly in functions for async safety

/* ─── Profile Updates ─── */

export async function updateProfile(formData: FormData) {
  const user = await requireAuth();
  const bio = formData.get("bio") as string;
  const youtube_url = formData.get("youtube_url") as string;
  const display_name = formData.get("display_name") as string;
  const avatar_url = formData.get("avatar_url") as string;

  const { error } = await (await createServerSupabase())
    .from("users")
    .update({
      display_name: display_name || null,
      avatar_url: avatar_url || null,
      bio: bio?.slice(0, 500) ?? "",
      youtube_url: youtube_url || null,
    })
    .eq("id", user.id);

  if (error) throw new Error("Failed to update profile");
  return { success: true };
}

export async function updateBanner(bannerUrl: string) {
  const user = await requireAuth();
  await (await createServerSupabase()).from("users").update({ banner_url: bannerUrl }).eq("id", user.id);
  return { success: true };
}

/* ─── Follow / Unfollow ─── */

export async function followUser(targetId: string) {
  const user = await requireAuth();
  if (user.id === targetId) return { error: "Cannot follow yourself" };

  const { error } = await (await createServerSupabase())
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetId });

  if (error?.code === "23505") return { error: "Already following" };
  if (error) throw error;

  // Award XP to the followed user
  await (await createServerSupabase()).rpc("increment_xp", {
    user_id_param: targetId,
    amount: XP_REWARDS.FOLLOWER_GAINED,
  });

  return { success: true };
}

export async function unfollowUser(targetId: string) {
  const user = await requireAuth();
  await (await createServerSupabase())
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);
  return { success: true };
}

/* ─── Fetch Profile Data ─── */

export async function getProfile(userId: string) {
  const { data: profile } = await (await createServerSupabase())
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  // Get counts
  const [followers, following, projects] = await Promise.all([
    (await createServerSupabase()).from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    (await createServerSupabase()).from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    (await createServerSupabase()).from("projects").select("*").eq("user_id", userId).eq("is_published", true).order("created_at", { ascending: false }),
  ]);

  // Compute rank
  const rank = getRank(profile.xp ?? 0);

  return {
    ...profile,
    rank: rank.name,
    rankColor: rank.color,
    followerCount: followers.count ?? 0,
    followingCount: following.count ?? 0,
    projects: projects.data ?? [],
  };
}

export async function isFollowing(currentUserId: string, targetUserId: string) {
  const { data } = await sb()
    .from("follows")
    .select("follower_id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();
  return !!data;
}
