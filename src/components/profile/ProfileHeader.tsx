"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRank, getRankProgress, getNextRank } from "@/lib/rank";
import { UserPlus, UserMinus, Pencil, Camera, Loader2 } from "lucide-react";
import { followUser, unfollowUser } from "@/app/profile/actions";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase";

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
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const supabase = createBrowserSupabase();
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { data, error } = await supabase.storage
        .from('matrix-files')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('matrix-files')
        .getPublicUrl(filePath);

      setPreviewAvatar(publicUrl);
      toast.success("Signal updated.");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      try {
        const { updateProfile } = await import("@/app/profile/actions");
        await updateProfile(formData);
        toast.success("Profile updated!");
        setIsEditing(false);
        // Soft refresh
        window.location.reload();
      } catch (err) {
        toast.error("Failed to update profile");
      }
    });
  };

  return (
    <div className="relative">
      {/* ... previous content ... */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border border-white/10 bg-surface p-8 shadow-2xl"
            >
              <h3 className="mb-6 text-xl font-black tracking-tight text-white uppercase italic">Neural Link Setup</h3>
              
              {/* Avatar Upload Preview */}
              <div className="flex flex-col items-center mb-8 gap-3">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="h-24 w-24 rounded-full border-2 border-dashed border-emerald-500/50 flex items-center justify-center overflow-hidden bg-emerald-500/5 transition-all group-hover:border-emerald-500">
                    {uploadingAvatar ? (
                      <Loader2 size={32} className="text-emerald-500 animate-spin" />
                    ) : (previewAvatar || profile.avatar_url) ? (
                      <img src={previewAvatar || profile.avatar_url!} className="h-full w-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-emerald-500/40" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-all">
                    <span className="text-[9px] font-black text-white tracking-widest uppercase">UPGRADE</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Select Signal Pattern</p>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <input type="hidden" name="avatar_url" value={previewAvatar || profile.avatar_url || ""} />
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Matrix Alias</label>
                  <input
                    name="display_name"
                    defaultValue={profile.display_name}
                    placeholder="Enter your new Alias..."
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Bio Header</label>
                  <textarea
                    name="bio"
                    defaultValue={profile.bio}
                    rows={3}
                    placeholder="Describe your signal..."
                    className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                  >
                    ABORT
                  </button>
                  <button
                    disabled={isPending || uploadingAvatar}
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-black tracking-widest text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all uppercase"
                  >
                    SYNC CHANGES
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
          <motion.div
            className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-background ${profile.is_online ? 'bg-emerald-500' : 'bg-red-500 opacity-50'}`}
            animate={profile.is_online ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          />
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
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 cursor-pointer"
              >
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
