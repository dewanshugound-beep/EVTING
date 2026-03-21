"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  Download,
  CheckCircle,
  Calendar,
  Globe,
  Shield,
  Package,
  Heart,
  MessageCircle,
  Bookmark,
  Settings,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toggleFollow } from "@/app/feed/actions";

type Tab = "posts" | "store" | "liked";

export default function ProfileClient({
  profileUser,
  posts,
  listings,
  followerCount,
  followingCount,
  viewerId,
  isFollowing: initialIsFollowing,
}: {
  profileUser: any;
  posts: any[];
  listings: any[];
  followerCount: number;
  followingCount: number;
  viewerId?: string;
  isFollowing: boolean;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCountState, setFollowerCountState] = useState(followerCount);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwn = viewerId === profileUser.id;

  const handleFollow = async () => {
    if (!viewerId) return;
    setFollowLoading(true);
    setIsFollowing(!isFollowing);
    setFollowerCountState(c => isFollowing ? c - 1 : c + 1);
    try {
      await toggleFollow(profileUser.id);
    } catch {
      setIsFollowing(isFollowing);
      setFollowerCountState(followerCount);
    } finally {
      setFollowLoading(false);
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    return content.split(/(```[\s\S]*?```)/g).map((part, i) => {
      if (part.startsWith("```")) {
        const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
        return (
          <div key={i} className="my-2 rounded-xl bg-black/60 border border-white/5 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
            <pre><code>{code.trim()}</code></pre>
          </div>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-40 md:h-56 w-full overflow-hidden">
        {profileUser.banner_url ? (
          <Image src={profileUser.banner_url} alt="Banner" fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950">
            <div className="hero-gradient absolute inset-0" />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="relative px-6 pb-0">
        <div className="flex items-end justify-between -mt-12 md:-mt-16 mb-4">
          {/* Avatar */}
          <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full bg-zinc-900 border-4 border-[#08080d] overflow-hidden shrink-0">
            {profileUser.avatar_url ? (
              <Image src={profileUser.avatar_url} alt={profileUser.display_name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-black text-zinc-600">
                {(profileUser.display_name || profileUser.username || "?")[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-2">
            {isOwn ? (
              <Link href="/settings">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-sm font-bold text-zinc-400 hover:bg-white/5 cursor-pointer">
                  <Settings size={14} /> Edit Profile
                </button>
              </Link>
            ) : viewerId && (
              <motion.button
                onClick={handleFollow}
                disabled={followLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2 ${
                  isFollowing
                    ? "border border-white/10 text-zinc-400 hover:bg-white/5"
                    : "bg-accent text-white shadow-lg shadow-accent/20"
                }`}
              >
                {followLoading && <Loader2 size={12} className="animate-spin" />}
                {isFollowing ? "Following" : "Follow"}
              </motion.button>
            )}
          </div>
        </div>

        {/* Name + Badges */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white tracking-tight">
              {profileUser.display_name || profileUser.username}
            </h1>
            {profileUser.role === "dev" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold tracking-widest uppercase">
                <CheckCircle size={10} /> Dev
              </span>
            )}
            {profileUser.role === "admin" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold tracking-widest uppercase">
                <Shield size={10} /> Admin
              </span>
            )}
            {profileUser.is_banned && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold">BANNED</span>
            )}
          </div>
          <p className="text-sm text-zinc-500">@{profileUser.username}</p>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="text-sm text-zinc-300 leading-relaxed mb-3 max-w-prose">{profileUser.bio}</p>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-4 text-[11px] text-zinc-600 mb-4 flex-wrap">
          {profileUser.website && (
            <a href={profileUser.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-accent transition-colors">
              <Globe size={11} /> {profileUser.website.replace(/https?:\/\//, "")}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={11} /> Joined {new Date(profileUser.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </span>
          <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">
            ⭐ {profileUser.reputation || 0} rep
          </span>
        </div>

        {/* Skills */}
        {(profileUser.skills || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {profileUser.skills.map((skill: string) => (
              <span key={skill} className="px-2.5 py-1 rounded-lg bg-white/5 text-[10px] font-bold text-zinc-400 tracking-wider uppercase">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm pb-4 border-b border-white/5">
          <div className="text-center">
            <p className="font-black text-white">{posts.length}+</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Posts</p>
          </div>
          <div className="text-center">
            <p className="font-black text-white">{followerCountState.toLocaleString()}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-black text-white">{followingCount.toLocaleString()}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Following</p>
          </div>
          <div className="text-center">
            <p className="font-black text-white">{listings.length}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Projects</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/5 sticky top-14 z-20 bg-[#08080d]/90 backdrop-blur-2xl">
        <div className="px-6 flex gap-0">
          {(["posts", "store", "liked"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3.5 text-xs font-bold text-center capitalize tracking-widest uppercase transition-all cursor-pointer relative ${
                activeTab === tab ? "text-white" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {tab === "store" ? "Projects" : tab}
              {activeTab === tab && (
                <motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" layoutId="profile-tab" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6 max-w-2xl">
        {/* POSTS TAB */}
        {activeTab === "posts" && (
          <div className="space-y-0 divide-y divide-white/5">
            {posts.length === 0 ? (
              <p className="text-sm text-zinc-600 py-10 text-center">No posts yet</p>
            ) : (
              posts.map((post: any) => (
                <div key={post.id} className="py-5 first:pt-0">
                  <Link href={`/post/${post.id}`} className="block group">
                    <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mb-3 group-hover:text-zinc-200 transition-colors">
                      {renderContent(post.content || "")}
                    </div>
                    {post.image_url && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/5 mb-3">
                        <Image src={post.image_url} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-zinc-600">
                      <span className="flex items-center gap-1"><Heart size={12} />{post.like_count || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comment_count || 0}</span>
                      <span className="ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* STORE TAB */}
        {activeTab === "store" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.length === 0 ? (
              <p className="text-sm text-zinc-600 py-10 text-center col-span-2">No published projects</p>
            ) : (
              listings.map((l: any) => (
                <Link key={l.id} href={`/store/${l.slug}`}>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer">
                    <h3 className="text-sm font-bold text-white mb-1">{l.title}</h3>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">{l.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                      <span className="flex items-center gap-1"><Star size={10} className="text-amber-400" />{l.star_count}</span>
                      <span className="flex items-center gap-1"><Download size={10} />{l.download_count}</span>
                      <span className="ml-auto badge-blue">{l.category}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* LIKED TAB — private to own profile */}
        {activeTab === "liked" && (
          <div className="py-10 text-center">
            {isOwn ? (
              <p className="text-sm text-zinc-600">Liked posts are private to you</p>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Bookmark size={32} className="text-zinc-800" />
                <p className="text-sm text-zinc-600">This is private</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
