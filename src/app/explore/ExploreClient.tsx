"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Dna, 
  Zap, 
  Terminal,
  Grid
} from "lucide-react";
import ProjectCard from "@/components/explore/ProjectCard";
import UploadProjectForm from "@/components/explore/UploadProjectForm";
import { useDebounce } from "@/hooks/useDebounce";

interface VaultProject {
  id: string;
  title: string;
  description: string;
  file_url: string;
  category: "Hacking" | "APK" | "Script" | "Tool";
  created_at: string;
  users?: {
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
}

export default function ExploreClient({ initialProjects }: { initialProjects: VaultProject[] }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  const categories = ["ALL", "HACKING", "APK", "SCRIPT", "TOOL"];

  const filteredProjects = initialProjects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                         p.description.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesCategory = activeCategory === "ALL" || p.category.toUpperCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black/95 text-zinc-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-white/5 bg-zinc-950/50 py-20 px-6">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="grid grid-cols-12 h-full w-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-emerald-500/20" />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <ShieldCheck className="text-emerald-500" size={24} />
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">Matrix Vault</h1>
              </div>
              <p className="max-w-xl text-lg text-zinc-500 font-medium leading-relaxed">
                Archives from the deepest sectors. Encrypted tools, unauthorized scripts, and leaked binary files. 
                <span className="text-emerald-500/80"> Access granted to authorized hackers.</span>
              </p>
            </div>
            <UploadProjectForm />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="mx-auto max-max-w-7xl px-6 py-12">
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                  activeCategory === cat 
                    ? "bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                    : "border-white/5 bg-white/5 text-zinc-600 hover:text-white hover:border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative group max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-600 group-hover:text-emerald-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search the archive..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
            />
          </div>
        </div>

        {/* Project Grid */}
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProjects.map((p) => (
                <ProjectCard key={p.id} project={p as any} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-40 border border-dashed border-white/5 rounded-3xl bg-zinc-950/20"
            >
              <div className="p-6 rounded-full bg-zinc-950 border border-white/5 mb-6 text-zinc-800">
                <Dna size={48} className="animate-pulse" />
              </div>
              <p className="text-xl font-black text-zinc-700 uppercase tracking-widest">No signal detected in this sector.</p>
              <p className="text-xs text-zinc-800 mt-2 italic capitalize">Refining search patterns might reveal hidden archives.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <div className="border-t border-white/5 bg-zinc-950/50 py-10 px-6 text-center">
        <div className="flex justify-center gap-8 mb-6 text-zinc-800">
          <div className="flex items-center gap-2"><Zap size={14} /> HIGH SPEED</div>
          <div className="flex items-center gap-2"><Terminal size={14} /> ENCRYPTED</div>
          <div className="flex items-center gap-2"><Grid size={14} /> DISTRIBUTED</div>
        </div>
        <p className="text-[10px] font-black text-zinc-700 tracking-[0.4em] uppercase">Matrix Archive System • Security Clearance Level 4</p>
      </div>
    </div>
  );
}
