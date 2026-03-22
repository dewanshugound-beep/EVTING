"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, Loader2, Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth-hooks";
import Link from "next/link";
import Image from "next/image";

export default function BookmarksPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookmarks() {
      if (!user?.id) return;
      try {
        const sb = createBrowserSupabase();
        const { data, error } = await sb
          .from("bookmarks")
          .select("post_id, posts(*, users(id, display_name, avatar_url, username, role))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Failed to fetch bookmarks:", error);
        } else {
          setPosts((data || []).map((b: any) => b.posts).filter(Boolean));
        }
      } catch (err) {
        console.error("Unexpected bookmarks error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [user?.id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-accent" /></div>;

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
          <Bookmark className="text-accent" size={20} />
        </div>
        <h1 className="text-2xl font-black text-white">Bookmarks</h1>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <Bookmark size={40} className="text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-600 font-bold">No bookmarks yet</p>
          <p className="text-xs text-zinc-700 mt-1">Save posts to find them here later</p>
          <Link href="/feed" className="inline-flex mt-4 px-4 py-2 rounded-xl bg-accent/10 text-accent text-sm font-bold border border-accent/20">
            Browse Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-px divide-y divide-white/5">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="py-4">
              <div className="flex gap-3">
                <Link href={post.users?.username ? `/u/${post.users.username}` : "/feed"} className="shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-400 overflow-hidden relative">
                    {post.users?.avatar_url ? (
                      <Image src={post.users.avatar_url} alt="" fill className="object-cover" />
                    ) : (
                      (post.users?.display_name || post.users?.username || "U")[0].toUpperCase()
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{post.users?.display_name || post.users?.username || "Ghost User"}</span>
                    {post.users?.username && <span className="text-[11px] text-zinc-600">@{post.users.username}</span>}
                    <span className="text-[11px] text-zinc-700">·</span>
                    <span className="text-[11px] text-zinc-700">{new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  </div>
                  <Link href={`/post/${post.id}`}>
                    <p className="text-sm text-zinc-300 leading-relaxed hover:text-white transition-colors">{post.content?.slice(0, 300)}{post.content?.length > 300 ? "..." : ""}</p>
                  </Link>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1 text-zinc-600 text-[11px]"><Heart size={13} />{post.like_count || 0}</span>
                    <span className="flex items-center gap-1 text-zinc-600 text-[11px]"><MessageCircle size={13} />{post.comment_count || 0}</span>
                    <span className="flex items-center gap-1 text-zinc-600 text-[11px]"><Repeat2 size={13} />{post.repost_count || 0}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
