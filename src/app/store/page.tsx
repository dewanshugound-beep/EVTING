"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Store,
  Star,
  Download,
  Filter,
  TrendingUp,
  Clock,
  Award,
  Terminal,
  Gamepad2,
  Package,
  Lock,
  GitBranch,
  Brain,
  Puzzle,
  MessageSquare,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getStoreListings } from "./actions";

const categories = [
  { id: "all", label: "All", icon: Store },
  { id: "scripts", label: "Scripts", icon: Terminal },
  { id: "games", label: "Games", icon: Gamepad2 },
  { id: "software", label: "Software", icon: Package },
  { id: "security", label: "Security", icon: Lock },
  { id: "oss", label: "Open Source", icon: GitBranch },
  { id: "ai", label: "AI / ML", icon: Brain },
  { id: "extensions", label: "Extensions", icon: Puzzle },
];

/* ─── Star Rating ─── */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={10} className={i <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-zinc-700"} />
      ))}
      <span className="text-[10px] text-zinc-500 ml-1 font-mono">{Number(rating).toFixed(1)}</span>
    </div>
  );
}

/* ─── Store Card ─── */
function StoreCard({ listing }: { listing: any }) {
  const catIcon = categories.find(c => c.id === listing.category)?.icon || Store;
  const CatIcon = catIcon;
  const author = listing.users;

  return (
    <Link href={`/store/${listing.slug}`}>
      <motion.div
        className="store-card rounded-2xl p-5 cursor-pointer relative overflow-hidden group h-full flex flex-col"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        {listing.is_editors_pick && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold tracking-widest uppercase">
            <Award size={8} /> PICK
          </div>
        )}
        {author?.role === "dev" && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[8px] font-bold tracking-widest uppercase">
            <CheckCircle size={8} /> DEV
          </div>
        )}

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-white/5 border border-white/10 ${author?.role === "dev" || listing.is_editors_pick ? "mt-5" : ""}`}>
          <CatIcon size={18} className="text-zinc-400 group-hover:text-accent transition-colors" />
        </div>

        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-accent transition-colors tracking-tight">{listing.title}</h3>
        <p className="text-[11px] text-zinc-500 leading-relaxed mb-4 line-clamp-2 flex-grow">{listing.tagline || listing.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {(listing.tags || []).slice(0, 3).map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-zinc-500 tracking-wider uppercase">{tag}</span>
          ))}
        </div>

        <StarRating rating={listing.avg_rating || 0} />

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <Link href={author?.username ? `/u/${author.username}` : `/profile/${listing.user_id}`} className="flex items-center gap-1.5 hover:text-accent transition-colors">
            <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500 overflow-hidden relative">
              {author?.avatar_url ? (
                <Image src={author.avatar_url} alt="" fill className="object-cover" />
              ) : (
                (author?.display_name || "U")[0].toUpperCase()
              )}
            </div>
            <span className="text-[10px] font-medium">@{author?.username || "user"}</span>
          </Link>
          <div className="flex items-center gap-3 text-[9px] text-zinc-600 font-mono">
            <span className="flex items-center gap-1"><Star size={9} className="text-amber-500" />{listing.star_count || 0}</span>
            <span className="flex items-center gap-1"><Download size={9} />{listing.download_count || 0}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Main Store Page ─── */
export default function StoreBrowsePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"trending" | "newest" | "top" | "editors">("trending");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStoreListings({
        category: activeCategory,
        search: search || undefined,
        sort: sortBy,
        limit: 40,
      });
      setListings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(loadListings, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [loadListings]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative border-b border-white/5 bg-zinc-950/50 overflow-hidden">
        <div className="hero-gradient absolute inset-0 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                  <Store className="text-accent" size={24} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Store</h1>
              </motion.div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-lg text-zinc-500 text-sm leading-relaxed">
                Discover, download, and share developer tools, scripts, games, AI models, and more.
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-accent h-4 w-4 transition-colors" />
              <input
                type="text" placeholder="Search tools, scripts, games..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-2xl bg-black/60 border border-white/10 focus:border-accent/50 outline-none text-sm text-white placeholder:text-zinc-600 transition-all"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-14 z-30">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveCategory(id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${activeCategory === id ? "bg-accent/10 text-accent border border-accent/20" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"}`}>
                  <Icon size={12} />{label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(["trending", "newest", "top", "editors"] as const).map(sort => {
                const icons = { trending: TrendingUp, newest: Clock, top: Star, editors: Award };
                const SortIcon = icons[sort];
                return (
                  <button key={sort} onClick={() => setSortBy(sort)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${sortBy === sort ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-300"}`}>
                    <SortIcon size={10} />{sort === "editors" ? "Picks" : sort}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase">{listings.length} results</p>
          <Link href="/upload" className="text-[10px] font-bold text-accent tracking-widest uppercase hover:underline">
            Upload Project →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-accent animate-spin" />
          </div>
        ) : listings.length > 0 ? (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}>
            {listings.map(listing => (
              <motion.div key={listing.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <StoreCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-3xl bg-zinc-950/20">
            <Store size={48} className="text-zinc-800 mb-4" />
            <p className="text-lg font-bold text-zinc-700">No listings found</p>
            <p className="text-xs text-zinc-800 mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
}
