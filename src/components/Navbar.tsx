"use client";

import { motion } from "framer-motion";
import { Wallet, Activity } from "lucide-react";
import { UserButton, SignInButton, useAuth } from "@clerk/nextjs";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const { isSignedIn } = useAuth();

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
