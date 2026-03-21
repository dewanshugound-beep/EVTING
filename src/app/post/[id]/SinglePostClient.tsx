"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Bookmark,
  Share,
  MessageCircle,
  Repeat2,
  ArrowLeft,
  Trash2,
  Send,
  Loader2,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toggleLike, toggleBookmark, createPost, deletePost } from "@/app/feed/actions";
import { useRouter } from "next/navigation";

function renderContent(content: string) {
  if (!content) return null;
  return content.split(/(```[\s\S]*?```)/g).map((part, i) => {
    if (part.startsWith("```")) {
      const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
      return (
        <div key={i} className="my-3 rounded-xl bg-black/60 border border-white/5 p-4 font-mono text-[12px] text-emerald-400 overflow-x-auto">
          <pre><code>{code.trim()}</code></pre>
        </div>
      );
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>;
  });
}

function PostHeader({ post, isOwn, onDelete }: { post: any; isOwn: boolean; onDelete: () => void }) {
  const author = post.users;
  return (
    <div className="flex items-start gap-3 mb-4">
      <Link href={author?.username ? `/u/${author.username}` : `/profile/${post.user_id}`} className="shrink-0">
        <div className="h-12 w-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-base font-bold text-zinc-400 overflow-hidden relative">
          {author?.avatar_url ? <Image src={author.avatar_url} alt="" fill className="object-cover" /> : (author?.display_name?.[0] || "U")}
        </div>
      </Link>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={author?.username ? `/u/${author.username}` : `/profile/${post.user_id}`} className="text-base font-bold text-white hover:underline">
              {author?.display_name || "User"}
            </Link>
            {author?.role === "dev" && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-accent/20" title="Verified Dev">
                <Star size={8} className="text-accent fill-accent" />
              </span>
            )}
          </div>
          {isOwn && (
            <button onClick={onDelete} className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-600">@{author?.username} · {new Date(post.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      </div>
    </div>
  );
}

export default function SinglePostClient({
  post,
  replies,
  viewerId,
  initialLiked,
  initialBookmarked,
}: {
  post: any;
  replies: any[];
  viewerId?: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [localReplies, setLocalReplies] = useState(replies);

  const handleLike = async () => {
    if (!viewerId) return;
    setLiked(!liked);
    setLikeCount((c: number) => liked ? c - 1 : c + 1);
    await toggleLike(post.id);
  };

  const handleBookmark = async () => {
    if (!viewerId) return;
    setBookmarked(!bookmarked);
    await toggleBookmark(post.id);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !viewerId) return;
    setReplyLoading(true);
    try {
      const result = await createPost({
        type: "text",
        content: replyText,
        parent_id: post.id,
      });
      if (result.post) {
        setLocalReplies(prev => [...prev, result.post]);
        setReplyText("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    await deletePost(post.id);
    router.push("/feed");
  };

  const isOwn = viewerId === post.user_id;

  return (
    <div className="min-h-screen max-w-2xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3 px-6 py-4 sticky top-14 z-20 bg-[#08080d]/90 backdrop-blur-2xl border-b border-white/5">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-sm font-bold text-white">Thread</h2>
      </div>

      {/* Main post */}
      <div className="px-6 py-6 border-b border-white/5">
        <PostHeader post={post} isOwn={isOwn} onDelete={handleDelete} />

        {/* Content */}
        <div className="text-sm text-zinc-200 leading-relaxed mb-6 ml-15">
          {renderContent(post.content || "")}
          {post.image_url && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 mt-3">
              <Image src={post.image_url} alt="" fill className="object-cover" />
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="ml-15 flex items-center gap-4 text-sm text-zinc-600 pb-4 border-b border-white/5">
          <span><span className="text-white font-bold">{post.repost_count || 0}</span> Reposts</span>
          <span><span className="text-white font-bold">{likeCount}</span> Likes</span>
          <span><span className="text-white font-bold">{localReplies.length}</span> Replies</span>
        </div>

        {/* Action buttons */}
        <div className="ml-15 flex items-center justify-around max-w-xs pt-2">
          <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors cursor-pointer group ${liked ? "text-red-500" : "text-zinc-600 hover:text-red-500"}`}>
            <Heart size={18} className={liked ? "fill-red-500" : "group-hover:scale-110 transition-transform"} />
          </button>
          <button className="text-zinc-600 hover:text-neon-green transition-colors cursor-pointer">
            <Repeat2 size={18} />
          </button>
          <button onClick={handleBookmark} className={`transition-colors cursor-pointer ${bookmarked ? "text-accent" : "text-zinc-600 hover:text-accent"}`}>
            <Bookmark size={18} className={bookmarked ? "fill-accent" : ""} />
          </button>
          <button className="text-zinc-600 hover:text-accent transition-colors cursor-pointer">
            <Share size={18} />
          </button>
        </div>
      </div>

      {/* Reply composer */}
      {viewerId && (
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0" />
            <div className="flex-1">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Post your reply..."
                className="w-full bg-transparent resize-none outline-none text-sm text-white placeholder:text-zinc-700 min-h-[60px]"
                maxLength={500}
              />
              <div className="flex items-center justify-end gap-3">
                <span className="text-[10px] text-zinc-700 font-mono">{replyText.length}/500</span>
                <motion.button
                  onClick={handleReply}
                  disabled={replyLoading || !replyText.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-bold disabled:opacity-30 cursor-pointer"
                >
                  {replyLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Reply
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      <div className="divide-y divide-white/5">
        {localReplies.map((reply: any) => {
          const replyAuthor = reply.users;
          return (
            <div key={reply.id} className="px-6 py-4">
              <div className="flex gap-3">
                <Link href={replyAuthor?.username ? `/u/${replyAuthor.username}` : `/profile/${reply.user_id}`} className="shrink-0">
                  <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden relative">
                    {replyAuthor?.avatar_url ? <Image src={replyAuthor.avatar_url} alt="" fill className="object-cover" /> : (replyAuthor?.display_name?.[0] || "U")}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{replyAuthor?.display_name}</span>
                    <span className="text-[10px] text-zinc-600">@{replyAuthor?.username}</span>
                    <span className="text-[10px] text-zinc-700">{new Date(reply.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed">
                    {renderContent(reply.content || "")}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-zinc-700">
                    <button className="flex items-center gap-1 text-[11px] hover:text-red-400 transition-colors cursor-pointer">
                      <Heart size={12} />{reply.like_count || 0}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {localReplies.length === 0 && (
          <div className="px-6 py-12 text-center">
            <MessageCircle size={28} className="text-zinc-800 mx-auto mb-2" />
            <p className="text-sm text-zinc-700">No replies yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
