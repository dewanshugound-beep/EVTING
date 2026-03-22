"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Bell, Search, LogOut, Settings, User, Zap, ChevronDown } from "lucide-react";
import { useAuth, useUser } from "@/lib/auth-hooks";
import { createBrowserSupabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import GlobalSearch from "./GlobalSearch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const signOut = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  return (
    <header className="fixed top-0 left-[68px] right-0 z-40 flex h-14 items-center justify-between px-5 bg-[#08080d]/80 backdrop-blur-2xl border-b border-zinc-800/50">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-black uppercase tracking-[0.15em] text-zinc-100">
          Matrix<span className="text-accent">IN</span>
        </span>
        <span className="h-4 w-px bg-zinc-800" />
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neon-green/20 bg-neon-green/5 text-neon-green text-[9px] font-bold tracking-widest">
          <Activity size={9} className="animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Center — Search */}
      <div className="hidden md:block flex-1 max-w-md mx-8">
        <GlobalSearch />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Search (mobile) */}
        <button className="md:hidden p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
          <Search size={16} />
        </button>

        {/* Notifications */}
        {isSignedIn && (
          <Link href="/notifications">
            <motion.div
              className="relative p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 notif-pulse" />
            </motion.div>
          </Link>
        )}

        {/* Upload CTA */}
        {isSignedIn && (
          <Link href="/upload">
            <motion.button
              className="hidden sm:flex items-center gap-1.5 rounded-xl bg-accent/10 border border-accent/20 px-3.5 py-1.5 text-[10px] font-bold text-accent tracking-wider glow-blue cursor-pointer uppercase"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              <Zap size={12} />
              Upload
            </motion.button>
          </Link>
        )}

        {/* Auth */}
        {isSignedIn ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/40 border border-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden relative">
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt="" fill className="object-cover" />
                ) : (
                  (user?.display_name || user?.username || "U")[0].toUpperCase()
                )}
              </div>
              <ChevronDown size={12} className="text-zinc-600 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-52 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/8 shadow-2xl shadow-black/60 overflow-hidden z-50"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-bold text-white truncate">{user?.display_name || user?.username}</p>
                    <p className="text-[11px] text-zinc-500 truncate">@{user?.username}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-full capitalize">
                        {user?.role || "member"}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">Lv.{user?.level || 1}</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {[
                      { href: `/u/${user?.username}`, icon: User, label: "Profile" },
                      { href: "/settings", icon: Settings, label: "Settings" },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link
                        key={label}
                        href={href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <Icon size={14} />
                        {label}
                      </Link>
                    ))}
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all cursor-pointer"
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Link href="/login">
            <motion.button
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/20 cursor-pointer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Sign In
            </motion.button>
          </Link>
        )}
      </div>
    </header>
  );
}
