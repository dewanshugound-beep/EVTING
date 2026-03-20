"use client";

import { motion } from "framer-motion";
import { Star, Crown } from "lucide-react";
import Link from "next/link";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  star_count: number;
  cover_url: string | null;
  users: { display_name: string; avatar_url: string | null };
};

export default function OfficialShowcase({
  projects,
}: {
  projects: Project[];
}) {
  if (projects.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-4 flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Official Showcase</h2>
        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          CURATED
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {projects.map((project, i) => (
          <Link key={project.id} href={`/project/${project.slug}`}>
            <motion.div
              className="min-w-[260px] max-w-[260px] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-amber-500/20 bg-surface-light transition-all hover:border-amber-500/40"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className="h-28 bg-gradient-to-br from-amber-500/10 to-neon-purple/5">
                {project.cover_url && (
                  <img
                    src={project.cover_url}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-white">{project.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
                  {project.description}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {project.users?.avatar_url && (
                      <img
                        src={project.users.avatar_url}
                        className="h-4 w-4 rounded-full"
                        alt=""
                      />
                    )}
                    <span className="text-[10px] text-zinc-500">
                      {project.users?.display_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Star className="h-3 w-3" fill="currentColor" />
                    {project.star_count}
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
