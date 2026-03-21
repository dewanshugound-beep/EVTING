"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import Link from "next/link";
import { getRank } from "@/lib/rank";

type User = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  username: string;
  xp: number;
};

const Leaderboard = React.memo(({ users }: { users: User[] }) => {
  if (!users || users.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="h-4 w-4 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
        <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Population Command</h2>
      </div>

      <div className="rounded-2xl border border-white/5 bg-zinc-950/30 overflow-hidden shadow-2xl">
        {users.map((user, i) => {
          const rank = getRank(user.xp);
          const medals = ["🥇", "🥈", "🥉"];

          return (
            <Link key={user.id} href={user.username ? `/u/${user.username}` : `/profile/${user.id}`}>
              <motion.div
                className={`flex items-center gap-4 px-5 py-4 transition-all hover:bg-white/[0.02] cursor-pointer group ${
                  i < users.length - 1 ? "border-b border-white/5" : ""
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className="w-8 text-center text-sm font-black text-zinc-700 font-mono">
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </span>

                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-900 border border-white/5 relative">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.display_name}
                      fill
                      sizes="36px"
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-zinc-600 uppercase">
                      {user.display_name?.[0] || '?' }
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate tracking-tight">
                    {user.display_name}
                  </p>
                  <p className="text-[10px] text-zinc-600 font-bold font-mono">@{user.username}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className="rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-current"
                    style={{
                      backgroundColor: rank.color + "10",
                      color: rank.color,
                    }}
                  >
                    {rank.name}
                  </span>
                  <span className="text-[10px] font-black text-zinc-700 tracking-tighter uppercase">
                    {user.xp.toLocaleString()} XP
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
});

Leaderboard.displayName = "Leaderboard";
export default Leaderboard;
