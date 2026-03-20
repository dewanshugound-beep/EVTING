"use client";

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

export default function Leaderboard({ users }: { users: User[] }) {
  if (users.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-neon-blue" />
        <h2 className="text-lg font-bold text-white">Top Developers</h2>
      </div>

      <div className="rounded-2xl border border-border bg-surface-light overflow-hidden">
        {users.map((user, i) => {
          const rank = getRank(user.xp);
          const medals = ["🥇", "🥈", "🥉"];

          return (
            <Link key={user.id} href={`/profile/${user.id}`}>
              <motion.div
                className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer ${
                  i < users.length - 1 ? "border-b border-border" : ""
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Rank # */}
                <span className="w-8 text-center text-sm font-bold text-zinc-500">
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </span>

                {/* Avatar */}
                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-500">
                      {user.display_name?.[0]}
                    </div>
                  )}
                </div>

                {/* Name + Rank */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.display_name}
                  </p>
                  <p className="text-[10px] text-zinc-500">@{user.username}</p>
                </div>

                {/* Rank Badge */}
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: rank.color + "20",
                    color: rank.color,
                  }}
                >
                  {rank.name}
                </span>

                {/* XP */}
                <span className="text-xs font-mono text-zinc-500">
                  {user.xp.toLocaleString()} XP
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
