"use server";

import { createServerSupabase } from "@/lib/supabase";
import { requireAuth, getDbUser } from "@/lib/actions";
import { revalidatePath } from "next/cache";

const sb = () => createServerSupabase();

/* ─── Role Helpers ─── */
async function requireMember() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  if (user.is_banned) throw new Error("Account suspended");
  return user;
}

/* ═══════════════════════════════════════════ */
/*  CREATE POST                                */
/* ═══════════════════════════════════════════ */
export async function createPost(data: {
  type: "text" | "image" | "code" | "poll" | "quote";
  content: string;
  image_url?: string;
  code_lang?: string;
  poll_options?: string[];
  repost_of?: string;
  parent_id?: string;
}) {
  const user = await requireMember();

  // Validate content length
  if (data.type === "text" && data.content.length > 500) {
    return { error: "Post content exceeds 500 characters" };
  }

  // Build poll options JSON
  let pollJson = null;
  if (data.type === "poll" && data.poll_options) {
    pollJson = data.poll_options.map(text => ({ text, votes: 0 }));
  }

  const { data: post, error } = await sb()
    .from("posts")
    .insert({
      user_id: user.id,
      type: data.type,
      content: data.content,
      image_url: data.image_url || null,
      code_lang: data.code_lang || null,
      poll_options: pollJson,
      repost_of: data.repost_of || null,
      parent_id: data.parent_id || null,
    })
    .select("*, users(id, display_name, avatar_url, username, role)")
    .single();

  if (error) throw error;

  // If it's a reply, increment parent's comment count
  if (data.parent_id) {
    await sb().rpc("increment_post_comments", { post_id_param: data.parent_id });
  }

  // If it's a repost, increment original's repost count
  if (data.repost_of) {
    await sb().rpc("increment_post_reposts", { post_id_param: data.repost_of });
    // Notify original author
    const { data: original } = await sb().from("posts").select("user_id").eq("id", data.repost_of).single();
    if (original && original.user_id !== user.id) {
      await createNotification(original.user_id, "repost", {
        actor_id: user.id,
        actor_name: user.display_name || user.username,
        post_id: data.repost_of,
      });
    }
  }

  // Check for @mentions and notify users
  const mentions = data.content.match(/@(\w+)/g);
  if (mentions) {
    const usernames = [...new Set(mentions.map((m) => m.substring(1)))];
    if (usernames.length > 0) {
      const { data: mentionedUsers } = await sb()
        .from("users")
        .select("id, username")
        .in("username", usernames);

      if (mentionedUsers && mentionedUsers.length > 0) {
        for (const mu of mentionedUsers) {
          if (mu.id !== user.id) {
            await createNotification(mu.id, "mention", {
              actor_id: user.id,
              actor_name: user.display_name || user.username,
              post_id: post.id,
            });
          }
        }
      }
    }
  }

  // Increment reputation
  await sb().rpc("increment_reputation", { user_id_param: user.id, amount: 1 });

  revalidatePath("/feed");
  return { success: true, post };
}

/* ═══════════════════════════════════════════ */
/*  GET FEED POSTS                             */
/* ═══════════════════════════════════════════ */
export async function getFeedPosts(options: {
  tab: "foryou" | "following";
  cursor?: string;
  limit?: number;
  userId?: string;
}) {
  const supabase = sb();
  const limit = options.limit || 20;

  let query = supabase
    .from("posts")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .is("parent_id", null) // Top-level posts only (not replies)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Cursor-based pagination
  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  // Following tab: only show posts from users the current user follows
  if (options.tab === "following" && options.userId) {
    const { data: followData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", options.userId);

    const followingIds = followData?.map(f => f.following_id) || [];
    followingIds.push(options.userId); // Include own posts

    if (followingIds.length > 0) {
      query = query.in("user_id", followingIds);
    }
  }

  const { data: posts, error } = await query;
  if (error) throw error;

  const hasMore = (posts?.length || 0) === limit;
  const nextCursor = posts && posts.length > 0 ? posts[posts.length - 1].created_at : null;

  return { posts: posts || [], hasMore, nextCursor };
}

/* ═══════════════════════════════════════════ */
/*  GET SINGLE POST + REPLIES                  */
/* ═══════════════════════════════════════════ */
export async function getPost(postId: string) {
  const { data } = await sb()
    .from("posts")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("id", postId)
    .single();
  return data;
}

export async function getPostReplies(postId: string) {
  const { data } = await sb()
    .from("posts")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("parent_id", postId)
    .order("created_at", { ascending: true });
  return data || [];
}

/* ═══════════════════════════════════════════ */
/*  LIKE / UNLIKE                              */
/* ═══════════════════════════════════════════ */
export async function toggleLike(postId: string) {
  const user = await requireMember();
  const supabase = sb();

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    await supabase.rpc("decrement_post_likes", { post_id_param: postId });
    return { liked: false };
  } else {
    await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
    await supabase.rpc("increment_post_likes", { post_id_param: postId });

    // Notify post author
    const { data: post } = await supabase.from("posts").select("user_id").eq("id", postId).single();
    if (post && post.user_id !== user.id) {
      await createNotification(post.user_id, "like", {
        actor_id: user.id,
        actor_name: user.display_name || user.username,
        post_id: postId,
      });
    }

    return { liked: true };
  }
}

