"use client";

import { motion } from "framer-motion";
import { Star, Eye } from "lucide-react";
import Link from "next/link";

type ProjectCardProps = {
  project: {
    id: string;
    title: string;
    slug: string;
    description: string;
    tags: string[];
    cover_url: string | null;
    star_count: number;
    view_count: number;
    created_at: string;
  };
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/project/${project.slug}`}>
      <motion.div
        className="bento-card group cursor-pointer overflow-hidden rounded-2xl bg-surface-light"
        whileHover={{
          y: -4,
          transition: { duration: 0.2 },
        }}
      >
        {/* Cover */}
        <div className="h-32 w-full overflow-hidden bg-gradient-to-br from-neon-blue/10 to-neon-purple/5">
          {project.cover_url && (
            <img
              src={project.cover_url}
              alt={project.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-1 text-base font-bold text-white">
            {project.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-xs text-zinc-500">
            {project.description || "No description"}
          </p>

          {/* Tags */}
          {project.tags?.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-neon-blue/10 px-2 py-0.5 text-[10px] font-medium text-neon-blue"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-[10px] text-zinc-600">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              {project.star_count}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {project.view_count}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
