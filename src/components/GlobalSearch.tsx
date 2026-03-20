"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Folder, X, Command } from "lucide-react";
import Link from "next/link";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ users: any[]; projects: any[] }>({
    users: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setResults({ users: [], projects: [] });
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        setResults({ users: [], projects: [] });
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults({ users: [], projects: [] });
  };

  const hasResults = results.users.length > 0 || results.projects.length > 0;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-600 cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" />
        Search...
        <kbd className="ml-2 hidden rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 sm:inline">
          ⌘K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="fixed inset-x-0 top-[15%] z-[60] mx-auto w-full max-w-lg p-4"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="overflow-hidden rounded-2xl border border-border bg-[#0e0e16] shadow-2xl">
                {/* Input */}
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Search users, projects, tags..."
                    className="flex-1 bg-transparent py-3.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                  />
                  {query && (
                    <button onClick={() => { setQuery(""); setResults({ users: [], projects: [] }); }} className="text-zinc-500 hover:text-white cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Results */}
                {hasResults && (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {/* Users */}
                    {results.users.length > 0 && (
                      <div className="mb-2">
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                          Users
                        </p>
                        {results.users.map((u: any) => (
                          <Link
                            key={u.id}
                            href={`/profile/${u.id}`}
                            onClick={close}
                          >
                            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer">
                              <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-zinc-800">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                                    <User className="h-3 w-3" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">{u.display_name}</span>
                                <span className="ml-2 text-xs text-zinc-600">@{u.username}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {results.projects.length > 0 && (
                      <div>
                        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                          Projects
                        </p>
                        {results.projects.map((p: any) => (
                          <Link
                            key={p.id}
                            href={`/project/${p.slug}`}
                            onClick={close}
                          >
                            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer">
                              <Folder className="h-4 w-4 text-neon-blue" />
                              <div>
                                <span className="font-medium">{p.title}</span>
                                <span className="ml-2 text-xs text-zinc-600">
                                  ★ {p.star_count}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {query.length >= 2 && !loading && !hasResults && (
                  <div className="py-8 text-center text-sm text-zinc-600">
                    No results for &quot;{query}&quot;
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="py-6 text-center text-xs text-zinc-600">
                    Searching...
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2">
                  <span className="text-[10px] text-zinc-600">
                    Type to search
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    ESC to close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
