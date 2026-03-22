"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Heart, Eye, Download, Star,
  MessageCircle, BarChart3, Loader2, ArrowUpRight, Package, Users, Zap
} from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase";
import { useUser } from "@/lib/auth-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPosts: 0, totalLikes: 0, totalFollowers: 0, totalFollowing: 0,
    totalListings: 0, totalDownloads: 0, totalStars: 0, totalViews: 0,
    xp: 0, level: 1, reputation: 0,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = React.useCallback(async () => {
    if (!user) return;
    try {
      const sb = createBrowserSupabase();
      const results = await Promise.all([
        sb.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        sb.from("posts").select("id, content, like_count, comment_count, created_at").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(5),
        sb.from("store_listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        sb.from("users").select("xp, level, reputation").eq("id", user.id).single(),
      ]);

      const [postCount, followerCount, followingCount, postsRes, listingsRes, userRes] = results;

      const postsData = postsRes.data || [];
      const listingsData = listingsRes.data || [];
      const userData = userRes.data;

      const totalLikes = postsData.reduce((s: number, p: any) => s + (p.like_count || 0), 0);
      const totalDownloads = listingsData.reduce((s: number, l: any) => s + (l.download_count || 0), 0);
      const totalStars = listingsData.reduce((s: number, l: any) => s + (l.star_count || 0), 0);

      setStats({
        totalPosts: postCount.count || 0,
        totalLikes,
        totalFollowers: followerCount.count || 0,
        totalFollowing: followingCount.count || 0,
        totalListings: listingsData.length || 0,
        totalDownloads,
        totalStars,
        totalViews: 0,
        xp: (userData as any)?.xp || user.xp || 0,
        level: (userData as any)?.level || user.level || 1,
        reputation: (userData as any)?.reputation || user.reputation || 0,
      });
      setRecentPosts(postsData);
      setListings(listingsData);
    } catch (err) {
      console.error("Dashboard synchronization failure:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }
    loadDashboard();
  }, [user, isLoaded, router, loadDashboard]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-accent" /></div>;

  const xpToNextLevel = Math.max(stats.level, 1) * 500;
  const xpProgress = xpToNextLevel > 0 ? (stats.xp % xpToNextLevel) / xpToNextLevel * 100 : 0;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
          <LayoutDashboard className="text-accent" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-xs text-zinc-500">Your personal analytics overview</p>
        </div>
      </div>

      {/* Level & XP bar */}
      <div className="mb-6 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-neon-purple/20 border border-accent/30 flex items-center justify-center text-sm font-black text-accent">
              {stats.level}
            </div>
            <div>
              <p className="text-sm font-bold text-white">Level {stats.level}</p>
              <p className="text-xs text-zinc-600">{stats.xp.toLocaleString()} / {(stats.level * 500).toLocaleString()} XP</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-black text-amber-400">{stats.reputation}</p>
              <p className="text-[10px] text-zinc-600">Reputation</p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${
              user?.role === "admin" ? "text-red-400 bg-red-500/10 border-red-500/20" :
              user?.role === "certified_dev" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
              user?.role === "dev" ? "text-accent bg-accent/10 border-accent/20" :
              "text-zinc-500 bg-zinc-800/80 border-zinc-700"
            }`}>{user?.role}</span>
          </div>
        </div>
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent to-neon-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Posts", value: stats.totalPosts, icon: BarChart3, color: "text-accent" },
          { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-red-400" },
          { label: "Followers", value: stats.totalFollowers, icon: Users, color: "text-neon-purple" },
          { label: "Following", value: stats.totalFollowing, icon: Users, color: "text-zinc-400" },
          { label: "Listings", value: stats.totalListings, icon: Package, color: "text-neon-green" },
          { label: "Downloads", value: stats.totalDownloads, icon: Download, color: "text-emerald-400" },
          { label: "Stars", value: stats.totalStars, icon: Star, color: "text-amber-400" },
          { label: "Views", value: stats.totalViews, icon: Eye, color: "text-zinc-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Write Post", href: "/feed", icon: MessageCircle, color: "bg-accent/10 text-accent border-accent/20" },
          { label: "Upload Tool", href: "/store/upload", icon: Zap, color: "bg-neon-green/10 text-neon-green border-neon-green/20" },
          { label: "My Profile", href: user?.username ? `/u/${user.username}` : "/feed", icon: Users, color: "bg-neon-purple/10 text-neon-purple border-neon-purple/20" },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={label} href={href}
            className={`flex items-center gap-2 p-4 rounded-2xl border transition-all hover:scale-[1.02] ${color}`}>
            <Icon size={16} />
            <span className="text-sm font-bold">{label}</span>
            <ArrowUpRight size={12} className="ml-auto opacity-60" />
          </Link>
        ))}
      </div>

      {/* Recent Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" /> Recent Posts
          </h2>
          <div className="space-y-2">
            {recentPosts.length === 0 ? (
              <p className="text-xs text-zinc-700 py-4">No posts yet. <Link href="/feed" className="text-accent">Write one!</Link></p>
            ) : (
              recentPosts.map(post => (
                <Link key={post.id} href={`/post/${post.id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <p className="text-xs text-zinc-400 truncate flex-1">
                    {post.content ? (post.content.length > 60 ? post.content.slice(0, 60) + "..." : post.content) : "No content"}
                  </p>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-600"><Heart size={10} />{post.like_count || 0}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-600"><MessageCircle size={10} />{post.comment_count || 0}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            <Package size={14} className="text-neon-green" /> Store Listings
          </h2>
          <div className="space-y-2">
            {listings.length === 0 ? (
              <div className="text-xs text-zinc-700 py-4">
                No listings yet.
                {(user?.role === "dev" || user?.role === "certified_dev" || user?.role === "admin") ? (
                  <Link href="/store/upload" className="text-neon-green ml-1">Upload your first tool!</Link>
                ) : (
                  <Link href="/request-dev-tag" className="text-accent ml-1">Request Dev access</Link>
                )}
              </div>
            ) : (
              listings.map(listing => (
                <Link key={listing.id} href={`/store/${listing.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                  <div>
                    <p className="text-xs text-white font-bold">{listing.title}</p>
                    <span className={`text-[9px] font-bold ${
                      listing.status === "approved" ? "text-neon-green" :
                      listing.status === "pending" ? "text-amber-400" : "text-red-400"
                    }`}>{listing.status}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-600"><Download size={10} />{listing.download_count || 0}</span>
                    <span className="flex items-center gap-0.5 text-[10px] text-zinc-600"><Star size={10} />{listing.star_count || 0}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
