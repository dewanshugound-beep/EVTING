"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Store,
  Rss,
  MessageSquare,
  Download,
  Star,
  Users,
  Code2,
  Zap,
  Shield,
  GitBranch,
  TrendingUp,
  Package,
  Gamepad2,
  Terminal,
  Brain,
  Puzzle,
  Lock,
  Activity
} from "lucide-react";
import Link from "next/link";

/* ─── Animated Counter ─── */
function AnimatedStat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.02] border border-white/5"
    >
      <span className="text-3xl font-black text-white tracking-tight">{value}</span>
      <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-1">{label}</span>
    </motion.div>
  );
}

/* ─── Bento Card (reusable) ─── */
function BentoCard({
  children,
  className = "",
  href,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  id?: string;
}) {
  const inner = (
    <motion.div
      className={`bento-card rounded-2xl bg-surface-light p-6 overflow-hidden group cursor-pointer select-none relative ${className}`}
      id={id}
      whileHover={{
        borderColor: "rgba(88,166,255,0.5)",
        boxShadow: "0 0 30px rgba(88,166,255,0.18), inset 0 0 30px rgba(88,166,255,0.04)",
        transition: { duration: 0.25 },
      }}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Category Pill ─── */
function CategoryPill({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-opacity-5 cursor-pointer transition-all ${color}`}
    >
      <Icon size={16} />
      <span className="text-[11px] font-bold tracking-wider uppercase">{label}</span>
    </motion.div>
  );
}

/* ─── Trending Item ─── */
function TrendingItem({ title, author, stars, downloads, index }: { title: string; author: string; stars: number; downloads: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 + index * 0.1 }}
      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent/20 transition-all group cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent text-xs font-black">
          {index + 1}
        </div>
        <div>
          <p className="text-sm font-bold text-white group-hover:text-accent transition-colors">{title}</p>
          <p className="text-[10px] text-zinc-600">by @{author}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><Star size={10} className="text-amber-500" />{stars}</span>
        <span className="flex items-center gap-1"><Download size={10} />{downloads}</span>
      </div>
    </motion.div>
  );
}

/* ─── Main Hero Component ─── */
const HomeHero = React.memo(() => {
  return (
    <>
      {/* ═══════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-accent/30 bg-accent/5 text-accent text-[10px] font-bold tracking-widest uppercase"
        >
          <Zap size={12} className="animate-pulse" />
          THE DEVELOPER PLATFORM
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="max-w-4xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
        >
          <span className="bg-gradient-to-r from-accent via-neon-purple to-neon-green bg-clip-text text-transparent">
            Build.
          </span>{" "}
          <span className="bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Share.
          </span>{" "}
          <span className="bg-gradient-to-r from-neon-green via-accent to-neon-purple bg-clip-text text-transparent">
            Connect.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="max-w-xl text-zinc-400 text-base sm:text-lg leading-relaxed mb-10"
        >
          The all-in-one platform for developers, hackers, creators, and gamers.
          Discover tools, share your work, and connect with your community.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <Link href="/store">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-accent hover:bg-blue-500 font-bold text-sm tracking-wide shadow-lg shadow-accent/30 hover:shadow-accent/50 transition-all cursor-pointer text-white"
            >
              <Store size={16} /> Explore Store
            </motion.button>
          </Link>
          <Link href="/feed">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 font-bold text-sm tracking-wide transition-all cursor-pointer text-white"
            >
              <Rss size={16} /> Dev Feed
            </motion.button>
          </Link>
          <Link href="/chat">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 font-bold text-sm tracking-wide transition-all cursor-pointer text-white"
            >
              <MessageSquare size={16} /> Chat
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* STATS BAR */}
      {/* ═══════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="max-w-4xl mx-auto px-6 py-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AnimatedStat value="12K+" label="Tools" delay={0.7} />
          <AnimatedStat value="48K+" label="Developers" delay={0.8} />
          <AnimatedStat value="1.2M" label="Downloads" delay={0.9} />
          <AnimatedStat value="99.9%" label="Uptime" delay={1.0} />
        </div>
      </motion.section>

      {/* ═══════════════════════════════════ */}
      {/* THREE PILLARS BENTO */}
      {/* ═══════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7, ease: "easeOut" }}
        className="max-w-5xl mx-auto px-6 pb-16"
      >
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">Three Pillars. One Platform.</h2>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">Everything you need to build, share, and connect — in one place.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Store Pillar */}
          <BentoCard href="/store" id="pillar-store" className="min-h-[280px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center mb-4">
                <Store size={22} className="text-accent" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2 text-white uppercase">Store & Repos</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Discover, download, and share scripts, tools, games, AI models, browser extensions, and more.
                Like GitHub meets App Store.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="badge-blue">Scripts</span>
                <span className="badge-green">Games</span>
                <span className="badge-purple">AI/ML</span>
                <span className="badge-amber">Tools</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-accent text-[10px] font-bold tracking-widest mt-6 group-hover:gap-3 transition-all uppercase">
              Browse Store <ArrowRight size={14} />
            </div>
          </BentoCard>

          {/* Feed Pillar */}
          <BentoCard href="/feed" id="pillar-feed" className="min-h-[280px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-neon-green/15 border border-neon-green/20 flex items-center justify-center mb-4">
                <Rss size={22} className="text-neon-green" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2 text-white uppercase">Social Feed</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Post updates, share code snippets, images, and polls. Follow developers, 
                join conversations, and build your reputation.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="badge-green">Posts</span>
                <span className="badge-blue">Code</span>
                <span className="badge-purple">Polls</span>
                <span className="badge-red">Trending</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-neon-green text-[10px] font-bold tracking-widest mt-6 group-hover:gap-3 transition-all uppercase">
              Open Feed <ArrowRight size={14} />
            </div>
          </BentoCard>

          {/* Chat Pillar */}
          <BentoCard href="/chat" id="pillar-chat" className="min-h-[280px] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-neon-purple/15 border border-neon-purple/20 flex items-center justify-center mb-4">
                <MessageSquare size={22} className="text-neon-purple" />
              </div>
              <h3 className="text-xl font-black tracking-tight mb-2 text-white uppercase">Real-time Chat</h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                Direct messages, community rooms, project channels. Share code, files, 
                and media with syntax highlighting.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <span className="badge-purple">DMs</span>
                <span className="badge-blue">Rooms</span>
                <span className="badge-green">Code</span>
                <span className="badge-amber">Files</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-neon-purple text-[10px] font-bold tracking-widest mt-6 group-hover:gap-3 transition-all uppercase">
              Enter Chat <ArrowRight size={14} />
            </div>
          </BentoCard>
        </div>
      </motion.section>

      {/* ═══════════════════════════════════ */}
      {/* STORE CATEGORIES */}
      {/* ═══════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7 }}
        className="max-w-5xl mx-auto px-6 pb-16"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Browse by Category</h2>
          <p className="text-zinc-500 text-sm">Find exactly what you need from our curated categories</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <CategoryPill icon={Terminal} label="Scripts" color="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10" />
          <CategoryPill icon={Gamepad2} label="Games" color="border-violet-500/20 bg-violet-500/5 text-violet-400 hover:bg-violet-500/10" />
          <CategoryPill icon={Package} label="Software" color="border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10" />
          <CategoryPill icon={Lock} label="Security" color="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10" />
          <CategoryPill icon={GitBranch} label="Open Source" color="border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10" />
          <CategoryPill icon={Brain} label="AI / ML" color="border-pink-500/20 bg-pink-500/5 text-pink-400 hover:bg-pink-500/10" />
          <CategoryPill icon={Puzzle} label="Extensions" color="border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10" />
        </div>
      </motion.section>

      {/* ═══════════════════════════════════ */}
      {/* TRENDING NOW */}
      {/* ═══════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="max-w-3xl mx-auto px-6 pb-16"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h2 className="text-xl font-black text-white tracking-tight">Trending Now</h2>
          </div>
          <Link href="/store" className="text-[10px] font-bold text-accent tracking-widest uppercase hover:underline">
            View All →
          </Link>
        </div>

        <div className="space-y-2">
          <TrendingItem title="AutoGPT Agent Framework" author="devmaster" stars={2847} downloads="45K" index={0} />
          <TrendingItem title="NightVision Pentest Suite" author="h4ck3r" stars={1923} downloads="32K" index={1} />
          <TrendingItem title="PixelForge Game Engine" author="indiedev" stars={1456} downloads="28K" index={2} />
          <TrendingItem title="CodePilot VS Extension" author="toolsmith" stars={1204} downloads="21K" index={3} />
          <TrendingItem title="Matrix Rain Generator" author="cyberart" stars={987} downloads="15K" index={4} />
        </div>
      </motion.section>

      {/* ═══════════════════════════════════ */}
      {/* BOTTOM FEATURES BAR */}
      {/* ═══════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="max-w-5xl mx-auto px-6 pb-8"
      >
        <BentoCard id="features-bar" className="flex flex-col sm:flex-row items-center justify-between gap-4 !p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Shield size={18} className="text-accent" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">Enterprise-Grade Security</p>
              <p className="text-zinc-500 text-[10px] font-mono tracking-wider">E2E Encryption · Content Moderation · Rate Limiting</p>
            </div>
          </div>
          <div className="flex gap-6 text-[9px] font-bold tracking-[0.15em] text-zinc-600 uppercase">
            <span className="flex items-center gap-1"><Activity size={10} className="text-neon-green" />SOC 2</span>
            <span>GDPR</span>
            <span>Open Audit</span>
          </div>
        </BentoCard>
      </motion.section>
      
      {/* ═══════════════════════════════════ */}
      {/* ABOUT ME SECTION */}
      {/* ═══════════════════════════════════ */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.7 }}
        className="max-w-5xl mx-auto px-6 pb-20"
      >
        <BentoCard className="flex flex-col items-center justify-center text-center p-10 bg-gradient-to-br from-black to-zinc-950 border border-white/5 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-2">
              <span className="text-accent">&lt;</span> About The Creator <span className="text-accent">/&gt;</span>
            </h2>
            
            <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed text-sm md:text-base">
              Hi, I'm <span className="text-white font-bold">Devanshu</span>. I'm a 14-year-old student at Chavara Vidya Peeth in class 9th. 
              I built this platform with a passion for clean, state-of-the-art UI and modern development.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-zinc-500 font-mono">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Code2 size={14} className="text-accent" /> Managed by Devanshu
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Terminal size={14} className="text-neon-purple" /> Created by Devanshu
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Shield size={14} className="text-neon-green" /> Owner is Devanshu
              </span>
            </div>
            
            <div className="mt-8">
              <a 
                href="https://www.instagram.com/its.devanshu_" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-bold text-sm tracking-wide hover:scale-105 transition-transform shadow-lg shadow-pink-500/20"
              >
                Follow me on Instagram
              </a>
            </div>
          </div>
        </BentoCard>
      </motion.section>
    </>
  );
});

HomeHero.displayName = "HomeHero";
export default HomeHero;
