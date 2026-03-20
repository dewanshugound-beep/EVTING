"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Activity, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import { UserButton, SignInButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const muted = localStorage.getItem("matrix_sound_muted") === "true";
    setIsMuted(muted);
    
    async function fetchRole() {
      if (isSignedIn && user?.id) {
        const sb = createBrowserSupabase();
        const { data } = await sb
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        if (data) setRole(data.role);
      } else {
        setRole(null);
      }
    }
    fetchRole();
  }, [isSignedIn, user?.id]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem("matrix_sound_muted", String(next));
  };

  return (
    <header className="fixed top-0 left-[68px] right-0 z-40 flex h-14 items-center justify-between px-5 bg-black/40 backdrop-blur-xl border-b border-zinc-800/70">
      {/* Left — Brand */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-100">
          MatrixIN
        </span>
        <span className="h-4 w-px bg-zinc-800" />
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black tracking-widest">
          <Activity size={10} className="animate-pulse" />
          ONLINE
        </div>
      </div>

      {/* Center — Search */}
      <div className="hidden md:block">
        <GlobalSearch />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3">
        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-xl border border-white/5 bg-zinc-950/20 text-zinc-500 hover:text-emerald-500 transition-all cursor-pointer mr-2"
          title={isMuted ? "Unmute Neural Signals" : "Mute Neural Feedback"}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Explore Link */}
        <Link href="/explore">
          <motion.div
            className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black tracking-[0.2em] flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer uppercase"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity size={14} className="text-blue-500" />
            MATRIX VAULT
          </motion.div>
        </Link>

        {/* Admin Link */}
        {role === "admin" && (
          <Link href="/admin">
            <motion.div
              className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-[0.2em] flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer uppercase h-9"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShieldCheck size={14} className="text-emerald-500" />
              ADMIN PANEL
            </motion.div>
          </Link>
        )}

        {/* Connect Wallet */}
        <motion.button
          className="hidden sm:flex items-center gap-1.5 rounded-xl border border-neon-blue/30 bg-neon-blue/10 px-4 py-2 text-xs font-semibold text-neon-blue glow-blue cursor-pointer"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Wallet className="h-3.5 w-3.5" />
          Connect Wallet
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-neon-blue notif-pulse" />
        </motion.button>

        {/* Auth */}
        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-2 ring-neon-blue/30 rounded-full",
              },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <motion.button
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 cursor-pointer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Sign In
            </motion.button>
          </SignInButton>
        )}
      </div>
    </header>
  );
}
