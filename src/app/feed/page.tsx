"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Share,
  Send,
  TrendingUp,
  Hash,
  Sparkles,
  Users,
  Zap,
  Star,
  Code2,
  BarChart3,
  Image as ImageIcon,
  Trash2,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useUser, useAuth } from "@/lib/auth-hooks";
import {
  createPost,
  getFeedPosts,
  toggleLike,
  toggleBookmark,
  getUserPostInteractions,
  deletePost,
  votePoll,
  getTrendingHashtags,
} from "./actions";
import { toggleFollow, getFollowCounts } from "./actions";

/* ═══════════════════════════════════════════ */
/*  POST CARD (real data)                      */
/* ═══════════════════════════════════════════ */
function PostCard({
  post,
  currentUserId,
  initialLiked,
  initialBookmarked,
}: {
  post: any;
  currentUserId?: string;
  initialLiked: boolean;
  initialBookmarked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [showMenu, setShowMenu] = useState(false);
  const [pollOptions, setPollOptions] = useState(post.poll_options);
  const [hasVoted, setHasVoted] = useState(false);

  const author = post.users;
  const isOwn = currentUserId === post.user_id;
  const isCode = post.content?.includes("```");

  // Render content with code blocks
  const renderContent = (content: string) => {
    if (!content) return null;
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
        return (
          <div key={i} className="my-3 rounded-xl bg-black/60 border border-white/5 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto">
            <pre><code>{code.trim()}</code></pre>
          </div>
        );
      }
      // Render hashtags and mentions as links
      const tokenized = part.split(/(#\w+|@\w+)/g).map((seg, j) => {
        if (seg.startsWith("#")) {
          return <Link href={`/explore?q=${encodeURIComponent(seg)}`} key={j} className="text-accent cursor-pointer hover:underline">{seg}</Link>;
        }
        if (seg.startsWith("@")) {
          const username = seg.substring(1);
          return <Link href={`/u/${username}`} key={j} className="text-neon-purple cursor-pointer hover:underline">{seg}</Link>;
        }
        return <span key={j}>{seg}</span>;
      });
      return <span key={i}>{tokenized}</span>;
    });
  };

  const handleLike = async () => {
    if (!currentUserId) return;
    setLiked(!liked);
    setLikeCount((c: number) => liked ? c - 1 : c + 1);
    try {
      await toggleLike(post.id);
    } catch { setLiked(liked); setLikeCount(post.like_count); }
  };

  const handleBookmark = async () => {
    if (!currentUserId) return;
    setBookmarked(!bookmarked);
    try {
      await toggleBookmark(post.id);
    } catch { setBookmarked(bookmarked); }
  };

  const handleDelete = async () => {
    if (confirm("Delete this post?")) {
      await deletePost(post.id);
      window.location.reload();
    }
  };

  const handleVote = async (idx: number) => {
    if (!currentUserId || hasVoted) return;
    const result = await votePoll(post.id, idx);
    if (result.poll_options) {
      setPollOptions(result.poll_options);
      setHasVoted(true);
    }
  };

  const totalVotes = pollOptions?.reduce((sum: number, o: any) => sum + (o.votes || 0), 0) || 1;

  return (
    <motion.article
      className="feed-card px-5 py-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={author?.username ? `/u/${author.username}` : `/profile/${post.user_id}`} className="shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-zinc-400 overflow-hidden relative">
            {author?.avatar_url ? (
              <Image src={author.avatar_url} alt="" fill className="object-cover" />
            ) : (
              (author?.display_name || "U")[0].toUpperCase()
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-2 mb-1">
            <Link href={author?.username ? `/u/${author.username}` : `/profile/${post.user_id}`} className="text-sm font-bold text-white hover:underline">
              {author?.display_name || "User"}
            </Link>
            {author?.role === "dev" && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-accent/20" title="Verified Dev">
                <Star size={8} className="text-accent fill-accent" />
              </span>
            )}
            {author?.role === "admin" && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-red-500/20" title="Admin">
                <Star size={8} className="text-red-400 fill-red-400" />
              </span>
            )}
            <span className="text-[11px] text-zinc-600">@{author?.username}</span>
            <span className="text-[11px] text-zinc-700">·</span>
            <span className="text-[11px] text-zinc-700">
              {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>

            {/* More menu */}
            {isOwn && (
              <div className="relative ml-auto">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-zinc-700 hover:text-zinc-400 cursor-pointer">
                  <MoreHorizontal size={14} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-6 z-20 bg-zinc-900 border border-white/10 rounded-lg py-1 shadow-lg">
                    <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 w-full cursor-pointer">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Repost indicator */}
          {post.type === "repost" && post.repost_of && (
            <p className="text-[10px] text-zinc-600 mb-2 flex items-center gap-1">
              <Repeat2 size={10} /> Reposted
            </p>
          )}

          {/* Content */}
          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mb-3">
            {renderContent(post.content || "")}
          </div>

          {/* Image */}
          {post.image_url && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 mb-3">
              <Image src={post.image_url} alt="" fill className="object-cover" />
            </div>
          )}

          {/* Poll */}
          {post.type === "poll" && pollOptions && (
            <div className="space-y-2 mb-3">
              {pollOptions.map((opt: any, idx: number) => {
                const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                return (
                  <button
                    key={idx}
                    onClick={() => handleVote(idx)}
                    disabled={hasVoted || !currentUserId}
                    className="w-full text-left relative p-3 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all hover:border-accent/20 cursor-pointer disabled:cursor-default"
                  >
                    <div
                      className="absolute inset-0 bg-accent/10 rounded-xl transition-all"
                      style={{ width: hasVoted ? `${pct}%` : "0%" }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm text-zinc-300">{opt.text}</span>
                      {hasVoted && <span className="text-xs text-zinc-500 font-mono">{pct}%</span>}
                    </div>
                  </button>
                );
              })}
              <p className="text-[10px] text-zinc-600">{totalVotes} votes</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-md">
            <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 text-zinc-600 hover:text-accent transition-colors group cursor-pointer">
              <MessageCircle size={15} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">{post.comment_count || 0}</span>
            </Link>
            <button className="flex items-center gap-1.5 text-zinc-600 hover:text-neon-green transition-colors group cursor-pointer">
              <Repeat2 size={15} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium">{post.repost_count || 0}</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${liked ? "text-red-500" : "text-zinc-600 hover:text-red-500"}`}
            >
              <Heart size={15} className={`group-hover:scale-110 transition-transform ${liked ? "fill-red-500" : ""}`} />
              <span className="text-[11px] font-medium">{likeCount}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 transition-colors group cursor-pointer ${bookmarked ? "text-accent" : "text-zinc-600 hover:text-accent"}`}
            >
              <Bookmark size={15} className={`group-hover:scale-110 transition-transform ${bookmarked ? "fill-accent" : ""}`} />
            </button>
            <button className="flex items-center text-zinc-600 hover:text-accent transition-colors cursor-pointer">
              <Share size={15} />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════ */
/*  MAIN FEED PAGE                             */
/* ═══════════════════════════════════════════ */
export default function FeedPage() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<"foryou" | "following">("foryou");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);

  // Compose state
  const [newContent, setNewContent] = useState("");
  const [postType, setPostType] = useState<"text" | "code" | "poll">("text");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [codeLang, setCodeLang] = useState("javascript");

  // Load feed
  const loadFeed = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setCursor(null); }
    else setLoadingMore(true);

    try {
      const result = await getFeedPosts({
        tab: activeTab,
        cursor: reset ? undefined : cursor || undefined,
        userId: user?.id,
      });

      const newPosts = result.posts;

      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(result.hasMore);
      setCursor(result.nextCursor);

      // Fetch interactions
      if (user?.id && newPosts.length > 0) {
        const postIds = newPosts.map((p: any) => p.id);
        const interactions = await getUserPostInteractions(user.id, postIds);
        if (reset) {
          setLikedIds(interactions.likes);
          setBookmarkedIds(interactions.bookmarks);
        } else {
          setLikedIds(prev => [...new Set([...prev, ...interactions.likes])]);
          setBookmarkedIds(prev => [...new Set([...prev, ...interactions.bookmarks])]);
        }
      }
    } catch (err) {
      console.error("Feed load error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, cursor, user?.id]);

  useEffect(() => {
    loadFeed(true);
  }, [activeTab]);

  // Load trending
  useEffect(() => {
    getTrendingHashtags().then(setTrendingTags).catch(() => {});
  }, []);

  // Submit post
  const handlePost = async () => {
    if (!newContent.trim() && postType !== "poll") return;
    setPostLoading(true);

    try {
      let opts: any = { type: postType, content: newContent };
      if (postType === "code") opts.code_lang = codeLang;
      if (postType === "poll") {
        opts.poll_options = pollOptions.filter(o => o.trim());
        if (opts.poll_options.length < 2) {
          setPostLoading(false);
          return alert("Polls need at least 2 options");
        }
      }

      await createPost(opts);
      setNewContent("");
      setPostType("text");
      setPollOptions(["", ""]);
      loadFeed(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPostLoading(false);
    }
  };

  // Infinite scroll
  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) loadFeed(false);
    }, { threshold: 0.5 });
    obs.observe(observerRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loadFeed]);

  return (
    <div className="min-h-screen flex">
      {/* ─── Main Feed Column ─── */}
      <div className="flex-1 max-w-2xl border-r border-white/5">
        {/* Feed Tabs */}
        <div className="sticky top-14 z-20 bg-[#08080d]/90 backdrop-blur-2xl border-b border-white/5">
          <div className="flex">
            {(["foryou", "following"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-sm font-bold text-center transition-all cursor-pointer relative ${
                  activeTab === tab ? "text-white" : "text-zinc-600 hover:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  {tab === "foryou" ? <Sparkles size={14} /> : <Users size={14} />}
                  {tab === "foryou" ? "For You" : "Following"}
                </div>
                {activeTab === tab && (
                  <motion.div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full" layoutId="feed-tab" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Compose Box (logged in only) */}
        {isSignedIn && (
          <div className="p-5 border-b border-white/5">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-neon-purple/20 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0 overflow-hidden relative">
                {user?.imageUrl ? (
                  <Image src={user.imageUrl} alt="" fill className="object-cover" />
                ) : "U"}
              </div>
              <div className="flex-1">
                {postType === "poll" ? (
                  <div className="space-y-2 mb-3">
                    <textarea
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="Ask a question..."
                      className="w-full bg-transparent resize-none outline-none text-sm text-white placeholder:text-zinc-700 min-h-[40px]"
                      maxLength={500}
                    />
                    {pollOptions.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }}
                        placeholder={`Option ${i + 1}`}
                        className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 outline-none text-sm text-white placeholder:text-zinc-700"
                      />
                    ))}
                    {pollOptions.length < 4 && (
                      <button onClick={() => setPollOptions([...pollOptions, ""])} className="text-[10px] text-accent font-bold cursor-pointer">
                        + Add option
                      </button>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder={postType === "code" ? "Paste your code..." : "What's on your mind?"}
                    className={`w-full bg-transparent resize-none outline-none text-sm text-white placeholder:text-zinc-700 min-h-[60px] ${postType === "code" ? "font-mono text-emerald-400" : ""}`}
                    maxLength={2000}
                  />
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPostType("text")} className={`p-2 rounded-lg transition-all cursor-pointer ${postType === "text" ? "text-accent bg-accent/10" : "text-zinc-600 hover:text-accent hover:bg-accent/5"}`}>
                      <MessageCircle size={16} />
                    </button>
                    <button onClick={() => setPostType("code")} className={`p-2 rounded-lg transition-all cursor-pointer ${postType === "code" ? "text-accent bg-accent/10" : "text-zinc-600 hover:text-accent hover:bg-accent/5"}`}>
                      <Code2 size={16} />
                    </button>
                    <button onClick={() => setPostType("poll")} className={`p-2 rounded-lg transition-all cursor-pointer ${postType === "poll" ? "text-accent bg-accent/10" : "text-zinc-600 hover:text-accent hover:bg-accent/5"}`}>
                      <BarChart3 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-700 font-mono">{newContent.length}/{postType === "code" ? 2000 : 500}</span>
                    <motion.button
                      onClick={handlePost}
                      disabled={postLoading || (!newContent.trim() && postType !== "poll")}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-bold shadow-lg shadow-accent/20 disabled:opacity-30 cursor-pointer"
                    >
                      {postLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Post
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-accent animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-600 font-bold">No posts yet</p>
            <p className="text-xs text-zinc-700 mt-1">Be the first to post something!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                initialLiked={likedIds.includes(post.id)}
                initialBookmarked={bookmarkedIds.includes(post.id)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerRef} className="h-10" />
        {loadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 size={18} className="text-accent animate-spin" />
          </div>
        )}
      </div>

      {/* ─── Right Sidebar ─── */}
      <aside className="hidden lg:block w-80 p-5 space-y-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        {/* Trending Tags */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent" />
            <h3 className="text-sm font-bold text-white">Trending</h3>
          </div>
          {trendingTags.length > 0 ? (
            <div className="space-y-3">
              {trendingTags.map(item => (
                <div key={item.tag} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Hash size={12} className="text-zinc-700" />
                    <span className="text-sm text-zinc-300 font-medium group-hover:text-accent transition-colors">{item.tag}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">{item.count} posts</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-700">No trending tags yet</p>
          )}
        </div>

        {/* Request Dev Tag CTA */}
        {isSignedIn && (
          <Link href="/request-dev-tag">
            <div className="rounded-2xl bg-accent/5 border border-accent/15 p-4 hover:bg-accent/10 transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-accent" />
                <h3 className="text-sm font-bold text-white">Become a Dev</h3>
              </div>
              <p className="text-[11px] text-zinc-400">Get your verified Dev badge and start publishing to the Store.</p>
            </div>
          </Link>
        )}
      </aside>
    </div>
  );
}
