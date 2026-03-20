"use client";

import { motion } from "framer-motion";
import { getRank, getRankProgress, getNextRank } from "@/lib/rank";
import { UserPlus, UserMinus, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/profile/actions";
import { toast } from "sonner";

type ProfileHeaderProps = {
  profile: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string;
    xp: number;
    is_online: boolean;
    followerCount: number;
    followingCount: number;
    youtube_url: string | null;
  };
  isOwner: boolean;
  isFollowingUser: boolean;
  projectCount: number;
};

export default function ProfileHeader({
  profile,
  isOwner,
  isFollowingUser: initialFollowing,
  projectCount,
}: ProfileHeaderProps) {
  const rank = getRank(profile.xp ?? 0);
  const nextRank = getNextRank(profile.xp ?? 0);
  const progress = getRankProgress(profile.xp ?? 0);
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followerCount);
  const [isPending, startTransition] = useTransition();

  const handleFollow = () => {
    startTransition(async () => {
      if (following) {
        await unfollowUser(profile.id);
        setFollowing(false);
        setFollowerCount((c) => c - 1);
        toast.success("Unfollowed");
      } else {
        await followUser(profile.id);
        setFollowing(true);
        setFollowerCount((c) => c + 1);
        toast.success("Following!");
      }
    });
  };

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-44 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-neon-blue/20 via-neon-purple/10 to-transparent">
        {profile.banner_url && (
          <img
            src={profile.banner_url}
            alt="Banner"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Avatar + Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-14 mb-4 inline-block">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-background bg-surface">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neon-blue/10 text-3xl font-bold text-neon-blue">
                {profile.display_name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          {/* Online Dot */}
          {profile.is_online && (
            <motion.div
              className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-background bg-green-500"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.display_name}
            </h1>
            <p className="text-sm text-zinc-500">@{profile.username}</p>

            {/* Rank Badge */}
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: rank.color + "20",
                  color: rank.color,
                  border: `1px solid ${rank.color}40`,
                }}
              >
                ⚡ {rank.name}
              </span>
              <span className="text-xs text-zinc-600">
                {profile.xp} XP
              </span>
            </div>

            {/* XP Progress Bar */}
            {nextRank && (
              <div className="mt-2 w-48">
                <div className="flex justify-between text-[10px] text-zinc-600">
                  <span>{rank.name}</span>
                  <span>{nextRank.name}</span>
                </div>
                <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: rank.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="mt-4 flex gap-5 text-sm">
              <div>
                <span className="font-bold text-white">{projectCount}</span>
                <span className="ml-1 text-zinc-500">Projects</span>
              </div>
              <div>
                <span className="font-bold text-white">{followerCount}</span>
                <span className="ml-1 text-zinc-500">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white">
                  {profile.followingCount}
                </span>
                <span className="ml-1 text-zinc-500">Following</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwner ? (
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />
                Edit Profile
              </button>
            ) : (
              <motion.button
                onClick={handleFollow}
                disabled={isPending}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  following
                    ? "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    : "bg-neon-blue text-white shadow-lg shadow-neon-blue/25 hover:shadow-neon-blue/40"
                }`}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {following ? (
                  <>
                    <UserMinus className="h-3.5 w-3.5" /> Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5" /> Follow
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
