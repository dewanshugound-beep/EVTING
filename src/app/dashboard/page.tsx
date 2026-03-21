import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase";
import { Shield, Target, Trophy, Star, Activity, Plus, TrendingUp, CalendarDays } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const sb = createServerSupabase();
  const { data: user, error } = await sb
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !user) {
    // If the webhook hasn't fired yet or failed, just show a loading state or retry
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-zinc-400">Syncing your profile...</p>
      </div>
    );
  }

  // Calculate progress to next level
  const xpForNextLevel = user.level * 1000;
  const progressPercent = Math.min(100, Math.max(0, (user.xp / xpForNextLevel) * 100));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight">Your Dashboard</h1>
        <p className="text-zinc-500 mt-1">Overview of your activity and reputation.</p>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="p-6 rounded-2xl bg-surface-light border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={60} />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Level</p>
            <p className="text-5xl font-black text-white">{user.level}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-light border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target size={60} className="text-neon-green" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total XP</p>
            <p className="text-5xl font-black text-neon-green">{user.xp}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-light border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star size={60} className="text-yellow-500" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Reputation</p>
            <p className="text-5xl font-black text-yellow-500">{user.reputation_score}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-light border border-white/5 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={16} className={user.role === 'admin' ? 'text-red-500' : 'text-accent'} />
            <span className="text-sm font-bold capitalize text-white">{user.role}</span>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays size={16} className="text-zinc-500" />
            <span className="text-xs text-zinc-400">Joined {format(new Date(user.created_at), "MMM yyyy")}</span>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="mb-12 p-6 rounded-2xl bg-gradient-to-r from-zinc-900 to-black border border-white/5 shadow-2xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-accent" /> Road to Level {user.level + 1}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Earn more XP by contributing.</p>
          </div>
          <p className="text-sm font-bold text-zinc-500">{user.xp} / {xpForNextLevel} XP</p>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-accent to-neon-purple rounded-full relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/upload" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-lg shadow-accent/20">
            <Plus size={16} /> New Project
          </Link>
          <Link href={`/u/${user.username}`} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-light hover:bg-white/10 border border-white/5 text-white font-bold text-sm transition-colors">
            View Public Profile
          </Link>
          <Link href="/settings" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-light hover:bg-white/10 border border-white/5 text-white font-bold text-sm transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
