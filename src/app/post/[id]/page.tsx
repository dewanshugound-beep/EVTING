import { createServerSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import SinglePostClient from "./SinglePostClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createServerSupabase();

  const [{ data: post }, viewer] = await Promise.all([
    sb.from("posts")
      .select("*, users(id, display_name, avatar_url, username, role)")
      .eq("id", id)
      .single(),
    currentUser(),
  ]);

  if (!post) notFound();

  // Get replies (threaded 2 levels)
  const { data: replies } = await sb
    .from("posts")
    .select("*, users(id, display_name, avatar_url, username, role)")
    .eq("parent_id", id)
    .order("created_at", { ascending: true });

  // Get viewer interactions
  let liked = false;
  let bookmarked = false;
  if (viewer) {
    const [{ data: likeRow }, { data: bookmarkRow }] = await Promise.all([
      sb.from("likes").select("id").eq("user_id", viewer.id).eq("post_id", id).maybeSingle(),
      sb.from("bookmarks").select("id").eq("user_id", viewer.id).eq("post_id", id).maybeSingle(),
    ]);
    liked = !!likeRow;
    bookmarked = !!bookmarkRow;
  }

  return (
    <SinglePostClient
      post={post}
      replies={replies || []}
      viewerId={viewer?.id}
      initialLiked={liked}
      initialBookmarked={bookmarked}
    />
  );
}