/* ═══════════════════════════════════════════ */
/*  CHECK IF USER LIKED / BOOKMARKED           */
/* ═══════════════════════════════════════════ */
export async function getUserPostInteractions(userId: string, postIds: string[]) {
  if (!userId || postIds.length === 0) return { likes: [], bookmarks: [] };
  const supabase = sb();

  const [{ data: likes }, { data: bookmarks }] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", postIds),
    supabase.from("bookmarks").select("post_id").eq("user_id", userId).in("post_id", postIds),
  ]);

  return {
    likes: likes?.map(l => l.post_id) || [],
    bookmarks: bookmarks?.map(b => b.post_id) || [],
  };
}

/* ═══════════════════════════════════════════ */
/*  BOOKMARK / UNBOOKMARK                      */
/* ═══════════════════════════════════════════ */
export async function toggleBookmark(postId: string) {
  const user = await requireMember();
  const supabase = sb();

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return { bookmarked: false };
  } else {
    await supabase.from("bookmarks").insert({ user_id: user.id, post_id: postId });
    return { bookmarked: true };
  }
}

/* ═══════════════════════════════════════════ */
/*  FOLLOW / UNFOLLOW                          */
/* ═══════════════════════════════════════════ */
export async function toggleFollow(targetUserId: string) {
  const user = await requireMember();
  if (user.id === targetUserId) return { error: "Cannot follow yourself" };

  const supabase = sb();

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("id", existing.id);
    return { following: false };
  } else {
    await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });

    // Notify target
    await createNotification(targetUserId, "follow", {
      actor_id: user.id,
      actor_name: user.display_name || user.username,
    });

    return { following: true };
  }
}

/* ═══════════════════════════════════════════ */
/*  GET FOLLOW STATUS + COUNTS                 */
/* ═══════════════════════════════════════════ */
export async function getFollowStatus(currentUserId: string, targetUserId: string) {
  const { data } = await sb()
    .from("follows")
    .select("id")
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();
  return !!data;
}

export async function getFollowCounts(userId: string) {
  const supabase = sb();
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers || 0, following: following || 0 };
}

/* ═══════════════════════════════════════════ */
/*  DELETE POST                                */
/* ═══════════════════════════════════════════ */
export async function deletePost(postId: string) {
  const user = await requireMember();
  const supabase = sb();

  const { data: post } = await supabase
    .from("posts")
    .select("user_id, parent_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };

  // Only author or admin can delete
  const isAdmin = user.role === "admin";
  if (post.user_id !== user.id && !isAdmin) return { error: "Unauthorized" };

  // If this is a reply, decrement parent comment count
  if (post.parent_id) {
    await supabase.rpc("decrement_post_comments", { post_id_param: post.parent_id });
  }

  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/feed");
  return { success: true };
}

/* ═══════════════════════════════════════════ */
/*  VOTE ON POLL                               */
/* ═══════════════════════════════════════════ */
export async function votePoll(postId: string, optionIndex: number) {
  const user = await requireMember();
  const supabase = sb();

  // Check if already voted
  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) return { error: "Already voted" };

  // Get current poll and update vote count
  const { data: post } = await supabase.from("posts").select("poll_options").eq("id", postId).single();
  if (!post || !post.poll_options) return { error: "Not a poll" };

  const options = post.poll_options as any[];
  if (optionIndex < 0 || optionIndex >= options.length) return { error: "Invalid option" };

  options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;

  await supabase.from("poll_votes").insert({ user_id: user.id, post_id: postId, option_index: optionIndex });
  await supabase.from("posts").update({ poll_options: options }).eq("id", postId);

  return { success: true, poll_options: options };
}

/* ═══════════════════════════════════════════ */
/*  GET USER POSTS (for profile)               */
/* ═══════════════════════════════════════════ */
export async function getUserPosts(userId: string, limit = 20, cursor?: string) {
  let query = sb()
    .from("posts")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("user_id", userId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);

  const { data } = await query;
  return data || [];
}

/* ═══════════════════════════════════════════ */
/*  GET USER BOOKMARKS (private)               */
/* ═══════════════════════════════════════════ */
export async function getUserBookmarks(userId: string) {
  const { data } = await sb()
    .from("bookmarks")
    .select("post_id, posts(*, users(id, display_name, avatar_url, username, role))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data?.map(b => (b as any).posts).filter(Boolean) || [];
}

/* ═══════════════════════════════════════════ */
/*  GET TRENDING HASHTAGS                      */
/* ═══════════════════════════════════════════ */
export async function getTrendingHashtags() {
  // Get recent posts and extract hashtags
  const { data: posts } = await sb()
    .from("posts")
    .select("content")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(500);

  const tagCounts: Record<string, number> = {};
  posts?.forEach(post => {
    const hashtags = (post.content || "").match(/#(\w+)/g) || [];
    hashtags.forEach((tag: string) => {
      const clean = tag.replace("#", "").toLowerCase();
      tagCounts[clean] = (tagCounts[clean] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
}

/* ═══════════════════════════════════════════ */
/*  CREATE NOTIFICATION (helper)               */
/* ═══════════════════════════════════════════ */
export async function createNotification(
  userId: string,
  type: string,
  data: Record<string, any>
) {
  await sb().from("notifications").insert({
    user_id: userId,
    type,
    data,
  });
}

/* ═══════════════════════════════════════════ */
/*  GET NOTIFICATIONS                          */
/* ═══════════════════════════════════════════ */
export async function getNotifications(userId: string, limit = 30) {
  const { data } = await sb()
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function markNotificationsRead(userId: string) {
  await sb()
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}

export async function getUnreadCount(userId: string) {
  const { count } = await sb()
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}
