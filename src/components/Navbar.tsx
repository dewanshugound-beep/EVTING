"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Bell, Search, Command } from "lucide-react";
import { UserButton, SignInButton, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import GlobalSearch from "./GlobalSearch";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

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
        {/* Quick Search Toggle (mobile) */}
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
              whileHover={{ scale: 1.04, boxShadow: "0 0 20px rgba(88,166,255,0.3)" }}
              whileTap={{ scale: 0.96 }}
            >
              <Command size={12} />
              Upload
            </motion.button>
          </Link>
        )}

        {/* Auth */}
        {isSignedIn ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-2 ring-accent/30 rounded-full",
              },
            }}
          />
        ) : (
          <SignInButton mode="modal">
            <motion.button
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/20 cursor-pointer"
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
