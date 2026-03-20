/**
 * Rank System — "Cultivation" Ranks
 * Users gain XP for uploads, stars received, and comments.
 */

export const RANKS = [
  { name: "Novice",       minXP: 0,    color: "#71717a" }, // zinc-500
  { name: "Apprentice",   minXP: 50,   color: "#22c55e" }, // green-500
  { name: "Journeyman",   minXP: 150,  color: "#3b82f6" }, // blue-500
  { name: "Expert",       minXP: 400,  color: "#a855f7" }, // purple-500
  { name: "Master",       minXP: 800,  color: "#f59e0b" }, // amber-500
  { name: "Grandmaster",  minXP: 1500, color: "#ef4444" }, // red-500
] as const;

export type RankName = (typeof RANKS)[number]["name"];

export function getRank(xp: number): (typeof RANKS)[number] {
  let current: (typeof RANKS)[number] = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXP) current = rank;
    else break;
  }
  return current;
}

export function getNextRank(xp: number): (typeof RANKS)[number] | null {
  for (const rank of RANKS) {
    if (xp < rank.minXP) return rank;
  }
  return null; // Already Grandmaster
}

export function getRankProgress(xp: number): number {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.min(Math.round((progress / range) * 100), 100);
}

/** XP rewards */
export const XP_REWARDS = {
  PROJECT_UPLOAD: 25,
  STAR_RECEIVED: 5,
  COMMENT_POSTED: 3,
  COMMENT_RECEIVED: 2,
  FOLLOWER_GAINED: 10,
} as const;
